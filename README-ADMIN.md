# 📋 Guide d'Administration TrustiScore

## 🔐 Sécurité

L'interface d'administration est maintenant protégée par mot de passe.

**Mot de passe par défaut : `admin123`**

⚠️ **Changez ce mot de passe avant tout déploiement !**

Voir [SECURITY-ADMIN.md](SECURITY-ADMIN.md) pour plus de détails sur la sécurité.

## 🎯 Vue d'ensemble

Ce guide explique comment utiliser l'interface d'administration pour personnaliser tous les textes et paramètres du site TrustiScore.

## 🚀 Accès à l'interface d'administration

Ouvrez le fichier `admin.html` dans votre navigateur :
```
file:///chemin/vers/trusti-score/admin.html
```

Ou via un serveur local :
```
http://localhost:8000/admin.html
```

## 🔧 Fonctionnalités

### 1. Configuration Générale

Dans l'onglet **Général**, vous pouvez modifier :
- **Nom du site** : Affiché dans le header et les métadonnées
- **Slogan** : Texte sous le titre principal
- **Copyright** : Texte du footer
- **Informations additionnelles** : Deuxième ligne du footer

### 2. Notes (A à E)

Dans l'onglet **Notes (A-E)**, vous pouvez configurer :
- **Seuils de notation** : Pourcentages minimums pour obtenir chaque note (A, B, C, D)
- **Titre de chaque note** : Ex: "Souverain & Privé" pour A
- **Description longue** : Texte affiché dans le simulateur après calcul
- **Description courte** : Texte affiché sur la page d'accueil

### 3. Critères de Notation

Dans l'onglet **Critères**, vous pouvez modifier pour chaque critère :
- **Nom du critère** : Ex: "Gouvernance et Juridiction"
- **Pondération** : Poids du critère en pourcentage (total doit faire 100%)
- **Description courte** : Texte explicatif sous le titre
- **Description détaillée** : Pour la page d'accueil
- **Exemples** : Pour les notes A et E
- **Options de notation** : Pour chaque niveau (0 à 4 points)
  - Icône (emoji)
  - Label court
  - Description complète

### 4. Simulateur

Dans l'onglet **Simulateur**, personnalisez :
- **Titre et sous-titre**
- **Texte d'introduction**
- **Bouton de soumission**
- **Titres des résultats**

### 5. Page d'Accueil

L'onglet **Page d'accueil** permet de modifier les titres des sections principales.

⚠️ **Note** : Pour une édition avancée du contenu (paragraphes, listes, etc.), exportez le fichier JSON et modifiez-le directement.

## 💾 Sauvegarde et Application des Modifications

### Méthode 1 : Sauvegarde Temporaire (Navigateur)

1. Modifiez les paramètres dans l'interface
2. Cliquez sur **💾 Sauvegarder la Configuration**
3. Les modifications sont enregistrées dans le `localStorage` du navigateur
4. Le site utilisera automatiquement cette configuration sur votre navigateur

✅ **Avantage** : Changements immédiats pour tester  
⚠️ **Inconvénient** : Uniquement visible sur votre navigateur, perdu si vous videz le cache

### Méthode 2 : Sauvegarde Permanente (Fichier)

1. Modifiez les paramètres dans l'interface
2. Cliquez sur **💾 Sauvegarder la Configuration**
3. Cliquez sur **📥 Exporter la Configuration**
4. Un fichier `config.json` sera téléchargé
5. Remplacez le fichier `assets/config.json` par celui téléchargé
6. Rafraîchissez le site

✅ **Avantage** : Modifications permanentes pour tous les utilisateurs  
✅ **Application** : Valable sur tous les navigateurs et appareils

## 🔄 Recharger la Configuration

Pour annuler les modifications non exportées et revenir au fichier `config.json` :
1. Cliquez sur **🔄 Recharger depuis le Fichier**

## ⚠️ Réinitialiser par Défaut

Pour revenir à la configuration d'origine :
1. Cliquez sur **⚠️ Réinitialiser par Défaut**
2. Confirmez l'action
3. Toutes les modifications du localStorage seront supprimées
4. La configuration du fichier `assets/config.json` sera rechargée

## 📝 Édition Avancée du JSON

Pour des modifications complexes du contenu de la page d'accueil :

