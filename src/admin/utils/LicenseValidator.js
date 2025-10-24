import { LicenseKeyGenerator } from './LicenseKeyGenerator.js'
import { Logger } from './Logger.js'

/**
 * License Validator - Validateur de licences complet
 * Valide les licences côté serveur et client avec vérifications de sécurité
 */
export class LicenseValidator {
  
  // Codes d'erreur standardisés
  static ERROR_CODES = {
    INVALID_KEY: 'INVALID_KEY',
    EXPIRED: 'EXPIRED',
    SUSPENDED: 'SUSPENDED',
    REVOKED: 'REVOKED',
    INACTIVE: 'INACTIVE',
    LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
    INVALID_CONTEXT: 'INVALID_CONTEXT',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    CHECKSUM_FAILED: 'CHECKSUM_FAILED',
    TYPE_MISMATCH: 'TYPE_MISMATCH'
  }
  
  // Messages d'erreur localisés
  static ERROR_MESSAGES = {
    INVALID_KEY: 'Clé de licence invalide',
    EXPIRED: 'Licence expirée',
    SUSPENDED: 'Licence suspendue',
    REVOKED: 'Licence révoquée',
    INACTIVE: 'Licence inactive',
    LIMIT_EXCEEDED: 'Limite d\'utilisation dépassée',
    INVALID_CONTEXT: 'Contexte de validation invalide',
    VALIDATION_ERROR: 'Erreur lors de la validation',
    CHECKSUM_FAILED: 'Vérification d\'intégrité échouée',
    TYPE_MISMATCH: 'Type de licence incompatible'
  }
  
  /**
   * Valider une licence complètement
   * @param {Object} license - Objet licence
   * @param {Object} context - Contexte de validation
   * @returns {Promise<Object>} Résultat de validation
   */
  static async validateLicense(license, context = {}) {
    try {
      Logger.debug('Starting license validation', { 
        licenseId: license.id, 
        licenseKey: license.license_key?.substring(0, 10) + '...',
        context 
      })
      
      // 1. Validation du format de clé
      const formatValidation = await this.validateKeyFormat(license.license_key)
      if (!formatValidation.valid) {
        return this.createValidationResult(false, formatValidation.error, formatValidation.message)
      }
      
      // 2. Validation du statut
      const statusValidation = this.validateStatus(license)
      if (!statusValidation.valid) {
        return this.createValidationResult(false, statusValidation.error, statusValidation.message)
      }
      
      // 3. Validation de l'expiration
      const expirationValidation = this.validateExpiration(license)
      if (!expirationValidation.valid) {
        return this.createValidationResult(false, expirationValidation.error, expirationValidation.message)
      }
      
      // 4. Validation des limites d'usage
      const limitsValidation = await this.validateUsageLimits(license, context)
      if (!limitsValidation.valid) {
        return this.createValidationResult(false, limitsValidation.error, limitsValidation.message)
      }
      
      // 5. Validation du contexte
      const contextValidation = this.validateContext(license, context)
      if (!contextValidation.valid) {
        return this.createValidationResult(false, contextValidation.error, contextValidation.message)
      }
      
      // 6. Validation des fonctionnalités
      const featuresValidation = this.validateFeatures(license, context)
      if (!featuresValidation.valid) {
        return this.createValidationResult(false, featuresValidation.error, featuresValidation.message)
      }
      
      Logger.success('License validation successful', { licenseId: license.id })
      
      return this.createValidationResult(true, null, 'Licence valide', {
        licenseType: license.license_type,
        expiresAt: license.expires_at,
        features: license.features,
        limits: {
          maxInvoices: license.max_invoices,
          maxClients: license.max_clients,
          maxUsers: license.max_users
        },
        daysUntilExpiration: license.daysUntilExpiration
      })
      
    } catch (error) {
      Logger.error('License validation error', { 
        licenseId: license?.id, 
        error: error.message 
      })
      
      return this.createValidationResult(
        false, 
        this.ERROR_CODES.VALIDATION_ERROR, 
        this.ERROR_MESSAGES.VALIDATION_ERROR
      )
    }
  }
  
