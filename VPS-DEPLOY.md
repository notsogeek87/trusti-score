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
git clone -b main https://github.com/notsogeek87/trusti-score.git /var/www/trustiscore
cd /var/www/trustiscore
cp .env.example .env   # BACKEND_PORT=3001 par défaut, c'est le bon choix ici
```

(Tant que la branche n'est pas mergée sur `main`, remplacez `-b main` par `-b claude/vps-site-deployment-shbk7f`.)

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
sudo sed -i \
  -e 's/VOTRE_DOMAINE/trustiscore.votre-domaine.com/g' \
  -e 's#__APP_ROOT__#/var/www/trustiscore#g' \
  -e 's/__APP_PORT__/3001/g' \
  /etc/nginx/sites-available/trustiscore.conf
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

## Déploiement automatique (CI/CD) à chaque push `staging` / `main`

L'idée : un deuxième checkout du dépôt pour le staging, et un workflow GitHub
Actions (`.github/workflows/deploy.yml`) qui se connecte en SSH au VPS à
chaque push sur `main` ou `staging` pour lancer `deploy/deploy.sh` côté
serveur. Le SSH est verrouillé avec une **commande forcée** : la clé GitHub
Actions ne peut rien exécuter d'autre que ce script précis.

### A. Créer un deuxième checkout pour le staging

```bash
sudo mkdir -p /var/www/trustiscore-staging
sudo chown $USER:$USER /var/www/trustiscore-staging
git clone -b staging https://github.com/notsogeek87/trusti-score.git /var/www/trustiscore-staging
cd /var/www/trustiscore-staging
echo "BACKEND_PORT=3002" > .env
cp backend/.env.example backend/.env
# éditez backend/.env comme à l'étape 4 (idéalement avec une base Neon séparée
# pour ne pas mélanger les données de staging et de prod)
docker compose up -d --build backend
```

Puis un second vhost nginx, sur un sous-domaine dédié :

```bash
sudo cp deploy/nginx-trustiscore.conf /etc/nginx/sites-available/trustiscore-staging.conf
sudo sed -i \
  -e 's/VOTRE_DOMAINE/staging.trustiscore.votre-domaine.com/g' \
  -e 's#__APP_ROOT__#/var/www/trustiscore-staging#g' \
  -e 's/__APP_PORT__/3002/g' \
  /etc/nginx/sites-available/trustiscore-staging.conf
sudo ln -s /etc/nginx/sites-available/trustiscore-staging.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d staging.trustiscore.votre-domaine.com
```

(N'oubliez pas le DNS pour `staging.trustiscore.votre-domaine.com`, comme à l'étape 2.)

> **Créer la branche `staging`** si elle n'existe pas encore : `git checkout -b staging main && git push -u origin staging`.

### B. Créer un utilisateur de déploiement dédié sur le VPS

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
```

Autorisez cet utilisateur à recharger nginx sans mot de passe, **et rien
d'autre** :

```bash
echo 'deploy ALL=(root) NOPASSWD: /usr/sbin/nginx -t, /bin/systemctl reload nginx' | sudo tee /etc/sudoers.d/deploy-nginx
sudo chmod 0440 /etc/sudoers.d/deploy-nginx
```

Donnez-lui la propriété des deux checkouts :

```bash
sudo chown -R deploy:deploy /var/www/trustiscore /var/www/trustiscore-staging
```

### C. Installer la commande forcée (dispatcher SSH)

```bash
sudo cp /var/www/trustiscore/deploy/ci-deploy.sh /usr/local/bin/trustiscore-ci-deploy.sh
sudo chmod +x /usr/local/bin/trustiscore-ci-deploy.sh
```

Ce script lit la commande envoyée par GitHub Actions (`main` ou `staging`) et
exécute uniquement le `deploy.sh` correspondant — jamais une commande
arbitraire.

### D. Générer la clé SSH pour GitHub Actions

**Sur votre machine (pas sur le VPS)** :

```bash
ssh-keygen -t ed25519 -C "github-actions-trustiscore" -f ./trustiscore-deploy-key -N ""
```

Copiez la **clé publique** sur le VPS, dans le compte `deploy`, avec la
commande forcée en préfixe (tout sur une seule ligne) :

```bash
sudo -u deploy mkdir -p /home/deploy/.ssh
echo 'command="/usr/local/bin/trustiscore-ci-deploy.sh",no-agent-forwarding,no-port-forwarding,no-pty,no-X11-forwarding '"$(cat trustiscore-deploy-key.pub)" | sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys
sudo -u deploy chmod 700 /home/deploy/.ssh
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
```

### E. Ajouter les secrets dans GitHub

Dans le repo GitHub → **Settings → Secrets and variables → Actions → New
repository secret** :

| Secret | Valeur |
| --- | --- |
| `VPS_HOST` | IP ou nom d'hôte de votre VPS |
| `VPS_DEPLOY_USER` | `deploy` |
| `VPS_DEPLOY_SSH_KEY` | contenu de la **clé privée** `trustiscore-deploy-key` (pas `.pub`) |
| `VPS_SSH_PORT` | *(optionnel)* si SSH n'écoute pas sur le port 22 |

Supprimez ensuite `trustiscore-deploy-key` et `trustiscore-deploy-key.pub` de
votre machine une fois le secret ajouté (ou gardez-les dans un gestionnaire
de mots de passe, jamais dans le dépôt).

### F. C'est tout

À chaque `git push` sur `main`, le workflow déploie `/var/www/trustiscore`
(production). À chaque push sur `staging`, il déploie
`/var/www/trustiscore-staging`. Suivez l'exécution dans l'onglet **Actions**
du repo GitHub.

## Fichiers ajoutés pour ce déploiement

- `backend/Dockerfile` : image du backend Node.js/Express
- `docker-compose.yml` : service `backend`, exposé uniquement en local (port piloté par `.env` / `BACKEND_PORT`)
- `deploy/nginx-trustiscore.conf` : vhost nginx prêt à l'emploi (frontend statique + reverse-proxy `/api/`), réutilisable pour prod et staging
- `deploy/deploy.sh` : script de mise à jour/redéploiement (utilisé localement et par la CI)
- `deploy/ci-deploy.sh` : dispatcher installé sur le VPS pour sécuriser le déploiement via GitHub Actions
- `.github/workflows/deploy.yml` : déploiement automatique sur push `main`/`staging`
