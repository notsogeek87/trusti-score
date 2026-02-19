# ⚡ Mise à Jour Rapide Vercel

Vous avez déjà un projet Vercel ? Voici les étapes ultra-simples pour mettre à jour avec les sessions PostgreSQL.

## 🚀 Mise à Jour en 3 Étapes

### 1️⃣ Push sur GitHub

```bash
git add .
git commit -m "Adaptation Vercel serverless - Sessions PostgreSQL"
git push origin main
```

**→ Vercel redéploie automatiquement !** ✨

### 2️⃣ Vérifier les Variables d'Environnement

Connectez-vous à https://vercel.com/dashboard

Allez dans : **Votre Projet** → **Settings** → **Environment Variables**

Vérifiez que vous avez :
- ✅ `DATABASE_URL` 
- ✅ `ADMIN_PASSWORD_HASH`
- ✅ `SESSION_SECRET`
- ✅ `NODE_ENV` = `production`

**Ces variables devraient déjà exister.** Si elles manquent, ajoutez-les depuis votre fichier `backend/.env`.

### 3️⃣ Tester

Une fois le redéploiement terminé (1-2 minutes) :

**Test API :**
```bash
curl https://trusti-score.vercel.app/api/health
```

**Test Authentification :**
```bash
curl -X POST https://trusti-score.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"9xWL5JVP$Nj1l6"}'
```

**Interface Admin :**
Ouvrez : https://trusti-score.vercel.app/admin.html

---

## ✅ Que s'est-il passé ?

### Avant (Problème)
```
┌──────────────┐
│   Vercel     │
│  Instance 1  │ → Sessions en mémoire → ❌ Perdues
└──────────────┘

┌──────────────┐
│   Vercel     │
│  Instance 2  │ → Sessions différentes → ❌ Ne marche pas
└──────────────┘
```

### Après (Solution)
```
┌──────────────┐
│   Vercel     │
│  Instance 1  │ ──┐
└──────────────┘   │
                   ↓
               ┌────────────┐
               │ PostgreSQL │ ✅ Sessions partagées
               │   (Neon)   │
               └────────────┘
                   ↑
┌──────────────┐   │
│   Vercel     │ ──┘
│  Instance 2  │
└──────────────┘
```

**Toutes les instances Vercel partagent les mêmes sessions !** 🎉

---

## 🔍 Vérification de la Table Sessions

La table `admin_sessions` est créée **automatiquement** au démarrage du serveur.

Pour vérifier qu'elle existe :

```bash
# Se connecter à Neon
psql "postgresql://neondb_owner:...@ep-...neon.tech/neondb"

# Lister les tables
\dt

# Voir la structure
\d admin_sessions
```

Vous devriez voir :
```
                Table "public.admin_sessions"
   Column    |            Type             | Nullable
-------------+-----------------------------+----------
 token       | character varying(64)       | not null
 expires_at  | bigint                      | not null
 created_at  | timestamp without time zone |
```

---

## 🐛 Dépannage

### Le redéploiement échoue

**Voir les logs :**
1. Dashboard Vercel → Votre projet
2. **Deployments** → Cliquer sur le dernier
3. **View Function Logs**

### L'authentification ne marche toujours pas

**Test 1 : Vérifier que l'API répond**
```bash
curl https://trusti-score.vercel.app/api/health
```

Si ça ne marche pas :
- Vérifiez que `DATABASE_URL` est bien configurée dans Vercel
- Regardez les logs de déploiement

**Test 2 : Vérifier la table sessions**
```bash
# Via votre machine locale
cd backend
node -e "
const pg = require('pg');
require('dotenv').config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }});
pool.query('SELECT COUNT(*) FROM admin_sessions').then(r => console.log('Sessions:', r.rows[0].count)).catch(e => console.error('Erreur:', e.message));
"
```

### Sessions pas créées

Exécutez manuellement :
```bash
cd backend
node create-sessions-table.js
```

---

## 📊 Différences avec le Déploiement Local

| Aspect | Local | Vercel |
|--------|-------|--------|
| **Serveur** | Node.js persistant | Fonctions serverless |
| **Sessions** | PostgreSQL | PostgreSQL (identique) |
| **Port** | 3001 | Automatique |
| **URL** | localhost:3001 | trusti-score.vercel.app |
| **Redémarrage** | Manuel | Automatique à chaque push |

**→ Même code, fonctionne partout !** ✅

---

## 🎉 C'est Terminé !

Votre application TrustiScore fonctionne maintenant sur Vercel avec des sessions persistantes.

**Prochaine étape :** Changez le mot de passe admin pour la production !

```bash
# Générer un nouveau hash
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('VotreNouveauMotDePasse', 10));"

# Mettre à jour dans Vercel Settings → Environment Variables
# Variable : ADMIN_PASSWORD_HASH
# Valeur : le nouveau hash
```

---

**Besoin d'aide ?** Consultez [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md) pour le guide complet.