  /**
   * Valider le format de la clé de licence
   * @param {string} licenseKey - Clé de licence
   * @returns {Promise<Object>} Résultat de validation
   */
  static async validateKeyFormat(licenseKey) {
    try {
      if (!licenseKey || typeof licenseKey !== 'string') {
        return {
          valid: false,
          error: this.ERROR_CODES.INVALID_KEY,
          message: this.ERROR_MESSAGES.INVALID_KEY
        }
      }
      
      // Utilisation du générateur pour valider le format
      const formatResult = await LicenseKeyGenerator.validateKeyFormat(licenseKey)
      
      if (!formatResult.valid) {
        return {
          valid: false,
          error: this.ERROR_CODES.CHECKSUM_FAILED,
          message: this.ERROR_MESSAGES.CHECKSUM_FAILED
        }
      }
      
      return { valid: true }
      
    } catch (error) {
      Logger.error('Key format validation error', { licenseKey, error: error.message })
      return {
        valid: false,
        error: this.ERROR_CODES.VALIDATION_ERROR,
        message: this.ERROR_MESSAGES.VALIDATION_ERROR
      }
    }
  }
  
  /**
   * Valider le statut de la licence
   * @param {Object} license - Objet licence
   * @returns {Object} Résultat de validation
   */
  static validateStatus(license) {
    if (!license.status) {
      return {
        valid: false,
        error: this.ERROR_CODES.INVALID_KEY,
        message: this.ERROR_MESSAGES.INVALID_KEY
      }
    }
    
    switch (license.status.toUpperCase()) {
      case 'ACTIVE':
        return { valid: true }
        
      case 'SUSPENDED':
        return {
          valid: false,
          error: this.ERROR_CODES.SUSPENDED,
          message: this.ERROR_MESSAGES.SUSPENDED
        }
        
      case 'REVOKED':
        return {
          valid: false,
          error: this.ERROR_CODES.REVOKED,
          message: this.ERROR_MESSAGES.REVOKED
        }
        
      case 'INACTIVE':
        return {
          valid: false,
          error: this.ERROR_CODES.INACTIVE,
          message: this.ERROR_MESSAGES.INACTIVE
        }
        
      default:
        return {
          valid: false,
          error: this.ERROR_CODES.INVALID_KEY,
          message: this.ERROR_MESSAGES.INVALID_KEY
        }
    }
  }
  
  /**
   * Valider l'expiration de la licence
   * @param {Object} license - Objet licence
   * @returns {Object} Résultat de validation
   */
  static validateExpiration(license) {
    if (!license.expires_at) {
      return {
        valid: false,
        error: this.ERROR_CODES.INVALID_KEY,
        message: this.ERROR_MESSAGES.INVALID_KEY
      }
    }
    
    const expirationDate = new Date(license.expires_at)
    const now = new Date()
    
    if (expirationDate < now) {
      return {
        valid: false,
        error: this.ERROR_CODES.EXPIRED,
        message: this.ERROR_MESSAGES.EXPIRED
      }
    }
    
    return { valid: true }
  }
  
  /**
   * Valider les limites d'usage
   * @param {Object} license - Objet licence
   * @param {Object} context - Contexte avec données d'usage
   * @returns {Promise<Object>} Résultat de validation
   */
  static async validateUsageLimits(license, context) {
    try {
      // Vérification des limites de factures
      if (license.max_invoices && context.currentInvoices) {
        if (context.currentInvoices >= license.max_invoices) {
          return {
            valid: false,
            error: this.ERROR_CODES.LIMIT_EXCEEDED,
            message: `Limite de factures atteinte (${license.max_invoices})`
          }
        }
      }
      
      // Vérification des limites de clients
      if (license.max_clients && context.currentClients) {
        if (context.currentClients >= license.max_clients) {
          return {
            valid: false,
            error: this.ERROR_CODES.LIMIT_EXCEEDED,
            message: `Limite de clients atteinte (${license.max_clients})`
          }
        }
      }
      
      // Vérification des limites d'utilisateurs
      if (license.max_users && context.currentUsers) {
        if (context.currentUsers >= license.max_users) {
          return {
            valid: false,
            error: this.ERROR_CODES.LIMIT_EXCEEDED,
            message: `Limite d'utilisateurs atteinte (${license.max_users})`
          }
        }
      }
      
      return { valid: true }
      
    } catch (error) {
      Logger.error('Usage limits validation error', { 
        licenseId: license.id, 
        error: error.message 
      })
      
      return {
        valid: false,
        error: this.ERROR_CODES.VALIDATION_ERROR,
        message: this.ERROR_MESSAGES.VALIDATION_ERROR
      }
    }
  }
  
