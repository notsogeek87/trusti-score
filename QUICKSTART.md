# 🚀 Guide de Démarrage Rapide - TrustiScore avec Base de Données

## ⚡ Vue d'ensemble

Votre système TrustiScore utilise maintenant :
- **Frontend** : HTML/CSS/JS (port 8000)
- **Backend API** : Node.js + Express (port 3001)
- **Base de données** : PostgreSQL sur Neon.tech (cloud)

---

## 📋 Prérequis

✅ Node.js installé (v18+)  
✅ Compte Neon.tech créé  
✅ Python 3 (pour servir le frontend)

---

## 🎯 Installation en 5 Étapes

### ÉTAPE 1 : Configurer Neon.tech (10 min)

Suivez le guide complet : **[NEON-SETUP.md](NEON-SETUP.md)**

**Résumé :**
1. Créez un compte sur https://neon.tech
2. Créez un projet "trustiscore"
3. Copiez la connection string
4. Créez le fichier `backend/.env`

### ÉTAPE 2 : Installer les Dépendances (1 min)

```powershell
cd C:\reportGit\trusti-score\backend
npm install
```

### ÉTAPE 3 : Configurer le `.env` (2 min)

Créez `backend/.env` avec votre connection string :

```env
DATABASE_URL=postgresql://votre_user:votre_pass@host.neon.tech/trustiscore?sslmode=require
PORT=3001
ADMIN_PASSWORD_HASH=$2b$10$...
SESSION_SECRET=jKl9mNp7qRs2tUv4wXy6zA3bCdEfGhI8
NODE_ENV=development
```

**Générer le hash du mot de passe :**
```powershell
node -e "import('bcrypt').then(bcrypt => console.log(bcrypt.hashSync('9xWL5JVP$Nj1l6', 10)))"
```

### ÉTAPE 4 : Démarrer le Backend (5 sec)

**Terminal 1 - Backend API :**
```powershell
cd C:\reportGit\trusti-score\backend
npm start
```

**Output attendu :**
```
✅ Base de données initialisée
🚀 TrustiScore API démarrée sur le port 3001
```

### ÉTAPE 5 : Démarrer le Frontend (5 sec)

**Terminal 2 - Frontend :**
```powershell
cd C:\reportGit\trusti-score
python -m http.server 8000
```

---

## ✅ Test de Connexion

### 1. Test API (Backend)

```powershell
curl http://localhost:3001/api/health
```

**Résultat attendu :**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-18T..."
}
```

### 2. Ouvrir l'Admin (Frontend)

```powershell
Start-Process "http://localhost:8000/admin.html"
```

### 3. Se Connecter

- Mot de passe : `9xWL5JVP$Nj1l6`
- Cliquez sur "Connexion"

**✅ Si connecté → L'interface admin s'ouvre**

### 4. Charger la Configuration

- Cliquez sur "🔄 Recharger depuis le Fichier"
- Message attendu : **"✅ Configuration chargée depuis la base de données"**

### 5. Modifier et Sauvegarder

- Modifiez un texte (ex: Nom du site)
- Cliquez sur "💾 Sauvegarder la Configuration"
- Message attendu : **"✅ Configuration sauvegardée dans la base de données !"**

### 6. Vérifier dans Neon.tech

1. Connectez-vous sur https://console.neon.tech
2. Ouvrez votre projet "trustiscore"
3. Cliquez sur "SQL Editor"
4. Exécutez :

```sql
SELECT * FROM trustiscore_config;
```

**✅ Vous devriez voir votre configuration en JSONB !**

---

## 🔄 Workflow Quotidien

### Démarrer les serveurs

**Option 1 : Deux terminaux séparés**

Terminal 1 :
```powershell
cd C:\reportGit\trusti-score\backend
npm start
```

Terminal 2 :
```powershell
cd C:\reportGit\trusti-score
python -m http.server 8000
```

**Option 2 : Script PowerShell unique** (créer `start-all.ps1`) :

```powershell
# Démarrer le backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\reportGit\trusti-score\backend; npm start"

# Attendre 3 secondes
Start-Sleep -Seconds 3

# Démarrer le frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\reportGit\trusti-score; python -m http.server 8000"

# Ouvrir le navigateur
Start-Sleep -Seconds 2
Start-Process "http://localhost:8000"
```

Puis lancez juste :
```powershell
.\start-all.ps1
```

### Arrêter les serveurs

Dans chaque terminal : **CTRL+C**

---

## 📊 Architecture

```
┌─────────────────────────────────────────────┐
│  Utilisateur                                │
└──────────────┬──────────────────────────────┘
               │
               │ http://localhost:8000
               ▼
