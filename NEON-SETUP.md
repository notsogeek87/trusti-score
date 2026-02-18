# 🐘 Configuration Neon.tech PostgreSQL - Guide Complet

## 🎯 Vue d'ensemble

Ce guide vous accompagne étape par étape pour créer votre base de données PostgreSQL gratuite sur Neon.tech et la connecter à TrustiScore.

**Durée totale :** 10 minutes

---

## 📝 ÉTAPE 1 : Créer un Compte Neon.tech (2 min)

### 1.1 Inscription

1. Allez sur **https://neon.tech**
2. Cliquez sur **"Sign Up"** (Inscription)
3. Choisissez une méthode :
   - GitHub (recommandé, plus rapide)
   - Google
   - Email

4. Si vous utilisez GitHub/Google, autorisez l'accès
5. Si vous utilisez Email, vérifiez votre boîte mail

**✅ Vous êtes maintenant connecté au dashboard Neon !**

---

## 🗄️ ÉTAPE 2 : Créer un Projet (3 min)

### 2.1 Nouveau Projet

Le dashboard s'ouvre sur la page "Projects".

1. Cliquez sur **"New Project"**
2. **Project name :** `trustiscore` (ou le nom que vous voulez)
3. **Region :** Choisissez la plus proche (ex: `Europe (Frankfurt)` ou `US East (Ohio)`)
4. **PostgreSQL version :** Laissez la dernière version (16 ou supérieure)
5. Cliquez sur **"Create Project"**

**⏱️ Création en cours... (5-10 secondes)**

---

## 🔗 ÉTAPE 3 : Récupérer la Connection String (2 min)

### 3.1 Connection String

Une fois le projet créé, vous voyez le dashboard du projet.