  /**
   * Valider le contexte d'utilisation
   * @param {Object} license - Objet licence
   * @param {Object} context - Contexte de validation
   * @returns {Object} Résultat de validation
   */
  static validateContext(license, context) {
    // Validation de l'entreprise
    if (context.companyId && license.company_id !== context.companyId) {
      return {
        valid: false,
        error: this.ERROR_CODES.INVALID_CONTEXT,
        message: 'Licence non autorisée pour cette entreprise'
      }
    }
    
    // Validation de l'environnement (si spécifié)
    if (context.environment && license.metadata?.environment) {
      if (license.metadata.environment !== context.environment) {
        return {
          valid: false,
          error: this.ERROR_CODES.INVALID_CONTEXT,
          message: 'Environnement non autorisé'
        }
      }
    }
    
    // Validation du domaine (si spécifié)
    if (context.domain && license.metadata?.allowedDomains) {
      const allowedDomains = Array.isArray(license.metadata.allowedDomains) 
        ? license.metadata.allowedDomains 
        : [license.metadata.allowedDomains]
      
      if (!allowedDomains.includes(context.domain)) {
        return {
          valid: false,
          error: this.ERROR_CODES.INVALID_CONTEXT,
          message: 'Domaine non autorisé'
        }
      }
    }
    
    return { valid: true }
  }
  
  /**
   * Valider les fonctionnalités demandées
   * @param {Object} license - Objet licence
   * @param {Object} context - Contexte avec fonctionnalités demandées
   * @returns {Object} Résultat de validation
   */
  static validateFeatures(license, context) {
    if (!context.requiredFeatures || !Array.isArray(context.requiredFeatures)) {
      return { valid: true } // Pas de fonctionnalités spécifiques demandées
    }
    
    const licenseFeatures = license.features || []
    
    for (const requiredFeature of context.requiredFeatures) {
      if (!licenseFeatures.includes(requiredFeature)) {
        return {
          valid: false,
          error: this.ERROR_CODES.TYPE_MISMATCH,
          message: `Fonctionnalité non autorisée: ${requiredFeature}`
        }
      }
    }
    
    return { valid: true }
  }
  
  /**
   * Validation rapide pour l'authentification
   * @param {string} licenseKey - Clé de licence
   * @returns {Promise<Object>} Résultat de validation rapide
   */
  static async quickValidate(licenseKey) {
    try {
      // Validation du format uniquement
      const formatResult = await LicenseKeyGenerator.validateKeyFormat(licenseKey)
      
      if (!formatResult.valid) {
        return {
          valid: false,
          error: this.ERROR_CODES.INVALID_KEY,
          message: this.ERROR_MESSAGES.INVALID_KEY
        }
      }
      
      return {
        valid: true,
        type: formatResult.type,
        message: 'Format de clé valide'
      }
      
    } catch (error) {
      Logger.error('Quick validation error', { licenseKey, error: error.message })
      return {
        valid: false,
        error: this.ERROR_CODES.VALIDATION_ERROR,
        message: this.ERROR_MESSAGES.VALIDATION_ERROR
      }
    }
  }
  
  /**
   * Valider une licence pour une action spécifique
   * @param {Object} license - Objet licence
   * @param {string} action - Action demandée
   * @param {Object} context - Contexte
   * @returns {Promise<Object>} Résultat de validation
   */
  static async validateForAction(license, action, context = {}) {
    try {
      // Validation de base
      const baseValidation = await this.validateLicense(license, context)
      if (!baseValidation.valid) {
        return baseValidation
      }
      
      // Validation spécifique à l'action
      const actionValidation = this.validateActionPermission(license, action)
      if (!actionValidation.valid) {
        return actionValidation
      }
      
      return {
        valid: true,
        message: `Action autorisée: ${action}`,
        action: action
      }
      
    } catch (error) {
      Logger.error('Action validation error', { 
        licenseId: license?.id, 
        action, 
        error: error.message 
      })
      
      return {
        valid: false,
        error: this.ERROR_CODES.VALIDATION_ERROR,
        message: this.ERROR_MESSAGES.VALIDATION_ERROR
      }
    }
  }
  
