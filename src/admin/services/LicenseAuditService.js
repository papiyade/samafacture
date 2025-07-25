import { AdminDatabaseService } from './AdminDatabaseService.js'
import { Logger } from '../utils/Logger.js'

/**
 * License Audit Service - Service d'audit des licences
 * Enregistre et gère tous les événements liés aux licences pour la traçabilité
 */
export class LicenseAuditService {
  
  // Types d'événements d'audit
  static EVENT_TYPES = {
    // Cycle de vie des licences
    LICENSE_CREATED: 'LICENSE_CREATED',
    LICENSE_UPDATED: 'LICENSE_UPDATED',
    LICENSE_DELETED: 'LICENSE_DELETED',
    LICENSE_ACTIVATED: 'LICENSE_ACTIVATED',
    LICENSE_SUSPENDED: 'LICENSE_SUSPENDED',
    LICENSE_REVOKED: 'LICENSE_REVOKED',
    LICENSE_RENEWED: 'LICENSE_RENEWED',
    
    // Validation et utilisation
    LICENSE_VALIDATION_ATTEMPT: 'LICENSE_VALIDATION_ATTEMPT',
    LICENSE_VALIDATION_SUCCESS: 'LICENSE_VALIDATION_SUCCESS',
    LICENSE_VALIDATION_FAILED: 'LICENSE_VALIDATION_FAILED',
    LICENSE_USAGE_RECORDED: 'LICENSE_USAGE_RECORDED',
    
    // Expiration et notifications
    EXPIRATION_WARNING_SENT: 'EXPIRATION_WARNING_SENT',
    GRACE_PERIOD_STARTED: 'GRACE_PERIOD_STARTED',
    GRACE_PERIOD_NOTIFICATION_SENT: 'GRACE_PERIOD_NOTIFICATION_SENT',
    LICENSE_SUSPENDED_EXPIRED: 'LICENSE_SUSPENDED_EXPIRED',
    SUSPENSION_NOTIFICATION_SENT: 'SUSPENSION_NOTIFICATION_SENT',
    
    // Sécurité et violations
    INVALID_KEY_ATTEMPT: 'INVALID_KEY_ATTEMPT',
    LIMIT_EXCEEDED_ATTEMPT: 'LIMIT_EXCEEDED_ATTEMPT',
    UNAUTHORIZED_ACCESS_ATTEMPT: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    
    // Administration
    ADMIN_ACCESS: 'ADMIN_ACCESS',
    BULK_OPERATION: 'BULK_OPERATION',
    CONFIGURATION_CHANGE: 'CONFIGURATION_CHANGE'
  }
  
