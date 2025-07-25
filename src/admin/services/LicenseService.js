import { AdminDatabaseService } from './AdminDatabaseService.js'
import { LicenseKeyGenerator } from '../utils/LicenseKeyGenerator.js'
import { LicenseValidator } from '../utils/LicenseValidator.js'
import { LicenseExpirationManager } from '../utils/LicenseExpirationManager.js'
import { LicenseTypeManager } from '../utils/LicenseTypeManager.js'
import { LicenseAuditService } from './LicenseAuditService.js'
import { Logger } from '../utils/Logger.js'

/**
 * License Service - Gestion complète des licences SamaFacture
 * Centralise toute la logique métier des licences
 */
export class LicenseService {
  
  /**
   * Créer une nouvelle licence
   * @param {Object} licenseData - Données de la licence
   * @returns {Object} Licence créée
   */
  static async createLicense(licenseData) {
    try {
      Logger.info('Creating new license', licenseData)
      
      // Validation des données
      this.validateLicenseData(licenseData)
      
      // Génération de la clé de licence
      const licenseKey = await LicenseKeyGenerator.generateLicenseKey(
        licenseData.type,
        licenseData.companyId,
        licenseData.customData
      )
      
      // Calcul de la date d'expiration
      const expiresAt = LicenseTypeManager.calculateExpirationDate(
        licenseData.type,
        licenseData.duration
      )
      
      // Récupération des limites
      const limits = LicenseTypeManager.getLimits(licenseData.type)
      
      // Préparation des données
      const license = {
        company_id: licenseData.companyId,
        license_key: licenseKey,
        license_type: licenseData.type,
        status: licenseData.status || 'ACTIVE',
        issued_at: new Date().toISOString(),
        expires_at: expiresAt,
        max_invoices: limits.maxInvoices,
        max_clients: limits.maxClients,
        max_users: limits.maxUsers || 1,
        features: JSON.stringify(limits.features || []),
        metadata: JSON.stringify(licenseData.metadata || {}),
        issued_by: licenseData.issuedBy || 'admin'
      }
      
      // Insertion en base
      const sql = `
        INSERT INTO licenses (
          company_id, license_key, license_type, status, issued_at, expires_at,
          max_invoices, max_clients, max_users, features, metadata, issued_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      AdminDatabaseService.run(sql, [
        license.company_id, license.license_key, license.license_type,
        license.status, license.issued_at, license.expires_at,
        license.max_invoices, license.max_clients, license.max_users,
        license.features, license.metadata, license.issued_by
      ])
      
      const licenseId = AdminDatabaseService.getLastInsertId()
      
      if (!licenseId) {
        throw new Error('Erreur lors de la création de la licence - ID non récupéré')
      }
      
      // Audit
      await LicenseAuditService.logEvent(licenseId, 'LICENSE_CREATED', {
        type: license.license_type,
        companyId: license.company_id,
        expiresAt: license.expires_at
      })
      
      // Récupération de la licence créée
      const createdLicense = await this.getLicense(licenseId)
      
      Logger.success('License created successfully', { licenseId, key: licenseKey })
      return createdLicense
      
    } catch (error) {
      Logger.error('Error creating license', { error: error.message, stack: error.stack })
      throw error
    }
  }
  
  /**
   * Récupérer une licence par ID
   * @param {number} licenseId - ID de la licence
   * @returns {Object|null} Licence ou null
   */
  static async getLicense(licenseId) {
    try {
      const sql = `
        SELECT l.*, c.name as company_name, c.email as company_email
        FROM licenses l
        LEFT JOIN companies c ON l.company_id = c.id
        WHERE l.id = ?
      `
      
      const result = AdminDatabaseService.queryAll(sql, [licenseId])
      
      if (result.length === 0) {
        return null
      }
      
      const license = result[0]
      
      // Parse JSON fields
      license.features = JSON.parse(license.features || '[]')
      license.metadata = JSON.parse(license.metadata || '{}')
      
      // Ajouter des informations calculées
      license.isExpired = new Date(license.expires_at) < new Date()
      license.daysUntilExpiration = Math.ceil(
        (new Date(license.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
      )
      
      return license
      
    } catch (error) {
      Logger.error('Error getting license', { licenseId, error: error.message })
      throw error
    }
  }
  
  /**
   * Récupérer une licence par clé
   * @param {string} licenseKey - Clé de licence
   * @returns {Object|null} Licence ou null
   */
  static async getLicenseByKey(licenseKey) {
    try {
      const sql = `
        SELECT l.*, c.name as company_name, c.email as company_email
        FROM licenses l
        LEFT JOIN companies c ON l.company_id = c.id
        WHERE l.license_key = ?
      `
      
      const result = AdminDatabaseService.queryAll(sql, [licenseKey])
      
      if (result.length === 0) {
        return null
      }
      
      const license = result[0]
      license.features = JSON.parse(license.features || '[]')
      license.metadata = JSON.parse(license.metadata || '{}')
      
      return license
      
    } catch (error) {
      Logger.error('Error getting license by key', { licenseKey, error: error.message })
      throw error
    }
  }
  
  /**
   * Récupérer toutes les licences d'une entreprise
   * @param {number} companyId - ID de l'entreprise
   * @returns {Array} Liste des licences
   */
  static async getCompanyLicenses(companyId) {
    try {
      const sql = `
        SELECT * FROM licenses
        WHERE company_id = ?
        ORDER BY created_at DESC
      `
      
      const licenses = AdminDatabaseService.queryAll(sql, [companyId])
      
      return licenses.map(license => {
        license.features = JSON.parse(license.features || '[]')
        license.metadata = JSON.parse(license.metadata || '{}')
        license.isExpired = new Date(license.expires_at) < new Date()
        license.daysUntilExpiration = Math.ceil(
          (new Date(license.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
        )
        return license
      })
      
    } catch (error) {
      Logger.error('Error getting company licenses', { companyId, error: error.message })
      throw error
    }
  }
  
  /**
   * Récupérer toutes les licences avec filtres
   * @param {Object} filters - Filtres de recherche
   * @returns {Array} Liste des licences
   */
  static async getAllLicenses(filters = {}) {
    try {
      let sql = `
        SELECT l.*, c.name as company_name, c.email as company_email
        FROM licenses l
        LEFT JOIN companies c ON l.company_id = c.id
        WHERE 1=1
      `
      const params = []
      
      // Filtres
      if (filters.status) {
        sql += ' AND l.status = ?'
        params.push(filters.status)
      }
      
      if (filters.type) {
        sql += ' AND l.license_type = ?'
        params.push(filters.type)
      }
      
      if (filters.companyId) {
        sql += ' AND l.company_id = ?'
        params.push(filters.companyId)
      }
      
      if (filters.expired !== undefined) {
        if (filters.expired) {
          sql += ' AND l.expires_at < datetime("now")'
        } else {
          sql += ' AND l.expires_at >= datetime("now")'
        }
      }
      
      if (filters.search) {
        sql += ' AND (c.name LIKE ? OR c.email LIKE ? OR l.license_key LIKE ?)'
        const searchTerm = `%${filters.search}%`
        params.push(searchTerm, searchTerm, searchTerm)
      }
      
      sql += ' ORDER BY l.created_at DESC'
      
      if (filters.limit) {
        sql += ' LIMIT ?'
        params.push(filters.limit)
      }
      
      const licenses = AdminDatabaseService.queryAll(sql, params)
      
      return licenses.map(license => {
        license.features = JSON.parse(license.features || '[]')
        license.metadata = JSON.parse(license.metadata || '{}')
        license.isExpired = new Date(license.expires_at) < new Date()
        license.daysUntilExpiration = Math.ceil(
          (new Date(license.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
        )
        return license
      })
      
    } catch (error) {
      Logger.error('Error getting all licenses', { filters, error: error.message })
      throw error
    }
  }
  
  /**
   * Mettre à jour une licence
   * @param {number} licenseId - ID de la licence
   * @param {Object} updates - Données à mettre à jour
   * @returns {Object} Licence mise à jour
   */
  static async updateLicense(licenseId, updates) {
    try {
      Logger.info('Updating license', { licenseId, updates })
      
      // Récupération de la licence actuelle pour audit
      const currentLicense = await this.getLicense(licenseId)
      if (!currentLicense) {
        throw new Error('Licence non trouvée')
      }
      
      // Préparation des champs à mettre à jour
      const allowedFields = [
        'license_type', 'status', 'expires_at', 'max_invoices',
        'max_clients', 'max_users', 'features', 'metadata'
      ]
      
      const updateFields = []
      const params = []
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`)
          
          // Sérialisation JSON si nécessaire
          if (key === 'features' || key === 'metadata') {
            params.push(JSON.stringify(value))
          } else {
            params.push(value)
          }
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('Aucun champ valide à mettre à jour')
      }
      
