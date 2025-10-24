import { LicenseEncryption } from '../utils/LicenseEncryption.js'
import { AdminDatabaseService } from './AdminDatabaseService.js'
import { NotificationService } from '../../shared/services/NotificationService.js'

/**
 * Remote License Control Service - Manages remote license operations
 */
export class RemoteLicenseControl {
  
  /**
   * Generate encrypted license file for a company
   * @param {number} companyId - Company ID
   * @returns {Object} License file data
   */
  static async generateLicenseFile(companyId) {
    try {
      // Get company and license data
      const company = await this.getCompanyWithLicense(companyId)
      if (!company) {
        throw new Error('Entreprise non trouvée')
      }
      
      // Prepare license data
      const licenseData = {
        companyId: company.id,
        companyName: company.name,
        companyEmail: company.email,
        licenseKey: company.license_key,
        licenseType: company.license_type,
        status: company.license_status,
        issuedAt: new Date().toISOString(),
        expiresAt: company.expires_at,
        features: this.getLicenseFeatures(company.license_type),
        limits: this.getLicenseLimits(company.license_type),
        version: '1.0',
        issuer: 'SamaFacture Admin'
      }
      
      // Generate encrypted license file
      const licenseFileContent = LicenseEncryption.generateLicenseFile(licenseData)
      
      // Log the generation
      AdminDatabaseService.logAudit('licenses', company.id, 'GENERATE_FILE', null, {
        companyId: companyId,
        licenseType: company.license_type,
        generatedAt: new Date().toISOString()
      })
      
      return {
        filename: `samafacture-license-${company.name.toLowerCase().replace(/\s+/g, '-')}.lic`,
        content: licenseFileContent,
        mimeType: 'application/octet-stream',
        size: licenseFileContent.length,
        company: {
          id: company.id,
          name: company.name,
          email: company.email
        },
        license: {
          type: company.license_type,
          expiresAt: company.expires_at,
          status: company.license_status
        }
      }
    } catch (error) {
      console.error('Error generating license file:', error)
      throw error
    }
  }
  
  /**
   * Validate a license file
   * @param {string} licenseFileContent - License file content
   * @returns {Object} Validation result
   */
  static async validateLicenseFile(licenseFileContent) {
    try {
      // Parse and decrypt license
      const licenseData = LicenseEncryption.parseLicenseFile(licenseFileContent)
      
      // Validate license data
      const validation = LicenseEncryption.validateLicense(licenseData)
      
      // Check against database
      const dbValidation = await this.validateAgainstDatabase(licenseData)
      
      return {
        ...validation,
        databaseValidation: dbValidation,
        licenseData: licenseData
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: [],
        status: 'INVALID'
      }
    }
  }
  
  /**
   * Suspend a company's license
   * @param {number} companyId - Company ID
   * @param {string} reason - Suspension reason
   * @returns {boolean} Success status
   */
  static async suspendLicense(companyId, reason = 'Suspendu par l\'administrateur') {
    try {
      const sql = `
        UPDATE licenses 
        SET status = 'SUSPENDED', 
            suspended_at = CURRENT_TIMESTAMP,
            suspension_reason = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE company_id = ?
      `
      
      AdminDatabaseService.run(sql, [reason, companyId])
      
      // Log audit
      AdminDatabaseService.logAudit('licenses', companyId, 'SUSPEND', null, {
        reason: reason,
        suspendedAt: new Date().toISOString()
      })
      
      // Notify company (in a real system, this would send an email)
      await this.notifyLicenseChange(companyId, 'SUSPENDED', reason)
      
      return true
    } catch (error) {
      console.error('Error suspending license:', error)
      throw error
    }
  }
  
