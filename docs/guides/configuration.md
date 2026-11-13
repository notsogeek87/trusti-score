# 🚀 TrustiScore - Système de Configuration Paramétrable

> **Pour qui / Pourquoi** : pour toute personne qui doit modifier les textes, critères
> ou seuils du site, ou comprendre comment les pages chargent leur contenu.

## 📌 Vue d'ensemble

Le site TrustiScore est entièrement paramétrable. Tous les textes explicatifs, descriptions, critères de notation et seuils peuvent être modifiés sans toucher au code HTML ou JavaScript.

## 🏗️ Architecture

### Fichiers Principaux

1. **assets/config.json** : Fichier de configuration contenant tous les textes et paramètres
2. **assets/config-loader.js** : Script de chargement et gestion de la configuration
3. **Table `trustiscore_config`** (PostgreSQL) : configuration publiée, servie par `GET /api/config`
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

### Modifier le contenu

Il n'y a plus d'interface d'administration. La configuration publiée vit dans la
table `trustiscore_config` (colonne `config_data`, JSONB) et se modifie en SQL
(voir [la référence API](../api/README.md)). `assets/config.json` sert de
configuration par défaut si la table est vide.

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

1. **API** (`GET /api/config`) : configuration stockée en base
2. **assets/config.json** : configuration par défaut si l'API ne répond pas

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

### Recommandations

1. **Valider le JSON** avant de l'écrire en base
2. L'historique (`trustiscore_config_history`) permet de revenir à une version précédente

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

## 📚 Ressources

- [Référence API](../api/README.md) : API et base de données
- [config.json](../../assets/config.json) : Configuration par défaut
- [config-loader.js](../../assets/config-loader.js) : Documentation du code

## 🤝 Contribution

Pour contribuer à l'amélioration du système :
1. Tester différentes configurations
2. Signaler les bugs ou limitations
3. Proposer des améliorations
4. Partager les configurations personnalisées

---

**Développé avec ❤️ pour la souveraineté numérique européenne**
