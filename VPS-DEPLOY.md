# Déploiement de TrustiScore sur votre VPS

Ce guide déploie TrustiScore sur votre propre VPS, en réutilisant l'infrastructure déjà en place (nginx + Docker), pour obtenir une URL sur votre propre serveur (ex: `https://trustiscore.votre-domaine.com`).

Constat sur votre VPS actuel :
- **nginx** tourne déjà (ports 80/443 en écoute) → on ajoute juste un nouveau `server{}`.
- **Docker** tourne déjà (plusieurs conteneurs, tous exposés en `127.0.0.1:PORT` puis reverse-proxyés par nginx) → on suit le même modèle pour le backend TrustiScore.
- Le port **3001** est libre.
- ~27 Go de disque disponibles → largement suffisant.

Architecture retenue :
- **Frontend** (HTML/CSS/JS statique) : servi **directement par nginx**, pas besoin de Docker.
- **Backend** (API Node.js/Express) : conteneur Docker, écoute en local sur `127.0.0.1:3001`, nginx fait le reverse-proxy sur `/api/`.
- **Base de données** : PostgreSQL managé sur Neon.tech (cloud), comme en dev — aucune base à installer sur le VPS.

Toutes les commandes ci-dessous sont à exécuter **vous-même en SSH sur le VPS** : je n'ai pas d'accès en écriture/exécution sur votre serveur depuis cette session, seulement un accès lecture seule à son état (services, ports, disque).

## 1. Base de données Neon.tech

Si ce n'est pas déjà fait, créez un projet gratuit sur [neon.tech](https://neon.tech) et récupérez la chaîne de connexion (`postgresql://...`). Détails complets : [NEON-SETUP.md](NEON-SETUP.md).

## 2. DNS

Chez votre registrar / DNS, créez un enregistrement **A** pointant vers l'IP publique de votre VPS :

```
trustiscore.votre-domaine.com.   A   <IP_DE_VOTRE_VPS>
```

Attendez la propagation (`dig trustiscore.votre-domaine.com` doit renvoyer votre IP).

## 3. Récupérer le code sur le VPS

```bash
sudo mkdir -p /var/www/trustiscore
sudo chown $USER:$USER /var/www/trustiscore
git clone -b claude/vps-site-deployment-shbk7f https://github.com/notsogeek87/trusti-score.git /var/www/trustiscore
cd /var/www/trustiscore
```

(Une fois la branche mergée sur `main`, faites plutôt `git clone ... -b main`.)

## 4. Configurer le backend

```bash
cp backend/.env.example backend/.env
```

Construisez d'abord l'image (elle contient déjà `bcrypt`, ce qui permet de générer le hash du mot de passe admin sans rien installer sur le VPS) :

```bash
docker compose build backend
docker compose run --rm backend node -e "import('bcrypt').then(b=>console.log(b.hashSync('VotreMotDePasse',10)))"
```

Copiez le hash affiché, puis éditez `backend/.env` :

```bash
nano backend/.env
```

Renseignez :
- `DATABASE_URL` : la chaîne Neon.tech de l'étape 1
- `PORT=3001`
- `ADMIN_PASSWORD_HASH` : le hash généré ci-dessus
- `SESSION_SECRET` : sortie de `openssl rand -hex 64`
- `NODE_ENV=production`

## 5. Lancer le backend (Docker)

```bash
docker compose up -d backend
docker compose logs -f backend   # Ctrl+C pour quitter les logs
```

Vérifiez que l'API répond en local :

```bash
curl http://127.0.0.1:3001/api/health
```

Le premier démarrage initialise automatiquement les tables PostgreSQL (`trustiscore_config`, `admin_sessions`, historique).

## 6. Configurer nginx

```bash
sudo cp deploy/nginx-trustiscore.conf /etc/nginx/sites-available/trustiscore.conf
sudo sed -i 's/VOTRE_DOMAINE/trustiscore.votre-domaine.com/g' /etc/nginx/sites-available/trustiscore.conf
# Le fichier pointe déjà sur /var/www/trustiscore (root) : adaptez ce chemin
# dans le fichier si vous avez cloné le dépôt ailleurs.
sudo ln -s /etc/nginx/sites-available/trustiscore.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

À ce stade, `http://trustiscore.votre-domaine.com` doit déjà afficher le site (en HTTP).

## 7. HTTPS avec Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx   # si pas déjà installé
sudo certbot --nginx -d trustiscore.votre-domaine.com
```

Certbot édite automatiquement `/etc/nginx/sites-available/trustiscore.conf` pour ajouter le bloc HTTPS et la redirection HTTP→HTTPS, puis recharge nginx.

## 8. Vérification finale

- `https://trustiscore.votre-domaine.com` → page d'accueil
- `https://trustiscore.votre-domaine.com/simulateur.html` → simulateur
- `https://trustiscore.votre-domaine.com/admin.html` → interface admin (protégée par rate-limiting nginx + login applicatif)
- `https://trustiscore.votre-domaine.com/api/health` → `{"status":"ok","database":"connected",...}`

## Mises à jour ultérieures

Après un nouveau `git push` sur la branche déployée, sur le VPS :

```bash
cd /var/www/trustiscore
./deploy/deploy.sh
```

Ce script fait `git pull`, reconstruit le conteneur backend si besoin, recharge nginx et vérifie `/api/health`.

## Fichiers ajoutés pour ce déploiement

- `backend/Dockerfile` : image du backend Node.js/Express
- `docker-compose.yml` : service `backend`, exposé uniquement en local (`127.0.0.1:3001`)
- `deploy/nginx-trustiscore.conf` : vhost nginx prêt à l'emploi (frontend statique + reverse-proxy `/api/`)
- `deploy/deploy.sh` : script de mise à jour/redéploiement
