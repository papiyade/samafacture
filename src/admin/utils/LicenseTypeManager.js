import { Logger } from './Logger.js'

/**
 * License Type Manager - Gestionnaire des types de licences
 * Gère la configuration des différents types de licences et leurs caractéristiques
 */
export class LicenseTypeManager {
  
  // Configuration des types de licences
  static LICENSE_TYPES = {
    TRIAL: {
      name: 'Essai',
      description: 'Version d\'essai gratuite avec fonctionnalités limitées',
      duration: { value: 30, unit: 'days' },
      price: 0,
      currency: 'XOF',
      limits: {
        maxInvoices: 10,
        maxClients: 5,
        maxUsers: 1,
        maxProducts: 20
      },
      features: [
        'invoicing',
        'basic_reporting',
        'client_management',
        'product_management'
      ],
      restrictions: [
        'no_email_integration',
        'no_api_access',
        'watermark_on_pdf'
      ],
      color: '#FFA500',
      icon: '🆓',
      priority: 1
    },
    
    BASIC: {
      name: 'Basique',
      description: 'Plan de base pour petites entreprises',
      duration: { value: 1, unit: 'months' },
      price: 15000,
      currency: 'XOF',
      limits: {
        maxInvoices: 100,
        maxClients: 50,
        maxUsers: 2,
        maxProducts: 100
      },
      features: [
        'invoicing',
        'quoting',
        'basic_reporting',
        'client_management',
        'product_management',
        'pdf_export',
        'email_integration'
      ],
      restrictions: [
        'no_advanced_reports',
        'no_api_access',
        'basic_support'
      ],
      color: '#4CAF50',
      icon: '📊',
      priority: 2
    },
    
    PREMIUM: {
      name: 'Premium',
      description: 'Plan avancé pour entreprises en croissance',
      duration: { value: 1, unit: 'months' },
      price: 35000,
      currency: 'XOF',
      limits: {
        maxInvoices: 500,
        maxClients: 200,
        maxUsers: 5,
        maxProducts: 500
      },
      features: [
        'invoicing',
        'quoting',
        'advanced_reporting',
        'client_management',
        'product_management',
        'pdf_export',
        'email_integration',
        'inventory_management',
        'multi_currency',
        'custom_templates'
      ],
      restrictions: [
        'no_api_access',
        'priority_support'
      ],
      color: '#2196F3',
      icon: '⭐',
      priority: 3
    },
    
    ENTERPRISE: {
      name: 'Entreprise',
      description: 'Solution complète pour grandes entreprises',
      duration: { value: 1, unit: 'years' },
      price: 300000,
      currency: 'XOF',
      limits: {
        maxInvoices: -1, // Illimité
        maxClients: -1,  // Illimité
        maxUsers: 20,
        maxProducts: -1  // Illimité
      },
      features: [
        'invoicing',
        'quoting',
        'advanced_reporting',
        'client_management',
        'product_management',
        'pdf_export',
        'email_integration',
        'inventory_management',
        'multi_currency',
        'custom_templates',
        'api_integration',
        'white_label',
        'multi_user_access',
        'advanced_permissions',
        'data_export',
        'custom_fields'
      ],
      restrictions: [],
      color: '#9C27B0',
      icon: '🏢',
      priority: 4
    }
  }
  
  // Fonctionnalités disponibles
  static AVAILABLE_FEATURES = {
    invoicing: {
      name: 'Facturation',
      description: 'Création et gestion des factures',
      category: 'core'
    },
    quoting: {
      name: 'Devis',
      description: 'Création et gestion des devis',
      category: 'core'
    },
    basic_reporting: {
      name: 'Rapports de base',
      description: 'Rapports simples de ventes et clients',
      category: 'reporting'
    },
    advanced_reporting: {
      name: 'Rapports avancés',
      description: 'Analyses détaillées et tableaux de bord',
      category: 'reporting'
    },
    client_management: {
      name: 'Gestion clients',
      description: 'Base de données clients complète',
      category: 'management'
    },
    product_management: {
      name: 'Gestion produits',
      description: 'Catalogue de produits et services',
      category: 'management'
    },
    inventory_management: {
      name: 'Gestion stock',
      description: 'Suivi des stocks et inventaires',
      category: 'management'
    },
    pdf_export: {
      name: 'Export PDF',
      description: 'Génération de documents PDF',
      category: 'export'
    },
    email_integration: {
      name: 'Intégration email',
      description: 'Envoi automatique par email',
      category: 'integration'
    },
    api_integration: {
      name: 'API',
      description: 'Accès API pour intégrations',
      category: 'integration'
    },
    multi_currency: {
      name: 'Multi-devises',
      description: 'Support de plusieurs devises',
      category: 'advanced'
    },
    custom_templates: {
      name: 'Modèles personnalisés',
      description: 'Personnalisation des documents',
      category: 'customization'
    },
    white_label: {
      name: 'Marque blanche',
      description: 'Suppression du branding SamaFacture',
      category: 'customization'
    },
    multi_user_access: {
      name: 'Multi-utilisateurs',
      description: 'Accès pour plusieurs utilisateurs',
      category: 'collaboration'
    },
    advanced_permissions: {
      name: 'Permissions avancées',
      description: 'Gestion fine des droits d\'accès',
      category: 'collaboration'
    },
    data_export: {
      name: 'Export de données',
      description: 'Export complet des données',
      category: 'export'
    },
    custom_fields: {
      name: 'Champs personnalisés',
      description: 'Ajout de champs personnalisés',
      category: 'customization'
    }
  }
  
