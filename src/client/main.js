import '../shared/styles/main.css'
import { DatabaseService } from '../shared/services/DatabaseService.js'

class SamaFactureApp {
  constructor() {
    this.currentPage = null
    this.isInitialized = false
  }

  async init() {
    try {
      // Show loading screen
      this.showLoadingScreen()

      // Initialize database
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
        
        // Update active nav item
        document.querySelectorAll('[data-page]').forEach(link => {
          link.classList.remove('bg-blue-100', 'text-blue-700', 'border-blue-500')
          link.classList.add('text-gray-600', 'hover:text-gray-900')
        })
        navLink.classList.add('bg-blue-100', 'text-blue-700', 'border-blue-500')
        navLink.classList.remove('text-gray-600', 'hover:text-gray-900')
      }
    })
  }

  async loadPage(pageName) {
    const mainContent = document.getElementById('main-content')
    if (!mainContent) return

    try {
      let pageInstance = null

      switch (pageName) {
        case 'dashboard':
          const { Dashboard } = await import('./pages/Dashboard.js')
          pageInstance = new Dashboard()
          break
        case 'clients':
          const { ClientList } = await import('./pages/clients/ClientList.js')
          pageInstance = new ClientList()
          break
        case 'invoices':
          const { InvoiceList } = await import('./pages/invoices/InvoiceList.js')
          pageInstance = new InvoiceList()
          break
        case 'quotes':
          const { QuoteList } = await import('./pages/quotes/QuoteList.js')
          pageInstance = new QuoteList()
          break
        case 'products':
          const { ProductList } = await import('./pages/products/ProductList.js')
          pageInstance = new ProductList()
          break
        case 'license':
          // Simple license page for now
          mainContent.innerHTML = `
            <div class="p-6">
              <h1 class="text-2xl font-bold text-gray-900 mb-4">Licence</h1>
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-green-800">✅ Application activée - Version complète</p>
              </div>
            </div>
          `
          return
        default:
          mainContent.innerHTML = `
            <div class="p-6">
              <h1 class="text-2xl font-bold text-gray-900 mb-4">Page non trouvée</h1>
              <p class="text-gray-600">La page demandée n'existe pas.</p>
            </div>
          `
          return
      }

      if (pageInstance && pageInstance.render) {
        // Clean up previous page
        if (this.currentPage && this.currentPage.destroy) {
          this.currentPage.destroy()
        }

        // Render new page
        const pageElement = await pageInstance.render()
        mainContent.innerHTML = ''
        mainContent.appendChild(pageElement)
        this.currentPage = pageInstance
      }

    } catch (error) {
      console.error(`❌ Failed to load page ${pageName}:`, error)
      mainContent.innerHTML = `
        <div class="p-6">
          <h1 class="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p class="text-gray-600">Impossible de charger la page: ${error.message}</p>
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

// Global navigation function
window.navigateToPage = async (pageName, options = {}) => {
  if (window.samaFactureApp) {
    await window.samaFactureApp.loadPage(pageName, options)
  }
}

// Global function to show modal
window.showModal = (modalId, data = {}) => {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.remove('hidden')
    modal.classList.add('flex')
    
    // Populate modal with data if provided
    if (data && Object.keys(data).length > 0) {
      Object.keys(data).forEach(key => {
        const element = modal.querySelector(`[data-field="${key}"]`)
        if (element) {
          element.value = data[key]
        }
      })
    }
  }
}

// Global function to hide modal
window.hideModal = (modalId) => {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
  }
}

// Global action functions
window.editItem = (type, id) => {
  console.log(`Editing ${type} with ID: ${id}`)
  // For now, just show the appropriate modal
  switch (type) {
    case 'invoice':
      window.showModal('invoice-modal')
      break
    case 'quote':
      window.showModal('quote-modal')
      break
    case 'client':
      window.showModal('client-modal')
      break
  }
}

window.viewItem = (type, id) => {
  console.log(`Viewing ${type} with ID: ${id}`)
  alert(`Affichage de ${type} #${id} - Fonctionnalité en développement`)
}

window.duplicateItem = (type, id) => {
  console.log(`Duplicating ${type} with ID: ${id}`)
  alert(`Duplication de ${type} #${id} - Fonctionnalité en développement`)
}

window.deleteItem = (type, id) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer cet élément ?`)) {
    console.log(`Deleting ${type} with ID: ${id}`)
    alert(`Suppression de ${type} #${id} - Fonctionnalité en développement`)
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new SamaFactureApp()
  window.samaFactureApp = app
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
