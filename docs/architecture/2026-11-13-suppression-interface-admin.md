# 2026-11-13 : suppression de l'interface admin et de l'authentification

> **Pour qui / Pourquoi** : explique pourquoi l'API est en lecture seule et comment
> la configuration se modifie désormais.

## Contexte

`admin.html` permettait de modifier la configuration du site (textes, critères,
seuils) via `PUT /api/config`, protégé par un mot de passe (`ADMIN_PASSWORD_HASH`,
bcrypt) et des sessions stockées dans `admin_sessions`. Le mot de passe par défaut
était publié en clair dans une dizaine de fichiers du dépôt public, et l'interface
n'était plus utilisée.

## Décision

Supprimer l'interface et toute l'authentification :

- `admin.html`, routes `POST /api/auth/login`, `POST /api/auth/logout`,
  `PUT /api/config`, `GET /api/config/history` ;
- table `admin_sessions` (supprimée au démarrage du serveur) ;
- dépendance `bcrypt` (et outils de compilation du `Dockerfile`) ;
- scripts et docs liés à l'admin (voir [legacy](../legacy/README.md)).

## Conséquences

- L'API ne fait plus que lire : `GET /api/health`, `GET /api/config`.
- La configuration se modifie **directement en base**, table `trustiscore_config` ;
  le trigger d'historique (`trustiscore_config_history`) est conservé :

```sql
UPDATE trustiscore_config
SET config_data = jsonb_set(config_data, '{siteName}', '"TrustiScore"'),
    updated_at = NOW()
WHERE id = 1;
```

- Variables à retirer côté Hyperfluid : `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`.
- Le mot de passe reste lisible dans l'historique Git : à considérer comme compromis.