  // Niveaux de sévérité
  static SEVERITY_LEVELS = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  }
  
  /**
   * Initialiser le service d'audit
   * @returns {Promise<void>}
   */
  static async init() {
    try {
      Logger.info('Initializing License Audit Service')
      
      await this.ensureAuditTable()
      await this.ensureIndexes()
      
      Logger.success('License Audit Service initialized')
      
    } catch (error) {
      Logger.error('Error initializing License Audit Service', { error: error.message })
      throw error
    }
  }
  
  /**
   * Enregistrer un événement d'audit
   * @param {number} licenseId - ID de la licence
   * @param {string} eventType - Type d'événement
   * @param {Object} eventData - Données de l'événement
   * @param {Object} context - Contexte (utilisateur, IP, etc.)
   * @returns {Promise<number>} ID de l'événement créé
   */
  static async logEvent(licenseId, eventType, eventData = {}, context = {}) {
    try {
      Logger.debug('Logging audit event', { licenseId, eventType, eventData })
      
      // Validation des paramètres
      if (!licenseId || !eventType) {
        throw new Error('License ID et type d\'événement requis')
      }
      
      if (!this.EVENT_TYPES[eventType]) {
        Logger.warn('Unknown event type', { eventType })
      }
      
      // Préparation des données
      const auditEntry = {
        license_id: licenseId,
        event_type: eventType,
        event_data: JSON.stringify(eventData),
        severity: this.determineSeverity(eventType, eventData),
        user_id: context.userId || null,
        user_agent: context.userAgent || null,
        ip_address: context.ip || null,
        session_id: context.sessionId || null,
        timestamp: new Date().toISOString()
      }
      
      // Insertion en base
      const sql = `
        INSERT INTO license_audit_logs (
          license_id, event_type, event_data, severity,
          user_id, user_agent, ip_address, session_id, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      AdminDatabaseService.run(sql, [
        auditEntry.license_id,
        auditEntry.event_type,
        auditEntry.event_data,
        auditEntry.severity,
        auditEntry.user_id,
        auditEntry.user_agent,
        auditEntry.ip_address,
        auditEntry.session_id,
        auditEntry.timestamp
      ])
      
      const auditId = AdminDatabaseService.getLastInsertId()
      
      // Vérification des alertes de sécurité
      await this.checkSecurityAlerts(licenseId, eventType, eventData, context)
      
      Logger.debug('Audit event logged', { auditId, licenseId, eventType })
      return auditId
      
    } catch (error) {
      Logger.error('Error logging audit event', { 
        licenseId, 
        eventType, 
        error: error.message 
      })
      throw error
    }
  }
  
  /**
   * Récupérer l'historique d'audit d'une licence
   * @param {number} licenseId - ID de la licence
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array>} Historique d'audit
   */
  static async getLicenseAuditHistory(licenseId, options = {}) {
    try {
      let sql = `
        SELECT * FROM license_audit_logs
        WHERE license_id = ?
      `
      const params = [licenseId]
      
      // Filtres
      if (options.eventType) {
        sql += ' AND event_type = ?'
        params.push(options.eventType)
      }
      
      if (options.severity) {
        sql += ' AND severity = ?'
        params.push(options.severity)
      }
      
      if (options.startDate) {
        sql += ' AND timestamp >= ?'
        params.push(options.startDate)
      }
      
      if (options.endDate) {
        sql += ' AND timestamp <= ?'
        params.push(options.endDate)
      }
      
      if (options.userId) {
        sql += ' AND user_id = ?'
        params.push(options.userId)
      }
      
      sql += ' ORDER BY timestamp DESC'
      
      if (options.limit) {
        sql += ' LIMIT ?'
        params.push(options.limit)
      }
      
      const results = AdminDatabaseService.queryAll(sql, params)
      
      return results.map(entry => {
        entry.event_data = JSON.parse(entry.event_data || '{}')
        return entry
      })
      
    } catch (error) {
      Logger.error('Error getting license audit history', { 
        licenseId, 
        error: error.message 
      })
      throw error
    }
  }
  
  /**
   * Récupérer tous les événements d'audit avec filtres
   * @param {Object} filters - Filtres de recherche
   * @returns {Promise<Array>} Événements d'audit
   */
  static async getAllAuditEvents(filters = {}) {
    try {
      let sql = `
        SELECT al.*, l.license_key, c.name as company_name
        FROM license_audit_logs al
        LEFT JOIN licenses l ON al.license_id = l.id
        LEFT JOIN companies c ON l.company_id = c.id
        WHERE 1=1
      `
      const params = []
      
      // Filtres
      if (filters.licenseId) {
        sql += ' AND al.license_id = ?'
        params.push(filters.licenseId)
      }
      
      if (filters.eventType) {
        sql += ' AND al.event_type = ?'
        params.push(filters.eventType)
      }
      
      if (filters.severity) {
        sql += ' AND al.severity = ?'
        params.push(filters.severity)
      }
      
      if (filters.companyId) {
        sql += ' AND l.company_id = ?'
        params.push(filters.companyId)
      }
      
      if (filters.startDate) {
        sql += ' AND al.timestamp >= ?'
        params.push(filters.startDate)
      }
      
      if (filters.endDate) {
        sql += ' AND al.timestamp <= ?'
        params.push(filters.endDate)
      }
      
      if (filters.search) {
        sql += ' AND (c.name LIKE ? OR l.license_key LIKE ? OR al.event_type LIKE ?)'
        const searchTerm = `%${filters.search}%`
        params.push(searchTerm, searchTerm, searchTerm)
      }
      
      sql += ' ORDER BY al.timestamp DESC'
      
      if (filters.limit) {
        sql += ' LIMIT ?'
        params.push(filters.limit)
      }
      
      const results = AdminDatabaseService.queryAll(sql, params)
      
      return results.map(entry => {
        entry.event_data = JSON.parse(entry.event_data || '{}')
        return entry
      })
      
    } catch (error) {
      Logger.error('Error getting all audit events', { error: error.message })
      throw error
    }
  }
  
  /**
   * Obtenir les statistiques d'audit
   * @param {Object} filters - Filtres pour les statistiques
   * @returns {Promise<Object>} Statistiques
   */
  static async getAuditStatistics(filters = {}) {
    try {
      const stats = {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        eventsLast24h: 0,
        eventsLast7days: 0,
        topLicenses: [],
        securityEvents: 0
      }
      
      // Total des événements
      let sql = 'SELECT COUNT(*) as count FROM license_audit_logs WHERE 1=1'
      const params = []
      
      if (filters.startDate) {
        sql += ' AND timestamp >= ?'
        params.push(filters.startDate)
      }
      
      if (filters.endDate) {
        sql += ' AND timestamp <= ?'
        params.push(filters.endDate)
      }
      
      const totalResult = AdminDatabaseService.queryAll(sql, params)
      if (totalResult.length > 0) {
        stats.totalEvents = totalResult[0].count
      }
      
      // Événements par type
      sql = `
        SELECT event_type, COUNT(*) as count
        FROM license_audit_logs
        WHERE 1=1
      `
      
      if (filters.startDate) {
        sql += ' AND timestamp >= ?'
      }
      if (filters.endDate) {
        sql += ' AND timestamp <= ?'
      }
      
      sql += ' GROUP BY event_type ORDER BY count DESC'
      
      const typeResults = AdminDatabaseService.queryAll(sql, params)
      typeResults.forEach(row => {
        stats.eventsByType[row.event_type] = row.count
      })
      
      // Événements par sévérité
      sql = `
        SELECT severity, COUNT(*) as count
        FROM license_audit_logs
        WHERE 1=1
      `
      
      if (filters.startDate) {
        sql += ' AND timestamp >= ?'
      }
      if (filters.endDate) {
        sql += ' AND timestamp <= ?'
      }
      
      sql += ' GROUP BY severity'
      
      const severityResults = AdminDatabaseService.queryAll(sql, params)
      severityResults.forEach(row => {
        stats.eventsBySeverity[row.severity] = row.count
      })
      
      // Événements des dernières 24h
      const last24hSql = `
        SELECT COUNT(*) as count
        FROM license_audit_logs
        WHERE timestamp >= datetime('now', '-1 day')
      `
      
      const last24hResult = AdminDatabaseService.queryAll(last24hSql)
      if (last24hResult.length > 0) {
        stats.eventsLast24h = last24hResult[0].count
      }
      
      // Événements des 7 derniers jours
      const last7daysSql = `
        SELECT COUNT(*) as count
        FROM license_audit_logs
        WHERE timestamp >= datetime('now', '-7 days')
      `
      
      const last7daysResult = AdminDatabaseService.queryAll(last7daysSql)
      if (last7daysResult.length > 0) {
        stats.eventsLast7days = last7daysResult[0].count
      }
      
      // Top licences par activité
      const topLicensesSql = `
        SELECT 
          al.license_id,
          l.license_key,
          c.name as company_name,
          COUNT(*) as event_count
        FROM license_audit_logs al
        LEFT JOIN licenses l ON al.license_id = l.id
        LEFT JOIN companies c ON l.company_id = c.id
        WHERE al.timestamp >= datetime('now', '-30 days')
        GROUP BY al.license_id
        ORDER BY event_count DESC
        LIMIT 10
      `
      
      const topLicensesResult = AdminDatabaseService.queryAll(topLicensesSql)
      stats.topLicenses = topLicensesResult
      
      // Événements de sécurité
      const securityEventsSql = `
        SELECT COUNT(*) as count
        FROM license_audit_logs
        WHERE event_type IN (
          'INVALID_KEY_ATTEMPT',
          'LIMIT_EXCEEDED_ATTEMPT',
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          'SUSPICIOUS_ACTIVITY'
        )
        AND timestamp >= datetime('now', '-30 days')
      `
      
      const securityResult = AdminDatabaseService.queryAll(securityEventsSql)
      if (securityResult.length > 0) {
        stats.securityEvents = securityResult[0].count
      }
      
      return stats
      
    } catch (error) {
      Logger.error('Error getting audit statistics', { error: error.message })
      throw error
    }
  }
  
  /**
   * Rechercher des événements d'audit
   * @param {string} query - Requête de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} Résultats de recherche
   */
  static async searchAuditEvents(query, options = {}) {
    try {
      const sql = `
        SELECT al.*, l.license_key, c.name as company_name
        FROM license_audit_logs al
        LEFT JOIN licenses l ON al.license_id = l.id
        LEFT JOIN companies c ON l.company_id = c.id
        WHERE (
          al.event_type LIKE ? OR
          al.event_data LIKE ? OR
          l.license_key LIKE ? OR
          c.name LIKE ? OR
          al.ip_address LIKE ?
        )
        ORDER BY al.timestamp DESC
        LIMIT ?
      `
      
      const searchTerm = `%${query}%`
      const limit = options.limit || 100
      
      const results = AdminDatabaseService.queryAll(sql, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit
      ])
      
      return results.map(entry => {
        entry.event_data = JSON.parse(entry.event_data || '{}')
        return entry
      })
      
    } catch (error) {
      Logger.error('Error searching audit events', { query, error: error.message })
      throw error
    }
  }
  
  /**
   * Exporter les événements d'audit
   * @param {Object} filters - Filtres d'export
   * @param {string} format - Format d'export (json, csv)
   * @returns {Promise<string>} Données exportées
   */
  static async exportAuditEvents(filters = {}, format = 'json') {
    try {
      Logger.info('Exporting audit events', { filters, format })
      
      const events = await this.getAllAuditEvents(filters)
      
      if (format === 'csv') {
        return this.convertToCSV(events)
      }
      
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        filters: filters,
        totalEvents: events.length,
        events: events
      }, null, 2)
      
    } catch (error) {
      Logger.error('Error exporting audit events', { error: error.message })
      throw error
    }
  }
  
  /**
   * Nettoyer les anciens événements d'audit
   * @param {number} retentionDays - Nombre de jours de rétention
   * @returns {Promise<number>} Nombre d'événements supprimés
   */
  static async cleanupOldEvents(retentionDays = 365) {
    try {
      Logger.info('Cleaning up old audit events', { retentionDays })
      
      const sql = `
        DELETE FROM license_audit_logs
        WHERE timestamp < datetime('now', '-${retentionDays} days')
      `
      
      const result = AdminDatabaseService.run(sql)
      
      Logger.success('Old audit events cleaned up', { deletedCount: result })
      return result
      
    } catch (error) {
      Logger.error('Error cleaning up old audit events', { error: error.message })
      throw error
    }
  }
  
  /**
   * Déterminer la sévérité d'un événement
   * @param {string} eventType - Type d'événement
   * @param {Object} eventData - Données de l'événement
   * @returns {string} Niveau de sévérité
   */
  static determineSeverity(eventType, eventData) {
    const criticalEvents = [
      'LICENSE_REVOKED',
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'SUSPICIOUS_ACTIVITY'
    ]
    
    const highEvents = [
      'LICENSE_SUSPENDED',
      'INVALID_KEY_ATTEMPT',
      'LIMIT_EXCEEDED_ATTEMPT',
      'LICENSE_SUSPENDED_EXPIRED'
    ]
    
    const mediumEvents = [
      'LICENSE_VALIDATION_FAILED',
      'EXPIRATION_WARNING_SENT',
      'GRACE_PERIOD_STARTED'
    ]
    
    if (criticalEvents.includes(eventType)) {
      return this.SEVERITY_LEVELS.CRITICAL
    }
    
    if (highEvents.includes(eventType)) {
      return this.SEVERITY_LEVELS.HIGH
    }
    
    if (mediumEvents.includes(eventType)) {
      return this.SEVERITY_LEVELS.MEDIUM
    }
    
    return this.SEVERITY_LEVELS.LOW
  }
  
  /**
   * Vérifier les alertes de sécurité
   * @param {number} licenseId - ID de la licence
   * @param {string} eventType - Type d'événement
   * @param {Object} eventData - Données de l'événement
   * @param {Object} context - Contexte
   * @returns {Promise<void>}
   */
  static async checkSecurityAlerts(licenseId, eventType, eventData, context) {
    try {
      // Vérifier les tentatives répétées d'accès invalide
      if (eventType === 'INVALID_KEY_ATTEMPT') {
        await this.checkRepeatedInvalidAttempts(licenseId, context)
      }
      
      // Vérifier les tentatives de dépassement de limites
      if (eventType === 'LIMIT_EXCEEDED_ATTEMPT') {
        await this.checkLimitExceededPattern(licenseId, context)
      }
      
      // Vérifier les accès depuis des IP suspectes
      if (context.ip) {
        await this.checkSuspiciousIP(context.ip, licenseId)
      }
      
    } catch (error) {
      Logger.error('Error checking security alerts', { 
        licenseId, 
        eventType, 
        error: error.message 
      })
    }
  }
  
  /**
   * Vérifier les tentatives répétées d'accès invalide
   * @param {number} licenseId - ID de la licence
   * @param {Object} context - Contexte
   * @returns {Promise<void>}
   */
  static async checkRepeatedInvalidAttempts(licenseId, context) {
    const sql = `
      SELECT COUNT(*) as count
      FROM license_audit_logs
      WHERE license_id = ?
      AND event_type = 'INVALID_KEY_ATTEMPT'
      AND timestamp >= datetime('now', '-1 hour')
    `
    
    const result = AdminDatabaseService.queryAll(sql, [licenseId])
    
    if (result.length > 0 && result[0].count >= 5) {
      // Plus de 5 tentatives en 1 heure = activité suspecte
      await this.logEvent(licenseId, 'SUSPICIOUS_ACTIVITY', {
        reason: 'Tentatives répétées d\'accès invalide',
        attemptCount: result[0].count,
        timeWindow: '1 hour'
      }, context)
    }
  }
  
  /**
   * Vérifier les patterns de dépassement de limites
   * @param {number} licenseId - ID de la licence
   * @param {Object} context - Contexte
   * @returns {Promise<void>}
   */
  static async checkLimitExceededPattern(licenseId, context) {
    const sql = `
      SELECT COUNT(*) as count
      FROM license_audit_logs
      WHERE license_id = ?
      AND event_type = 'LIMIT_EXCEEDED_ATTEMPT'
      AND timestamp >= datetime('now', '-24 hours')
    `
    
    const result = AdminDatabaseService.queryAll(sql, [licenseId])
    
    if (result.length > 0 && result[0].count >= 10) {
      // Plus de 10 tentatives de dépassement en 24h
      await this.logEvent(licenseId, 'SUSPICIOUS_ACTIVITY', {
        reason: 'Tentatives répétées de dépassement de limites',
        attemptCount: result[0].count,
        timeWindow: '24 hours'
      }, context)
    }
  }
  
  /**
   * Vérifier les IP suspectes
   * @param {string} ip - Adresse IP
   * @param {number} licenseId - ID de la licence
   * @returns {Promise<void>}
   */
  static async checkSuspiciousIP(ip, licenseId) {
    const sql = `
      SELECT COUNT(DISTINCT license_id) as license_count
      FROM license_audit_logs
      WHERE ip_address = ?
      AND timestamp >= datetime('now', '-1 hour')
    `
    
    const result = AdminDatabaseService.queryAll(sql, [ip])
    
    if (result.length > 0 && result[0].license_count >= 10) {
      // Même IP utilisée pour plus de 10 licences différentes en 1h
      await this.logEvent(licenseId, 'SUSPICIOUS_ACTIVITY', {
        reason: 'IP utilisée pour de multiples licences',
        ip: ip,
        licenseCount: result[0].license_count,
        timeWindow: '1 hour'
      })
    }
  }
  
  /**
   * Convertir les événements en CSV
   * @param {Array} events - Événements à convertir
   * @returns {string} Données CSV
   */
  static convertToCSV(events) {
    if (events.length === 0) return ''
    
    const headers = [
      'ID', 'License ID', 'License Key', 'Company', 'Event Type',
      'Severity', 'Timestamp', 'User ID', 'IP Address', 'Event Data'
    ]
    
    const csvRows = [headers.join(',')]
    
    events.forEach(event => {
      const row = [
        event.id,
        event.license_id,
        event.license_key || '',
        event.company_name || '',
        event.event_type,
        event.severity,
        event.timestamp,
        event.user_id || '',
        event.ip_address || '',
        JSON.stringify(event.event_data).replace(/"/g, '""')
      ]
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }
  
  /**
   * Créer la table d'audit si nécessaire
   * @returns {Promise<void>}
   */
  static async ensureAuditTable() {
    try {
      const sql = `
        CREATE TABLE IF NOT EXISTS license_audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          license_id INTEGER NOT NULL,
          event_type TEXT NOT NULL,
          event_data TEXT,
          severity TEXT NOT NULL DEFAULT 'LOW',
          user_id INTEGER,
          user_agent TEXT,
          ip_address TEXT,
          session_id TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (license_id) REFERENCES licenses (id)
        )
      `
      
      AdminDatabaseService.run(sql)
      
    } catch (error) {
      Logger.error('Error creating audit table', { error: error.message })
      throw error
    }
  }
  
  /**
   * Créer les index pour optimiser les performances
   * @returns {Promise<void>}
   */
  static async ensureIndexes() {
    try {
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_audit_license_id ON license_audit_logs (license_id)',
        'CREATE INDEX IF NOT EXISTS idx_audit_event_type ON license_audit_logs (event_type)',
        'CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON license_audit_logs (timestamp)',
        'CREATE INDEX IF NOT EXISTS idx_audit_severity ON license_audit_logs (severity)',
        'CREATE INDEX IF NOT EXISTS idx_audit_ip_address ON license_audit_logs (ip_address)'
      ]
      
      for (const indexSql of indexes) {
        AdminDatabaseService.run(indexSql)
      }
      
    } catch (error) {
      Logger.error('Error creating audit indexes', { error: error.message })
      throw error
    }
  }
}