  /**
   * Obtenir tous les types de licences
   * @returns {Object} Types de licences
   */
  static getAllTypes() {
    return this.LICENSE_TYPES
  }
  
  /**
   * Obtenir un type de licence spécifique
   * @param {string} type - Type de licence
   * @returns {Object|null} Configuration du type
   */
  static getType(type) {
    return this.LICENSE_TYPES[type] || null
  }
  
  /**
   * Vérifier si un type de licence est valide
   * @param {string} type - Type à vérifier
   * @returns {boolean} True si valide
   */
  static isValidType(type) {
    return type && this.LICENSE_TYPES.hasOwnProperty(type)
  }
  
  /**
   * Obtenir les limites d'un type de licence
   * @param {string} type - Type de licence
   * @returns {Object} Limites
   */
  static getLimits(type) {
    const licenseType = this.getType(type)
    if (!licenseType) {
      throw new Error(`Type de licence invalide: ${type}`)
    }
    
    return {
      maxInvoices: licenseType.limits.maxInvoices,
      maxClients: licenseType.limits.maxClients,
      maxUsers: licenseType.limits.maxUsers,
      maxProducts: licenseType.limits.maxProducts,
      features: [...licenseType.features]
    }
  }
  
  /**
   * Obtenir les fonctionnalités d'un type de licence
   * @param {string} type - Type de licence
   * @returns {Array} Liste des fonctionnalités
   */
  static getFeatures(type) {
    const licenseType = this.getType(type)
    if (!licenseType) {
      throw new Error(`Type de licence invalide: ${type}`)
    }
    
    return [...licenseType.features]
  }
  
  /**
   * Vérifier si une fonctionnalité est disponible pour un type
   * @param {string} type - Type de licence
   * @param {string} feature - Fonctionnalité à vérifier
   * @returns {boolean} True si disponible
   */
  static hasFeature(type, feature) {
    const features = this.getFeatures(type)
    return features.includes(feature)
  }
  
  /**
   * Calculer la date d'expiration
   * @param {string} type - Type de licence
   * @param {Object} customDuration - Durée personnalisée (optionnel)
   * @returns {string} Date d'expiration ISO
   */
  static calculateExpirationDate(type, customDuration = null) {
    const licenseType = this.getType(type)
    if (!licenseType) {
      throw new Error(`Type de licence invalide: ${type}`)
    }
    
    const duration = customDuration || licenseType.duration
    const now = new Date()
    const expirationDate = new Date(now)
    
    switch (duration.unit) {
      case 'days':
        expirationDate.setDate(expirationDate.getDate() + duration.value)
        break
      case 'months':
        expirationDate.setMonth(expirationDate.getMonth() + duration.value)
        break
      case 'years':
        expirationDate.setFullYear(expirationDate.getFullYear() + duration.value)
        break
      default:
        throw new Error(`Unité de durée invalide: ${duration.unit}`)
    }
    
    return expirationDate.toISOString()
  }
  
  /**
   * Obtenir la durée par défaut d'un type
   * @param {string} type - Type de licence
   * @returns {Object} Durée par défaut
   */
  static getDefaultDuration(type) {
    const licenseType = this.getType(type)
    if (!licenseType) {
      throw new Error(`Type de licence invalide: ${type}`)
    }
    
    return { ...licenseType.duration }
  }
  
