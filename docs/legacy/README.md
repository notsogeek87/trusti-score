# Documentation obsolète

> **Pour qui / Pourquoi** : retrouver d'anciens guides supprimés du dépôt parce qu'ils
> décrivaient une architecture qui n'existe plus (Vercel, Neon, interface admin).

Ces fichiers ne sont plus dans la branche principale ; ils restent consultables dans
l'historique Git, par exemple :

```bash
git log --diff-filter=D --name-only -- '*.md'
git show <commit>^:QUICKSTART.md
```

| Fichier | Sujet | Raison du retrait |
|---|---|---|
| `VERCEL-CHANGES.md`, `VERCEL-DEPLOY.md`, `VERCEL-UPDATE.md` | Déploiement Vercel | [Hébergement Hyperfluid](../architecture/2026-11-13-hebergement-hyperfluid-retrait-vercel.md) |
| `NEON-SETUP.md` | Base Neon | Base interne Hyperfluid |
| `CLOUDFLARE-SETUP.md` | Cloudflare, protection de l'admin | Admin supprimé |
| `README-ADMIN.md`, `SECURITY-ADMIN.md`, `SECURITY-BOTS.md` | Interface admin et sa sécurité | [Admin supprimé](../architecture/2026-11-13-suppression-interface-admin.md) |
| `QUICKSTART.md`, `STATUS.md`, `RESUME.md`, `COMMANDS.md`, `ARCHITECTURE.md` | Démarrage local, état, commandes | Centrés sur l'admin, Vercel et Neon |
