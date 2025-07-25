import { AdminDatabaseService } from './AdminDatabaseService.js'
import { CredentialGenerator } from '../utils/CredentialGenerator.js'
import { Logger } from '../utils/Logger.js'

/**
 * Company Service - Manages company CRUD operations
 */
export class CompanyService {
  
  /**
   * Get all companies with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Array} List of companies
   */
  static async getCompanies(filters = {}) {
    try {
      let sql = `
        SELECT c.*, l.license_type, l.status as license_status, l.expires_at
        FROM companies c
        LEFT JOIN licenses l ON c.id = l.company_id
        WHERE 1=1
      `
      const params = []

      // Apply filters
      if (filters.status) {
        sql += ' AND c.status = ?'
        params.push(filters.status)
      }

      if (filters.search) {
        sql += ' AND (c.name LIKE ? OR c.email LIKE ?)'
        params.push(`%${filters.search}%`, `%${filters.search}%`)
      }

      if (filters.licenseType) {
        sql += ' AND l.license_type = ?'
        params.push(filters.licenseType)
      }

      sql += ' ORDER BY c.created_at DESC'

      const companies = AdminDatabaseService.queryAll(sql, params)
      
      // Calculate additional stats for each company
      return companies.map(company => ({
        ...company,
        invoiceCount: this.getCompanyInvoiceCount(company.id),
        revenue: this.getCompanyRevenue(company.id),
        lastActivity: this.getLastActivity(company.id)
      }))
    } catch (error) {
      console.error('❌ Error fetching companies:', error)
      throw error
    }
  }

  /**
   * Get a single company by ID
   * @param {number} id - Company ID
   * @returns {Object|null} Company data
   */
  static async getCompany(id) {
    try {
      const sql = `
        SELECT c.*, l.license_type, l.status as license_status, l.expires_at, l.license_key
        FROM companies c
        LEFT JOIN licenses l ON c.id = l.company_id
        WHERE c.id = ?
      `
      
      const companies = AdminDatabaseService.queryAll(sql, [id])
      
      if (companies && companies.length > 0) {
        const company = companies[0]
        return {
          ...company,
          invoiceCount: this.getCompanyInvoiceCount(id),
          revenue: this.getCompanyRevenue(id),
          lastActivity: this.getLastActivity(id)
        }
      }
      
      return null
    } catch (error) {
      console.error('❌ Error fetching company:', error)
      throw error
    }
  }

