# TrustiScore Backend API

API Node.js + Express + PostgreSQL qui sert la configuration du site TrustiScore
(textes, critères, seuils) et les pages statiques dans l'image Docker.

L'API est en **lecture seule** : il n'y a plus d'interface d'administration ni
d'authentification. La configuration se modifie directement en base.

## Installation

```bash
cd backend
cp .env.example .env   # renseigner DATABASE_URL
npm install
npm start              # ou npm run dev (redémarrage automatique)
```

## Variables d'environnement

```env
DATABASE_URL=postgresql://...   # adresse PostgreSQL (ou bloc JSON fourni par Hyperfluid)
PORT=3001
NODE_ENV=development
```

## Endpoints

### GET /api/health

Vérifie la connexion à la base.

```json
{ "status": "ok", "database": "connected", "timestamp": "..." }
```

### GET /api/config

Renvoie la configuration actuelle (ligne `id = 1` de `trustiscore_config`).
Si la table est vide, renvoie `assets/config.json`.

## Base de données

Les tables sont créées au démarrage du serveur.

### `trustiscore_config`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | INTEGER | toujours `1` |
| `config_data` | JSONB | configuration complète |
| `updated_at` | TIMESTAMP | date de dernière modification |

Au premier démarrage sur une base vide, la configuration de
`backend/seed-config.json` est insérée.

### `trustiscore_config_history`

Remplie automatiquement par un trigger à chaque modification de
`trustiscore_config`, pour garder l'historique.

## Modifier la configuration

Directement en SQL, par exemple :

```sql
UPDATE trustiscore_config
SET config_data = jsonb_set(config_data, '{siteName}', '"TrustiScore"'),
    updated_at = NOW()
WHERE id = 1;
```

L'ancienne version est conservée dans `trustiscore_config_history`.
