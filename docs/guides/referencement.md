# Référencement (SEO) du site trusti-score.eu

Audit du 21/11/2026 et préparation de la mise en ligne « indexable ».
Périmètre : le site vitrine (ce dépôt). L'app web `app.trusti-score.eu` reste volontairement en
`noindex` (robots.txt `Disallow: /`).

## État au moment de l'audit

| # | Constat | Gravité | Statut |
|---|---------|---------|--------|
| 1 | Toutes les pages en `noindex, nofollow` : Google n'indexe rien | Bloquant | **Volontaire, à lever** (voir plus bas) |
| 2 | Aucune page par application : les notes, le cœur du projet, sont invisibles pour les moteurs | Majeur | Corrigé (575 fiches × 3 langues, voir plus bas) |
| 3 | Pas de `<link rel="canonical">` alors que `/simulateur`, `/simulateur.html`, `/index.html` répondent tous en 200 (contenu dupliqué) | Majeur | Corrigé |
| 4 | Pas de `sitemap.xml` | Majeur | Corrigé (`sitemap.xml`, avec les `hreflang`) |
| 5 | Pas de compression : la page d'accueil pèse 65 Ko transférés | Moyen | Corrigé (gzip : ~15 Ko) |
| 6 | Pas de balises Open Graph / Twitter : partages sans image ni résumé | Moyen | Corrigé (image 1200×630 par langue) |
| 7 | Pas de données structurées | Moyen | Corrigé (Organization + WebSite, WebApplication pour le simulateur, Dataset pour l'API) |
| 8 | Page 404 brute d'Express | Faible | Corrigé (`404.html`, code 404, `noindex`) |
| 9 | `liens.html` sans meta description | Faible | Corrigé |
| 10 | H1 de l'accueil = « TrustiScore » seul (aucun mot-clé) | Moyen | Recommandation |
| 11 | Simulateur : ~400 caractères visibles sans JavaScript (2 000 avec) | Faible | Recommandation |
| 12 | Liens internes en `.html` (ex. `mentions-legales.html`) alors que l'URL canonique est sans `.html` | Faible | Couvert par le canonical ; nettoyage optionnel |

Déjà bon : `hreflang` FR/EN/DE complets et cohérents, `lang` correct, titres et descriptions
uniques par page et par langue, `alt` sur les images, anciennes adresses redirigées en 301
(`www.`, `trustiscore.eu`, `trusti-score.lielu.eu`), HTTPS, mobile (viewport).

## Lever le `noindex` (le jour J)

Pages à rendre indexables (FR, EN, DE) : `index`, `simulateur`, `developpeurs`,
`mentions-legales`, `confidentialite` — les mêmes que dans `sitemap.xml`.
`liens` (page pour QR code) et `presentation` (diapos) **restent** en `noindex`.

```bash
for p in index simulateur developpeurs mentions-legales confidentialite; do
  for f in $p.html en/$p.html de/$p.html; do
    sed -i 's#<meta name="robots" content="noindex, nofollow">#<meta name="robots" content="index, follow">#' "$f"
  done
done
node scripts/check-i18n.mjs --update && node scripts/check-i18n.mjs
```

Puis, après déploiement :

1. **Google Search Console** : ajouter la propriété `trusti-score.eu` (vérification DNS), soumettre
   `https://trusti-score.eu/sitemap.xml`, demander l'indexation de l'accueil.
2. **Bing Webmaster Tools** : important pour ce public — Bing alimente Qwant, Ecosia et
   DuckDuckGo. Importer depuis Search Console, soumettre le sitemap.
3. Mettre à jour `<lastmod>` dans `sitemap.xml` quand une page change vraiment.
4. Tester un partage (Matrix, Mastodon, LinkedIn) pour vérifier l'aperçu.

## Ce qui a été ajouté

- Chaque page : `canonical`, `og:*`, `twitter:card` (images `assets/og-image*.png`).
- `scripts/check-i18n.mjs` vérifie que `canonical` et `og:url` pointent vers la page elle-même
  (ils diffèrent d'une langue à l'autre, donc exclus de la comparaison de structure).
- `sitemap.xml` (copié dans l'image par le `Dockerfile`), déclaré dans `robots.txt`.
- `backend/server.js` : compression (`compression`) et page 404.

## Recommandations

- **H1 de l'accueil** : y mettre le sujet, pas seulement la marque. Ex. :
  « TrustiScore, la note de souveraineté numérique des applications ». Titre de page possible :
  « TrustiScore – Souveraineté numérique des applications, notée de A à E ».
- **Simulateur** : afficher en HTML une courte intro (à quoi il sert, les 5 critères) visible
  sans JavaScript.
- **HTTPS forcé + HSTS** à vérifier côté Hyperfluid (le serveur Node ne redirige pas `http://`).
- **Liens entrants** (le vrai moteur pour un site jeune) : Framalibre, AlternativeTo,
  european-alternatives.eu, listes « awesome » sur GitHub, presse tech (Next, Korben…),
  annonce sur Mastodon/Matrix, fiche Wikidata.

## Fiches applications (`backend/app-pages.js`)

Une page par application notée, dans les 3 langues, générée par le serveur du site :

| Adresse | Contenu |
|---|---|
| `/applications`, `/en/applications`, `/de/applications` | Toutes les applications, groupées par note, avec filtre par nom |
| `/applications/<slug>` (et `/en/…`, `/de/…`) | Note, score, résumé, les 5 critères avec justification et sources, alternatives mieux notées, liens stores et app |
| `/sitemap-applications.xml` | Toutes les fiches (avec `hreflang`), déclaré dans `robots.txt` |

- **Données** : export complet de l'API ouverte (`/api/v1/export`, 3 langues), rechargé toutes
  les heures (3 exports/h sur les 20 autorisés). Si l'API tombe, les dernières données restent servies.
- **Mise à jour rapide** : toutes les 5 min (`APP_PAGES_POLL_SECONDS`), le serveur relit la liste
  légère (`/api/v1/apps`, 6 appels) et compare note, score, date d'évaluation et nom de chaque app.
  Jusqu'à 5 apps modifiées : seules leurs fiches sont rechargées. Au-delà, ou si des apps sont
  ajoutées ou retirées : export complet (au plus toutes les 15 min). Une note changée en base est
  visible sur le site en **~5 à 10 min** (cache navigateur des fiches : 5 min). Un texte de critère
  modifié sans changement de note suit au rechargement horaire.
- **Alternatives** : `/api/v1/apps/<id>/alternatives`, cache 6 h, 30 appels/min au plus ; au-delà ou en
  cas d'échec, repli sur les apps de la même catégorie mieux notées.
- **Adresses** : l'identifiant s'il est lisible (`tiktok`, `vinted`), sinon le nom (`whatsapp`,
  `proton-mail`). L'ancien identifiant numérique redirige en 301 vers l'adresse lisible.
  Attention : renommer une app change son adresse si son identifiant n'est pas lisible.
- **Indexation** : les fiches suivent automatiquement l'accueil. Tant que `index.html` est en
  `noindex`, elles le sont aussi ; le jour où il passe en `index, follow`, elles suivent
  (redémarrage du conteneur, fait par chaque déploiement).
- Données structurées : `SoftwareApplication` + `Review` (score sur 100) et `BreadcrumbList` ;
  `CollectionPage` pour la liste.
- L'accueil renvoie vers la liste (bouton sous les exemples, pied de page) et vers les fiches
  Tuta Mail et TikTok.
- `TRUSTI_PUBLIC_API` permet de pointer vers une autre API (par défaut `https://api.trusti-score.eu/api/v1`).

### Limites connues côté données (API)

- Catégories, noms et niveaux des critères ne sont pas traduits dans l'export EN/DE : les
  critères sont traduits par le site (`assets/i18n/config.<lang>.json`), la catégorie n'est
  affichée qu'en français.
- Certains noms sont ceux des stores (« Whatsapp », « TikTok - Videos, Shop & LIVE ») : le
  titre de la fiche prend la partie avant « : » ou « - ». Corriger le nom en base suffit.
- 118 applications ont un identifiant technique (`app_177…`) ; l'adresse vient alors du nom.

## Pistes suivantes

- Pages « Alternatives européennes à <app> » pour les apps notées D ou E (requêtes très cherchées).
- Pages par catégorie (« Messageries », « E-mail »…) une fois les catégories traduites dans l'API.
