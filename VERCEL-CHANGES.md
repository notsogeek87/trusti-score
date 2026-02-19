# 🚀 Adaptations pour Vercel Serverless

## 📅 Date : 19 février 2026

## ✨ Modifications Effectuées

### 1. Backend - Sessions PostgreSQL

**Fichier modifié :** `backend/server.js`

- ❌ **Avant** : Sessions stockées en mémoire (`Map()`)
- ✅ **Après** : Sessions stockées dans PostgreSQL

**Pourquoi ?** Les fonctions serverless Vercel n'ont pas de mémoire persistante entre les requêtes. Chaque requête peut être traitée par une instance différente.

**Changements :**
- Fonction `requireAuth()` : Maintenant asynchrone, vérifie dans PostgreSQL
- Route `/api/auth/login` : Stocke le token dans la table `admin_sessions`
- Route `/api/auth/logout` : Supprime le token de PostgreSQL
- Nettoyage automatique des sessions expirées (10% de chance à chaque login)

### 2. Base de Données - Table Sessions

**Nouveau script :** `backend/create-sessions-table.js`

Crée automatiquement :
```sql
CREATE TABLE admin_sessions (
    token VARCHAR(64) PRIMARY KEY,
    expires_at BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

La table est également créée automatiquement au démarrage du serveur dans `initDatabase()`.

### 3. Configuration Vercel

**Nouveau fichier :** `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    }
  ]
}
```

### 4. Fichiers Ignorés

**Nouveau fichier :** `.vercelignore`

Exclut du déploiement :
- `node_modules`
- `.env` (sécurité)
- Fichiers de logs
- Fichiers IDE

### 5. Documentation

**Nouveau fichier :** `VERCEL-DEPLOY.md`

Guide complet de déploiement avec :
- ✅ Configuration des variables d'environnement
- ✅ Initialisation de la base de données
- ✅ Tests de déploiement
- ✅ Configuration du domaine personnalisé
- ✅ Checklist complète

### 6. Package.json

Nouveau script ajouté :
```json
"create-sessions": "node create-sessions-table.js"
```

## 🔄 Compatibilité

### ✅ Fonctionnement Local Inchangé

Toutes les modifications sont **100% rétrocompatibles** :
- ✅ Le serveur fonctionne toujours en local
- ✅ Les sessions fonctionnent (maintenant via PostgreSQL)
- ✅ L'authentification admin fonctionne
- ✅ Aucun changement dans l'interface utilisateur

### ✅ Compatible Vercel Serverless

- ✅ Pas de stockage en mémoire
- ✅ Sessions persistantes dans PostgreSQL
- ✅ Nettoyage automatique des sessions expirées
- ✅ Fonctions serverless < 10s d'exécution

## 🧪 Tests Effectués

### Tests Locaux
```powershell
✅ npm start - Serveur démarre correctement
✅ GET /api/health - Base de données connectée
✅ POST /api/auth/login - Authentification réussie
✅ Sessions stockées dans PostgreSQL
✅ Token généré et vérifié
```

### Structure de Base de Données

Tables créées automatiquement :
1. ✅ `trustiscore_config` - Configuration principale
2. ✅ `trustiscore_config_history` - Historique des modifications
3. ✅ `admin_sessions` - **NOUVEAU** Sessions admin

## 📊 Architecture Technique

### Avant (Local uniquement)
```
┌─────────────┐
│   Express   │
│   Server    │
├─────────────┤
│  Sessions   │  ← Map() en mémoire
│  (Memory)   │
└─────────────┘
```

### Après (Local + Vercel)
```
┌─────────────┐
│   Express   │
│   Server    │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  PostgreSQL │
│   (Neon)    │
├─────────────┤
│   Config    │
│  Sessions   │  ← Persisté en BDD
│  History    │
└─────────────┘
```

## 🔐 Sécurité

### Inchangée
- ✅ Hash bcrypt pour les mots de passe
- ✅ Tokens cryptographiquement sécurisés (256 bits)
- ✅ Sessions expirées après 4 heures
- ✅ Protection CORS
- ✅ Validation des entrées

### Améliorée
- ✅ Nettoyage automatique des sessions expirées
- ✅ Index sur `expires_at` pour performances
- ✅ Variables d'environnement isolées par déploiement

## 📝 À Faire Avant Production

### Obligatoire
- [ ] Changer le mot de passe admin
- [ ] Mettre à jour `ADMIN_PASSWORD_HASH` dans Vercel
- [ ] Mettre à jour l'URL API dans `config-loader.js`
- [ ] Générer un nouveau `SESSION_SECRET`

### Recommandé
- [ ] Configurer un domaine personnalisé
- [ ] Activer les alertes Vercel
- [ ] Documenter les variables d'environnement
- [ ] Configurer des sauvegardes Neon

## 🎉 Résultat

Votre application TrustiScore est maintenant **100% compatible Vercel serverless** tout en continuant de fonctionner parfaitement en local !

---

## 📚 Fichiers Modifiés/Créés

### Modifiés
- ✏️ `backend/server.js` - Sessions PostgreSQL
- ✏️ `backend/package.json` - Nouveau script
- ✏️ `README.md` - Lien vers documentation Vercel

### Créés
- ✨ `vercel.json` - Configuration Vercel
- ✨ `.vercelignore` - Fichiers à exclure
- ✨ `backend/create-sessions-table.js` - Script de migration
- ✨ `VERCEL-DEPLOY.md` - Guide de déploiement
- ✨ `VERCEL-CHANGES.md` - Ce fichier

---

**Migration réussie ! 🚀**
