# 🚀 Guide de Déploiement sur Vercel

Ce guide vous explique comment déployer TrustiScore sur Vercel avec support serverless.

## ✅ Modifications Effectuées pour Vercel

Votre application a été adaptée pour fonctionner sur Vercel :

- ✅ Sessions stockées dans PostgreSQL (au lieu de la mémoire)
- ✅ Configuration `vercel.json` créée
- ✅ API compatible avec les fonctions serverless
- ✅ Nettoyage automatique des sessions expirées

---

## ⚡ Vous avez DÉJÀ un projet Vercel ? (Mise à jour rapide)

Si votre projet `trusti-score` existe déjà sur Vercel, c'est simple :

### 1️⃣ Push les modifications

```bash
git add .
git commit -m "Adaptation pour Vercel serverless - Sessions PostgreSQL"
git push origin main
```

**Vercel redéploiera automatiquement !** ✨

### 2️⃣ Vérifier que la table sessions existe

La table `admin_sessions` sera créée automatiquement au prochain redémarrage.

Ou créez-la manuellement depuis votre machine :

```bash
cd backend
node create-sessions-table.js
```

### 3️⃣ C'est tout ! 🎉

Testez votre application :
- API : `https://trusti-score.vercel.app/api/health`
- Admin : `https://trusti-score.vercel.app/admin.html`

**✅ Si ça fonctionne, vous n'avez rien d'autre à faire !**

---

## 📋 Nouveau Déploiement (si vous n'avez PAS encore de projet Vercel)

### Prérequis

1. **Compte Vercel** : https://vercel.com (gratuit)
2. **Base de données Neon** : Déjà configurée dans `.env`
3. **Code sur GitHub** : Push votre code sur GitHub

---

## 🔧 Étape 1 : Préparation du Code

### 1.1 Gitignore

Vérifiez que `.gitignore` contient :

```
node_modules/
.env
.vercel
*.log
```

### 1.2 Push sur GitHub

```bash
git add .
git commit -m "Adaptation pour Vercel serverless"
git push origin main
```

---

## 🌐 Étape 2 : Déploiement sur Vercel

### Option A : Via l'Interface Web (Recommandé)

1. Allez sur https://vercel.com
2. Cliquez sur **"Add New Project"**
3. **Import Git Repository** → Sélectionnez votre repo `trusti-score`
4. Vercel détecte automatiquement la configuration
5. Cliquez sur **"Deploy"**

### Option B : Via CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel
```

---

## 🔐 Étape 3 : Configuration des Variables d'Environnement

### Dans le Dashboard Vercel

1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez les variables suivantes :

| Variable | Valeur | Type |
|----------|--------|------|
| `DATABASE_URL` | `postgresql://...neon.tech/neondb?sslmode=require` | Production |
| `ADMIN_PASSWORD_HASH` | `$2b$10$c3jgliR0x7Vb2FIEVbOvruH5FPm...` | Production |
| `SESSION_SECRET` | `jKl9mNp7qRs2tUv4wXy6zA3bCdEfGhI8JlMn...` | Production |
| `NODE_ENV` | `production` | Production |
| `PORT` | `3001` | Production |

**⚠️ IMPORTANT : Copiez ces valeurs depuis votre fichier `.env` local !**

### Générer un Nouveau SECRET (Recommandé)

Pour plus de sécurité, générez un nouveau `SESSION_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 💾 Étape 4 : Initialiser la Base de Données

Une fois déployé, la table `admin_sessions` sera créée automatiquement au premier démarrage.

Vous pouvez aussi l'exécuter manuellement depuis votre machine locale :

```bash
cd backend
node create-sessions-table.js
```

---

## 🧪 Étape 5 : Tester le Déploiement

### 5.1 Tester l'API

Votre API sera accessible sur : `https://votre-projet.vercel.app/api/health`

```bash
curl https://votre-projet.vercel.app/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-02-19T..."
}
```

### 5.2 Tester l'Authentification

```bash
curl -X POST https://votre-projet.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"9xWL5JVP$Nj1l6"}'
```

Réponse attendue :
```json
{
  "token": "abc123...",
  "expiresAt": 1234567890
}
```