  /**
   * Reactivate a company's license
   * @param {number} companyId - Company ID
   * @returns {boolean} Success status
   */
  static async reactivateLicense(companyId) {
    try {
      const sql = `
        UPDATE licenses 
        SET status = 'ACTIVE', 
            suspended_at = NULL,
            suspension_reason = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE company_id = ?
      `
      
      AdminDatabaseService.run(sql, [companyId])
      
      // Log audit
      AdminDatabaseService.logAudit('licenses', companyId, 'REACTIVATE', null, {
        reactivatedAt: new Date().toISOString()
      })
      
      // Notify company
      await this.notifyLicenseChange(companyId, 'ACTIVE', 'Licence réactivée')
      
      return true
    } catch (error) {
      console.error('Error reactivating license:', error)
      throw error
    }
  }
  
  /**
   * Extend a company's license
   * @param {number} companyId - Company ID
   * @param {number} days - Days to extend
   * @returns {Object} Updated license info
   */
  static async extendLicense(companyId, days) {
    try {
      // Get current license
      const company = await this.getCompanyWithLicense(companyId)
      if (!company) {
        throw new Error('Entreprise non trouvée')
      }
      
      // Calculate new expiry date
      const currentExpiry = new Date(company.expires_at)
      const newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000))
      
      const sql = `
        UPDATE licenses 
        SET expires_at = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE company_id = ?
      `
      
      AdminDatabaseService.run(sql, [newExpiry.toISOString(), companyId])
      
      // Log audit
      AdminDatabaseService.logAudit('licenses', companyId, 'EXTEND', 
        { expires_at: company.expires_at }, 
        { expires_at: newExpiry.toISOString(), extended_days: days }
      )
      
      // Notify company
      await this.notifyLicenseChange(companyId, 'EXTENDED', `Licence prolongée de ${days} jours`)
      
