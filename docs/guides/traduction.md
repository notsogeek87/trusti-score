# 🌍 Traduction du site (FR, EN, DE, ES, IT, NL, PL, PT)

> **Pour qui / Pourquoi** : pour toute personne (ou agent IA) qui modifie une page ou un texte
> du site : comment les versions traduites sont organisées, et comment les garder à jour.

## Organisation

Le français reste la langue source. Chaque page existe en huit exemplaires :

```
index.html            → https://trusti-score.eu/
en/index.html         → https://trusti-score.eu/en/
de/index.html         → https://trusti-score.eu/de/
es/, it/, nl/, pl/, pt/ → https://trusti-score.eu/es/ …
simulateur.html       → /simulateur, /en/simulateur, /de/simulateur, /es/simulateur…
…
```

- **FR, EN, DE** : pages écrites et maintenues à la main.
- **ES, IT, NL, PL, PT** : pages **générées** à partir des pages anglaises par
  `scripts/i18n-pages.mjs`. Les traductions vivent dans `i18n/pages/<lang>.json`
  (`{ "texte anglais": "traduction" }`) ; ne pas modifier `es/*.html`… à la main, la
  prochaine génération écraserait la modification.

- **Mêmes noms de fichiers** dans toutes les langues (`/de/simulateur`, pas `/de/simulator`).
- **Pas de traduction côté navigateur** : chaque version est une vraie page HTML, lisible sans
  JavaScript et indexable.
- Les pages traduites pointent vers `../assets/`, jamais vers `assets/`.
- **Textes de la configuration** (notes A à E, critères, simulateur, slogan, pied de page) :
  la configuration FR vient de `GET /api/config` (base) ou de `assets/config.json`. Sur une
  page traduite, `assets/config-loader.js` charge en plus `assets/i18n/config.<lang>.json` et
  remplace **uniquement les textes**. Poids, seuils et valeurs restent ceux de la
  configuration FR : la note ne peut pas différer d'une langue à l'autre.
