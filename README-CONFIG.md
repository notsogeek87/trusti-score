# 🚀 TrustiScore - Système de Configuration Paramétrable

## 📌 Vue d'ensemble

Le site TrustiScore est maintenant entièrement paramétrable par un administrateur. Tous les textes explicatifs, descriptions, critères de notation et seuils peuvent être modifiés sans toucher au code HTML ou JavaScript.

## 🏗️ Architecture

### Fichiers Principaux

1. **assets/config.json** : Fichier de configuration contenant tous les textes et paramètres
2. **assets/config-loader.js** : Script de chargement et gestion de la configuration
3. **admin.html** : Interface d'administration web pour modifier la configuration
4. **index.html** : Page d'accueil (modifiée pour utiliser la config dynamique)
5. **simulateur.html** : Simulateur (modifié pour utiliser la config dynamique)

### Flux de Données

```
┌─────────────────┐
│  config.json    │ ← Configuration par défaut
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ config-loader.js│ ← Charge et gère la config
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  index.html     │ ← Affiche le contenu dynamique
│  simulateur.html│
└─────────────────┘

┌─────────────────┐
│   admin.html    │ ← Interface pour modifier
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  localStorage   │ ← Stockage temporaire
└────────┬────────┘
         │
         ↓ (export)
┌─────────────────┐
│  config.json    │ ← Mise à jour permanente
└─────────────────┘
```

## ✨ Fonctionnalités

### Ce qui est paramétrable :

#### 1. Informations Générales
- Nom du site
- Slogan
- Texte du footer

#### 2. Système de Notation
- Seuils de notation (A: ≥80%, B: ≥60%, C: ≥40%, D: ≥20%)
- Descriptions des notes A à E
  - Titre
  - Description longue (simulateur)
  - Description courte (page d'accueil)

#### 3. Critères d'Évaluation
Pour chaque critère (gouvernance, localisation, contrôle, conformité, transparence) :
- Nom
- Pondération (%)
- Description courte
- Description détaillée
- Exemples pour notes A et E
- **5 options de notation** (0 à 4 points)
  - Icône (emoji)
  - Label court
  - Description complète

#### 4. Simulateur
- Titre et sous-titre
- Texte d'introduction (multi-paragraphes)
- Texte du bouton de soumission
- Titres des sections de résultats

#### 5. Page d'Accueil
- Sections complètes avec :
  - Titres
  - Contenu structuré (paragraphes, listes, encadrés)

## 🎯 Utilisation

### Pour un Administrateur

1. **Ouvrir l'interface admin** : `admin.html`
2. **Naviguer entre les onglets** : Général, Notes, Critères, Simulateur, Page d'accueil
3. **Modifier les textes** dans les formulaires
4. **Sauvegarder** : Les modifications sont stockées dans le navigateur
5. **Exporter** : Télécharger le fichier `config.json` modifié
6. **Appliquer** : Remplacer `assets/config.json` par le fichier exporté

### Pour un Développeur

```javascript
// Charger la configuration
await trustiConfig.load();

// Obtenir une valeur
const siteName = trustiConfig.getSiteName();
const criteria = trustiConfig.getCriteria();
const gradeDesc = trustiConfig.getGradeDescription('A');

// Calculer un score
const formData = new FormData(form);
const results = trustiConfig.calculateScore(formData);

// Générer du HTML
const gradeScaleHTML = trustiConfig.generateGradeScale();
const criteriaHTML = trustiConfig.generateCriteriaGrid();
```

## 🔄 Fonctionnement Technique

### Priorité de Chargement

1. **localStorage** : Si présent, utilisé en priorité (modifications de l'admin non exportées)
2. **config.json** : Fichier par défaut si pas de localStorage

### Génération Dynamique

Les pages `index.html` et `simulateur.html` génèrent dynamiquement leur contenu au chargement :

```javascript
// Au chargement de la page
await trustiConfig.load();
trustiConfig.applyToHeader();
trustiConfig.applyToFooter();
generateContent();
```

### Calcul du Score

Le calcul est entièrement basé sur la configuration :

```javascript
// Pondérations et seuils depuis config.json
const score = calculateWeightedScore(formData);
const grade = getGradeFromThresholds(score);
```

## 📦 Structure de config.json

```json
{
  "siteName": "TrustiScore",
  "siteTagline": "...",
  "footer": { "copyright": "...", "additionalInfo": "..." },
  "gradeThresholds": { "A": 80, "B": 60, "C": 40, "D": 20 },
  "gradeDescriptions": {
    "A": { "title": "...", "description": "...", "shortDescription": "..." }
  },
  "criteria": {
    "gouvernance": {
      "name": "...",
      "weight": 20,
      "description": "...",
      "options": [
        { "value": 4, "icon": "🛡️", "label": "...", "description": "..." }
      ]
    }
  },
  "simulator": { "title": "...", "introDescription": [...] },
  "homepage": { "sections": [...] }
}
```

## 🔐 Sécurité

### Recommandations Production

1. **Ne pas exposer admin.html** sur le serveur public
2. **Protéger l'accès** via authentification si exposé
3. **Valider le JSON** avant de l'appliquer
4. **Sauvegarder** l'ancien config.json avant remplacement

### Validation

Le système vérifie :
- Format JSON valide
- Présence des champs requis
- Cohérence des pondérations (total = 100%)

## 🎨 Personnalisation Avancée

### Ajouter un Nouveau Critère

1. Modifier `config.json` :
```json
"criteria": {
  "nouveau_critere": {
    "name": "Nouveau Critère",
    "weight": 10,
    "description": "...",
    "options": [...]
  }
}
```

2. Ajuster les pondérations des autres critères pour totaliser 100%

### Modifier les Icônes

Utiliser des emojis ou des caractères Unicode :
- Copier depuis [Emojipedia](https://emojipedia.org)
- Ou utiliser des codes Unicode : `\u{1F512}`

### Personnaliser les Couleurs

Les couleurs sont dans les fichiers HTML (section `<style>`). Pour une personnalisation complète :
1. Créer un fichier CSS externe
2. Ajouter des classes CSS paramétrables dans config.json

## 📊 Avantages de cette Architecture

✅ **Séparation contenu/code** : Les textes sont isolés du code  
✅ **Modification facile** : Interface utilisateur intuitive  
✅ **Sans redéploiement** : Changements sans recompilation  
✅ **Multilingue** : Facile d'ajouter plusieurs langues  
✅ **Versioning** : config.json peut être versionné (Git)  
✅ **Testing** : Tester différentes configurations facilement  
✅ **Backup** : Sauvegardes simples du fichier JSON  

## 🚀 Évolutions Futures Possibles

- [ ] Support multilingue (config-fr.json, config-en.json)
- [ ] Éditeur WYSIWYG pour le contenu HTML
- [ ] Système de thèmes (couleurs dans config.json)
- [ ] Import/Export de critères individuels
- [ ] Historique des versions de configuration
- [ ] API pour modifier la config à distance
- [ ] Prévisualisation en temps réel dans l'admin

## 📚 Ressources

- [README-ADMIN.md](README-ADMIN.md) : Guide d'utilisation détaillé
- [config.json](assets/config.json) : Configuration par défaut
- [config-loader.js](assets/config-loader.js) : Documentation du code

## 🤝 Contribution

Pour contribuer à l'amélioration du système :
1. Tester différentes configurations
2. Signaler les bugs ou limitations
3. Proposer des améliorations
4. Partager les configurations personnalisées

---

**Développé avec ❤️ pour la souveraineté numérique européenne**