1. Cliquez sur **"Connection Details"** (ou l'onglet "Dashboard")
2. Vous voyez une section **"Connection string"**
3. **Format :** PostgreSQL
4. Cochez **"Pooled connection"** (recommandé pour les API)

**Exemple de connection string :**
```
postgresql://trustiscore_owner:AbCd1234XyZ@ep-magic-cloud-123456.us-east-2.aws.neon.tech/trustiscore?sslmode=require
```

### 3.2 Copier la Connection String

1. Cliquez sur l'icône **"Copy"** à côté de la connection string
2. 📋 **Notez-la quelque part** (vous en aurez besoin)

**⚠️ IMPORTANT :** Cette string contient votre mot de passe ! Ne la partagez jamais.

---

## 🔐 ÉTAPE 4 : Configurer le Backend (3 min)

### 4.1 Créer le fichier .env

Dans le dossier `backend/`, créez un fichier `.env` (sans extension) :

**Windows PowerShell :**
```powershell
cd backend
New-Item -Path .env -ItemType File
notepad .env
```

**Ou simplement :** Créez un fichier texte nommé exactement `.env` (attention au point au début !)

### 4.2 Contenu du fichier .env

Copiez ceci dans `.env` et **remplacez** la `DATABASE_URL` par la vôtre :

```env
# Connection à Neon.tech (REMPLACEZ par votre connection string)
DATABASE_URL=postgresql://trustiscore_owner:VotreMotDePasse@ep-example-123456.us-east-2.aws.neon.tech/trustiscore?sslmode=require

# Port de l'API
PORT=3001

# Mot de passe admin (on va le générer à l'étape suivante)
ADMIN_PASSWORD_HASH=$2b$10$temp

# Secret pour les sessions
SESSION_SECRET=jKl9mNp7qRs2tUv4wXy6zA3bCdEfGhI8

# Environnement
NODE_ENV=development
```

**✅ Sauvegardez le fichier .env**

### 4.3 Générer le Hash du Mot de Passe

Votre mot de passe admin actuel est : `9xWL5JVP$Nj1l6`

Pour le hasher avec bcrypt :

**Ouvrez PowerShell dans le dossier backend :**

```powershell
cd C:\reportGit\trusti-score\backend
npm install
node -e "import('bcrypt').then(bcrypt => console.log(bcrypt.hashSync('9xWL5JVP$Nj1l6', 10)))"
```

**Résultat (exemple) :**
```
$2b$10$abcdefGHIJKLmnopQRST.uvwxyZABCDEFGHIJKLMNOPQRSTUVWXYZ
```

📋 **Copiez ce hash** et remplacez la valeur de `ADMIN_PASSWORD_HASH` dans `.env`

**Exemple après modification :**
```env
ADMIN_PASSWORD_HASH=$2b$10$abcdefGHIJKLmnopQRST.uvwxyZABCDEFGHIJKLMNOPQRSTUVWXYZ
```

**✅ Sauvegardez .env à nouveau**

---

## 🚀 ÉTAPE 5 : Installer et Démarrer l'API (2 min)

### 5.1 Installation des dépendances

**PowerShell dans le dossier backend :**
```powershell
cd C:\reportGit\trusti-score\backend
npm install
```

**Packages installés :**
- `express` : Framework web
- `pg` : Client PostgreSQL
- `bcrypt` : Hashage des mots de passe
- `cors` : Autoriser les requêtes cross-origin
- `dotenv` : Charger les variables d'environnement

**⏱️ Installation... (30 secondes)**

### 5.2 Démarrer le serveur

```powershell
npm start
```

**Output attendu :**
```
🔧 Initialisation de la base de données...
✅ Base de données initialisée

🚀 ============================================
   TrustiScore API démarrée sur le port 3001
   ============================================

   Endpoints disponibles :
   - GET  http://localhost:3001/api/health
   - POST http://localhost:3001/api/auth/login
   - GET  http://localhost:3001/api/config
   - PUT  http://localhost:3001/api/config (auth)

   Connexion BDD : Neon.tech PostgreSQL
```

**✅ L'API est démarrée !**

---

## 🧪 ÉTAPE 6 : Tester la Connexion (2 min)

### 6.1 Test de santé de l'API

**Ouvrez un nouveau PowerShell (gardez l'API qui tourne) :**

```powershell
curl http://localhost:3001/api/health
```

**Résultat attendu :**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-18T14:30:45.123Z"
}
```

**✅ Si vous voyez "connected", la BDD est bien connectée !**

### 6.2 Test d'authentification

```powershell
$body = @{
    password = "9xWL5JVP$Nj1l6"
} | ConvertTo-Json

curl -Method POST -Uri "http://localhost:3001/api/auth/login" -Body $body -ContentType "application/json"
```

**Résultat attendu :**
```json
{
  "token": "a1b2c3d4e5f6...",
  "expiresAt": 1708267845123
}
```

**✅ Si vous recevez un token, l'authentification fonctionne !**

---

## 🔍 ÉTAPE 7 : Vérifier la Base de Données (Optionnel)

### 7.1 Console SQL de Neon

1. Retournez sur **https://console.neon.tech**
2. Sélectionnez votre projet **trustiscore**
3. Cliquez sur **"SQL Editor"** dans le menu de gauche
4. Exécutez cette requête :

```sql
SELECT * FROM trustiscore_config;
```

**Résultat :** La table existe mais est vide (c'est normal !)

### 7.2 Vérifier les tables créées

```sql
\dt
```

**Tables créées automatiquement :**
- `trustiscore_config` : Configuration actuelle
- `trustiscore_config_history` : Historique des modifications

---

## 📊 Architecture Finale

```
┌─────────────────────────────────────────────┐
│  Navigateur (admin.html)                    │
│  - Interface d'administration               │
│  - JavaScript (fetch API)                   │
└──────────────┬──────────────────────────────┘
               │
               │ HTTP/JSON
               │ (Port 3001)
               ▼
┌─────────────────────────────────────────────┐
│  Backend Node.js + Express                  │
│  - API REST (/api/config, /api/auth)        │
│  - Authentification avec bcrypt             │
│  - Gestion des sessions                     │
└──────────────┬──────────────────────────────┘
               │
               │ PostgreSQL
               │ (Connexion SSL)
               ▼
┌─────────────────────────────────────────────┐
│  Neon.tech (Cloud PostgreSQL)               │
│  - Region: Europe/US                        │
│  - Tables: config + history                 │
│  - Backup automatique                       │
└─────────────────────────────────────────────┘
```

---

## 🎯 Prochaines Étapes

Maintenant que votre base de données est configurée, nous allons :

1. ✅ **Modifier admin.html** pour utiliser l'API au lieu de localStorage
2. ✅ **Tester** la sauvegarde et le chargement depuis la BDD
3. ✅ **Déployer** l'API en production (optionnel)

**Continuez avec le fichier [BACKEND-SETUP.md](BACKEND-SETUP.md) pour la suite !**

---

## 🆘 Dépannage

### Erreur : "Cannot find module 'bcrypt'"

**Solution :**
```powershell
cd backend
npm install bcrypt
```

### Erreur : "Connection refused" ou "ECONNREFUSED"

**Causes possibles :**
1. API pas démarrée → Lancez `npm start` dans backend/
2. Mauvais port → Vérifiez que c'est bien 3001
3. Firewall bloque → Autorisez Node.js dans le pare-feu Windows

### Erreur : "Invalid connection string"

**Solution :**
1. Vérifiez que vous avez copié la TOTALITÉ de la connection string depuis Neon
2. Vérifiez qu'il n'y a pas d'espaces avant/après dans .env
3. Vérifiez que .env est bien à la racine du dossier backend/

### Erreur : "password authentication failed"

**Solutions :**
1. Re-copiez la connection string depuis Neon.tech (peut-être expirée)
2. Vérifiez que vous n'avez pas modifié le mot de passe dans la string
3. Dans Neon, allez dans Settings → "Reset password" et récupérez une nouvelle string

### Base de données vide après redémarrage

**C'est normal !** Les tables sont créées automatiquement au premier démarrage.
Pour vérifier : allez dans Neon SQL Editor et tapez `\dt` pour lister les tables.

---

## 📚 Ressources

- **Documentation Neon :** https://neon.tech/docs
- **Documentation PostgreSQL :** https://www.postgresql.org/docs/
- **Node.js pg library :** https://node-postgres.com/
- **Express.js :** https://expressjs.com/

---

## ✅ Checklist Finale

Avant de passer à la suite, vérifiez :

- [ ] Compte Neon.tech créé
- [ ] Projet PostgreSQL créé
- [ ] Connection string copiée
- [ ] Fichier `.env` créé avec la bonne DATABASE_URL
- [ ] Hash du mot de passe généré et ajouté dans .env
- [ ] `npm install` exécuté avec succès
- [ ] API démarrée (`npm start`)
- [ ] Test `/api/health` réussi
- [ ] Test `/api/auth/login` réussi

**🎉 Si tout est ✅, vous êtes prêt pour l'intégration avec l'admin !**