---

## 🎨 Étape 6 : Mettre à Jour le Frontend

### 6.1 Modifier `assets/config-loader.js`

Trouvez la fonction `getApiUrl()` et mettez à jour l'URL de production :

```javascript
getApiUrl() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001';
    }
    
    // 🔥 CHANGER AVEC VOTRE URL VERCEL
    return 'https://votre-projet.vercel.app';
}
```

### 6.2 Redéployer

```bash
git add assets/config-loader.js
git commit -m "Mise à jour URL API Vercel"
git push origin main
```

Vercel redéploiera automatiquement.

---

## ✅ Étape 7 : Vérification Complète

1. **API Backend** : https://votre-projet.vercel.app/api/health
2. **Frontend** : https://votre-projet.vercel.app/index.html
3. **Admin** : https://votre-projet.vercel.app/admin.html
4. **Simulateur** : https://votre-projet.vercel.app/simulateur.html

### Test d'Authentification Admin

1. Ouvrez https://votre-projet.vercel.app/admin.html
2. Entrez le mot de passe : `9xWL5JVP$Nj1l6`
3. Vous devriez être connecté ✅

---

## 🔒 Sécurité Production

### ⚠️ CHANGEZ LE MOT DE PASSE ADMIN

**Avant d'utiliser en production, changez ABSOLUMENT le mot de passe !**

```bash
# Générer un nouveau hash
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('VotreNouveauMotDePasse', 10));"

# Copier le hash et le mettre dans Vercel → Settings → Environment Variables
# Variable : ADMIN_PASSWORD_HASH
# Valeur : $2b$10$...nouveau_hash
```

Puis redéployer :

```bash
vercel --prod
```

---

## 📊 Monitoring et Logs

### Voir les Logs en Temps Réel

Dans le Dashboard Vercel :
- **Deployments** → Cliquez sur votre déploiement
- **Functions** → Voir les logs des fonctions serverless

### Erreurs Courantes

| Erreur | Solution |
|--------|----------|
| `DATABASE_URL not found` | Ajoutez la variable dans Vercel Settings |
| `Session invalide` | La table `admin_sessions` n'existe pas → Exécutez `create-sessions-table.js` |
| `CORS error` | Vérifiez que CORS est activé dans `server.js` |

---

## 🆓 Limites du Plan Gratuit Vercel

- ✅ **Bande passante** : 100GB/mois
- ✅ **Builds** : 6000 minutes/mois
- ✅ **Functions** : Temps d'exécution 10s max
- ✅ **Serverless Functions** : Illimitées

**→ Largement suffisant pour TrustiScore !**

---

## 🔄 Mises à Jour

Pour mettre à jour l'application :

```bash
# Modifier votre code
git add .
git commit -m "Nouvelle fonctionnalité"
git push origin main

# Vercel redéploie automatiquement
```

---

## 🌐 Domaine Personnalisé

### Ajouter votre domaine

1. Dans Vercel : **Settings** → **Domains**
2. Ajoutez votre domaine : `trustiscore.com`
3. Configurez les DNS selon les instructions
4. Vercel génère automatiquement un certificat SSL ✅

---

## 📚 Documentation Complémentaire

- **Vercel** : https://vercel.com/docs
- **Neon.tech** : https://neon.tech/docs
- **Express sur Vercel** : https://vercel.com/guides/using-express-with-vercel

---

## 🆘 Support

En cas de problème :

1. Vérifiez les logs Vercel
2. Testez l'API avec `curl`
3. Vérifiez que la BDD Neon est accessible
4. Consultez la documentation Vercel

---

## ✅ Checklist de Déploiement

- [ ] Code pushé sur GitHub
- [ ] Projet créé sur Vercel
- [ ] Variables d'environnement configurées
- [ ] Table `admin_sessions` créée
- [ ] URL API mise à jour dans `config-loader.js`
- [ ] Test de l'API `/api/health`
- [ ] Test de l'authentification admin
- [ ] Mot de passe changé (production)
- [ ] Domaine personnalisé configuré (optionnel)

---

**🎉 Votre application TrustiScore est maintenant en ligne sur Vercel !**