  /**
   * Valider les permissions pour une action
   * @param {Object} license - Objet licence
   * @param {string} action - Action demandée
   * @returns {Object} Résultat de validation
   */
  static validateActionPermission(license, action) {
    const licenseFeatures = license.features || []
    
    // Mapping des actions vers les fonctionnalités requises
    const actionFeatureMap = {
      'create_invoice': ['invoicing'],
      'create_quote': ['quoting'],
      'export_pdf': ['pdf_export'],
      'send_email': ['email_integration'],
      'advanced_reporting': ['advanced_reports'],
      'multi_user': ['multi_user_access'],
      'api_access': ['api_integration'],
      'custom_branding': ['white_label']
    }
    
    const requiredFeatures = actionFeatureMap[action]
    
    if (!requiredFeatures) {
      // Action non mappée, autoriser par défaut
      return { valid: true }
    }
    
    for (const feature of requiredFeatures) {
      if (!licenseFeatures.includes(feature)) {
        return {
          valid: false,
          error: this.ERROR_CODES.TYPE_MISMATCH,
          message: `Action non autorisée: ${action}`
        }
      }
    }
    
    return { valid: true }
  }
  
  /**
   * Créer un résultat de validation standardisé
   * @param {boolean} valid - Validité
   * @param {string} error - Code d'erreur
   * @param {string} message - Message
   * @param {Object} data - Données supplémentaires
   * @returns {Object} Résultat de validation
   */
  static createValidationResult(valid, error = null, message = '', data = {}) {
    const result = {
      valid,
      timestamp: new Date().toISOString()
    }
    
    if (!valid) {
      result.error = error
      result.message = message
    } else {
      result.message = message || 'Validation réussie'
      if (Object.keys(data).length > 0) {
        result.data = data
      }
    }
    
    return result
  }
  
  /**
   * Valider plusieurs licences en lot
   * @param {Array} licenses - Tableau de licences
   * @param {Object} context - Contexte commun
   * @returns {Promise<Array>} Résultats de validation
   */
  static async validateBatch(licenses, context = {}) {
    try {
      Logger.info('Validating licenses batch', { count: licenses.length })
      
      const results = []
      
      for (const license of licenses) {
        try {
          const result = await this.validateLicense(license, context)
          results.push({
            licenseId: license.id,
            licenseKey: license.license_key,
            ...result
          })
        } catch (error) {
          results.push({
            licenseId: license.id,
            licenseKey: license.license_key,
            valid: false,
            error: this.ERROR_CODES.VALIDATION_ERROR,
            message: error.message
          })
        }
      }
      
      const validCount = results.filter(r => r.valid).length
      Logger.success('Licenses batch validation completed', {
        total: licenses.length,
        valid: validCount,
        invalid: licenses.length - validCount
      })
      
      return results
      
    } catch (error) {
      Logger.error('Batch validation error', { error: error.message })
      throw error
    }
  }
  
  /**
   * Obtenir les informations de validation pour le debugging
   * @param {Object} license - Objet licence
   * @returns {Object} Informations de debug
   */
  static getValidationDebugInfo(license) {
    return {
      licenseId: license.id,
      licenseKey: license.license_key?.substring(0, 10) + '...',
      type: license.license_type,
      status: license.status,
      expiresAt: license.expires_at,
      isExpired: new Date(license.expires_at) < new Date(),
      daysUntilExpiration: Math.ceil(
        (new Date(license.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
      ),
      limits: {
        maxInvoices: license.max_invoices,
        maxClients: license.max_clients,
        maxUsers: license.max_users
      },
      features: license.features,
      companyId: license.company_id,
      metadata: license.metadata
    }
  }
}
