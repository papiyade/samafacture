import '../shared/styles/main.css'
import { AdminApp } from './components/AdminApp.js'
import { ThemeService } from '../shared/services/ThemeService.js'
import { I18nService } from '../shared/services/I18nService.js'

class SamaFactureAdmin {
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

      // TODO: Add admin authentication check here
      
      // Initialize the admin app
      this.app = new AdminApp()
      await this.app.init()

      // Hide loading screen and show app
      this.hideLoadingScreen()
      this.showApp()

      this.isInitialized = true
      console.log('✅ SamaFacture Admin initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize SamaFacture Admin:', error)
      this.showErrorScreen(error)
    }
  }

  async initializeServices() {
    // Initialize theme service
    ThemeService.init()

    // Initialize i18n service
    await I18nService.init('fr')

    console.log('✅ Admin core services initialized')
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
    const app = document.getElementById('admin-app')
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
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erreur d'initialisation Admin</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-4">${error.message}</p>
          <button onclick="location.reload()" class="btn btn-primary">
            Recharger le dashboard
          </button>
        </div>
      `
    }
  }
}

// Initialize the admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const adminApp = new SamaFactureAdmin()
  adminApp.init()
})

