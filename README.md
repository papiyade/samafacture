# SamaFacture PWA

Une application PWA (Progressive Web App) de facturation et devis avec gestion centralisée, base de données locale SQLite, et système de licence pour TPE/PME.

## 🚀 Fonctionnalités

### 📱 Application Client (PWA)
- **Facturation & Devis** : Création, modification et gestion des factures et devis
- **Gestion Clients** : Base de données clients avec historique
- **Gestion Produits** : Catalogue de produits et services
- **PDF Personnalisables** : Génération de PDF avec logo et branding
- **Calculs Automatiques** : TVA, remises, totaux
- **Statistiques** : Chiffre d'affaires, clients, produits populaires
- **Mode Hors Ligne** : Fonctionnement complet sans connexion internet
- **Base Locale** : SQLite dans le navigateur avec IndexedDB
- **Thèmes** : Mode clair/sombre avec détection système
- **Multilingue** : Français et anglais

### 🔐 Système de Licence
- **Période d'essai** : 30 jours gratuits
- **Activation par clé** : Système de licence sécurisé
- **Validation offline** : Fonctionne sans connexion
- **Liaison appareil** : Protection contre la copie

### 👨‍💼 Dashboard Administrateur
- **Gestion Entreprises** : Vue d'ensemble de tous les clients
- **Gestion Licences** : Génération et activation des clés
- **Statistiques Globales** : Métriques d'utilisation
- **Configuration Système** : Paramètres globaux

## 🛠️ Technologies

- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Styling** : Tailwind CSS
- **Build Tool** : Vite
- **PWA** : Service Worker, Web App Manifest
- **Base de Données** : SQLite (sql.js) + IndexedDB
- **PDF** : pdf-lib
- **Chiffrement** : crypto-js
- **Charts** : Chart.js

## 📦 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation des dépendances
```bash
npm install
```

### Développement
```bash
# Application client
npm run dev:client

# Dashboard admin
npm run dev:admin
```

### Build de production
```bash
# Build client
npm run build:client

# Build admin
npm run build:admin

# Build complet
npm run build
```

## 🏗️ Structure du Projet

```
src/
├── client/           # Application client PWA
│   ├── components/   # Composants UI
│   ├── pages/        # Pages de l'application
│   ├── services/     # Services métier
│   └── main.js       # Point d'entrée client
├── admin/            # Dashboard administrateur
│   ├── components/   # Composants admin
│   ├── pages/        # Pages admin
│   └── admin.js      # Point d'entrée admin
└── shared/           # Code partagé
    ├── components/   # Composants réutilisables
    ├── services/     # Services communs
    ├── database/     # Schémas et migrations
    ├── models/       # Modèles de données
    ├── utils/        # Utilitaires
    ├── styles/       # Styles globaux
    └── i18n/         # Traductions
```

## 🎨 Design System

L'application utilise un système de design moderne inspiré de :
- **Notion** : Interface claire et intuitive
- **Wave Accounting** : Simplicité pour la comptabilité
- **Stripe Dashboard** : Élégance et professionnalisme

### Composants UI
- Boutons avec variants (primary, secondary, success, warning, danger)
- Inputs avec validation et états d'erreur
- Cards avec header, body, footer
- Modals responsives
- Sidebar collapsible
- Animations fluides

### Thèmes
- **Clair** : Interface lumineuse pour le jour
- **Sombre** : Interface sombre pour réduire la fatigue oculaire
- **Système** : Suit automatiquement les préférences du système

## 💾 Base de Données

### Tables Principales
- `clients` : Informations clients
- `products` : Catalogue produits/services
- `invoices` : Factures avec items
- `quotes` : Devis avec items
- `settings` : Configuration application

### Fonctionnalités
- **Offline First** : Toutes les données stockées localement
- **Sauvegarde** : Export/import de la base
- **Migrations** : Évolution du schéma
- **Validation** : Contraintes d'intégrité

## 🔐 Système de Licence

### Types de Licence
- **Essai** : 30 jours gratuits, fonctionnalités complètes
- **Complète** : Accès illimité avec support
- **Temporaire** : Licence avec date d'expiration

### Sécurité
- Chiffrement AES des clés de licence
- Empreinte appareil pour éviter la copie
- Validation offline avec signature cryptographique
- Révocation à distance possible

### Format des Clés
```
XXXX-XXXX-XXXX-XXXX
```
Exemple : `A1B2-C3D4-E5F6-G7H8`

## 📱 PWA Features

### Installation
- Installable sur desktop et mobile
- Icônes adaptatives
- Splash screen personnalisé

### Offline
- Service Worker pour cache intelligent
- Synchronisation en arrière-plan
- Indicateur de statut réseau

### Performance
- Lazy loading des pages
- Code splitting automatique
- Cache des ressources statiques

## 🌍 Internationalisation

### Langues Supportées
- **Français** (par défaut) : Interface complète
- **Anglais** : Traduction complète

### Fonctionnalités
- Changement de langue à chaud
- Formatage des devises (XOF, EUR, USD)
- Formatage des dates localisé
- Pluralisation intelligente

## 🚀 Déploiement

### Client PWA
1. Build de production : `npm run build:client`
2. Déployer le dossier `dist/` sur un serveur HTTPS
3. Configurer les headers pour le cache
4. Tester l'installation PWA

### Dashboard Admin
1. Build admin : `npm run build:admin`
2. Déployer sur serveur sécurisé
3. Configurer l'authentification
4. Protéger l'accès par IP si nécessaire

## 🔧 Configuration

### Variables d'Environnement
```env
VITE_APP_NAME=SamaFacture
VITE_DEFAULT_CURRENCY=XOF
VITE_DEFAULT_TAX_RATE=18
VITE_TRIAL_DAYS=30
```

### Personnalisation
- Logo et branding dans `/public/icons/`
- Couleurs dans `tailwind.config.js`
- Traductions dans `/src/shared/i18n/`

## 📊 Métriques et Analytics

### Statistiques Client
- Chiffre d'affaires mensuel/annuel
- Nombre de factures/devis
- Top clients par volume
- Produits les plus vendus

### Métriques Admin
- Nombre d'utilisateurs actifs
- Licences actives/expirées
- Usage par fonctionnalité
- Revenus générés

## 🛡️ Sécurité

### Données Locales
- Chiffrement des données sensibles
- Validation côté client
- Sanitisation des entrées

### Licences
- Clés chiffrées avec AES-256
- Empreinte unique par appareil
- Validation cryptographique

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support :
- Email : support@samafacture.com
- Documentation : [docs.samafacture.com](https://docs.samafacture.com)
- Issues : [GitHub Issues](https://github.com/papiyade/samafacture/issues)

---

**SamaFacture** - Simplifiez votre facturation, développez votre business ! 🚀