- **Textes générés en JavaScript** : `TRUSTI_UI` dans `assets/config-loader.js` (« Note »,
  « Voir le détail »…) et `LABELS` dans `deploy/hyperfluid/hosting.js` (mention d'hébergement).

### Choix de la langue

- Sélecteur **FR · EN · DE · ES · IT · NL · PL · PT** (`<nav class="lang-switch">`) dans l'en-tête et le pied de page
  (dans le sommaire, touche S, pour la présentation). Il mène à la même page dans l'autre langue.
- `assets/i18n.js` mémorise le choix (`localStorage`, clé `trusti-lang`) et, si aucun choix
  n'est mémorisé et que la langue du navigateur est une autre langue du site, affiche un
  bandeau discret proposant la page équivalente. **Jamais de redirection automatique.**
  `<body data-no-lang-banner>` désactive le bandeau (présentation).
- Chaque page déclare ses équivalents (`<link rel="alternate" hreflang="…">`, `x-default` = FR).
  Le site est encore en `noindex` ; `sitemap.xml` est prêt (voir `docs/guides/referencement.md`).

## Modifier une page

1. Modifier la page FR.
2. Reporter la modification dans `en/<page>` et `de/<page>` (texte traduit, structure identique).
3. Lister les textes anglais nouveaux ou modifiés, sans traduction ES/IT/NL/PL/PT :

```bash
node scripts/i18n-pages.mjs --missing
```

4. Ajouter leurs traductions dans `i18n/pages/es.json`, `it.json`, `nl.json`, `pl.json`,
   `pt.json` (clé = texte anglais tel que listé). Un texte qui ne se traduit pas (nom
   propre, adresse) prend la même valeur. Les anciennes clés devenues inutiles peuvent rester.
5. Régénérer les pages ES/IT/NL/PL/PT (et le sélecteur de langue des pages FR/EN/DE) :

```bash
node scripts/i18n-pages.mjs
```

6. Lancer le contrôle, puis enregistrer les nouvelles empreintes :

```bash
node scripts/check-i18n.mjs            # signale ce qui manque ou a divergé
node scripts/check-i18n.mjs --update   # une fois les traductions à jour
```

Une phrase JavaScript construite avec des variables (`${…}`) n'est pas extraite : elle se
traduit dans `TEMPLATES` en tête de `scripts/i18n-pages.mjs`.

Ajouter une langue : l'ajouter à `LANGS` (et `GENERATED`, `OG_LOCALE`) dans
`scripts/i18n-pages.mjs`, à `LANGS` dans `scripts/check-i18n.mjs`, `assets/i18n.js`,
`backend/app-pages.js` (textes `T`, `LOCALE`), à `TRUSTI_UI` (`assets/config-loader.js`),
`LABELS` (`deploy/hyperfluid/hosting.js`), créer `i18n/pages/<lang>.json`,
`assets/i18n/config.<lang>.json` et `assets/og-image-<lang>.png`, puis mettre à jour
`sitemap.xml`.

La CI (`hyperfluid-image.yml`) lance `node scripts/check-i18n.mjs` avant de construire l'image.
**Le déploiement est bloqué** si :

- une page FR a changé sans que `i18n.manifest.json` ait été mis à jour (donc sans relecture
  des traductions) ;
- une version traduite manque, n'a pas la bonne langue, les bons `hreflang` ou le sélecteur ;
- la structure diffère entre langues : `id`, nombre de balises, liens, scripts, images ;
- une page traduite pointe vers `assets/` au lieu de `../assets/` ;
- `assets/i18n/config.<lang>.json` n'a pas de traduction pour un texte de
  `backend/seed-config.json`, ou contient une clé inconnue ou un nombre.

Un texte propre à une traduction (ex. « seule la version française fait foi ») porte
l'attribut `data-i18n-note` : il est exclu de la comparaison de structure.

## Modifier un texte de la configuration

La configuration publiée est en base (`trustiscore_config`) et sa copie dans
`backend/seed-config.json`. Quand un texte FR change :

1. Mettre à jour `backend/seed-config.json` (workflow *Seed config*).
2. Traduire le texte dans chaque `assets/i18n/config.<lang>.json` (en, de, es, it, nl, pl, pt ;
   même chemin de clés ; les tableaux sont associés **par position**).
3. `node scripts/check-i18n.mjs --update`.

Un texte FR modifié en base sans mise à jour de `seed-config.json` reste affiché avec
l'ancienne traduction. Le contrôle ne le détecte pas, puisqu'il ne lit que la copie du dépôt.

## Pages juridiques

`mentions-legales` et `confidentialite` sont traduites avec la mention « seule la version
française fait foi ». Toute modification juridique se fait d'abord en FR.

## Contact

Les versions traduites précisent « nous répondons en français ou en anglais ». Les e-mails et
tickets GitHub pré-remplis sont traduits.

## Glossaire

| FR | EN | DE |
| --- | --- | --- |
| souveraineté numérique | digital sovereignty | digitale Souveränität |
| note (A à E) | grade | Note |
| score sur 100 | score out of 100 | Punktzahl von 100 |
| appli, application | app | App |
| éditeur (d'une appli) | provider / publisher | Anbieter / Herausgeber |
| GAFAM | Big Tech | Big Tech |
| RGPD | GDPR | DSGVO |
| UE | EU | EU |
| DPO | DPO (Data Protection Officer) | Datenschutzbeauftragter (DSB) |
| AIPD / DPIA | DPIA | DSFA |
| CGU / PPD | terms of service / privacy policy | AGB / Datenschutzerklärung |
| Cloud Act | CLOUD Act | CLOUD Act |
| SecNumCloud | SecNumCloud (qualification cloud de l'ANSSI) | SecNumCloud (ANSSI ; équivalent allemand : C5 du BSI) |
| réversibilité | reversibility | Reversibilität |
| grille de notation | rating grid | Bewertungsraster |
| simulateur | simulator | Simulator |
| mentions légales | legal notice | Impressum |
| Gouvernance et Juridiction | Governance and Jurisdiction | Governance und Rechtsraum |
| Localisation des données | Data Location | Datenstandort |
| Contrôle technique | Technical Control | Technische Kontrolle |
| Conformité et Certifications | Compliance and Certifications | Konformität und Zertifizierungen |
| Transparence | Transparency | Transparenz |

Ton : vouvoiement en allemand (*Sie*). En anglais, orthographe britannique (*colour*, *organisation*).
Les noms TrustiScore, Trusti et les lettres A à E ne se traduisent pas.

### Glossaire ES, IT, NL, PL, PT

| FR | ES | IT | NL | PL | PT |
| --- | --- | --- | --- | --- | --- |
| souveraineté numérique | soberanía digital | sovranità digitale | digitale soevereiniteit | suwerenność cyfrowa | soberania digital |
| note (A à E) | nota | voto | score | ocena | nota |
| éditeur | editor | editore | uitgever | wydawca | editor |
| RGPD | RGPD | GDPR | AVG | RODO | RGPD |
| DPO | DPO | DPO | FG (functionaris gegevensbescherming) | IOD (inspektor ochrony danych) | EPD (encarregado de proteção de dados) |
| mentions légales | aviso legal | note legali | colofon | nota prawna | aviso legal |
| simulateur | simulador | simulatore | simulator | symulator | simulador |
| Gouvernance et Juridiction | Gobernanza y jurisdicción | Governance e giurisdizione | Governance en jurisdictie | Zarządzanie i jurysdykcja | Governação e jurisdição |
| Localisation des données | Ubicación de los datos | Localizzazione dei dati | Locatie van de gegevens | Lokalizacja danych | Localização dos dados |
| Contrôle technique | Control técnico | Controllo tecnico | Technische controle | Kontrola techniczna | Controlo técnico |
| Conformité et Certifications | Cumplimiento y certificaciones | Conformità e certificazioni | Naleving en certificeringen | Zgodność i certyfikaty | Conformidade e certificações |
| Transparence | Transparencia | Trasparenza | Transparantie | Przejrzystość | Transparência |

Ton : tutoiement (*tú*, *tu*, *je*, *ty*, *tu*), comme dans l'app Trusti (le site FR vouvoie). Portugais
d'Europe (*telemóvel*, *ecrã*), espagnol d'Espagne. Traductions faites par Claude
(novembre 2026), à relire par des locuteurs natifs.