  /**
   * Obtenir le prix d'un type de licence
   * @param {string} type - Type de licence
   * @returns {Object} Prix et devise
   */
  static getPrice(type) {
    const licenseType = this.getType(type)
    if (!licenseType) {
      throw new Error(`Type de licence invalide: ${type}`)
    }
    
    return {
      amount: licenseType.price,
      currency: licenseType.currency,
      formatted: this.formatPrice(licenseType.price, licenseType.currency)
    }
  }
  
  /**
   * Formater un prix
   * @param {number} amount - Montant
   * @param {string} currency - Devise
   * @returns {string} Prix formaté
   */
  static formatPrice(amount, currency) {
    if (amount === 0) {
      return 'Gratuit'
    }
    
    const formatter = new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    })
    
    return formatter.format(amount)
  }
  
  /**
   * Comparer deux types de licences
   * @param {string} type1 - Premier type
   * @param {string} type2 - Deuxième type
   * @returns {number} -1, 0, ou 1 selon la comparaison
   */
  static compareTypes(type1, type2) {
    const license1 = this.getType(type1)
    const license2 = this.getType(type2)
    
    if (!license1 || !license2) {
      throw new Error('Types de licence invalides pour la comparaison')
    }
    
    return license1.priority - license2.priority
  }
  
  /**
   * Obtenir le type supérieur suivant
   * @param {string} currentType - Type actuel
   * @returns {string|null} Type supérieur ou null
   */
  static getUpgradeType(currentType) {
    const current = this.getType(currentType)
    if (!current) {
      return null
    }
    
    const types = Object.entries(this.LICENSE_TYPES)
    const sortedTypes = types.sort((a, b) => a[1].priority - b[1].priority)
    
    const currentIndex = sortedTypes.findIndex(([type]) => type === currentType)
    
    if (currentIndex === -1 || currentIndex === sortedTypes.length - 1) {
      return null // Pas de type supérieur
    }
    
    return sortedTypes[currentIndex + 1][0]
  }
  
  /**
   * Obtenir les différences entre deux types
   * @param {string} fromType - Type de départ
   * @param {string} toType - Type d'arrivée
   * @returns {Object} Différences
   */
  static getTypeDifferences(fromType, toType) {
    const from = this.getType(fromType)
    const to = this.getType(toType)
    
    if (!from || !to) {
      throw new Error('Types de licence invalides')
    }
    
    const differences = {
      limits: {},
      features: {
        added: [],
        removed: []
      },
      price: {
        from: from.price,
        to: to.price,
        difference: to.price - from.price
      }
    }
    
    // Différences de limites
    for (const [key, value] of Object.entries(to.limits)) {
      if (from.limits[key] !== value) {
        differences.limits[key] = {
          from: from.limits[key],
          to: value
        }
      }
    }
    
    // Fonctionnalités ajoutées
    differences.features.added = to.features.filter(
      feature => !from.features.includes(feature)
    )
    
    // Fonctionnalités supprimées
    differences.features.removed = from.features.filter(
      feature => !to.features.includes(feature)
    )
    
    return differences
  }
  
  /**
   * Obtenir les types recommandés selon l'usage
   * @param {Object} usage - Données d'usage
   * @returns {Array} Types recommandés
   */
  static getRecommendedTypes(usage) {
    const recommendations = []
    
    for (const [type, config] of Object.entries(this.LICENSE_TYPES)) {
      let score = 0
      let suitable = true
      
      // Vérifier les limites
      if (config.limits.maxInvoices !== -1 && usage.invoices > config.limits.maxInvoices) {
        suitable = false
      }
      if (config.limits.maxClients !== -1 && usage.clients > config.limits.maxClients) {
        suitable = false
      }
      if (config.limits.maxUsers !== -1 && usage.users > config.limits.maxUsers) {
        suitable = false
      }
      
      if (!suitable) continue
      
      // Calculer le score de recommandation
      if (usage.features) {
        const matchingFeatures = usage.features.filter(f => config.features.includes(f))
        score = matchingFeatures.length / usage.features.length
      }
      
      recommendations.push({
        type,
        config,
        score,
        suitable: true
      })
    }
    
    return recommendations.sort((a, b) => b.score - a.score)
  }
  
  /**
   * Créer un type de licence personnalisé
   * @param {string} name - Nom du type
   * @param {Object} config - Configuration
   * @returns {string} ID du type créé
   */
  static createCustomType(name, config) {
    try {
      Logger.info('Creating custom license type', { name, config })
      
      // Validation de la configuration
      this.validateTypeConfig(config)
      
      // Génération d'un ID unique
      const typeId = `CUSTOM_${name.toUpperCase().replace(/\s+/g, '_')}_${Date.now()}`
      
      // Ajout du type personnalisé
      this.LICENSE_TYPES[typeId] = {
        name,
        description: config.description || `Type personnalisé: ${name}`,
        duration: config.duration || { value: 1, unit: 'months' },
        price: config.price || 0,
        currency: config.currency || 'XOF',
        limits: config.limits || {},
        features: config.features || [],
        restrictions: config.restrictions || [],
        color: config.color || '#607D8B',
        icon: config.icon || '🔧',
        priority: config.priority || 999,
        custom: true,
        createdAt: new Date().toISOString()
      }
      
      Logger.success('Custom license type created', { typeId })
      return typeId
      
    } catch (error) {
      Logger.error('Error creating custom license type', { name, error: error.message })
      throw error
    }
  }
  
  /**
   * Valider la configuration d'un type
   * @param {Object} config - Configuration à valider
   */
  static validateTypeConfig(config) {
    const required = ['duration', 'limits', 'features']
    
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Champ requis manquant: ${field}`)
      }
    }
    
    // Validation de la durée
    if (!config.duration.value || !config.duration.unit) {
      throw new Error('Durée invalide')
    }
    
    if (!['days', 'months', 'years'].includes(config.duration.unit)) {
      throw new Error('Unité de durée invalide')
    }
    
    // Validation des limites
    const limitFields = ['maxInvoices', 'maxClients', 'maxUsers']
    for (const field of limitFields) {
      if (config.limits[field] !== undefined && 
          typeof config.limits[field] !== 'number') {
        throw new Error(`Limite invalide pour ${field}`)
      }
    }
    
    // Validation des fonctionnalités
    if (!Array.isArray(config.features)) {
      throw new Error('Les fonctionnalités doivent être un tableau')
    }
    
    for (const feature of config.features) {
      if (!this.AVAILABLE_FEATURES[feature]) {
        throw new Error(`Fonctionnalité inconnue: ${feature}`)
      }
    }
  }
  
  /**
   * Obtenir les statistiques des types de licences
   * @returns {Object} Statistiques
   */
  static getTypeStatistics() {
    const stats = {
      totalTypes: Object.keys(this.LICENSE_TYPES).length,
      byCategory: {},
      priceRange: {
        min: Infinity,
        max: 0,
        average: 0
      },
      features: {
        total: Object.keys(this.AVAILABLE_FEATURES).length,
        byCategory: {}
      }
    }
    
    let totalPrice = 0
    let paidTypes = 0
    
    // Analyse des types
    for (const [type, config] of Object.entries(this.LICENSE_TYPES)) {
      if (config.price > 0) {
        stats.priceRange.min = Math.min(stats.priceRange.min, config.price)
        stats.priceRange.max = Math.max(stats.priceRange.max, config.price)
        totalPrice += config.price
        paidTypes++
      }
    }
    
    stats.priceRange.average = paidTypes > 0 ? totalPrice / paidTypes : 0
    if (stats.priceRange.min === Infinity) stats.priceRange.min = 0
    
    // Analyse des fonctionnalités
    for (const [feature, config] of Object.entries(this.AVAILABLE_FEATURES)) {
      const category = config.category
      if (!stats.features.byCategory[category]) {
        stats.features.byCategory[category] = 0
      }
      stats.features.byCategory[category]++
    }
    
    return stats
  }
  
  /**
   * Exporter la configuration des types
   * @returns {Object} Configuration exportée
   */
  static exportConfiguration() {
    return {
      licenseTypes: this.LICENSE_TYPES,
      availableFeatures: this.AVAILABLE_FEATURES,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
  }
  
  /**
   * Importer une configuration de types
   * @param {Object} config - Configuration à importer
   */
  static importConfiguration(config) {
    try {
      Logger.info('Importing license types configuration')
      
      if (!config.licenseTypes || !config.availableFeatures) {
        throw new Error('Configuration invalide')
      }
      
      // Validation avant import
      for (const [type, typeConfig] of Object.entries(config.licenseTypes)) {
        this.validateTypeConfig(typeConfig)
      }
      
      // Import des types
      this.LICENSE_TYPES = { ...config.licenseTypes }
      this.AVAILABLE_FEATURES = { ...config.availableFeatures }
      
      Logger.success('License types configuration imported successfully')
      
    } catch (error) {
      Logger.error('Error importing configuration', { error: error.message })
      throw error
    }
  }
}
