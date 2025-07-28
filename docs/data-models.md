# SamaFacture - Modèles de Données

## Vue d'ensemble

Ce document décrit les structures de données utilisées dans SamaFacture, basées sur l'analyse du côté client fonctionnel.

## Modèles de Données Client

### 1. Client (Customer)

```javascript
{
  id: String,           // Généré automatiquement
  name: String,         // Nom complet (obligatoire)
  email: String|null,   // Adresse email (optionnel, validé)
  phone: String|null,   // Numéro de téléphone (optionnel, validé)
  company: String|null, // Nom de l'entreprise (optionnel)
  address: String|null, // Adresse complète (optionnel)
  notes: String|null,   // Notes internes (optionnel)
  created_at: Date,     // Date de création
  updated_at: Date      // Date de modification
}
```

**Validations :**
- `name` : obligatoire, non vide
- `email` : format email valide si fourni
- `phone` : format téléphone valide si fourni (regex: `/^[\+]?[0-9\s\-\(\)]{8,}$/`)

### 2. Produit/Service (Product)

```javascript
{
  id: String,              // Généré automatiquement
  name: String,            // Nom du produit/service (obligatoire)
  description: String,     // Description détaillée (optionnel)
  category: String,        // Catégorie (obligatoire)
  price: Number,           // Prix unitaire en XOF (obligatoire, >= 0)
  unit: String,            // Unité de mesure (défaut: 'pièce')
  stock: Number,           // Stock initial (défaut: 0, >= 0)
  created_at: Date,        // Date de création
  updated_at: Date         // Date de modification
}
```

**Catégories disponibles :**
- `produit` : Produit
- `service` : Service
- `consultation` : Consultation
- `formation` : Formation
- `maintenance` : Maintenance
- `autre` : Autre

**Unités disponibles :**
- `pièce`, `heure`, `jour`, `mois`, `kg`, `litre`, `mètre`, `m²`, `forfait`

### 3. Facture (Invoice)

```javascript
{
  id: String,              // Généré automatiquement
  number: String,          // Numéro de facture (ex: INV-001)
  client_id: String,       // ID du client (obligatoire)
  date: Date,              // Date de facture
  due_date: Date,          // Date d'échéance
  status: String,          // Statut de la facture
  items: Array,            // Articles de la facture
  subtotal: Number,        // Sous-total HT
  tax_rate: Number,        // Taux de taxe (défaut: 18%)
  tax_amount: Number,      // Montant de la taxe
  discount_rate: Number,   // Taux de remise (défaut: 0%)
  discount_amount: Number, // Montant de la remise
  total: Number,           // Total TTC
  notes: String,           // Notes sur la facture
  terms: String,           // Conditions de paiement
  created_at: Date,        // Date de création
  updated_at: Date         // Date de modification
}
```

**Statuts de facture :**
- `draft` : Brouillon
- `sent` : Envoyée
- `paid` : Payée
- `overdue` : En retard
- `cancelled` : Annulée

**Structure des articles (items) :**
```javascript
{
  description: String,     // Description de l'article
  quantity: Number,        // Quantité
  price: Number,           // Prix unitaire
  total: Number            // Total de la ligne (quantity * price)
}
```

### 4. Devis (Quote)

```javascript
{
  id: String,              // Généré automatiquement
  number: String,          // Numéro de devis (ex: DEV-001)
  client_id: String,       // ID du client (obligatoire)
  date: Date,              // Date du devis
  valid_until: Date,       // Date de validité
  status: String,          // Statut du devis
  items: Array,            // Articles du devis (même structure que facture)
  subtotal: Number,        // Sous-total HT
  tax_rate: Number,        // Taux de taxe
  tax_amount: Number,      // Montant de la taxe
  discount_rate: Number,   // Taux de remise
  discount_amount: Number, // Montant de la remise
  total: Number,           // Total TTC
  notes: String,           // Notes sur le devis
  terms: String,           // Conditions
  created_at: Date,        // Date de création
  updated_at: Date         // Date de modification
}
```

**Statuts de devis :**
- `draft` : Brouillon
- `sent` : Envoyé
- `accepted` : Accepté
- `rejected` : Refusé
- `expired` : Expiré

### 5. Dépense (Expense)

```javascript
{
  id: String,              // Généré automatiquement
  description: String,     // Description de la dépense
  amount: Number,          // Montant en XOF
  category: String,        // Catégorie de dépense
  date: Date,              // Date de la dépense
  payment_method: String,  // Méthode de paiement
  receipt: String|null,    // Fichier de reçu (optionnel)
  notes: String,           // Notes additionnelles
  created_at: Date,        // Date de création
  updated_at: Date         // Date de modification
}
```

### 6. Paramètres de l'entreprise (Company Settings)

```javascript
{
  company_name: String,        // Nom de l'entreprise
  company_email: String,       // Email de l'entreprise
  company_phone: String,       // Téléphone de l'entreprise
  company_address: String,     // Adresse de l'entreprise
  company_website: String,     // Site web (optionnel)
  company_tax_number: String,  // Numéro fiscal (optionnel)
  company_logo: String|null,   // Logo en base64 (optionnel)
  currency: String,            // Devise (défaut: XOF)
  language: String,            // Langue (défaut: fr)
  tax_rate: Number,            // Taux de taxe par défaut
  invoice_prefix: String,      // Préfixe des factures (défaut: INV)
  quote_prefix: String,        // Préfixe des devis (défaut: DEV)
  next_invoice_number: String, // Prochain numéro de facture
  next_quote_number: String    // Prochain numéro de devis
}
```

## Architecture de Base de Données

### Stockage Local (Client)
- **Type** : localStorage avec préfixe `samafacture_`
- **Format** : JSON sérialisé
- **Collections** :
  - `clients` : Array des clients
  - `products` : Array des produits
  - `invoices` : Array des factures
  - `quotes` : Array des devis
  - `expenses` : Array des dépenses
  - `settings` : Object des paramètres

### Relations
- `Invoice.client_id` → `Client.id`
- `Quote.client_id` → `Client.id`
- Les articles des factures/devis peuvent référencer des produits existants

## Contraintes et Validations

### Contraintes Générales
- Tous les montants sont en XOF (Franc CFA)
- Les dates sont stockées au format ISO 8601
- Les IDs sont générés automatiquement (UUID ou timestamp)

### Validations Côté Client
- Validation des formats email et téléphone
- Validation des montants (nombres positifs)
- Validation des quantités (entiers positifs)
- Validation des taux (0-100%)

## Évolution vers l'Architecture Admin

Cette structure client servira de base pour :
1. **Modèle Entreprise Admin** : Regroupement des données client par entreprise
2. **Système de Licences** : Contrôle d'accès basé sur le type de licence
3. **Synchronisation** : Propagation des changements admin vers les clients
4. **Audit** : Traçabilité des actions admin sur les données client

## Notes Techniques

- Le système utilise actuellement localStorage pour la simplicité
- Migration vers SQLite/IndexedDB prévue pour la version production
- Chiffrement des données sensibles à implémenter
- Système de sauvegarde/restauration à développer