1. Exportez la configuration avec **📥 Exporter la Configuration**
2. Ouvrez le fichier `config.json` dans un éditeur de texte
3. Modifiez la section `homepage.sections`
4. Structure d'une section :

```json
{
  "id": "why",
  "title": "🎯 Pourquoi TrustiScore existe-t-il ?",
  "content": [
    {
      "type": "paragraph",
      "text": "Votre texte avec <strong>mise en forme HTML</strong>"
    },
    {
      "type": "highlight",
      "text": "Texte en surbrillance"
    },
    {
      "type": "subtitle",
      "text": "Sous-titre"
    },
    {
      "type": "list",
      "ordered": true,
      "items": [
        "Premier item",
        "Deuxième item"
      ]
    }
  ]
}
```

5. Sauvegardez et remplacez `assets/config.json`

## 🎨 Types de Contenu Disponibles

- **paragraph** : Paragraphe de texte normal
- **highlight** : Encadré mis en évidence
- **subtitle** : Sous-titre (h3)
- **list** : Liste à puces ou numérotée
  - `ordered: true` pour une liste numérotée
  - `ordered: false` pour une liste à puces

## 🔍 Vérification

Après avoir appliqué les modifications :

1. Ouvrez `index.html` dans votre navigateur
2. Vérifiez que les titres et textes sont à jour
3. Ouvrez `simulateur.html`
4. Vérifiez les critères et les options de notation
5. Testez le calcul du TrustiScore

## 🆘 Dépannage

### Les modifications ne s'appliquent pas

1. Vérifiez que vous avez bien remplacé le fichier `assets/config.json`
2. Videz le cache du navigateur (Ctrl+F5 ou Cmd+Shift+R)
3. Vérifiez qu'il n'y a pas d'erreurs dans la console du navigateur (F12)

### Le site affiche des erreurs

1. Vérifiez que le fichier `config.json` est valide (utilisez un validateur JSON en ligne)
2. Assurez-vous que tous les champs requis sont présents
3. Vérifiez que les pourcentages des critères totalisent 100%

### Configuration perdue après un refresh

- Si vous n'avez pas exporté, les modifications sont dans le localStorage uniquement
- Exportez toujours votre configuration avant de fermer l'interface admin

## 📚 Structure du Projet

```
trusti-score/
├── admin.html              # Interface d'administration
├── index.html              # Page d'accueil
├── simulateur.html         # Simulateur de score
├── assets/
│   ├── config.json         # Configuration du site
│   ├── config-loader.js    # Script de chargement de config
│   └── logo.png           # Logo
└── README-ADMIN.md         # Ce fichier
```

## 🔒 Sécurité

⚠️ **Important** : L'interface d'administration ne nécessite pas d'authentification. Pour un environnement de production :

1. Protégez l'accès à `admin.html` via .htaccess ou configuration serveur
2. N'exposez pas `admin.html` sur un serveur public
3. Utilisez l'interface en local uniquement
4. Déployez uniquement les fichiers nécessaires (sans admin.html si possible)

## 💡 Bonnes Pratiques

1. **Testez toujours localement** avant de déployer
2. **Gardez une copie de sauvegarde** du config.json original
3. **Validez votre JSON** avant de l'appliquer
4. **Documentez vos modifications** importantes
5. **Vérifiez les pondérations** : la somme doit toujours faire 100%
6. **Testez le simulateur** après chaque modification des critères

## 🎯 Cas d'Usage Courants

### Modifier un texte explicatif

1. Ouvrir l'onglet correspondant dans l'admin
2. Modifier le texte
3. Sauvegarder et exporter
4. Remplacer config.json

### Ajouter un nouveau seuil de notation

1. Onglet "Notes (A-E)"
2. Modifier les pourcentages
3. Sauvegarder et tester dans le simulateur

### Changer la pondération des critères

1. Onglet "Critères"
2. Modifier les pourcentages (total = 100%)
3. Sauvegarder et tester le calcul

### Personnaliser les icônes

1. Onglet "Critères"
2. Modifier les champs "Icône" avec des emojis
3. Copier-coller des emojis depuis https://emojipedia.org

## 📞 Support

Pour toute question ou problème :
- Consultez ce guide
- Vérifiez la console JavaScript (F12) pour les erreurs
- Assurez-vous que tous les fichiers sont au bon emplacement

---

**Bonne personnalisation ! 🎨**
