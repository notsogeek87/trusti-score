# 🔄 Flux de Données - TrustiScore avec PostgreSQL

## Architecture Complète

```
┌─────────────────────────────────────────────┐
│  Visiteur ouvre index.html                  │
│  ou simulateur.html                         │
└──────────────┬──────────────────────────────┘
               │
               │ JavaScript charge config-loader.js
               ▼
┌─────────────────────────────────────────────┐
│  config-loader.js                           │
│  - Essaie API d'abord                       │
│  - Fallback sur config.json si API off     │
└──────────────┬──────────────────────────────┘
               │
               │ fetch('http://localhost:3001/api/config')
               ▼
┌─────────────────────────────────────────────┐
│  Backend API (Node.js)                      │
│  GET /api/config (PAS d'auth nécessaire)    │
│  Lit depuis PostgreSQL                      │
└──────────────┬──────────────────────────────┘
               │
               │ SELECT * FROM trustiscore_config
               ▼
┌─────────────────────────────────────────────┐
│  PostgreSQL (Neon.tech)                     │
│  Table: trustiscore_config                  │
│  Contient la config JSON                    │
└─────────────────────────────────────────────┘
```

---

## Flux d'Utilisation

### 1️⃣ Visiteur lambda sur le site

```mermaid
Visiteur → index.html → config-loader.js → API → PostgreSQL → Config affichée
```

**Logs dans la console (F12) :**
```
🔄 Tentative de chargement depuis l'API...
✅ Configuration chargée depuis la base de données
```

**Avantage :** Toute modification admin est visible instantanément pour tous !

---

### 2️⃣ Admin modifie la configuration

```mermaid
Admin → admin.html → Login → Modifications → Sauvegarde → API → PostgreSQL
```

**Workflow :**
1. Connexion sur http://localhost:8000/admin.html
2. Mot de passe : `9xWL5JVP$Nj1l6`
3. Modifie les textes, critères, etc.
4. Clic "💾 Sauvegarder la Configuration"
5. **Envoyé à l'API avec authentification**
6. **Stocké dans PostgreSQL**

**Résultat :**
- ✅ Sauvegarde permanente en BDD
- ✅ Visible instantanément sur index.html
- ✅ Historique automatique (audit trail)

---

### 3️⃣ Initialisation de la BDD (première fois)

**Commande :**
```powershell
cd backend
npm run init
```

**Que fait ce script ?**
1. Lit `assets/config.json` (configuration par défaut)
2. S'authentifie à l'API
3. Envoie la config à PostgreSQL
4. Vérifie que tout est OK

**Quand l'utiliser ?**
- ✅ Première installation
- ✅ Après un reset complet de la BDD
- ❌ Pas besoin si la BDD est déjà initialisée

---

## Comparaison Avant / Après

### ❌ Avant (localStorage)

```
Admin modifie
    ↓
localStorage (navigateur uniquement)
    ↓
Export manuel en JSON
    ↓
Copier dans assets/config.json
    ↓
Commit Git
    ↓
Visiteurs voient les modifications
```

**Problèmes :**
- 😢 Modifications perdues si cache vidé
- 😢 Processus manuel fastidieux
- 😢 Pas d'historique

### ✅ Maintenant (PostgreSQL)

```
Admin modifie
    ↓
API → PostgreSQL (automatique)
    ↓
Visiteurs voient les modifications (temps réel)
```

**Avantages :**
- ✅ Sauvegarde permanente
- ✅ Instantané pour tous
- ✅ Historique automatique
- ✅ Multi-utilisateurs possible

---

## Points Importants

### 🌐 En Production

**Frontend :** Peut être déployé sur Netlify/Vercel (statique)  
**Backend :** DOIT être déployé sur Render/Railway/Vercel (API)

**Configuration prod dans config-loader.js :**
```javascript
getApiUrl() {
    if (hostname === 'localhost') {
        return 'http://localhost:3001';
    }
    
    // EN PRODUCTION :
    return 'https://api.trustiscore.com'; // Votre URL API
}
```

### 🔒 Sécurité

**Route publique (pas d'auth) :**
- `GET /api/config` - Lecture seule

**Routes protégées (token requis) :**
- `PUT /api/config` - Sauvegarde (admin uniquement)
- `POST /api/auth/login` - Authentification
- `POST /api/auth/logout` - Déconnexion

### 📊 Fallback Automatique

Si l'API est indisponible (maintenance, panne réseau...) :

```javascript
// config-loader.js fait automatiquement :
try {
    config = await fetch(API_URL + '/api/config');
} catch {
    // ⬇️ FALLBACK automatique
    config = await fetch('assets/config.json');
}
```

**Résultat :** Site toujours fonctionnel, même si API down !

---

## Commandes Utiles

### Démarrer le système complet
```powershell
.\start.ps1
```

### Initialiser la BDD (première fois)
```powershell
cd backend
npm run init
```

### Réinitialiser la BDD (⚠️ ÉCRASE tout)
```powershell
cd backend
npm run force-init
```

### Tests automatiques
```powershell
.\test-system.ps1
```

### Logs en temps réel
Regardez le terminal où tourne `npm start` :
```
2026-02-18T14:30:00.000Z - GET /api/config
2026-02-18T14:30:05.000Z - POST /api/auth/login
✅ Connexion admin réussie
2026-02-18T14:30:10.000Z - PUT /api/config
✅ Configuration sauvegardée en BDD
```

---

## 🎯 Récapitulatif

| Composant | Rôle | Où |
|-----------|------|-----|
| **config.json** | Backup/Fallback | `assets/config.json` |
| **config-loader.js** | Chargeur intelligent | `assets/config-loader.js` |
| **API Backend** | Serveur Node.js | `backend/server.js` |
| **PostgreSQL** | Base de données | Neon.tech (cloud) |
| **admin.html** | Interface admin | Frontend |
| **index.html** | Page visiteur | Frontend |

**Principe :** Les visiteurs lisent depuis l'API, l'admin écrit via l'API, tout est stocké en PostgreSQL ! ✅

---

## ✅ Checklist Mise en Production

- [ ] Backend déployé (Render/Railway)
- [ ] Variable `API_URL` mise à jour dans config-loader.js
- [ ] BDD initialisée (`npm run init`)
- [ ] Password admin changé (générer nouveau hash)
- [ ] Cloudflare configuré (protection DDoS)
- [ ] Tests de charge effectués
- [ ] Monitoring activé (Sentry/LogRocket)

**Voir [CLOUDFLARE-SETUP.md](../CLOUDFLARE-SETUP.md) pour le déploiement !**
