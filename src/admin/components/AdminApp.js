import { Router } from '../../shared/utils/Router.js'
import { AdminNavigation } from './AdminNavigation.js'
import { I18nService } from '../../shared/services/I18nService.js'
import { AdminDatabaseService } from '../services/AdminDatabaseService.js'

/**
 * Admin App Component - Manages the admin dashboard application
 */
export class AdminApp {
  constructor() {
    this.router = null
    this.navigation = null
  }

  async init() {
    // Initialize database first
    console.log('🔄 Initializing admin database...')
    await AdminDatabaseService.init()
    
    // Insert test data if database is empty
    await this.ensureTestData()

    // Initialize router
    this.router = new Router('admin-main-content')
    this.setupRoutes()

    // Initialize navigation
    this.navigation = new AdminNavigation()
    await this.navigation.init()

    // Start the router
    this.router.start()

    console.log('✅ Admin App initialized')
  }

  async ensureTestData() {
    try {
      // Check if we have any companies
      const companies = AdminDatabaseService.queryAll('SELECT COUNT(*) as count FROM companies')
      const companyCount = companies[0]?.count || 0
      
      if (companyCount === 0) {
        console.log('🔄 Inserting test data...')
        await this.insertTestData()
        console.log('✅ Test data inserted')
      } else {
        console.log(`✅ Database has ${companyCount} companies`)
      }
    } catch (error) {
      console.error('❌ Error checking/inserting test data:', error)
    }
  }

  async insertTestData() {
    // Insert test companies
    const testCompanies = [
      {
        name: 'BBS Invest',
        email: 'contact@bbsinvest.sn',
        phone: '+221 33 123 45 67',
        address: '123 Avenue Bourguiba',
        city: 'Dakar',
        postal_code: '12000',
        country: 'Sénégal',
        username: 'bbsinvest',
        password_hash: '$2b$10$rQJ8vQJ8vQJ8vQJ8vQJ8vO', // Hash of 'password123'
        business_type: 'Investissement',
        currency: 'XOF',
        tax_rate: 18.0,
        status: 'ACTIVE'
      },
      {
        name: 'KSF Solutions',
        email: 'info@ksfsolutions.sn',
        phone: '+221 33 234 56 78',
        address: '456 Rue de la République',
        city: 'Dakar',
        postal_code: '12001',
        country: 'Sénégal',
        username: 'ksfsolutions',
        password_hash: '$2b$10$rQJ8vQJ8vQJ8vQJ8vQJ8vO',
        business_type: 'Services IT',
        currency: 'XOF',
        tax_rate: 18.0,
        status: 'ACTIVE'
      },
      {
        name: 'KSF Trading',
        email: 'trading@ksf.sn',
        phone: '+221 33 345 67 89',
        address: '789 Boulevard du Centenaire',
        city: 'Dakar',
        postal_code: '12002',
        country: 'Sénégal',
        username: 'ksftrading',
        password_hash: '$2b$10$rQJ8vQJ8vQJ8vQJ8vQJ8vO',
        business_type: 'Commerce',
        currency: 'XOF',
        tax_rate: 18.0,
        status: 'ACTIVE'
      },
      {
        name: 'KSF Consulting',
        email: 'consulting@ksf.sn',
        phone: '+221 33 456 78 90',
        address: '321 Avenue Cheikh Anta Diop',
        city: 'Dakar',
        postal_code: '12003',
        country: 'Sénégal',
        username: 'ksfconsulting',
        password_hash: '$2b$10$rQJ8vQJ8vQJ8vQJ8vQJ8vO',
        business_type: 'Conseil',
        currency: 'XOF',
        tax_rate: 18.0,
        status: 'SUSPENDED'
      }
    ]

    for (const company of testCompanies) {
      const sql = `
        INSERT INTO companies (
          name, email, phone, address, city, postal_code, country,
          username, password_hash, business_type, currency, tax_rate, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      
      AdminDatabaseService.run(sql, [
        company.name, company.email, company.phone, company.address,
        company.city, company.postal_code, company.country,
        company.username, company.password_hash, company.business_type,
        company.currency, company.tax_rate, company.status
      ])

      const companyId = AdminDatabaseService.getLastInsertId()
      
      // Create a license for each company
      const licenseTypes = ['TRIAL', 'BASIC', 'PREMIUM', 'ENTERPRISE']
      const licenseType = licenseTypes[Math.floor(Math.random() * licenseTypes.length)]
      
      const licenseKey = this.generateLicenseKey()
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 3) // 3 months from now
      
      const licenseSql = `
        INSERT INTO licenses (
          company_id, license_key, license_type, status, expires_at,
          max_invoices, max_clients
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      
      AdminDatabaseService.run(licenseSql, [
        companyId, licenseKey, licenseType, 'ACTIVE', expiresAt.toISOString(),
        licenseType === 'TRIAL' ? 10 : licenseType === 'BASIC' ? 100 : licenseType === 'PREMIUM' ? 500 : -1,
        licenseType === 'TRIAL' ? 5 : licenseType === 'BASIC' ? 50 : licenseType === 'PREMIUM' ? 200 : -1
      ])
    }
  }

  generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) result += '-'
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  setupRoutes() {
    // Admin Dashboard
    this.router.addRoute('/', async () => {
      const { AdminDashboard } = await import('../pages/AdminDashboard.js')
      return new AdminDashboard()
    })

    // Company Management
    this.router.addRoute('/companies', async () => {
      const { CompanyManagement } = await import('../pages/CompanyManagement.js')
      return new CompanyManagement()
    })

    // License Management
    this.router.addRoute('/licenses', async () => {
      const { LicenseManagement } = await import('../pages/LicenseManagement.js')
      return new LicenseManagement()
    })

    // Global Statistics
    this.router.addRoute('/stats', async () => {
      const { GlobalStats } = await import('../pages/GlobalStats.js')
      return new GlobalStats()
    })

    // System Settings
    this.router.addRoute('/settings', async () => {
      const { SystemSettings } = await import('../pages/SystemSettings.js')
      return new SystemSettings()
    })

    // 404 Not Found
    this.router.setNotFoundHandler(async () => {
      const { AdminNotFound } = await import('../pages/AdminNotFound.js')
      return new AdminNotFound()
    })
  }
}
