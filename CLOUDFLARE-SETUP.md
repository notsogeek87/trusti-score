# 🚀 Configuration Cloudflare pour TrustiScore - Guide Pratique

## 🎯 Pourquoi Cloudflare ?

✅ **GRATUIT** pour l'essentiel  
✅ Protection DDoS automatique (des millions d'attaques bloquées/jour)  
✅ Rate limiting (limite les requêtes abusives)  
✅ CDN mondial (site plus rapide partout)  
✅ Certificat SSL gratuit  
✅ Cache intelligent  
✅ Firewall puissant  
✅ Protection contre les bots  

**Temps d'installation : 15-20 minutes**

---

## 📝 ÉTAPE 1 : Inscription (5 min)

### 1.1 Créer un Compte

1. Allez sur **https://dash.cloudflare.com/sign-up**
2. Entrez votre email
3. Choisissez un mot de passe fort
4. Vérifiez votre email (cliquez sur le lien de confirmation)

### 1.2 Ajouter Votre Site

1. Cliquez sur **"Add a Site"** (Ajouter un site)
2. Entrez votre nom de domaine : `votre-domaine.com`
3. Cliquez sur **"Add site"**

**Note :** Si vous n'avez pas encore de domaine, vous pouvez :
- En acheter un sur Namecheap, OVH, Gandi, etc. (10-15€/an)
- Pour tester : utilisez un sous-domaine gratuit sur vercel.app ou netlify.app

---

## 🔍 ÉTAPE 2 : Scan et Configuration (5 min)

### 2.1 Scan DNS

Cloudflare va scanner votre domaine pour détecter vos enregistrements DNS.

**Attendez** que le scan se termine (30 secondes à 2 minutes).

### 2.2 Vérification des Enregistrements

Cloudflare affiche tous vos enregistrements DNS existants.

**Vérifiez :**
- [ ] Enregistrement A (yourdomaine.com → Votre IP serveur)
- [ ] Enregistrement CNAME (www → votre-domaine.com)

**Exemple :**
```
Type    Name    Content             Proxy status
A       @       198.51.100.1        Proxied (orange cloud)
CNAME   www     votre-domaine.com   Proxied (orange cloud)
```

⚠️ **IMPORTANT :** Le petit nuage doit être **ORANGE** (Proxied) pour activer la protection !

**Actions :**
1. Vérifiez que le nuage est orange à côté de chaque enregistrement
2. Si gris, cliquez dessus pour le rendre orange
3. Cliquez sur **"Continue"**

---

## 🎛️ ÉTAPE 3 : Choix du Plan (1 min)

### Plans Disponibles

| Plan | Prix | Recommandé pour |
|------|------|-----------------|
| **Free** | 0€/mois | Sites personnels, blogs, démo ⭐ |
| Pro | 20$/mois | Sites business |
| Business | 200$/mois | E-commerce |
| Enterprise | Sur devis | Grandes entreprises |

**Pour TrustiScore :** Choisissez **"Free"** (largement suffisant !)

1. Sélectionnez le plan **"Free"**
2. Cliquez sur **"Continue"**

---

## 🌐 ÉTAPE 4 : Changement des Nameservers (10 min + 24h propagation)

### 4.1 Récupérer les Nameservers Cloudflare

Cloudflare vous donne 2 nameservers, par exemple :
```
abcd.ns.cloudflare.com
efgh.ns.cloudflare.com
```

**📝 Notez-les quelque part !**

### 4.2 Chez Votre Registrar (où vous avez acheté le domaine)

#### OVH
1. Connectez-vous sur **https://www.ovh.com/manager/**
2. Allez dans **"Noms de domaine"**
3. Cliquez sur votre domaine
4. Onglet **"Serveurs DNS"**
5. Cliquez sur **"Modifier les serveurs DNS"**
6. Supprimez les serveurs existants
7. Ajoutez les 2 nameservers Cloudflare
8. **Enregistrez**

#### Namecheap
1. Connectez-vous sur **https://www.namecheap.com**
2. Dashboard → **Domain List**
3. Cliquez sur **"Manage"** à côté de votre domaine
4. Section **"Nameservers"**
5. Sélectionnez **"Custom DNS"**
6. Entrez les 2 nameservers Cloudflare
7. Cliquez sur la coche verte ✓

#### GoDaddy
1. Connectez-vous sur **https://www.godaddy.com**
2. **"My Products"** → Trouver votre domaine
3. Cliquez sur **DNS** ou **"Manage DNS"**
4. Descendez à **"Nameservers"**
5. Cliquez sur **"Change"**
6. Sélectionnez **"Custom"**
7. Entrez les nameservers Cloudflare
8. **Enregistrez**

#### Gandi
1. Connectez-vous sur **https://admin.gandi.net**
2. **"Noms de domaine"**
3. Cliquez sur votre domaine
4. Onglet **"Serveurs de noms"**
5. Cliquez sur **"Modifier"**
6. Ajoutez les nameservers Cloudflare
7. **Validez**

### 4.3 Retour sur Cloudflare

1. Cliquez sur **"Done, check nameservers"**
2. Cloudflare vérifie automatiquement

⏰ **ATTENTION :** La propagation DNS prend entre **10 minutes et 48 heures** (généralement 2-4 heures).

**Pendant ce temps, votre site peut être temporairement inaccessible.**

---

## ✅ ÉTAPE 5 : Confirmation (Variable)

### Vérification

Cloudflare envoie un email quand les nameservers sont actifs.

**Pour vérifier manuellement :**
```bash
# Windows PowerShell
nslookup -type=ns votre-domaine.com

# Linux/Mac
dig NS votre-domaine.com +short
```

**Résultat attendu :**
```
abcd.ns.cloudflare.com
efgh.ns.cloudflare.com
```

**Si vous voyez les nameservers Cloudflare → C'est bon ! ✅**

---

## 🔧 ÉTAPE 6 : Configuration Sécurité (5 min)

Une fois les nameservers activés, configurez la sécurité :

### 6.1 SSL/TLS

1. Dans le dashboard Cloudflare : **SSL/TLS**
2. Mode SSL/TLS : Sélectionnez **"Full (strict)"** (recommandé)
   - Si erreur : choisissez **"Flexible"** temporairement
3. Activez **"Always Use HTTPS"** (Redirection automatique HTTP → HTTPS)
4. Activez **"Automatic HTTPS Rewrites"**

### 6.2 Firewall Rules (Protection Admin)

#### Règle 1 : Bloquer l'accès à admin.html depuis l'étranger

1. **Security** → **WAF** → **Firewall rules**
2. Cliquez sur **"Create firewall rule"**
3. **Nom :** `Block Admin Foreign Access`
4. **Expression :**
```
(http.request.uri.path eq "/admin.html") and (ip.geoip.country ne "FR")
```
5. **Action :** Challenge (CAPTCHA)
6. **Save**

**Effet :** Seules les IPs françaises peuvent accéder directement à l'admin. Les autres doivent résoudre un CAPTCHA.

#### Règle 2 : Rate Limiting Admin

1. **Create firewall rule**
2. **Nom :** `Admin Rate Limit`
3. **Expression :**
```
(http.request.uri.path eq "/admin.html")
```
4. **Action :** Challenge
5. **Rate limiting :** 5 requests per 10 minutes
6. **Save**

**Effet :** Maximum 5 tentatives d'accès en 10 minutes par IP.

### 6.3 Bot Fight Mode

1. **Security** → **Bots**
2. Activez **"Bot Fight Mode"** (Toggle ON)
3. Activez **"Super Bot Fight Mode"** si disponible

**Effet :** Bloque automatiquement les bots malveillants.

### 6.4 Sécurité Supplémentaire

1. **Security** → **Settings**
2. **Security Level :** Medium (ou High si vous avez beaucoup d'attaques)
3. **Challenge Passage :** 30 minutes
4. **Browser Integrity Check :** ON

---

## ⚡ ÉTAPE 7 : Performance & Cache (3 min)

### 7.1 Auto Minify

1. **Speed** → **Optimization**
2. **Auto Minify :** Cochez JavaScript, CSS, HTML
3. **Brotli :** ON

### 7.2 Caching

1. **Caching** → **Configuration**
2. **Caching Level :** Standard
3. **Browser Cache TTL :** 4 hours

### 7.3 Règles de Page

1. **Caching** → **Page Rules**
2. **Create Page Rule**

#### Règle Admin : Ne PAS cacher
```
URL: *votre-domaine.com/admin.html*
Settings:
- Cache Level: Bypass
- Browser Cache TTL: Respect Existing Headers
Save
```

#### Règle Assets : Cacher longtemps
```
URL: *votre-domaine.com/assets/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 7 days
- Browser Cache TTL: 7 days
Save
```

#### Règle Pages principales
```
URL: *votre-domaine.com/*.html
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 4 hours
Save
```

---

## 🧪 ÉTAPE 8 : Test & Validation (5 min)

### 8.1 Test SSL

1. Allez sur **https://www.ssllabs.com/ssltest/**
2. Entrez : `votre-domaine.com`
3. Attendez l'analyse (2-3 minutes)
4. **Résultat attendu :** Note A ou A+

### 8.2 Test Vitesse

1. Allez sur **https://www.webpagetest.org/**
2. Entrez votre URL
3. Lancez le test
4. **Avant Cloudflare :** Notez le temps de chargement
5. **Après Cloudflare :** Devrait être 30-50% plus rapide !

### 8.3 Test Sécurité

#### Test 1 : Accès Admin
```
1. Ouvrez votre site : https://votre-domaine.com
2. Allez sur https://votre-domaine.com/admin.html
3. Depuis la France : devrait charger normalement
4. Utilisez un VPN pour simuler un pays étranger : 
   → Devrait afficher un CAPTCHA !
```

#### Test 2 : Rate Limiting
```
1. Ouvrez un terminal
2. Exécutez (remplacez l'URL) :
   for i in {1..10}; do curl https://votre-domaine.com/admin.html; done
3. Après 5-6 requêtes : devrait bloquer (Error 429)
```

#### Test 3 : DDoS Simulation
```
# NE PAS faire en production, uniquement en test !
ab -n 100 -c 10 https://votre-domaine.com/
```
**Résultat :** Cloudflare bloque/ralentit automatiquement.

---

## 📊 ÉTAPE 9 : Monitoring (En continu)

### Dashboard Cloudflare

**À surveiller :**

1. **Analytics** → **Traffic**
   - Nombre de visiteurs
   - Bande passante économisée (%)
   - Requêtes cachées vs non cachées

2. **Analytics** → **Security**
   - Menaces bloquées
   - Graphique des attaques
   - Pays d'origine des menaces

3. **Analytics** → **Performance**
   - Temps de chargement
   - Performance CDN

### Alertes Email

1. **Notifications** → **Notification settings**
2. Activez :
   - [ ] **DDoS Attack Alerts**
   - [ ] **Rate Limiting Alerts**
   - [ ] **Firewall Events**
   - [ ] **SSL/TLS Certificate Alerts**

---

## 🎓 Configuration Avancée (Optionnel)

### Page Rules Supplémentaires

#### Redirection www → non-www (ou inverse)
```
URL: *www.votre-domaine.com/*
Settings:
- Forwarding URL: 301 - Permanent Redirect
- Destination URL: https://votre-domaine.com/$1
```

### Géo-blocage Complet

Pour bloquer complètement certains pays :

1. **Security** → **WAF** → **Tools**
2. **IP Access Rules**
3. **Mode :** Block
4. **Country :** Sélectionnez les pays à bloquer (ex: Russie, Chine si pas d'audience là-bas)
5. **Add**

### Transform Rules (Headers personnalisés)

1. **Rules** → **Transform Rules**
2. **Modify Response Header**
3. **Create rule**

**Exemple : Ajouter un header de sécurité**
```
Name: Security Headers
When: All incoming requests
Then:
- Set static header: X-Powered-By = TrustiScore
- Set static header: X-Frame-Options = DENY
Save
```

---

## 🔄 ÉTAPE 10 : Déploiement de TrustiScore

### 10.1 Préparer les Fichiers

Sur votre serveur ou hébergement :

```bash
# Structure recommandée
/var/www/votre-domaine/
├── index.html
├── simulateur.html
├── robots.txt
└── assets/
    ├── config.json
    ├── config-loader.js
    └── logo.png

# NE PAS INCLURE :
# ❌ admin.html (utiliser en local uniquement)
# ❌ README-*.md
# ❌ .git/
```

### 10.2 Configuration Serveur

#### Apache (.htaccess)
```apache
# Force HTTPS (Cloudflare le fait déjà, mais double sécurité)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>

# Cache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 week"
    ExpiresByType text/css "access plus 1 week"
</IfModule>
```

#### Nginx
Utilisez le fichier [nginx.conf.example](nginx.conf.example) fourni précédemment.

### 10.3 Vérification Finale

**Checklist :** 
- [ ] Site accessible en HTTPS
- [ ] Redirections HTTP → HTTPS fonctionnelles
- [ ] Assets (logo, etc.) chargent correctement
- [ ] Simulateur fonctionne
- [ ] Configuration chargée depuis config.json
- [ ] admin.html NON accessible (pas déployé)
- [ ] robots.txt bloque admin.html

---

## 🆘 Dépannage

### Problème : "Error 521 - Web server is down"

**Causes possibles :**
- Serveur web arrêté
- Firewall bloque Cloudflare
- Mauvaise IP dans les DNS

**Solutions :**
1. Vérifiez que votre serveur web tourne : `systemctl status nginx` ou `apache2`
2. Autorisez les IPs Cloudflare dans votre firewall : https://www.cloudflare.com/ips/
3. Vérifiez l'enregistrement A dans Cloudflare DNS

### Problème : "Too many redirects"

**Cause :** Boucle de redirection SSL

**Solution :**
1. Dashboard Cloudflare → **SSL/TLS**
2. Changez en mode **"Full"** (au lieu de "Flexible")
3. Ou désactivez les redirections HTTPS forcées sur votre serveur

### Problème : Cache ne se vide pas

**Solution :**
1. **Caching** → **Configuration**
2. **Purge Cache** → **Purge Everything**
3. Attendez 30 secondes
4. Rafraîchissez avec CTRL+F5

### Problème : Firewall bloque des visiteurs légitimes

**Solution :**
1. **Security** → **Events**
2. Trouvez les IPs bloquées par erreur
3. **IP Access Rules** → Ajoutez l'IP en mode "Allow"

---

## 📈 Résultats Attendus

### Avant Cloudflare
```
⏱️ Temps de chargement : 2.5 secondes
📊 Taille page : 350 KB
🌍 Vitesse depuis l'étranger : Lente
🛡️ Protection DDoS : Aucune
💰 Bande passante : 100%
```

### Après Cloudflare
```
⏱️ Temps de chargement : 0.8 secondes (-68%)
📊 Taille page : 180 KB (compression)
🌍 Vitesse depuis l'étranger : Rapide (CDN)
🛡️ Protection DDoS : Automatique
💰 Bande passante : 40% (60% économisé)
```

---

## 🎯 Récapitulatif Actions à Faire

### Immédiat (Aujourd'hui)
1. ✅ S'inscrire sur Cloudflare
2. ✅ Ajouter le domaine
3. ✅ Changer les nameservers chez le registrar
4. ⏰ Attendre propagation (quelques heures)

### Après Propagation (J+1)
5. ✅ Configurer SSL/TLS (Full Strict)
6. ✅ Activer "Always Use HTTPS"
7. ✅ Créer les firewall rules (admin protection)
8. ✅ Activer Bot Fight Mode
9. ✅ Configurer les page rules
10. ✅ Tester tout !

### Maintenance (Hebdomadaire)
- 📊 Consulter les analytics
- 🔍 Vérifier les menaces bloquées
- 🔄 Purger le cache si modifications

---

## 💡 Conseils Pro

1. **Ne jamais exposer l'admin** : Utilisez admin.html uniquement en local
2. **Monitoring actif** : Consultez le dashboard 1x/semaine minimum
3. **Purger le cache** après chaque mise à jour du site
4. **Whitelister votre IP** si vous travaillez souvent depuis le même endroit
5. **Tester en navigation privée** pour voir la version cachée
6. **Mode "Under Attack"** : Activez si vous subissez une attaque DDoS

**Raccourci mode attaque :**
Dashboard → Quick Actions → **"I'm Under Attack"** (activez temporairement)

---

## 📞 Support

- **Documentation :** https://developers.cloudflare.com/
- **Communauté :** https://community.cloudflare.com/
- **Status :** https://www.cloudflarestatus.com/
- **Support Email :** support@cloudflare.com (réponse en 24-48h)

---

## ✅ Checklist Finale

Avant de considérer la configuration terminée :

- [ ] Nameservers Cloudflare actifs
- [ ] Site accessible en HTTPS
- [ ] Note SSL Labs : A ou A+
- [ ] Firewall rules admin configurées
- [ ] Bot Fight Mode activé
- [ ] Page rules créées
- [ ] Cache fonctionne (vérifier headers)
- [ ] Tests de sécurité passés
- [ ] Alertes email configurées
- [ ] admin.html NON déployé sur le serveur
- [ ] Mot de passe admin changé
- [ ] Tout documenté

---

**🎉 Félicitations ! Votre site est maintenant protégé par Cloudflare !**

**Gain obtenu :**
- ⚡ Site 2-3x plus rapide
- 🛡️ Protection DDoS automatique
- 🔒 Sécurité renforcée
- 💰 60-80% de bande passante économisée
- 🌍 Performance mondiale via CDN

**ROI : INFINI** (gratuit + énormes bénéfices !) 🚀
