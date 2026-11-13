# 🚀 Commandes Rapides - TrustiScore

## 📦 Installation Initiale

```bash
# Backend
cd backend
npm install

# Base de données
npm run init
```

## 🔧 Développement Local

### Démarrage Rapide
```powershell
# Tout démarrer en une commande
.\start.ps1
```

### Démarrage Manuel

**Terminal 1 - Backend**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend**
```bash
python -m http.server 8000
```

### URLs Locales
- Frontend : http://localhost:8000
- Admin : http://localhost:8000/admin.html
- Simulateur : http://localhost:8000/simulateur.html
- API : http://localhost:3001

## 🗄️ Base de Données

### Initialiser la BDD (première fois)
```bash
cd backend
npm run init
```

### Réinitialiser la BDD (⚠️ écrase tout)
```bash
cd backend
npm run force-init
```

### Créer la table de sessions
```bash
cd backend
npm run create-sessions
```

## 🔐 Sécurité

### Générer un nouveau mot de passe admin
```bash
# 1. Générer le hash
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('VotreMotDePasse', 10));"

# 2. Copier le hash dans backend/.env
# ADMIN_PASSWORD_HASH=$2b$10$...
```

### Générer un secret de session
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🌐 Déploiement

Le site est déployé sur Hyperfluid : l'image Docker est construite par le workflow
`.github/workflows/hyperfluid-image.yml` à chaque push sur `main`.

## 🧪 Tests

### Test système complet
```powershell
.\test-system.ps1
```

### Test API
```bash
# Health check
curl http://localhost:3001/api/health

# Authentification
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"9xWL5JVP$Nj1l6"}'

# Configuration
curl http://localhost:3001/api/config
```

### Test avec PowerShell
```powershell
# Health check
Invoke-RestMethod -Uri http://localhost:3001/api/health

# Authentification
$body = @{ password = '9xWL5JVP$Nj1l6' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3001/api/auth/login -Method Post -Body $body -ContentType 'application/json'
```

## 📊 Base de Données Neon

### Voir les tables
```bash
# Via psql
psql "postgresql://...neon.tech/neondb"

# Lister les tables
\dt

# Voir la config
SELECT * FROM trustiscore_config;

# Voir les sessions
SELECT * FROM admin_sessions;
```

## 🔄 Git

### Commandes courantes
```bash
# Voir les changements
git status

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "Description des changements"

# Push vers GitHub
git push origin main

# Créer une branche
git checkout -b nouvelle-fonctionnalite

# Fusionner une branche
git checkout main
git merge nouvelle-fonctionnalite
```

## 🛠️ Maintenance

### Arrêter tous les serveurs
```powershell
# Arrêter tous les processus Node.js
Get-Process -Name node | Stop-Process -Force

# Arrêter Python (si http.server tourne)
Get-Process -Name python | Where-Object {$_.CommandLine -like "*http.server*"} | Stop-Process -Force
```

### Nettoyer les sessions expirées
```sql
-- Connexion à Neon
psql "postgresql://...neon.tech/neondb"

-- Supprimer les sessions expirées
DELETE FROM admin_sessions WHERE expires_at < EXTRACT(epoch FROM NOW()) * 1000;
```

### Voir les logs
```bash
# Logs backend (dans le terminal où npm start tourne)
# Les logs s'affichent en temps réel
```

## 🐛 Dépannage

### Le backend ne démarre pas
```bash
# Vérifier que le port 3001 est libre
netstat -ano | findstr :3001

# Tuer le processus si nécessaire
taskkill /PID <PID> /F
```

### Erreur de connexion à la BDD
```bash
# Vérifier les variables d'environnement
cd backend
cat .env

# Tester la connexion
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### Le mot de passe admin ne fonctionne pas
```bash
# Vérifier que le backend tourne
curl http://localhost:3001/api/health

# Vérifier le hash dans .env
cd backend
grep ADMIN_PASSWORD_HASH .env
```

## 📝 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `backend/server.js` | API Express |
| `backend/.env` | Variables d'environnement (PRIVÉ) |
| `assets/config.json` | Configuration par défaut |
| `assets/config-loader.js` | Loader de config dynamique |
| `admin.html` | Interface d'administration |
| `Dockerfile` / `hyperfluid.toml` | Image et configuration Hyperfluid |
| `start.ps1` | Script de démarrage rapide |

## 🔗 Ressources

- **Documentation** : Voir les fichiers .md à la racine
- **GitHub** : https://github.com/notsogeek87/trusti-score
- **Neon** : https://console.neon.tech
- **Hyperfluid** : https://www.hyperfluid.cloud/

## 🆘 Support

1. Vérifier [STATUS.md](STATUS.md) pour l'état du système
2. Consulter [QUICKSTART.md](QUICKSTART.md) pour le guide complet

---

**Mot de passe admin par défaut :** `9xWL5JVP$Nj1l6`  
⚠️ **À CHANGER en production !**
