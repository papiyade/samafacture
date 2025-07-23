# 🚀 SamaFacture - PWA de Facturation et Devis

## 📋 Description

**SamaFacture** est une application PWA (Progressive Web App) complète de gestion de facturation et devis, spécialement conçue pour les TPE/PME. Elle offre une interface moderne, responsive et toutes les fonctionnalités essentielles pour gérer efficacement les activités commerciales.

## ✨ Fonctionnalités Principales

### 🏠 Dashboard Intelligent
- **Statistiques en temps réel** : Chiffre d'affaires, nombre de factures, clients, montants en attente
- **Actions rapides** : Boutons pour créer rapidement factures, devis, clients
- **Aperçu des données récentes** : Factures et clients récents avec navigation directe
- **Vue d'ensemble des statuts** : Brouillons, factures payées, en attente, etc.

### 👥 Gestion Clients Complète
- **CRUD complet** avec formulaires validés
- **Recherche et filtres** intelligents
- **Statistiques par client** : nombre de factures, chiffre d'affaires total
- **Import/Export CSV** pour migration de données
- **Historique détaillé** des transactions

### 📄 Gestion Factures Professionnelle
- **Création et édition** avec calculs automatiques
- **Gestion des statuts** : Brouillon, Envoyée, Payée, En retard, Annulée
- **Filtrage avancé** et recherche textuelle
- **Export CSV** et génération PDF (structure prête)
- **Suivi des paiements** et échéances

### 📦 Catalogue Produits/Services
- **Gestion complète** avec catégories et stock
- **Calculs automatiques** de prix et valeurs
- **Unités de mesure** multiples
- **Duplication** et import/export
- **Statistiques détaillées** : prix moyen, stock total, catégories

### 💼 Gestion Devis Avancée
- **Workflow complet** : création → envoi → acceptation
- **Conversion automatique** devis → facture
- **Calculs automatiques** TVA, remises, totaux
- **Gestion des dates** de validité
- **Statuts avancés** avec transitions logiques

## 🛠 Technologies Utilisées

- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **Styling** : Tailwind CSS pour design system
- **Persistance** : LocalStorage avec DatabaseService
- **Architecture** : Modulaire et extensible
- **PWA** : Manifest et service worker ready

## 📁 Structure du Projet

```
src/
├── client/
│   ├── pages/
│   │   ├── Dashboard.js           # Tableau de bord principal
│   │   ├── clients/               # Module clients
│   │   ├── invoices/              # Module factures
│   │   ├── products/              # Module produits
│   │   └── quotes/                # Module devis
│   └── components/                # Composants UI
├── shared/
│   ├── components/                # Composants réutilisables
│   │   ├── Button.js              # Composant bouton
│   │   ├── Modal.js               # Composant modal
│   │   ├── Table.js               # Composant tableau
│   │   └── Form.js                # Composant formulaire
│   └── services/
│       └── DatabaseService.js     # Service de données
```

## 🚀 Installation et Utilisation

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn

### Installation
```bash
# Cloner le repository
git clone https://github.com/papiyade/samafacture.git

# Aller dans le dossier
cd samafacture

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build
```

### Utilisation
1. Ouvrir l'application dans le navigateur
2. Commencer par ajouter des clients
3. Créer des produits/services
4. Générer des devis et les convertir en factures
5. Suivre les paiements et statistiques

## 📊 Fonctionnalités Avancées

### 🔄 Workflows Métier
- **Conversion devis → facture** automatique
- **Gestion intelligente des statuts** avec transitions logiques
- **Calculs automatiques** (TVA, remises, totaux)
- **Numérotation automatique** des documents

### 📈 Reporting et Statistiques
- **Dashboard temps réel** avec métriques clés
- **Calculs automatiques** : CA, moyennes, totaux
- **Export CSV** pour analyse externe
- **Aperçus par statut** et catégorie

### 💡 Expérience Utilisateur
- **Actions rapides** depuis le dashboard
- **Formulaires intelligents** avec validation
- **Messages contextuels** et confirmations
- **Interface intuitive** et professionnelle

## 🎯 Fonctionnalités Implémentées

- ✅ Dashboard complet avec statistiques temps réel
- ✅ Gestion clients (CRUD + import/export)
- ✅ Gestion factures (CRUD + statuts + calculs)
- ✅ Gestion produits (CRUD + stock + catégories)
- ✅ Gestion devis (CRUD + conversion + workflow)
- ✅ Composants UI réutilisables et professionnels
- ✅ Base de données locale avec relations
- ✅ Interface responsive et moderne
- ✅ Recherche et filtres avancés
- ✅ Export CSV pour tous les modules
- ✅ Validation de formulaires en temps réel
- ✅ Calculs automatiques (TVA, remises, totaux)

## 🔄 Prochaines Étapes

- 📄 Génération PDF complète (jsPDF/html2pdf)
- 🔐 Système de licence et authentification
- 📧 Envoi d'emails automatique
- 📱 Optimisations PWA (offline, notifications)
- 🎨 Personnalisation thèmes et logos
- 🌐 Synchronisation cloud optionnelle

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

Pour toute question ou suggestion :
- Email : contact@samafacture.com
- GitHub : [@papiyade](https://github.com/papiyade)

---

**SamaFacture - Simplifiez votre gestion commerciale !** 🚀

