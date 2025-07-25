import { AdminDatabaseService } from '../services/AdminDatabaseService.js'
import { LicenseAuditService } from '../services/LicenseAuditService.js'
import { Logger } from './Logger.js'

/**
 * License Expiration Manager - Gestionnaire d'expiration des licences
 * Gère automatiquement les expirations, notifications et désactivations
 */
export class LicenseExpirationManager {
  
  // Configuration des notifications
  static NOTIFICATION_INTERVALS = {
    WARNING_30_DAYS: 30,
    WARNING_7_DAYS: 7,
    WARNING_1_DAY: 1,
    EXPIRED: 0
  }
  
  // Types de notifications
  static NOTIFICATION_TYPES = {
    EXPIRATION_WARNING: 'EXPIRATION_WARNING',
    EXPIRED: 'EXPIRED',
    GRACE_PERIOD: 'GRACE_PERIOD',
    SUSPENDED: 'SUSPENDED'
  }
  
  /**
   * Traiter toutes les licences expirées
   * @returns {Promise<Object>} Résultat du traitement
   */
  static async processExpiredLicenses() {
    try {
      Logger.info('Starting expired licenses processing')
      
      const result = {
        processed: 0,
        expired: 0,
        suspended: 0,
        notified: 0,
        errors: []
      }
      
      // Récupération des licences à traiter
      const licensesToProcess = await this.getLicensesToProcess()
      result.processed = licensesToProcess.length
      
      Logger.info('Found licenses to process', { count: licensesToProcess.length })
      
      for (const license of licensesToProcess) {
        try {
          const processResult = await this.processLicense(license)
          
          if (processResult.expired) result.expired++
          if (processResult.suspended) result.suspended++
          if (processResult.notified) result.notified++
          
        } catch (error) {
          Logger.error('Error processing license', { 
            licenseId: license.id, 
            error: error.message 
          })
          result.errors.push({
            licenseId: license.id,
            error: error.message
          })
        }
      }
      
      Logger.success('Expired licenses processing completed', result)
      return result
      
    } catch (error) {
      Logger.error('Error in expired licenses processing', { error: error.message })
      throw error
    }
  }
  
  /**
   * Traiter une licence individuelle
   * @param {Object} license - Licence à traiter
   * @returns {Promise<Object>} Résultat du traitement
   */
  static async processLicense(license) {
    try {
      const result = {
        expired: false,
        suspended: false,
        notified: false
      }
      
      const now = new Date()
      const expirationDate = new Date(license.expires_at)
      const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24))
      
      Logger.debug('Processing license', { 
        licenseId: license.id, 
        daysUntilExpiration 
      })
      
      if (daysUntilExpiration <= 0) {
        // Licence expirée
        await this.handleExpiredLicense(license)
        result.expired = true
        result.notified = true
        
      } else if (this.shouldNotify(daysUntilExpiration)) {
        // Notification d'expiration prochaine
        await this.sendExpirationWarning(license, daysUntilExpiration)
        result.notified = true
      }
      