┌─────────────────────────────────────────────┐
│  Frontend (Python HTTP Server)             │
│  - index.html                               │
│  - simulateur.html                          │
│  - admin.html ◄── Modifications ici         │
└──────────────┬──────────────────────────────┘
               │
               │ Fetch API (JavaScript)
               │ http://localhost:3001/api/*
               ▼
┌─────────────────────────────────────────────┐
│  Backend (Node.js + Express)                │
│  - Authentification (bcrypt)                │
│  - API REST (/config, /auth)                │
│  - Gestion sessions                         │
└──────────────┬──────────────────────────────┘
               │
               │ PostgreSQL Driver (pg)
               │ SSL Connection
               ▼
┌─────────────────────────────────────────────┐
│  Neon.tech (Cloud PostgreSQL)               │
│  - Table: trustiscore_config                │
│  - Table: trustiscore_config_history        │
│  - Backup automatique                       │
└─────────────────────────────────────────────┘
```

---

## 🎓 Que se passe-t-il maintenant ?

### Avant (localStorage)

```
admin.html → localStorage (navigateur)
            → Export manuel en JSON
            → Copier dans assets/config.json
```

**Problème :** Modifications perdues si on vide le cache

### Maintenant (Base de données)

```
admin.html → API Backend (Node.js)
            → PostgreSQL (Neon.tech)
            → Persistance automatique
            → Historique des modifications
```

**Avantages :**
✅ Modifications sauvegardées de façon permanente  
✅ Accessible depuis n'importe quel navigateur/appareil  
✅ Historique automatique (audit trail)  
✅ Backup automatique par Neon  
✅ Pas besoin d'export/import manuel

---

## 🔍 Vérification de l'État

### Frontend et Backend connectés ?

Ouvrez la console JavaScript (F12) dans admin.html :

**Logs de connexion :**
```
🔄 Début du chargement de la configuration...
📡 Tentative de chargement depuis l'API...
📡 Réponse API reçue: 200 OK
✅ Configuration API parsée: {...}
```

**Si vous voyez ça → ✅ Tout fonctionne !**

**Si vous voyez :**
```
⚠️ Erreur lors du chargement depuis l'API: fetch failed
🔄 Tentative de chargement depuis le fichier local...
```

**→ ⚠️ Backend pas démarré ou mauvaise URL**

### Vérifier que le Backend est actif

```powershell
curl http://localhost:3001/api/health
```

Si erreur → Démarrez le backend (`cd backend; npm start`)

---

## 🆘 Dépannage Rapide

### "API indisponible" dans l'admin

**Causes :**
1. Backend pas démarré
2. Mauvaise URL dans admin.html (ligne avec `API_URL`)
3. Port 3001 déjà utilisé

**Solutions :**
```powershell
# 1. Vérifier que le backend tourne
curl http://localhost:3001/api/health

# 2. Si pas de réponse, démarrer le backend
cd backend
npm start

# 3. Vérifier le port
netstat -ano | findstr :3001
```

### "Session expirée"

**Normal !** Les sessions expirent après 4 heures.

**Solution :** Reconnectez-vous

### Modifications non sauvegardées

**Vérifications :**
1. Backend actif ? → `curl http://localhost:3001/api/health`
2. Token valide ? → Regardez la console (F12)
3. Erreur en console ? → Partagez le message d'erreur

### "Cannot connect to database"

**Vérifications :**
1. Connection string correcte dans `.env` ?
2. Neon.tech accessible ? → https://console.neon.tech
3. Mot de passe de BDD correct ?

**Solution :** Re-copiez la connection string depuis Neon

---

## 📚 Ressources

- **[NEON-SETUP.md](NEON-SETUP.md)** : Guide complet Neon.tech
- **[backend/README.md](backend/README.md)** : Documentation API
- **[CLOUDFLARE-SETUP.md](CLOUDFLARE-SETUP.md)** : Déploiement production

---

## ✅ Checklist de Bon Fonctionnement

- [ ] Backend démarré (port 3001)
- [ ] Frontend démarré (port 8000)
- [ ] `/api/health` retourne "connected"
- [ ] Connexion admin fonctionne
- [ ] Message "Configuration chargée depuis la base de données"
- [ ] Sauvegarde fonctionne (message de succès)
- [ ] Données visibles dans Neon SQL Editor

**🎉 Si tout est ✅, votre système est opérationnel !**

---

## 🚀 Prochaines Étapes

1. ✅ **Déployer le backend** sur Render/Railway/Vercel
2. ✅ **Déployer le frontend** sur Netlify/Vercel/GitHub Pages
3. ✅ **Configurer Cloudflare** pour la protection DDoS
4. ✅ **Changer le mot de passe** en production

**Voir [CLOUDFLARE-SETUP.md](CLOUDFLARE-SETUP.md) pour le déploiement !**
