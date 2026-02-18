# 🔐 Sécurité de l'Interface d'Administration

## 🎯 Protection par Mot de Passe

L'interface d'administration (`admin.html`) est maintenant protégée par un mot de passe pour empêcher les accès non autorisés.

## 🔑 Mot de Passe Par Défaut

**Mot de passe par défaut : `admin123`**

⚠️ **IMPORTANT : Changez ce mot de passe avant de déployer en production !**

## 🛠️ Changer le Mot de Passe

### Méthode 1 : Modification du Fichier

1. Ouvrez le fichier `admin.html` dans un éditeur de texte
2. Recherchez la ligne suivante (environ ligne 810) :
```javascript
const ADMIN_PASSWORD = 'admin123'; // Changez ce mot de passe !
```
3. Remplacez `'admin123'` par votre mot de passe sécurisé
4. Sauvegardez le fichier

**Exemple :**
```javascript
const ADMIN_PASSWORD = 'MonMotDePasseSecurise2026!';
```

### Méthode 2 : Mot de Passe Fort Recommandé

Pour un mot de passe sécurisé, utilisez :
- Au moins 12 caractères
- Mélange de majuscules et minuscules
- Chiffres et caractères spéciaux
- Pas de mots du dictionnaire

**Exemples de mots de passe forts :**
- `Tr@nspar3nc3_2026!`
- `S0uv3ra!n€t€_Num`
- `TrustiScor3#Admin!`

## 🔒 Fonctionnement de la Sécurité

### Session

- **Durée** : La session persiste jusqu'à la fermeture du navigateur
- **Stockage** : Utilise `sessionStorage` (local au navigateur)
- **Déconnexion** : Bouton "🚪 Se déconnecter" en haut à droite

### Ce qui est Protégé

✅ Accès à l'interface de configuration  
✅ Modification des textes et paramètres  
✅ Export de la configuration  

### Limitations de Sécurité (Côté Client)

⚠️ Cette protection est côté client (JavaScript). Elle est efficace pour :
- Empêcher un accès accidentel
- Décourager les utilisateurs non autorisés
- Protéger dans un environnement local ou de confiance

❌ Elle N'est PAS suffisante pour :
- Un environnement de production exposé sur Internet
- Protéger contre des attaques ciblées
- Sécuriser des données sensibles

## 🌐 Déploiement en Production

### Option 1 : Ne Pas Exposer admin.html (Recommandé)

La meilleure sécurité est de ne **jamais déployer** `admin.html` sur votre serveur public.

**Workflow recommandé :**
1. Utilisez `admin.html` uniquement en local
2. Exportez la configuration modifiée
3. Déployez uniquement `index.html`, `simulateur.html` et `assets/`

### Option 2 : Protection Serveur

Si vous devez exposer l'admin, ajoutez une authentification serveur :

#### Apache (.htaccess)

```apache
# Protéger admin.html
<Files "admin.html">
    AuthType Basic
    AuthName "Administration TrustiScore"
    AuthUserFile /chemin/vers/.htpasswd
    Require valid-user
</Files>
```

Créer le fichier .htpasswd :
```bash
htpasswd -c .htpasswd admin
```

#### Nginx

```nginx
location /admin.html {
    auth_basic "Administration TrustiScore";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

#### Node.js / Express

```javascript
const basicAuth = require('express-basic-auth');

app.use('/admin.html', basicAuth({
    users: { 'admin': 'motdepasse' },
    challenge: true
}));
```

### Option 3 : Restriction par IP

Limiter l'accès à des adresses IP spécifiques.

#### Apache
```apache
<Files "admin.html">
    Order Deny,Allow
    Deny from all
    Allow from 192.168.1.0/24
    Allow from votre.ip.publique
</Files>
```

#### Nginx
```nginx
location /admin.html {
    allow 192.168.1.0/24;
    allow votre.ip.publique;
    deny all;
}
```

## 🔍 Vérification de Sécurité

### Tests à Effectuer

1. **Test d'accès :**
   - Ouvrir `admin.html` → Écran de connexion doit apparaître
   - Entrer un mauvais mot de passe → Message d'erreur
   - Entrer le bon mot de passe → Accès autorisé

2. **Test de session :**
   - Se connecter
   - Rafraîchir la page (F5) → Devrait rester connecté
   - Fermer l'onglet et rouvrir → Devrait redemander le mot de passe

3. **Test de déconnexion :**
   - Cliquer sur "Se déconnecter"
   - Vérifier le retour à l'écran de connexion

## 🚨 En Cas de Mot de Passe Oublié

Si vous oubliez votre mot de passe personnalisé :

1. Ouvrez `admin.html` dans un éditeur de texte
2. Trouvez la ligne `const ADMIN_PASSWORD = '...'`
3. Remplacez par un nouveau mot de passe
4. Ou réinitialisez à `'admin123'`

## 📊 Logs et Surveillance

Le système ne conserve aucun log des tentatives de connexion. Pour surveiller l'accès :

1. Consultez les logs de votre serveur web (Apache/Nginx)
2. Utilisez un outil de monitoring (fail2ban, etc.)
3. Activez les alertes sur les fichiers sensibles

## ✅ Checklist de Sécurité

Avant de déployer :

- [ ] Mot de passe par défaut modifié
- [ ] Mot de passe fort (12+ caractères)
- [ ] `admin.html` non déployé OU protégé par authentification serveur
- [ ] Restriction par IP configurée (si applicable)
- [ ] Tests de sécurité effectués
- [ ] Documentation du mot de passe dans un gestionnaire sécurisé
- [ ] Sauvegarde de la configuration originale

## 🆘 Support

Pour des questions de sécurité :
- Consultez la documentation de votre hébergeur
- Utilisez des certificats SSL/TLS (HTTPS)
- Envisagez une authentification à deux facteurs pour un environnement critique

## 📚 Ressources Complémentaires

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Guide Apache Authentication](https://httpd.apache.org/docs/2.4/howto/auth.html)
- [Nginx Access Control](https://docs.nginx.com/nginx/admin-guide/security-controls/configuring-http-basic-authentication/)

---

**Sécurité = Simplicité + Vigilance** 🛡️