      // Ajout de updated_at
      updateFields.push('updated_at = CURRENT_TIMESTAMP')
      params.push(licenseId)
      
      const sql = `UPDATE licenses SET ${updateFields.join(', ')} WHERE id = ?`
      
      AdminDatabaseService.run(sql, params)
      
      // Audit
      await LicenseAuditService.logEvent(licenseId, 'LICENSE_UPDATED', {
        oldValues: currentLicense,
        newValues: updates
      })
      
      // Récupération de la licence mise à jour
      const updatedLicense = await this.getLicense(licenseId)
      
      Logger.success('License updated successfully', { licenseId })
      return updatedLicense
      
    } catch (error) {
      Logger.error('Error updating license', { licenseId, error: error.message })
      throw error
    }
  }
  
  /**
   * Activer une licence
   * @param {number} licenseId - ID de la licence
   * @returns {Object} Licence activée
   */
  static async activateLicense(licenseId) {
    try {
      const license = await this.getLicense(licenseId)
      if (!license) {
        throw new Error('Licence non trouvée')
      }
      
      if (license.status === 'ACTIVE') {
        throw new Error('Cette licence est déjà active')
      }
      
      // Vérification de l'expiration
      if (new Date(license.expires_at) < new Date()) {
        throw new Error('Impossible d\'activer une licence expirée')
      }
      
      const updatedLicense = await this.updateLicense(licenseId, {
        status: 'ACTIVE'
      })
      
      await LicenseAuditService.logEvent(licenseId, 'LICENSE_ACTIVATED', {
        previousStatus: license.status
      })
      
      Logger.success('License activated', { licenseId })
      return updatedLicense
      
    } catch (error) {
      Logger.error('Error activating license', { licenseId, error: error.message })
      throw error
    }
  }
  
  /**
   * Suspendre une licence
   * @param {number} licenseId - ID de la licence
   * @param {string} reason - Raison de la suspension
   * @returns {Object} Licence suspendue
   */
  static async suspendLicense(licenseId, reason = '') {
    try {
      const license = await this.getLicense(licenseId)
      if (!license) {
        throw new Error('Licence non trouvée')
      }
      
      if (license.status === 'SUSPENDED') {
        throw new Error('Cette licence est déjà suspendue')
      }
      
      const updatedLicense = await this.updateLicense(licenseId, {
        status: 'SUSPENDED',
        metadata: {
          ...license.metadata,
          suspensionReason: reason,
          suspendedAt: new Date().toISOString()
        }
      })
      
      await LicenseAuditService.logEvent(licenseId, 'LICENSE_SUSPENDED', {
        previousStatus: license.status,
        reason
      })
      
      Logger.success('License suspended', { licenseId, reason })
      return updatedLicense
      
    } catch (error) {
      Logger.error('Error suspending license', { licenseId, error: error.message })
      throw error
    }
  }
  
  /**
   * Révoquer une licence
   * @param {number} licenseId - ID de la licence
   * @param {string} reason - Raison de la révocation
   * @returns {Object} Licence révoquée
   */
  static async revokeLicense(licenseId, reason = '') {
    try {
      const license = await this.getLicense(licenseId)
      if (!license) {
        throw new Error('Licence non trouvée')
      }
      
      if (license.status === 'REVOKED') {
        throw new Error('Cette licence est déjà révoquée')
      }
      
      const updatedLicense = await this.updateLicense(licenseId, {
        status: 'REVOKED',
        metadata: {
          ...license.metadata,
          revocationReason: reason,
          revokedAt: new Date().toISOString()
        }
      })
      
      await LicenseAuditService.logEvent(licenseId, 'LICENSE_REVOKED', {
        previousStatus: license.status,
        reason
      })
      
      Logger.success('License revoked', { licenseId, reason })
      return updatedLicense
      
    } catch (error) {
      Logger.error('Error revoking license', { licenseId, error: error.message })
      throw error
    }
  }
  
  /**
   * Renouveler une licence
   * @param {number} licenseId - ID de la licence
   * @param {Object} renewalData - Données de renouvellement
   * @returns {Object} Licence renouvelée
   */
  static async renewLicense(licenseId, renewalData = {}) {
    try {
      const license = await this.getLicense(licenseId)
      if (!license) {
        throw new Error('Licence non trouvée')
      }
      
      // Calcul de la nouvelle date d'expiration
      const currentExpiry = new Date(license.expires_at)
      const now = new Date()
      
      // Si la licence n'est pas encore expirée, on part de la date d'expiration actuelle
      // Sinon, on part d'aujourd'hui
      const startDate = currentExpiry > now ? currentExpiry : now
      
      const duration = renewalData.duration || LicenseTypeManager.getDefaultDuration(license.license_type)
      const newExpiryDate = new Date(startDate)
      
      switch (duration.unit) {
        case 'days':
          newExpiryDate.setDate(newExpiryDate.getDate() + duration.value)
          break
        case 'months':
          newExpiryDate.setMonth(newExpiryDate.getMonth() + duration.value)
          break
        case 'years':
          newExpiryDate.setFullYear(newExpiryDate.getFullYear() + duration.value)
          break
        default:
          throw new Error('Unité de durée invalide')
      }
      
      const updatedLicense = await this.updateLicense(licenseId, {
        expires_at: newExpiryDate.toISOString(),
        status: 'ACTIVE', // Réactivation automatique lors du renouvellement
        metadata: {
          ...license.metadata,
          renewedAt: new Date().toISOString(),
          previousExpiryDate: license.expires_at
        }
      })
      
      await LicenseAuditService.logEvent(licenseId, 'LICENSE_RENEWED', {
        previousExpiryDate: license.expires_at,
        newExpiryDate: newExpiryDate.toISOString(),
        duration
      })
      
      Logger.success('License renewed', { licenseId, newExpiryDate })
      return updatedLicense
      
    } catch (error) {
      Logger.error('Error renewing license', { licenseId, error: error.message })
      throw error
    }
  }
  
  /**
   * Valider une licence
   * @param {string} licenseKey - Clé de licence
   * @param {Object} context - Contexte de validation
   * @returns {Object} Résultat de validation
   */
  static async validateLicense(licenseKey, context = {}) {
    try {
      Logger.debug('Validating license', { licenseKey, context })
      
      // Récupération de la licence
      const license = await this.getLicenseByKey(licenseKey)
      if (!license) {
        return {
          valid: false,
          error: 'INVALID_KEY',
          message: 'Clé de licence invalide'
        }
      }
      
      // Validation avec le LicenseValidator
      const validationResult = await LicenseValidator.validateLicense(license, context)
      
      // Log de la tentative de validation
      await LicenseAuditService.logEvent(license.id, 'LICENSE_VALIDATION_ATTEMPT', {
        context,
        result: validationResult,
        ip: context.ip,
        userAgent: context.userAgent
      })
      
      return validationResult
      
    } catch (error) {
      Logger.error('Error validating license', { licenseKey, error: error.message })
      return {
        valid: false,
        error: 'VALIDATION_ERROR',
        message: 'Erreur lors de la validation de la licence'
      }
    }
  }
  
  /**
   * Supprimer une licence
   * @param {number} licenseId - ID de la licence
   * @returns {boolean} Succès de la suppression
   */
  static async deleteLicense(licenseId) {
    try {
      const license = await this.getLicense(licenseId)
      if (!license) {
        throw new Error('Licence non trouvée')
      }
      
      // Audit avant suppression
      await LicenseAuditService.logEvent(licenseId, 'LICENSE_DELETED', {
        deletedLicense: license
      })
      
      const sql = 'DELETE FROM licenses WHERE id = ?'
      AdminDatabaseService.run(sql, [licenseId])
      
      Logger.success('License deleted', { licenseId })
      return true
      
    } catch (error) {
      Logger.error('Error deleting license', { licenseId, error: error.message })
      throw error
    }
  }
  
  /**
   * Obtenir les statistiques des licences
   * @returns {Object} Statistiques
   */
  static async getStatistics() {
    try {
      const stats = {
        total: 0,
        active: 0,
        suspended: 0,
        expired: 0,
        revoked: 0,
        byType: {},
        expiringIn30Days: 0,
        recentlyCreated: 0
      }
      
      // Total et par statut
      const statusSql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended,
          SUM(CASE WHEN status = 'REVOKED' THEN 1 ELSE 0 END) as revoked,
          SUM(CASE WHEN expires_at < datetime('now') THEN 1 ELSE 0 END) as expired
        FROM licenses
      `
      
      const statusResult = AdminDatabaseService.queryAll(statusSql)
      if (statusResult.length > 0) {
        const row = statusResult[0]
        stats.total = row.total
        stats.active = row.active
        stats.suspended = row.suspended
        stats.revoked = row.revoked
        stats.expired = row.expired
      }
      
      // Par type
      const typeSql = `
        SELECT license_type, COUNT(*) as count
        FROM licenses
        GROUP BY license_type
      `
      
      const typeResults = AdminDatabaseService.queryAll(typeSql)
      typeResults.forEach(row => {
        stats.byType[row.license_type] = row.count
      })
      
      // Expirant dans 30 jours
      const expiringSql = `
        SELECT COUNT(*) as count
        FROM licenses
        WHERE expires_at BETWEEN datetime('now') AND datetime('now', '+30 days')
        AND status = 'ACTIVE'
      `
      
      const expiringResult = AdminDatabaseService.queryAll(expiringSql)
      if (expiringResult.length > 0) {
        stats.expiringIn30Days = expiringResult[0].count
      }
      
      // Créées récemment (7 derniers jours)
      const recentSql = `
        SELECT COUNT(*) as count
        FROM licenses
        WHERE created_at >= datetime('now', '-7 days')
      `
      
      const recentResult = AdminDatabaseService.queryAll(recentSql)
      if (recentResult.length > 0) {
        stats.recentlyCreated = recentResult[0].count
      }
      
      return stats
      
    } catch (error) {
      Logger.error('Error getting license statistics', { error: error.message })
      throw error
    }
  }
  
  /**
   * Vérifier les licences expirées et les traiter
   * @returns {Object} Résultat du traitement
   */
  static async processExpiredLicenses() {
    try {
      Logger.info('Processing expired licenses')
      
      const result = await LicenseExpirationManager.processExpiredLicenses()
      
      Logger.success('Expired licenses processed', result)
      return result
      
    } catch (error) {
      Logger.error('Error processing expired licenses', { error: error.message })
      throw error
    }
  }
  
  /**
   * Validation des données de licence
   * @param {Object} licenseData - Données à valider
   */
  static validateLicenseData(licenseData) {
    const required = ['companyId', 'type']
    
    for (const field of required) {
      if (!licenseData[field]) {
        throw new Error(`Le champ ${field} est requis`)
      }
    }
    
    // Validation du type de licence
    if (!LicenseTypeManager.isValidType(licenseData.type)) {
      throw new Error(`Type de licence invalide: ${licenseData.type}`)
    }
    
    // Validation de l'ID entreprise
    if (!Number.isInteger(licenseData.companyId) || licenseData.companyId <= 0) {
      throw new Error('ID entreprise invalide')
    }
  }
}
