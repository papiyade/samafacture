import '../shared/styles/main.css'
import { App } from './components/App.js'
import { DatabaseService } from '../shared/services/DatabaseService.js'
import { LicenseService } from '../shared/services/LicenseService.js'
import { ThemeService } from '../shared/services/ThemeService.js'
import { I18nService } from '../shared/services/I18nService.js'

class SamaFactureApp {
  constructor() {
    this.app = null
    this.isInitialized = false
  }

  async init() {
    try {
      // Show loading screen
      this.showLoadingScreen()

      // Initialize core services
      await this.initializeServices()

      // Check license status
      const licenseStatus = await LicenseService.checkLicense()
      if (!licenseStatus.isValid && !licenseStatus.isTrial) {
        this.redirectToLicenseActivation()
        return
      }

      // Initialize database
      await DatabaseService.init()

      // Initialize the main app
      this.app = new App()
      await this.app.init()

      // Hide loading screen and show app
      this.hideLoadingScreen()
      this.showApp()

      // Register service worker for PWA
      this.registerServiceWorker()

      // Setup offline detection
      this.setupOfflineDetection()

      this.isInitialized = true
      console.log('✅ SamaFacture PWA initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize SamaFacture:', error)
      this.showErrorScreen(error)
    }
  }

  async initializeServices() {
    // Initialize theme service
    ThemeService.init()

    // Initialize i18n service
    await I18nService.init('fr')

    console.log('✅ Core services initialized')
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

  redirectToLicenseActivation() {
    // This will be implemented when we create the license activation page
    console.log('Redirecting to license activation...')
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('✅ Service Worker registered:', registration)
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }
  }

  setupOfflineDetection() {
    const offlineIndicator = document.getElementById('offline-indicator')
    
    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        offlineIndicator?.classList.add('hidden')
      } else {
        offlineIndicator?.classList.remove('hidden')
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Initial check
    updateOnlineStatus()
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new SamaFactureApp()
  app.init()
})

// Handle app installation prompt
let deferredPrompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  
  // Show install button or banner
  console.log('💡 App can be installed')
})

// Handle successful app installation
window.addEventListener('appinstalled', () => {
  console.log('✅ App installed successfully')
  deferredPrompt = null
})

