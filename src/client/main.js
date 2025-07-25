import '../shared/styles/main.css'
import { DatabaseService } from '../shared/services/DatabaseService.js'
import { PDFService } from './services/PDFService.js'
import { ThemeService } from '../shared/services/ThemeService.js'
import { NotificationService } from '../shared/services/NotificationService.js'
import { OfflineManager } from './services/OfflineManager.js'

class SamaFactureApp {
  constructor() {
    this.currentPage = null
    this.isInitialized = false
    this.offlineManager = null
  }

  async init() {
    try {
      // Show loading screen
      this.showLoadingScreen()

      // Initialize theme service
      ThemeService.init()

      // Initialize notification service
      NotificationService.init()

      // Initialize offline manager (handles service worker, network detection, sync)
      this.offlineManager = new OfflineManager()
      await this.offlineManager.init()

      // Initialize database (with IndexedDB and migration)
      await DatabaseService.init()

      // Setup navigation
      this.setupNavigation()

      // Load initial page
      await this.loadPage('dashboard')

      // Hide loading screen and show app
      this.hideLoadingScreen()
      this.showApp()

      this.isInitialized = true
      console.log('✅ SamaFacture PWA initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize SamaFacture:', error)
      this.showErrorScreen(error)
    }
  }

  setupNavigation() {
    // Setup navigation click handlers
    document.addEventListener('click', async (e) => {
      const navLink = e.target.closest('[data-page]')
      if (navLink) {
        e.preventDefault()
        const page = navLink.dataset.page
        await this.loadPage(page)
        
        // Update active nav state
        document.querySelectorAll('[data-page]').forEach(link => {
          link.classList.remove('bg-blue-100', 'text-blue-700', 'dark:bg-blue-900', 'dark:text-blue-200')
          link.classList.add('text-gray-700', 'dark:text-gray-300')
        })
        navLink.classList.add('bg-blue-100', 'text-blue-700', 'dark:bg-blue-900', 'dark:text-blue-200')
        navLink.classList.remove('text-gray-700', 'dark:text-gray-300')
      }
    })

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        this.loadPage(e.state.page, false)
      }
    })
  }

  async loadPage(pageName, pushState = true) {
    try {
      // Update URL if needed
      if (pushState) {
        history.pushState({ page: pageName }, '', `#${pageName}`)
      }

      // Show loading state
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.innerHTML = '<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>'
      }

      // Load page module
      let pageModule
      switch (pageName) {
        case 'dashboard':
          pageModule = await import('./pages/Dashboard.js')
          break
        case 'clients':
          pageModule = await import('./pages/Clients.js')
          break
        case 'products':
          pageModule = await import('./pages/Products.js')
          break
        case 'invoices':
          pageModule = await import('./pages/Invoices.js')
          break
        case 'quotes':
          pageModule = await import('./pages/Quotes.js')
          break
        case 'expenses':
          pageModule = await import('./pages/Expenses.js')
          break
        case 'settings':
          pageModule = await import('./pages/Settings.js')
          break
        default:
          throw new Error(`Page "${pageName}" not found`)
      }

      // Initialize and render page
      const page = new pageModule.default()
      await page.render()
      
      this.currentPage = page
      console.log(`✅ Loaded page: ${pageName}`)

    } catch (error) {
      console.error(`❌ Failed to load page "${pageName}":`, error)
      this.showPageError(error)
    }
  }

  showPageError(error) {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="text-center py-12">
          <div class="text-red-500 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erreur de chargement</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-4">${error.message}</p>
          <button onclick="location.reload()" class="btn btn-primary">
            Recharger la page
          </button>
        </div>
      `
    }
  }

  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden')
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen')
    if (loadingScreen) {
      loadingScreen.classList.add('hidden')
    }
  }

  showApp() {
    const app = document.getElementById('app')
    if (app) {
      app.classList.remove('hidden')
    }
  }

  showErrorScreen(error) {
    const loadingScreen = document.getElementById('loading-screen')
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="text-center">
          <div class="text-red-500 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erreur d'initialisation</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-4">${error.message}</p>
          <button onclick="location.reload()" class="btn btn-primary">
            Recharger l'application
          </button>
        </div>
      `
    }
  }
}

// Global navigation function
window.navigateTo = async (page) => {
  if (window.app && window.app.isInitialized) {
    await window.app.loadPage(page)
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  window.app = new SamaFactureApp()
  await window.app.init()
})

// Handle page visibility changes for better offline experience
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.app?.offlineManager) {
    // Page became visible, check for updates
    console.log('🔍 Page visible, checking for updates...')
  }
})

export default SamaFactureApp
