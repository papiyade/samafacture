import { AdminDatabaseService } from './AdminDatabaseService.js'

/**
 * License Service - Gestion complète des licences SamaFacture
 * Centralise toute la logique métier des licences
 */
export class LicenseService {
  
  /**
   * Get all licenses with company information
   * @returns {Array} List of licenses
   */
  static async getLicenses() {
    try {
      // Ensure database is initialized
      if (!AdminDatabaseService.isInitialized) {
        await AdminDatabaseService.init()
      }

      const sql = `
        SELECT 
          l.*,
          c.name as companyName,
          c.email as companyEmail,
          c.status as companyStatus
        FROM licenses l
        LEFT JOIN companies c ON l.company_id = c.id
        ORDER BY l.created_at DESC
      `
      
      return AdminDatabaseService.queryAll(sql)
    } catch (error) {
      console.error('❌ Error fetching licenses:', error)
      return []
    }
  }

  /**
   * Create a new license
   * @param {Object} licenseData - License data
   * @returns {Object} Created license
   */
  static async createLicense(licenseData) {
    try {
      // Ensure database is initialized
      if (!AdminDatabaseService.isInitialized) {
        await AdminDatabaseService.init()
      }

      // Generate license key
      const licenseKey = this.generateLicenseKey()
      
      // Prepare license data
      const license = {
        company_id: licenseData.companyId,
        license_key: licenseKey,
        license_type: licenseData.licenseType,
        status: licenseData.status || 'ACTIVE',
        expires_at: licenseData.expiresAt,
        max_invoices: this.getMaxInvoices(licenseData.licenseType),
        max_clients: this.getMaxClients(licenseData.licenseType),
        notes: licenseData.notes || null
      }

      const sql = `
        INSERT INTO licenses (
          company_id, license_key, license_type, status, expires_at,
          max_invoices, max_clients, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      AdminDatabaseService.run(sql, [
        license.company_id, license.license_key, license.license_type,
        license.status, license.expires_at, license.max_invoices,
        license.max_clients, license.notes
      ])

      const licenseId = AdminDatabaseService.getLastInsertId()
      
      // Return created license with company info
      return {
        id: licenseId,
        licenseKey: license.license_key,
        ...license
      }
    } catch (error) {
      console.error('❌ Error creating license:', error)
      throw error
    }
  }

  /**
   * Revoke a license
   * @param {number} licenseId - License ID
   * @returns {boolean} Success
   */
  static async revokeLicense(licenseId) {
    try {
      const sql = 'UPDATE licenses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      AdminDatabaseService.run(sql, ['REVOKED', licenseId])
      return true
    } catch (error) {
      console.error('❌ Error revoking license:', error)
      throw error
    }
  }

  /**
   * Generate a license key
   * @returns {string} License key
   */
  static generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) result += '-'
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Get max invoices for license type
   * @param {string} licenseType - License type
   * @returns {number} Max invoices
   */
  static getMaxInvoices(licenseType) {
    const limits = {
      'TRIAL': 10,
      'BASIC': 100,
      'PREMIUM': 500,
      'ENTERPRISE': -1 // Unlimited
    }
    return limits[licenseType] || 10
  }

  /**
   * Get max clients for license type
   * @param {string} licenseType - License type
   * @returns {number} Max clients
   */
  static getMaxClients(licenseType) {
    const limits = {
      'TRIAL': 5,
      'BASIC': 50,
      'PREMIUM': 200,
      'ENTERPRISE': -1 // Unlimited
    }
    return limits[licenseType] || 5
  }

  /**
   * Get license statistics
   * @returns {Object} Statistics
   */
  static async getStatistics() {
    try {
      const stats = {
        total: 0,
        active: 0,
        expired: 0,
        expiring: 0
      }

      const sql = 'SELECT status, expires_at FROM licenses'
      const licenses = AdminDatabaseService.queryAll(sql)
      
      stats.total = licenses.length
      
      const now = new Date()
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(now.getDate() + 30)

      licenses.forEach(license => {
        if (license.status === 'ACTIVE') {
          stats.active++
          
          if (license.expires_at) {
            const expiresAt = new Date(license.expires_at)
            if (expiresAt < now) {
              stats.expired++
            } else if (expiresAt < thirtyDaysFromNow) {
              stats.expiring++
            }
          }
        } else if (license.status === 'EXPIRED') {
          stats.expired++
        }
      })

      return stats
    } catch (error) {
      console.error('❌ Error getting license statistics:', error)
      return { total: 0, active: 0, expired: 0, expiring: 0 }
    }
  }
}

