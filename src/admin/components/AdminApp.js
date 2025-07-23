import { Router } from '../../shared/utils/Router.js'
import { AdminNavigation } from './AdminNavigation.js'
import { I18nService } from '../../shared/services/I18nService.js'

/**
 * Admin App Component - Manages the admin dashboard application
 */
export class AdminApp {
  constructor() {
    this.router = null
    this.navigation = null
  }

  async init() {
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