      return result
      
    } catch (error) {
      Logger.error('Error processing individual license', { 
        licenseId: license.id, 
        error: error.message 
      })
      throw error
    }
  }
  
  /**
   * Gérer une licence expirée
   * @param {Object} license - Licence expirée
   * @returns {Promise<void>}
   */
  static async handleExpiredLicense(license) {
    try {
      Logger.info('Handling expired license', { licenseId: license.id })
      
      // Vérifier si la licence est déjà marquée comme expirée
      if (license.status === 'EXPIRED' || license.status === 'SUSPENDED') {
        Logger.debug('License already processed', { 
          licenseId: license.id, 
          status: license.status 
        })
        return
      }
      
      // Calculer la période de grâce
      const gracePeriodDays = this.getGracePeriod(license.license_type)
      const expirationDate = new Date(license.expires_at)
      const gracePeriodEnd = new Date(expirationDate)
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays)
      
      const now = new Date()
      
      if (now <= gracePeriodEnd) {
        // Encore dans la période de grâce
        await this.handleGracePeriod(license, gracePeriodEnd)
      } else {
        // Période de grâce dépassée, suspendre la licence
        await this.suspendExpiredLicense(license)
      }
      
    } catch (error) {
      Logger.error('Error handling expired license', { 
        licenseId: license.id, 
        error: error.message 
      })
      throw error
    }
  }
  
  /**
   * Gérer la période de grâce
   * @param {Object} license - Licence en période de grâce
   * @param {Date} gracePeriodEnd - Fin de la période de grâce
   * @returns {Promise<void>}
   */
  static async handleGracePeriod(license, gracePeriodEnd) {
    try {
      Logger.info('License in grace period', { 
        licenseId: license.id, 
        gracePeriodEnd 
      })
      
      // Mettre à jour les métadonnées pour indiquer la période de grâce
      const metadata = license.metadata || {}
      metadata.gracePeriod = {
        started: new Date().toISOString(),
        ends: gracePeriodEnd.toISOString(),
        notified: true
      }
      
      const sql = `
        UPDATE licenses 
        SET metadata = ?
        WHERE id = ?
      `
      
      AdminDatabaseService.run(sql, [JSON.stringify(metadata), license.id])
      
      // Audit
      await LicenseAuditService.logEvent(license.id, 'GRACE_PERIOD_STARTED', {
        gracePeriodEnd: gracePeriodEnd.toISOString(),
        originalExpiration: license.expires_at
      })
      
      // Notification de période de grâce
      await this.sendGracePeriodNotification(license, gracePeriodEnd)
      
    } catch (error) {
      Logger.error('Error handling grace period', { 
        licenseId: license.id, 
        error: error.message 
      })
      throw error
    }
  }
  
  /**
   * Suspendre une licence expirée
   * @param {Object} license - Licence à suspendre
   * @returns {Promise<void>}
   */
  static async suspendExpiredLicense(license) {
    try {
      Logger.info('Suspending expired license', { licenseId: license.id })
      
      const metadata = license.metadata || {}
      metadata.suspensionReason = 'Licence expirée'
      metadata.suspendedAt = new Date().toISOString()
      metadata.originalExpiration = license.expires_at
      
      const sql = `
        UPDATE licenses 
        SET status = 'SUSPENDED', metadata = ?
        WHERE id = ?
      `
      
      AdminDatabaseService.run(sql, [JSON.stringify(metadata), license.id])
      
      // Audit
      await LicenseAuditService.logEvent(license.id, 'LICENSE_SUSPENDED_EXPIRED', {
        originalExpiration: license.expires_at,
        suspendedAt: metadata.suspendedAt
      })
      
      // Notification de suspension
      await this.sendSuspensionNotification(license)
      
      Logger.success('License suspended due to expiration', { licenseId: license.id })
      
    } catch (error) {
      Logger.error('Error suspending expired license', { 
        licenseId: license.id, 
        error: error.message 
      })
      throw error
    }
  }
  
  /**
   * Envoyer un avertissement d'expiration
   * @param {Object} license - Licence concernée
   * @param {number} daysUntilExpiration - Jours avant expiration
   * @returns {Promise<void>}
   */
  static async sendExpirationWarning(license, daysUntilExpiration) {
    try {
      Logger.info('Sending expiration warning', { 
        licenseId: license.id, 
        daysUntilExpiration 
      })
      
      // Vérifier si cette notification a déjà été envoyée
      const lastNotification = await this.getLastNotification(license.id, 'EXPIRATION_WARNING')
      
      if (lastNotification && this.wasRecentlyNotified(lastNotification, daysUntilExpiration)) {
        Logger.debug('Notification already sent recently', { 
          licenseId: license.id, 
          lastNotification 
        })
        return
      }
      
      // Enregistrer la notification
      await this.recordNotification(license.id, 'EXPIRATION_WARNING', {
        daysUntilExpiration,
        expirationDate: license.expires_at,
        licenseType: license.license_type
      })
      
      // Audit
      await LicenseAuditService.logEvent(license.id, 'EXPIRATION_WARNING_SENT', {
        daysUntilExpiration,
        notificationType: this.getNotificationType(daysUntilExpiration)
      })
      
      Logger.success('Expiration warning sent', { 
        licenseId: license.id, 
        daysUntilExpiration 
      })
      
    } catch (error) {
      Logger.error('Error sending expiration warning', { 
        licenseId: license.id, 
        error: error.message 
      })
      throw error
    }
  }
  
  /**
   * Envoyer une notification de période de grâce
   * @param {Object} license - Licence concernée
   * @param {Date} gracePeriodEnd - Fin de la période de grâce
   * @returns {Promise<void>}
   */
  static async sendGracePeriodNotification(license, gracePeriodEnd) {
    try {
      Logger.info('Sending grace period notification', { 
        licenseId: license.id, 
        gracePeriodEnd 
      })
      
      await this.recordNotification(license.id, 'GRACE_PERIOD', {
        gracePeriodEnd: gracePeriodEnd.toISOString(),
        originalExpiration: license.expires_at
      })
      
      await LicenseAuditService.logEvent(license.id, 'GRACE_PERIOD_NOTIFICATION_SENT', {
        gracePeriodEnd: gracePeriodEnd.toISOString()
      })
      
    } catch (error) {
      Logger.error('Error sending grace period notification', { 
        licenseId: license.id, 
        error: error.message 
      })
      throw error
    }
  }
  
  /**
   * Envoyer une notification de suspension
   * @param {Object} license - Licence suspendue
   * @returns {Promise<void>}
   */
  static async sendSuspensionNotification(license) {
    try {
      Logger.info('Sending suspension notification', { licenseId: license.id })
      
      await this.recordNotification(license.id, 'SUSPENDED', {
        suspensionReason: 'Licence expirée',
        originalExpiration: license.expires_at
      })
      
      await LicenseAuditService.logEvent(license.id, 'SUSPENSION_NOTIFICATION_SENT', {
        reason: 'Licence expirée'
      })
      
    } catch (error) {
      Logger.error('Error sending suspension notification', { 
        licenseId: license.id, 
        error: error.message 
      })
      throw error
    }
  }
  
  /**
   * Récupérer les licences à traiter
   * @returns {Promise<Array>} Liste des licences
   */
  static async getLicensesToProcess() {
    try {
      // Récupérer les licences actives qui expirent dans les 30 prochains jours
      // ou qui sont déjà expirées mais pas encore suspendues
      const sql = `
        SELECT l.*, c.name as company_name, c.email as company_email
        FROM licenses l
        LEFT JOIN companies c ON l.company_id = c.id
        WHERE l.status IN ('ACTIVE', 'EXPIRED')
        AND (
          l.expires_at <= datetime('now', '+30 days')
          OR l.expires_at <= datetime('now')
        )
        ORDER BY l.expires_at ASC
      `
      
      const licenses = AdminDatabaseService.queryAll(sql)
      
      return licenses.map(license => {
        license.features = JSON.parse(license.features || '[]')
        license.metadata = JSON.parse(license.metadata || '{}')
        return license
      })
      
    } catch (error) {
      Logger.error('Error getting licenses to process', { error: error.message })
      throw error
    }
  }
  
  /**
   * Vérifier si une notification doit être envoyée
   * @param {number} daysUntilExpiration - Jours avant expiration
   * @returns {boolean} True si notification nécessaire
   */
  static shouldNotify(daysUntilExpiration) {
    const intervals = Object.values(this.NOTIFICATION_INTERVALS)
    return intervals.includes(daysUntilExpiration)
  }
  
  /**
   * Obtenir le type de notification selon les jours restants
   * @param {number} daysUntilExpiration - Jours avant expiration
   * @returns {string} Type de notification
   */
  static getNotificationType(daysUntilExpiration) {
    if (daysUntilExpiration <= 0) return 'EXPIRED'
    if (daysUntilExpiration <= 1) return 'CRITICAL'
    if (daysUntilExpiration <= 7) return 'URGENT'
    if (daysUntilExpiration <= 30) return 'WARNING'
    return 'INFO'
  }
  
  /**
   * Obtenir la période de grâce selon le type de licence
   * @param {string} licenseType - Type de licence
   * @returns {number} Jours de grâce
   */
  static getGracePeriod(licenseType) {
    const gracePeriods = {
      'TRIAL': 3,      // 3 jours de grâce
      'BASIC': 7,      // 7 jours de grâce
      'PREMIUM': 14,   // 14 jours de grâce
      'ENTERPRISE': 30 // 30 jours de grâce
    }
    
    return gracePeriods[licenseType] || 7 // 7 jours par défaut
  }
  
  /**
   * Enregistrer une notification
   * @param {number} licenseId - ID de la licence
   * @param {string} type - Type de notification
   * @param {Object} data - Données de la notification
   * @returns {Promise<void>}
   */
  static async recordNotification(licenseId, type, data) {
    try {
      // Créer la table des notifications si elle n'existe pas
      await this.ensureNotificationsTable()
      
      const sql = `
        INSERT INTO license_notifications (
          license_id, notification_type, data, created_at
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `
      
      AdminDatabaseService.run(sql, [
        licenseId,
        type,
        JSON.stringify(data)
      ])
      
      Logger.debug('Notification recorded', { licenseId, type })
      
    } catch (error) {
      Logger.error('Error recording notification', { 
        licenseId, 
        type, 
        error: error.message 
      })
      throw error
    }
  }
  
  /**
   * Récupérer la dernière notification d'un type
   * @param {number} licenseId - ID de la licence
   * @param {string} type - Type de notification
   * @returns {Promise<Object|null>} Dernière notification
   */
  static async getLastNotification(licenseId, type) {
    try {
      const sql = `
        SELECT * FROM license_notifications
        WHERE license_id = ? AND notification_type = ?
        ORDER BY created_at DESC
        LIMIT 1
      `
      
      const result = AdminDatabaseService.queryAll(sql, [licenseId, type])
      
      if (result.length === 0) {
        return null
      }
      
      const notification = result[0]
      notification.data = JSON.parse(notification.data || '{}')
      
      return notification
      
    } catch (error) {
      Logger.error('Error getting last notification', { 
        licenseId, 
        type, 
        error: error.message 
      })
      return null
    }
  }
  
  /**
   * Vérifier si une notification a été envoyée récemment
   * @param {Object} lastNotification - Dernière notification
   * @param {number} daysUntilExpiration - Jours avant expiration
   * @returns {boolean} True si récemment notifié
   */
  static wasRecentlyNotified(lastNotification, daysUntilExpiration) {
    if (!lastNotification) return false
    
    const lastNotificationDate = new Date(lastNotification.created_at)
    const now = new Date()
    const hoursSinceLastNotification = (now - lastNotificationDate) / (1000 * 60 * 60)
    
    // Ne pas renvoyer la même notification dans les 24h
    if (hoursSinceLastNotification < 24) {
      return true
    }
    
    // Vérifier si c'est pour le même nombre de jours
    const lastDays = lastNotification.data?.daysUntilExpiration
    return lastDays === daysUntilExpiration
  }
  
  /**
   * Créer la table des notifications si nécessaire
   * @returns {Promise<void>}
   */
  static async ensureNotificationsTable() {
    try {
      const sql = `
        CREATE TABLE IF NOT EXISTS license_notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          license_id INTEGER NOT NULL,
          notification_type TEXT NOT NULL,
          data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (license_id) REFERENCES licenses (id)
        )
      `
      
      AdminDatabaseService.run(sql)
      
    } catch (error) {
      Logger.error('Error creating notifications table', { error: error.message })
      throw error
    }
  }
  
  /**
   * Obtenir les statistiques d'expiration
   * @returns {Promise<Object>} Statistiques
   */
  static async getExpirationStats() {
    try {
      const stats = {
        expiring30Days: 0,
        expiring7Days: 0,
        expiring1Day: 0,
        expired: 0,
        inGracePeriod: 0
      }
      
      // Expirant dans 30 jours
      const sql30 = `
        SELECT COUNT(*) as count
        FROM licenses
        WHERE status = 'ACTIVE'
        AND expires_at BETWEEN datetime('now') AND datetime('now', '+30 days')
      `
      
      const result30 = AdminDatabaseService.queryAll(sql30)
      if (result30.length > 0) {
        stats.expiring30Days = result30[0].count
      }
      
      // Expirant dans 7 jours
      const sql7 = `
        SELECT COUNT(*) as count
        FROM licenses
        WHERE status = 'ACTIVE'
        AND expires_at BETWEEN datetime('now') AND datetime('now', '+7 days')
      `
      
      const result7 = AdminDatabaseService.queryAll(sql7)
      if (result7.length > 0) {
        stats.expiring7Days = result7[0].count
      }
      
      // Expirant dans 1 jour
      const sql1 = `
        SELECT COUNT(*) as count
        FROM licenses
        WHERE status = 'ACTIVE'
        AND expires_at BETWEEN datetime('now') AND datetime('now', '+1 day')
      `
      
      const result1 = AdminDatabaseService.queryAll(sql1)
      if (result1.length > 0) {
        stats.expiring1Day = result1[0].count
      }
      
      // Expirées
      const sqlExpired = `
        SELECT COUNT(*) as count
        FROM licenses
        WHERE expires_at < datetime('now')
        AND status IN ('ACTIVE', 'EXPIRED')
      `
      
      const resultExpired = AdminDatabaseService.queryAll(sqlExpired)
      if (resultExpired.length > 0) {
        stats.expired = resultExpired[0].count
      }
      
      return stats
      
    } catch (error) {
      Logger.error('Error getting expiration stats', { error: error.message })
      throw error
    }
  }
  
  /**
   * Planifier le traitement automatique des expirations
   * @param {number} intervalMinutes - Intervalle en minutes
   * @returns {number} ID de l'intervalle
   */
  static scheduleAutomaticProcessing(intervalMinutes = 60) {
    Logger.info('Scheduling automatic expiration processing', { intervalMinutes })
    
    return setInterval(async () => {
      try {
        await this.processExpiredLicenses()
      } catch (error) {
        Logger.error('Error in scheduled expiration processing', { error: error.message })
      }
    }, intervalMinutes * 60 * 1000)
  }
}