  /**
   * Create a new company
   * @param {Object} companyData - Company information
   * @returns {Object} Created company with credentials
   */
  static async createCompany(companyData) {
    try {
      Logger.info('Starting company creation', companyData)
      
      // Validate required fields (includes email uniqueness check)
      this.validateCompanyData(companyData)
      Logger.debug('Company data validation passed')

      // Get existing usernames to avoid duplicates
      const existingUsernames = this.getExistingUsernames()
      Logger.debug('Existing usernames retrieved', { count: existingUsernames.length })

      // Generate credentials
      const credentials = await CredentialGenerator.generateCredentials(
        companyData.name,
        existingUsernames,
        companyData.memorablePassword || false
      )
      Logger.debug('Credentials generated', { username: credentials.username })

      // Prepare company data
      const company = {
        name: companyData.name,
        email: companyData.email,
        phone: companyData.phone || null,
        address: companyData.address || null,
        city: companyData.city || null,
        postal_code: companyData.postal_code || null,
        country: companyData.country || 'Sénégal',
        username: credentials.username,
        password_hash: credentials.passwordHash,
        business_type: companyData.business_type || null,
        tax_number: companyData.tax_number || null,
        logo_url: companyData.logo_url || null,
        currency: companyData.currency || 'XOF',
        tax_rate: companyData.tax_rate || 18.0,
        invoice_prefix: companyData.invoice_prefix || 'INV',
        quote_prefix: companyData.quote_prefix || 'DEV',
        status: 'ACTIVE'
      }

      // Insert company
      const sql = `
        INSERT INTO companies (
          name, email, phone, address, city, postal_code, country,
          username, password_hash, business_type, tax_number, logo_url,
          currency, tax_rate, invoice_prefix, quote_prefix, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      Logger.debug('Inserting company into database', { sql, params: company.name })
      AdminDatabaseService.run(sql, [
        company.name, company.email, company.phone, company.address,
        company.city, company.postal_code, company.country,
        company.username, company.password_hash, company.business_type,
        company.tax_number, company.logo_url, company.currency,
        company.tax_rate, company.invoice_prefix, company.quote_prefix,
        company.status
      ])

      const companyId = AdminDatabaseService.getLastInsertId()
      Logger.debug('Company inserted', { companyId })
      
      if (!companyId) {
        throw new Error('Erreur lors de la création de l\'entreprise - ID non récupéré')
      }

      // Create default license
      Logger.debug('Creating default license', { companyId, licenseType: companyData.licenseType || 'TRIAL' })
      await this.createDefaultLicense(companyId, companyData.licenseType || 'TRIAL')

      // Log audit
      AdminDatabaseService.logAudit('companies', companyId, 'CREATE', null, company)

      // Return company with credentials (password will be shown only once)
      const createdCompany = await this.getCompany(companyId)
      Logger.success('Company created successfully', { companyId, name: createdCompany.name })
      
      return {
        ...createdCompany,
        credentials: {
          username: credentials.username,
          password: credentials.password // Plain text for display
        }
      }
    } catch (error) {
      Logger.error('Error creating company', { error: error.message, stack: error.stack })
      
      // Handle specific SQLite errors
      if (error.message && error.message.includes('UNIQUE constraint failed: companies.email')) {
        throw new Error('Cette adresse email est déjà utilisée')
      }
      
      throw error
    }
  }

  /**
   * Update a company
   * @param {number} id - Company ID
   * @param {Object} updates - Updated data
   * @returns {Object} Updated company
   */
  static async updateCompany(id, updates) {
    try {
      // Get current company data for audit
      const currentCompany = await this.getCompany(id)
      if (!currentCompany) {
        throw new Error('Company not found')
      }

      // Validate updates
      if (updates.email && updates.email !== currentCompany.email) {
        this.validateEmailForUpdate(updates.email, id)
      }

      // Prepare update fields
      const updateFields = []
      const params = []

      const allowedFields = [
        'name', 'email', 'phone', 'address', 'city', 'postal_code', 'country',
        'business_type', 'tax_number', 'logo_url', 'currency', 'tax_rate',
        'invoice_prefix', 'quote_prefix', 'status'
      ]

      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = ?`)
          params.push(updates[field])
        }
      })

      if (updateFields.length === 0) {
        return currentCompany
      }

      // Add updated_at
      updateFields.push('updated_at = CURRENT_TIMESTAMP')
      params.push(id)

      const sql = `UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`
      
      AdminDatabaseService.run(sql, params)

      // Log audit
      AdminDatabaseService.logAudit('companies', id, 'UPDATE', currentCompany, updates)

      return await this.getCompany(id)
    } catch (error) {
      console.error('❌ Error updating company:', error)
      throw error
    }
  }

  /**
   * Delete a company
   * @param {number} id - Company ID
   * @returns {boolean} Success status
   */
  static async deleteCompany(id) {
    try {
      // Get company data for audit
      const company = await this.getCompany(id)
      if (!company) {
        throw new Error('Company not found')
      }

      // Delete company (licenses will be deleted by CASCADE)
      const sql = 'DELETE FROM companies WHERE id = ?'
      AdminDatabaseService.run(sql, [id])

      // Log audit
      AdminDatabaseService.logAudit('companies', id, 'DELETE', company, null)

      return true
    } catch (error) {
      console.error('❌ Error deleting company:', error)
      throw error
    }
  }

  /**
   * Regenerate credentials for a company
   * @param {number} id - Company ID
   * @param {boolean} memorablePassword - Use memorable password
   * @returns {Object} New credentials
   */
  static async regenerateCredentials(id, memorablePassword = false) {
    try {
      const company = await this.getCompany(id)
      if (!company) {
        throw new Error('Company not found')
      }

      // Generate new password (keep same username)
      const newPassword = await CredentialGenerator.regeneratePassword(memorablePassword)

      // Update password hash
      const sql = 'UPDATE companies SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      AdminDatabaseService.run(sql, [newPassword.passwordHash, id])

      // Log audit
      AdminDatabaseService.logAudit('companies', id, 'REGENERATE_PASSWORD', null, {
        action: 'password_regenerated',
        timestamp: newPassword.regeneratedAt
      })

      return {
        username: company.username,
        password: newPassword.password // Plain text for display
      }
    } catch (error) {
      console.error('❌ Error regenerating credentials:', error)
      throw error
    }
  }

  /**
   * Suspend a company
   * @param {number} id - Company ID
   * @returns {Object} Updated company
   */
  static async suspendCompany(id) {
    try {
      const company = await this.getCompany(id)
      if (!company) {
        throw new Error('Entreprise non trouvée')
      }

      if (company.status === 'SUSPENDED') {
        throw new Error('Cette entreprise est déjà suspendue')
      }

      // Update company status
      const sql = 'UPDATE companies SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      AdminDatabaseService.run(sql, ['SUSPENDED', id])

      // Update license status
      const licenseSql = 'UPDATE licenses SET status = ? WHERE company_id = ?'
      AdminDatabaseService.run(licenseSql, ['SUSPENDED', id])

      // Log audit
      AdminDatabaseService.logAudit('companies', id, 'SUSPEND', 
        { status: company.status }, 
        { status: 'SUSPENDED' }
      )

      return await this.getCompany(id)
    } catch (error) {
      console.error('❌ Error suspending company:', error)
      throw error
    }
  }

  /**
   * Activate a company
   * @param {number} id - Company ID
   * @returns {Object} Updated company
   */
  static async activateCompany(id) {
    try {
      const company = await this.getCompany(id)
      if (!company) {
        throw new Error('Entreprise non trouvée')
      }

      if (company.status === 'ACTIVE') {
        throw new Error('Cette entreprise est déjà active')
      }

      // Update company status
      const sql = 'UPDATE companies SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      AdminDatabaseService.run(sql, ['ACTIVE', id])

      // Update license status
      const licenseSql = 'UPDATE licenses SET status = ? WHERE company_id = ?'
      AdminDatabaseService.run(licenseSql, ['ACTIVE', id])

      // Log audit
      AdminDatabaseService.logAudit('companies', id, 'ACTIVATE', 
        { status: company.status }, 
        { status: 'ACTIVE' }
      )

      return await this.getCompany(id)
    } catch (error) {
      console.error('❌ Error activating company:', error)
      throw error
    }
  }

  /**
   * Get company statistics
   * @returns {Object} Statistics
   */
  static async getStatistics() {
    try {
      const stats = {
        totalCompanies: 0,
        activeCompanies: 0,
        suspendedCompanies: 0,
        totalRevenue: 0,
        totalInvoices: 0,
        averageRevenuePerCompany: 0
      }

      // Get company counts
      const companyCountsResult = AdminDatabaseService.queryAll(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended
        FROM companies
      `)

      const companyCounts = companyCountsResult.length > 0 ? companyCountsResult[0] : {}
      stats.totalCompanies = companyCounts.total || 0
      stats.activeCompanies = companyCounts.active || 0
      stats.suspendedCompanies = companyCounts.suspended || 0

      // Calculate average revenue (placeholder - would need actual invoice data)
      if (stats.totalCompanies > 0) {
        stats.averageRevenuePerCompany = stats.totalRevenue / stats.totalCompanies
      }

      return stats
    } catch (error) {
      console.error('❌ Error getting statistics:', error)
      throw error
    }
  }

  // Helper methods
  static validateCompanyData(data) {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Le nom de l\'entreprise est requis (minimum 2 caractères)')
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      throw new Error('Une adresse email valide est requise')
    }

    // Check if email already exists using queryAll
    const existingCompanies = AdminDatabaseService.queryAll(
      'SELECT id FROM companies WHERE email = ?',
      [data.email]
    )
    
    if (existingCompanies && existingCompanies.length > 0) {
      throw new Error('Cette adresse email est déjà utilisée')
    }
  }

  static validateEmail(email) {
    const existingCompanies = AdminDatabaseService.queryAll(
      'SELECT id FROM companies WHERE email = ?',
      [email]
    )
    
    if (existingCompanies && existingCompanies.length > 0) {
      throw new Error('Cette adresse email est déjà utilisée')
    }
  }

  static validateEmailForUpdate(email, excludeId) {
    const existingCompanies = AdminDatabaseService.queryAll(
      'SELECT id FROM companies WHERE email = ? AND id != ?',
      [email, excludeId]
    )
    
    if (existingCompanies && existingCompanies.length > 0) {
      throw new Error('Cette adresse email est déjà utilisée')
    }
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static getExistingUsernames() {
    try {
      const result = AdminDatabaseService.queryAll('SELECT username FROM companies')
      return result.map(row => row.username)
    } catch (error) {
      console.error('❌ Error getting existing usernames:', error)
      return []
    }
  }

  static async createDefaultLicense(companyId, licenseType = 'TRIAL') {
    const licenseKey = this.generateLicenseKey()
    const expiresAt = this.calculateExpirationDate(licenseType)
    const limits = this.getLicenseLimits(licenseType)

    const sql = `
      INSERT INTO licenses (
        company_id, license_key, license_type, expires_at,
        max_invoices, max_clients, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
    `

    AdminDatabaseService.run(sql, [
      companyId, licenseKey, licenseType, expiresAt,
      limits.maxInvoices, limits.maxClients
    ])
  }

  static generateLicenseKey() {
    const prefix = 'SAMA'
    const year = new Date().getFullYear()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}-${year}-${random}`
  }

  static calculateExpirationDate(licenseType) {
    const now = new Date()
    switch (licenseType) {
      case 'TRIAL':
        now.setDate(now.getDate() + 30) // 30 days
        break
      case 'BASIC':
        now.setMonth(now.getMonth() + 1) // 1 month
        break
      case 'PREMIUM':
        now.setFullYear(now.getFullYear() + 1) // 1 year
        break
      default:
        now.setDate(now.getDate() + 30)
    }
    return now.toISOString()
  }

  static getLicenseLimits(licenseType) {
    const limits = {
      TRIAL: { maxInvoices: 10, maxClients: 5 },
      BASIC: { maxInvoices: 100, maxClients: 50 },
      PREMIUM: { maxInvoices: 1000, maxClients: 500 }
    }
    return limits[licenseType] || limits.TRIAL
  }

  // Placeholder methods for invoice/revenue data (would integrate with actual data)
  static getCompanyInvoiceCount(companyId) {
    // TODO: Integrate with actual invoice data
    return Math.floor(Math.random() * 100)
  }

  static getCompanyRevenue(companyId) {
    // TODO: Integrate with actual revenue data
    return Math.floor(Math.random() * 500000)
  }

  static getLastActivity(companyId) {
    // TODO: Integrate with actual activity data
    const dates = ['2024-01-20', '2024-01-18', '2024-01-15', '2024-01-10']
    return dates[Math.floor(Math.random() * dates.length)]
  }
}