      return {
        companyId: companyId,
        previousExpiry: company.expires_at,
        newExpiry: newExpiry.toISOString(),
        extendedDays: days
      }
    } catch (error) {
      console.error('Error extending license:', error)
      throw error
    }
  }
  
  /**
   * Change license type
   * @param {number} companyId - Company ID
   * @param {string} newLicenseType - New license type
   * @returns {Object} Updated license info
   */
  static async changeLicenseType(companyId, newLicenseType) {
    try {
      // Get current license
      const company = await this.getCompanyWithLicense(companyId)
      if (!company) {
        throw new Error('Entreprise non trouvée')
      }
      
      // Generate new license key
      const newLicenseKey = LicenseEncryption.generateLicenseKey(companyId, newLicenseType)
      
      const sql = `
        UPDATE licenses 
        SET license_type = ?,
            license_key = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE company_id = ?
      `
      
      AdminDatabaseService.run(sql, [newLicenseType, newLicenseKey, companyId])
      
      // Log audit
      AdminDatabaseService.logAudit('licenses', companyId, 'CHANGE_TYPE', 
        { license_type: company.license_type, license_key: company.license_key }, 
        { license_type: newLicenseType, license_key: newLicenseKey }
      )
      
      // Notify company
      await this.notifyLicenseChange(companyId, 'TYPE_CHANGED', `Type de licence changé vers ${newLicenseType}`)
      
      return {
        companyId: companyId,
        previousType: company.license_type,
        newType: newLicenseType,
        newLicenseKey: newLicenseKey
      }
    } catch (error) {
      console.error('Error changing license type:', error)
      throw error
    }
  }
  
  /**
   * Get license features based on type
   * @param {string} licenseType - License type
   * @returns {Array} List of features
   */
  static getLicenseFeatures(licenseType) {
    const features = {
      TRIAL: ['basic_invoicing', 'basic_quotes', 'client_management'],
      BASIC: ['basic_invoicing', 'basic_quotes', 'client_management', 'product_management', 'basic_reports'],
      PREMIUM: ['advanced_invoicing', 'advanced_quotes', 'client_management', 'product_management', 'advanced_reports', 'expense_tracking', 'multi_currency'],
      ENTERPRISE: ['all_features', 'api_access', 'custom_branding', 'priority_support', 'advanced_analytics']
    }
    
    return features[licenseType] || features.TRIAL
  }
  
  /**
   * Get license limits based on type
   * @param {string} licenseType - License type
   * @returns {Object} License limits
   */
  static getLicenseLimits(licenseType) {
    const limits = {
      TRIAL: {
        maxInvoices: 10,
        maxClients: 5,
        maxProducts: 10,
        maxUsers: 1,
        storageLimit: '100MB'
      },
      BASIC: {
        maxInvoices: 100,
        maxClients: 50,
        maxProducts: 100,
        maxUsers: 2,
        storageLimit: '1GB'
      },
      PREMIUM: {
        maxInvoices: 1000,
        maxClients: 500,
        maxProducts: 1000,
        maxUsers: 5,
        storageLimit: '10GB'
      },
      ENTERPRISE: {
        maxInvoices: -1, // Unlimited
        maxClients: -1,
        maxProducts: -1,
        maxUsers: -1,
        storageLimit: 'Unlimited'
      }
    }
    
    return limits[licenseType] || limits.TRIAL
  }
  
  /**
   * Get company with license data
   * @param {number} companyId - Company ID
   * @returns {Object|null} Company with license data
   */
  static async getCompanyWithLicense(companyId) {
    const sql = `
      SELECT c.*, l.license_type, l.license_key, l.status as license_status, 
             l.expires_at, l.suspended_at, l.suspension_reason
      FROM companies c
      LEFT JOIN licenses l ON c.id = l.company_id
      WHERE c.id = ?
    `
    
    const companies = AdminDatabaseService.queryAll(sql, [companyId])
    return companies && companies.length > 0 ? companies[0] : null
  }
  
  /**
   * Validate license against database
   * @param {Object} licenseData - License data
   * @returns {Object} Database validation result
   */
  static async validateAgainstDatabase(licenseData) {
    try {
      const company = await this.getCompanyWithLicense(licenseData.companyId)
      
      if (!company) {
        return {
          isValid: false,
          error: 'Entreprise non trouvée dans la base de données'
        }
      }
      
      if (company.license_key !== licenseData.licenseKey) {
        return {
          isValid: false,
          error: 'Clé de licence invalide'
        }
      }
      
      if (company.license_status === 'SUSPENDED') {
        return {
          isValid: false,
          error: 'Licence suspendue'
        }
      }
      
      return {
        isValid: true,
        company: company
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Erreur de validation de la base de données'
      }
    }
  }
  
  /**
   * Notify company of license changes
   * @param {number} companyId - Company ID
   * @param {string} changeType - Type of change
   * @param {string} message - Notification message
   */
  static async notifyLicenseChange(companyId, changeType, message) {
    try {
      // In a real system, this would send an email or push notification
      console.log(`📧 License notification for company ${companyId}: ${changeType} - ${message}`)
      
      // Log notification
      AdminDatabaseService.logAudit('notifications', companyId, 'LICENSE_NOTIFICATION', null, {
        changeType: changeType,
        message: message,
        sentAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error sending license notification:', error)
    }
  }
  
  /**
   * Get license statistics
   * @returns {Object} License statistics
   */
  static async getLicenseStatistics() {
    try {
      const stats = {
        total: 0,
        active: 0,
        suspended: 0,
        expired: 0,
        byType: {},
        expiringIn7Days: 0,
        expiringIn30Days: 0
      }
      
      // Get all licenses
      const sql = `
        SELECT license_type, status, expires_at
        FROM licenses
      `
      
      const licenses = AdminDatabaseService.queryAll(sql, [])
      const now = new Date()
      
      licenses.forEach(license => {
        stats.total++
        
        // Count by status
        if (license.status === 'ACTIVE') {
          stats.active++
        } else if (license.status === 'SUSPENDED') {
          stats.suspended++
        }
        
        // Count by type
        stats.byType[license.license_type] = (stats.byType[license.license_type] || 0) + 1
        
        // Check expiration
        const expiresAt = new Date(license.expires_at)
        if (expiresAt < now) {
          stats.expired++
        } else {
          const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
          if (daysUntilExpiry <= 7) {
            stats.expiringIn7Days++
          } else if (daysUntilExpiry <= 30) {
            stats.expiringIn30Days++
          }
        }
      })
      
      return stats
    } catch (error) {
      console.error('Error getting license statistics:', error)
      throw error
    }
  }
}

