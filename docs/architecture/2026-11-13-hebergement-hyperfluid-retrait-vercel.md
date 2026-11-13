# 2026-11-13 : hébergement sur Hyperfluid, retrait de Vercel et Neon

> **Pour qui / Pourquoi** : trace la décision d'héberger TrustiScore uniquement chez
> Hyperfluid et ce qu'elle a changé dans le dépôt et les pages légales.

## Contexte

Le site était servi par Vercel (pages statiques + API serverless, `vercel.json`) avec
une base PostgreSQL chez Neon, et mesurait son audience avec Vercel Web Analytics.
Il a été migré vers Hyperfluid (Nudibranches Technologies, infrastructure en Europe) :
une image Docker unique et une base PostgreSQL interne.

## Décision

Hyperfluid devient le seul hébergeur du site, de l'API et de la base. Tout ce qui
était propre à Vercel est retiré :

- `vercel.json`, `.vercelignore`, guides `VERCEL-*.md` ;
- le contournement `VERCEL=1` de la redirection des anciens domaines (`backend/server.js`) ;
- le script Vercel Web Analytics de toutes les pages : le site ne mesure plus d'audience.

## Conséquences

- `confidentialite.html` et `mentions-legales.html` désignent Nudibranches Technologies
  comme hébergeur ; la rubrique « Mesure d'audience » est supprimée.
- La politique mentionne un **relais Vercel temporaire** : les versions de l'app Android
  Trusti antérieures au 13 novembre 2026 appellent `trusti-alpha.vercel.app/api`
  (dépôt `trusti`), relayé vers Hyperfluid. À retirer de la politique quand ce relais
  sera supprimé.
- Le projet Vercel `trusti-score` (adresse `trusti-score.vercel.app`) n'a plus de
  configuration : à déconnecter ou supprimer.
- Voir [le guide de déploiement](../guides/deploiement.md).
