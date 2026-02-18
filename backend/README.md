# 🚀 TrustiScore Backend API

API REST Node.js + Express + PostgreSQL (Neon.tech) pour gérer la configuration dynamique de TrustiScore.

## 📦 Installation

```powershell
cd backend
npm install
```

## ⚙️ Configuration

1. **Créez un fichier `.env`** à partir de `.env.example` :
```powershell
Copy-Item .env.example .env
notepad .env
```

2. **Configurez les variables** :
```env
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
PORT=3001
ADMIN_PASSWORD_HASH=$2b$10$...
SESSION_SECRET=votre_secret_aleatoire
NODE_ENV=development
```

3. **Générez le hash du mot de passe** :
```powershell
node -e "import('bcrypt').then(bcrypt => console.log(bcrypt.hashSync('VotreMotDePasse', 10)))"
```

## 🚀 Démarrage

### Première fois : Initialiser la base de données

**⚠️ Important :** Avant d'utiliser le système, vous devez initialiser la base de données avec la configuration par défaut.

```powershell
npm run init
```

Ce script :
- ✅ Lit `assets/config.json`
- ✅ Se connecte à PostgreSQL
- ✅ Insère la configuration en BDD
- ✅ Vérifie que tout fonctionne

**Si la BDD est déjà initialisée :** Le script ne fait rien pour éviter d'écraser vos modifications.

**Pour réinitialiser complètement (⚠️ ÉCRASE tout) :**
```powershell
npm run force-init
```

### Mode développement
```powershell
npm start
```

### Mode watch (redémarre automatiquement)
```powershell
npm run dev
```

## 📡 API Endpoints

### Public

#### GET /api/health
Test de santé de l'API et connexion BDD.

**Réponse :**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-18T14:30:45.123Z"
}
```

#### GET /api/config
Récupère la configuration actuelle.

**Réponse :**
```json
{
  "siteName": "TrustiScore",
  "siteTagline": "...",
  "gradeThresholds": { ... },
  "criteria": { ... }
}
```

### Authentifié (nécessite token)

#### POST /api/auth/login
Authentification admin.

**Request :**
```json
{
  "password": "9xWL5JVP$Nj1l6"
}
```

**Réponse :**
```json
{
  "token": "a1b2c3d4e5f6...",
  "expiresAt": 1708267845123
}
```

#### POST /api/auth/logout
Déconnexion (invalide le token).

**Headers :**
```
Authorization: Bearer <token>
```

#### PUT /api/config
Sauvegarde la configuration complète.

**Headers :**
```
Authorization: Bearer <token>
```

**Request :**
```json
{
  "siteName": "TrustiScore",
  "criteria": { ... }
}
```

**Réponse :**
```json
{
  "message": "Configuration sauvegardée avec succès",
  "updated_at": "2026-02-18T14:30:45.123Z"
}
```

#### GET /api/config/history
Liste les 20 dernières modifications.

**Headers :**
```
Authorization: Bearer <token>
```

**Réponse :**
```json
[
  {
    "id": 15,
    "updated_at": "2026-02-18T14:30:45.123Z"
  },
  ...
]
```

## 🗄️ Structure de la Base de Données

### Table : `trustiscore_config`
```sql
CREATE TABLE trustiscore_config (
    id INTEGER PRIMARY KEY,
    config_data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table : `trustiscore_config_history`
```sql
CREATE TABLE trustiscore_config_history (
    id SERIAL PRIMARY KEY,
    config_data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Trigger :** Chaque modification de `trustiscore_config` sauvegarde automatiquement une copie dans `trustiscore_config_history`.

## 🧪 Tests

### Test connexion BDD
```powershell
curl http://localhost:3001/api/health
```

### Test authentification
```powershell
$body = @{ password = "9xWL5JVP$Nj1l6" } | ConvertTo-Json
curl -Method POST -Uri "http://localhost:3001/api/auth/login" -Body $body -ContentType "application/json"
```

### Test récupération config
```powershell
curl http://localhost:3001/api/config
```

### Test sauvegarde (avec token)
```powershell
$headers = @{ Authorization = "Bearer VOTRE_TOKEN" }
$body = @{ siteName = "Test" } | ConvertTo-Json
curl -Method PUT -Uri "http://localhost:3001/api/config" -Headers $headers -Body $body -ContentType "application/json"
```

## 🔒 Sécurité

- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ Tokens de session sécurisés (64 caractères aléatoires)
- ✅ Expiration automatique des sessions (4 heures)
- ✅ CORS activé pour le frontend
- ✅ Connexion SSL obligatoire à PostgreSQL
- ✅ Validation des données entrantes
- ✅ Logs des tentatives de connexion

## 🌐 Déploiement en Production

### Option 1 : Render.com (Gratuit)

1. Push votre code sur GitHub
2. Créez un compte sur https://render.com
3. New Web Service → Connectez votre repo
4. **Build Command :** `cd backend && npm install`
5. **Start Command :** `cd backend && npm start`
6. Ajoutez les variables d'environnement (DATABASE_URL, etc.)

### Option 2 : Railway.app (Gratuit)

1. Créez un compte sur https://railway.app
2. New Project → Deploy from GitHub
3. Sélectionnez votre repo
4. Railway détecte automatiquement Node.js
5. Ajoutez les variables d'environnement

### Option 3 : Vercel (Gratuit)

1. Installez Vercel CLI : `npm install -g vercel`
2. Dans le dossier backend : `vercel`
3. Suivez les instructions
4. Ajoutez les variables d'environnement via dashboard

### Variables d'environnement en production

```env
DATABASE_URL=postgresql://...neon.tech/db
PORT=3001
ADMIN_PASSWORD_HASH=$2b$10$...
SESSION_SECRET=<générez un nouveau secret long>
NODE_ENV=production
```

**⚠️ Générez un nouveau `SESSION_SECRET` en production :**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📊 Monitoring

### Logs en production

Les logs incluent :
- ✅ Connexions réussies
- ⚠️ Tentatives de connexion échouées
- ❌ Erreurs BDD
- 📡 Toutes les requêtes HTTP

### Neon.tech Dashboard

- Nombre de connexions actives
- Taille de la base de données
- Requêtes exécutées
- Performance

## 🔄 Backup

Neon.tech fait des backups automatiques quotidiens.

**Pour sauvegarder manuellement :**

```sql
-- Dans Neon SQL Editor
COPY (SELECT * FROM trustiscore_config) TO '/tmp/backup.json';
```

**Ou exporter via l'API :**
```powershell
curl http://localhost:3001/api/config > backup-config.json
```

## 🆘 Dépannage

### Port 3001 déjà utilisé

**Solution :** Changez le PORT dans `.env` :
```env
PORT=3002
```

### "Cannot connect to database"

**Vérifications :**
1. Connection string correcte dans .env
2. Neon.tech accessible (pas de maintenance)
3. Pare-feu autorise les connexions sortantes

### "Session expired"

Les sessions expirent après 4 heures.
**Solution :** Reconnectez-vous via `/api/auth/login`

### Modifications non sauvegardées

**Vérifications :**
1. Token d'authentification valide
2. Headers `Authorization` présent
3. Logs du serveur pour voir l'erreur exacte

## 📚 Technologies Utilisées

- **Node.js 20+** : Runtime JavaScript
- **Express 4** : Framework web
- **PostgreSQL 16** : Base de données
- **pg 8** : Client PostgreSQL pour Node.js
- **bcrypt 5** : Hashage des mots de passe
- **cors 2** : Cross-Origin Resource Sharing
- **dotenv 16** : Variables d'environnement

## 📝 Licence

MIT
