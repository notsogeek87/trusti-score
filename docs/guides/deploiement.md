# Déploiement sur Hyperfluid

> **Pour qui / Pourquoi** : pour comprendre comment une modification arrive en
> production sur https://trusti-score.eu, et quoi vérifier quand un déploiement échoue.

## Chaîne de déploiement

1. Push (ou merge) sur `main`.
2. Le workflow `.github/workflows/hyperfluid-image.yml` construit l'image Docker
   (`Dockerfile`), vérifie qu'elle charge ses dépendances, la publie sur
   `ghcr.io/notsogeek87/trusti-score`, puis crée le tag `hyperfluid-v1.0.N`.
3. Hyperfluid suit ces tags (`hyperfluid.toml`) et redéploie le site.

Les fichiers `.md` et les workflows ponctuels (`seed-config.yml`, `qr-liens.yml`)
ne déclenchent pas de construction.

```toml
# hyperfluid.toml
[containers.trusti-score.image]
repository = "ghcr.io/notsogeek87/trusti-score"
tag        = "{git_version}"
```

## Contenu de l'image

- `backend/server.js` (API Express, port 3000) et ses dépendances ;
- les pages `*.html`, `robots.txt` et `assets/`, servies depuis `/app/public` ;
- `deploy/hyperfluid/hosting.js` : mention « Hébergé en France par Hyperfluid »,
  présente uniquement dans cette image.

## Variables d'environnement (côté Hyperfluid)

```env
DATABASE_URL=...   # adresse PostgreSQL ou bloc JSON fourni par Hyperfluid
PORT=3000
NODE_ENV=production
```

## Base de données

Les tables sont créées au démarrage. Sur une base vide, la configuration de
`backend/seed-config.json` est insérée (générée une fois par le workflow
`seed-config.yml`). Voir [la référence API](../api/README.md).

## Tester en local

```bash
cd backend
cp .env.example .env   # renseigner DATABASE_URL
npm install
npm start              # http://localhost:3001
```
