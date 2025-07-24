import '../shared/styles/main.css'
import { DatabaseService } from '../shared/services/DatabaseService.js'
import { PrintService } from './services/PDFService.js'
import { ThemeService } from '../shared/services/ThemeService.js'

class SamaFactureApp {
  constructor() {
    this.currentPage = null
    this.isInitialized = false
  }

  async init() {
    try {
      // Show loading screen
      this.showLoadingScreen()

      // Initialize theme service
      ThemeService.init()

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
        case 'settings':
          const { Settings } = await import('./pages/Settings.js')
          pageInstance = new Settings()
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

// Global function to show modal (will be enhanced later)
// This is replaced by the enhanced version below

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
  
  switch (type) {
    case 'invoice':
      const invoice = DatabaseService.getInvoice(id)
      if (invoice) {
        window.showModal('invoice-modal', invoice)
      }
      break
    case 'quote':
      const quote = DatabaseService.getQuotes().find(q => q.id === id)
      if (quote) {
        window.showModal('quote-modal', quote)
      }
      break
    case 'client':
      const client = DatabaseService.getClient(id)
      if (client) {
        window.showModal('client-modal', client)
      }
      break
  }
}

window.viewItem = (type, id) => {
  console.log(`Viewing ${type} with ID: ${id}`)
  
  switch (type) {
    case 'invoice':
      const invoice = DatabaseService.getInvoice(id)
      if (invoice) {
        window.showInvoiceDetails(invoice)
      }
      break
    case 'quote':
      const quote = DatabaseService.getQuotes().find(q => q.id === id)
      if (quote) {
        window.showQuoteDetails(quote)
      }
      break
    case 'client':
      const client = DatabaseService.getClient(id)
      if (client) {
        window.showClientDetails(client)
      }
      break
  }
}

window.duplicateItem = (type, id) => {
  console.log(`Duplicating ${type} with ID: ${id}`)
  
  switch (type) {
    case 'invoice':
      const invoice = DatabaseService.getInvoice(id)
      if (invoice) {
        const duplicatedInvoice = { ...invoice }
        delete duplicatedInvoice.id
        delete duplicatedInvoice.number
        duplicatedInvoice.status = 'draft'
        duplicatedInvoice.date = new Date().toISOString().split('T')[0]
        window.showModal('invoice-modal', duplicatedInvoice)
      }
      break
    case 'quote':
      const quote = DatabaseService.getQuotes().find(q => q.id === id)
      if (quote) {
        const duplicatedQuote = { ...quote }
        delete duplicatedQuote.id
        delete duplicatedQuote.number
        duplicatedQuote.status = 'draft'
        duplicatedQuote.date = new Date().toISOString().split('T')[0]
        window.showModal('quote-modal', duplicatedQuote)
      }
      break
    case 'client':
      const client = DatabaseService.getClient(id)
      if (client) {
        const duplicatedClient = { ...client }
        delete duplicatedClient.id
        duplicatedClient.name = `${client.name} (Copie)`
        duplicatedClient.email = ''
        window.showModal('client-modal', duplicatedClient)
      }
      break
  }
}

window.deleteItem = (type, id) => {
  let itemName = ''
  let confirmMessage = ''
  
  switch (type) {
    case 'invoice':
      const invoice = DatabaseService.getInvoice(id)
      itemName = invoice ? invoice.number : `Facture #${id}`
      confirmMessage = `Êtes-vous sûr de vouloir supprimer la facture ${itemName} ?`
      break
    case 'quote':
      const quote = DatabaseService.getQuotes().find(q => q.id === id)
      itemName = quote ? quote.number : `Devis #${id}`
      confirmMessage = `Êtes-vous sûr de vouloir supprimer le devis ${itemName} ?`
      break
    case 'client':
      const client = DatabaseService.getClient(id)
      itemName = client ? client.name : `Client #${id}`
      confirmMessage = `Êtes-vous sûr de vouloir supprimer le client ${itemName} ?`
      break
  }
  
  if (confirm(confirmMessage)) {
    try {
      let success = false
      switch (type) {
        case 'invoice':
          success = DatabaseService.deleteInvoice(id)
          break
        case 'quote':
          success = DatabaseService.deleteQuote(id)
          break
        case 'client':
          success = DatabaseService.deleteClient(id)
          break
      }
      
      if (success) {
        window.showNotification(`${itemName} supprimé avec succès`, 'success')
        window.refreshCurrentView()
      } else {
        window.showNotification(`Erreur lors de la suppression de ${itemName}`, 'error')
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error)
      window.showNotification(`Erreur lors de la suppression de ${itemName}`, 'error')
    }
  }
}

// Notification system
window.showNotification = (message, type = 'info') => {
  const container = document.getElementById('notifications-container')
  if (!container) return
  
  const notification = document.createElement('div')
  notification.className = `mb-4 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`
  
  const colors = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  }
  
  notification.className += ` ${colors[type] || colors.info}`
  notification.innerHTML = `
    <div class="flex items-center justify-between">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `
  
  container.appendChild(notification)
  
  // Animate in
  setTimeout(() => {
    notification.classList.remove('translate-x-full')
  }, 100)
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.classList.add('translate-x-full')
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove()
      }
    }, 300)
  }, 5000)
}

// Refresh current view
window.refreshCurrentView = () => {
  if (window.samaFactureApp && window.samaFactureApp.currentPage) {
    const currentPage = window.samaFactureApp.currentPage
    
    // Try different methods to refresh the page
    if (currentPage.loadClients && typeof currentPage.loadClients === 'function') {
      currentPage.loadClients()
      currentPage.filterClients()
      currentPage.renderTable()
    } else if (currentPage.loadInvoices && typeof currentPage.loadInvoices === 'function') {
      currentPage.loadInvoices()
      currentPage.filterInvoices()
      currentPage.renderTable()
    } else if (currentPage.loadQuotes && typeof currentPage.loadQuotes === 'function') {
      currentPage.loadQuotes()
      currentPage.filterQuotes()
      currentPage.renderTable()
    } else if (currentPage.loadData && typeof currentPage.loadData === 'function') {
      currentPage.loadData()
    }
    
    // Try to render if method exists
    if (currentPage.render && typeof currentPage.render === 'function') {
      currentPage.render()
    }
  }
}

// Detail view functions
window.showClientDetails = (client) => {
  const invoices = DatabaseService.getInvoices().filter(inv => inv.client_id === client.id)
  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)
  
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center'
  modal.innerHTML = `
    <div class="relative bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
      <div class="flex items-center justify-between p-6 border-b">
        <h3 class="text-lg font-medium text-gray-900">Détails du client</h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Nom</label>
            <p class="mt-1 text-sm text-gray-900">${client.name || 'Non renseigné'}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <p class="mt-1 text-sm text-gray-900">${client.email || 'Non renseigné'}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Téléphone</label>
            <p class="mt-1 text-sm text-gray-900">${client.phone || 'Non renseigné'}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Entreprise</label>
            <p class="mt-1 text-sm text-gray-900">${client.company || 'Non renseigné'}</p>
          </div>
        </div>
        <div class="border-t pt-4">
          <h4 class="font-medium text-gray-900 mb-2">Statistiques</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Nombre de factures</label>
              <p class="mt-1 text-lg font-semibold text-blue-600">${invoices.length}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Montant total</label>
              <p class="mt-1 text-lg font-semibold text-green-600">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(totalAmount)}</p>
            </div>
          </div>
        </div>
        <div class="border-t pt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
          <p class="text-sm text-gray-900">${client.address || 'Non renseignée'}</p>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
}

// Old functions removed - replaced by enhanced versions with PDF buttons below

// Form validation functions
window.validateClientForm = (formData) => {
  const errors = {}
  
  // Validate name
  if (!formData.name || formData.name.trim().length < 2) {
    errors.name = 'Le nom doit contenir au moins 2 caractères'
  }
  
  // Validate email
  if (!formData.email || formData.email.trim() === '') {
    errors.email = 'L\'email est obligatoire'
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Format d\'email invalide'
    }
  }
  
  // Validate phone (optional but if provided, should be valid)
  if (formData.phone && formData.phone.trim() !== '') {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/
    if (!phoneRegex.test(formData.phone)) {
      errors.phone = 'Format de téléphone invalide'
    }
  }
  
  return errors
}

window.showFormErrors = (errors, formPrefix = 'client') => {
  // Clear previous errors
  document.querySelectorAll(`[id^="${formPrefix}-"][id$="-error"]`).forEach(errorDiv => {
    errorDiv.classList.add('hidden')
    errorDiv.textContent = ''
  })
  
  // Show new errors
  Object.keys(errors).forEach(field => {
    const errorDiv = document.getElementById(`${formPrefix}-${field}-error`)
    const inputField = document.getElementById(`${formPrefix}-${field}`)
    
    if (errorDiv && inputField) {
      errorDiv.textContent = errors[field]
      errorDiv.classList.remove('hidden')
      inputField.classList.add('border-red-500')
      inputField.classList.remove('border-gray-300')
    }
  })
}

window.clearFormErrors = (formPrefix = 'client') => {
  document.querySelectorAll(`[id^="${formPrefix}-"][id$="-error"]`).forEach(errorDiv => {
    errorDiv.classList.add('hidden')
    errorDiv.textContent = ''
  })
  
  document.querySelectorAll(`[id^="${formPrefix}-"]`).forEach(input => {
    if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
      input.classList.remove('border-red-500')
      input.classList.add('border-gray-300')
    }
  })
}

// Client form handling
window.setupClientForm = () => {
  const form = document.getElementById('client-form')
  if (!form) return
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const submitBtn = document.getElementById('client-submit-btn')
    const originalText = submitBtn.textContent
    
    try {
      // Show loading state
      submitBtn.disabled = true
      submitBtn.textContent = 'Enregistrement...'
      
      // Clear previous errors
      window.clearFormErrors('client')
      
      // Get form data
      const formData = new FormData(form)
      const clientData = {
        name: formData.get('name') || document.getElementById('client-name').value,
        email: formData.get('email') || document.getElementById('client-email').value,
        phone: formData.get('phone') || document.getElementById('client-phone').value,
        company: formData.get('company') || document.getElementById('client-company').value,
        address: formData.get('address') || document.getElementById('client-address').value
      }
      
      // Validate form
      const errors = window.validateClientForm(clientData)
      if (Object.keys(errors).length > 0) {
        window.showFormErrors(errors, 'client')
        return
      }
      
      // Check if editing existing client
      const modal = document.getElementById('client-modal')
      const isEditing = modal.dataset.editingId
      
      let result
      if (isEditing) {
        // Update existing client
        result = DatabaseService.updateClient(parseInt(isEditing), clientData)
        if (result) {
          window.showNotification('Client modifié avec succès', 'success')
        }
      } else {
        // Create new client
        result = DatabaseService.addClient(clientData)
        if (result) {
          window.showNotification('Client créé avec succès', 'success')
        }
      }
      
      if (result) {
        // Close modal and refresh view
        window.hideModal('client-modal')
        window.refreshCurrentView()
        form.reset()
        delete modal.dataset.editingId
      } else {
        window.showNotification('Erreur lors de l\'enregistrement du client', 'error')
      }
      
    } catch (error) {
      console.error('Error saving client:', error)
      window.showNotification('Erreur lors de l\'enregistrement du client', 'error')
    } finally {
      // Restore button state
      submitBtn.disabled = false
      submitBtn.textContent = originalText
    }
  })
}

// Enhanced showModal function to handle form data
window.showModal = (modalId, data = {}) => {
  const modal = document.getElementById(modalId)
  if (!modal) return
  
  modal.classList.remove('hidden')
  modal.classList.add('flex')
  
  // Handle client modal specifically
  if (modalId === 'client-modal') {
    const form = document.getElementById('client-form')
    if (form) {
      form.reset()
      window.clearFormErrors('client')
      
      // If editing, populate form and store ID
      if (data && data.id) {
        modal.dataset.editingId = data.id
        document.getElementById('client-name').value = data.name || ''
        document.getElementById('client-email').value = data.email || ''
        document.getElementById('client-phone').value = data.phone || ''
        document.getElementById('client-company').value = data.company || ''
        document.getElementById('client-address').value = data.address || ''
        
        // Update modal title
        const title = modal.querySelector('h3')
        if (title) title.textContent = 'Modifier le client'
        
        // Update submit button text
        const submitBtn = document.getElementById('client-submit-btn')
        if (submitBtn) submitBtn.textContent = 'Modifier'
      } else {
        // New client mode
        delete modal.dataset.editingId
        const title = modal.querySelector('h3')
        if (title) title.textContent = 'Nouveau Client'
        
        const submitBtn = document.getElementById('client-submit-btn')
        if (submitBtn) submitBtn.textContent = 'Enregistrer'
      }
    }
  }
  
  // Handle invoice modal
  if (modalId === 'invoice-modal') {
    window.populateClientSelect('invoice-client')
    window.setupInvoiceForm()
    
    // Set default date to today
    document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0]
    
    // Clear items and add one default item
    document.getElementById('invoice-items').innerHTML = ''
    window.addInvoiceItem()
    
    if (data && data.id) {
      // Editing mode - populate form
      modal.dataset.editingId = data.id
      document.getElementById('invoice-client').value = data.client_id || ''
      document.getElementById('invoice-date').value = data.date || ''
      document.getElementById('invoice-due-date').value = data.due_date || ''
      document.getElementById('invoice-status').value = data.status || 'draft'
      document.getElementById('invoice-tax-rate').value = data.tax_rate || 18
      document.getElementById('invoice-notes').value = data.notes || ''
      
      // Populate items
      if (data.items && data.items.length > 0) {
        document.getElementById('invoice-items').innerHTML = ''
        data.items.forEach(item => {
          window.addInvoiceItem()
          const lastItem = document.getElementById('invoice-items').lastElementChild
          lastItem.querySelector('.item-description').value = item.description || ''
          lastItem.querySelector('.item-quantity').value = item.quantity || 1
          lastItem.querySelector('.item-price').value = item.price || 0
        })
      }
      
      window.calculateInvoiceTotal()
      
      const title = modal.querySelector('h3')
      if (title) title.textContent = 'Modifier la facture'
      
      const submitBtn = document.getElementById('invoice-submit-btn')
      if (submitBtn) submitBtn.textContent = 'Modifier'
    } else {
      // New invoice mode
      delete modal.dataset.editingId
      const title = modal.querySelector('h3')
      if (title) title.textContent = 'Nouvelle Facture'
      
      const submitBtn = document.getElementById('invoice-submit-btn')
      if (submitBtn) submitBtn.textContent = 'Enregistrer'
    }
  }
  
  // Handle quote modal
  if (modalId === 'quote-modal') {
    window.populateClientSelect('quote-client')
    window.setupQuoteForm()
    
    // Set default date to today
    document.getElementById('quote-date').value = new Date().toISOString().split('T')[0]
    
    // Set default valid until date (30 days from now)
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 30)
    document.getElementById('quote-valid-until').value = validUntil.toISOString().split('T')[0]
    
    // Clear items and add one default item
    document.getElementById('quote-items').innerHTML = ''
    window.addQuoteItem()
    
    if (data && data.id) {
      // Editing mode - populate form
      modal.dataset.editingId = data.id
      document.getElementById('quote-client').value = data.client_id || ''
      document.getElementById('quote-date').value = data.date || ''
      document.getElementById('quote-valid-until').value = data.valid_until || ''
      document.getElementById('quote-status').value = data.status || 'draft'
      document.getElementById('quote-tax-rate').value = data.tax_rate || 18
      document.getElementById('quote-notes').value = data.notes || ''
      
      // Populate items
      if (data.items && data.items.length > 0) {
        document.getElementById('quote-items').innerHTML = ''
        data.items.forEach(item => {
          window.addQuoteItem()
          const lastItem = document.getElementById('quote-items').lastElementChild
          lastItem.querySelector('.item-description').value = item.description || ''
          lastItem.querySelector('.item-quantity').value = item.quantity || 1
          lastItem.querySelector('.item-price').value = item.price || 0
        })
      }
      
      window.calculateQuoteTotal()
      
      const title = modal.querySelector('h3')
      if (title) title.textContent = 'Modifier le devis'
      
      const submitBtn = document.getElementById('quote-submit-btn')
      if (submitBtn) submitBtn.textContent = 'Modifier'
    } else {
      // New quote mode
      delete modal.dataset.editingId
      const title = modal.querySelector('h3')
      if (title) title.textContent = 'Nouveau Devis'
      
      const submitBtn = document.getElementById('quote-submit-btn')
      if (submitBtn) submitBtn.textContent = 'Enregistrer'
    }
  }
}

// Dynamic item management for invoices and quotes
window.addInvoiceItem = () => {
  const container = document.getElementById('invoice-items')
  const itemCount = container.children.length
  
  const itemDiv = document.createElement('div')
  itemDiv.className = 'grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg'
  itemDiv.innerHTML = `
    <div class="col-span-5">
      <label class="block text-xs font-medium text-gray-700">Description</label>
      <input type="text" class="item-description mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Description de l'article">
    </div>
    <div class="col-span-2">
      <label class="block text-xs font-medium text-gray-700">Quantité</label>
      <input type="number" class="item-quantity mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" min="1" value="1">
    </div>
    <div class="col-span-2">
      <label class="block text-xs font-medium text-gray-700">Prix unitaire</label>
      <input type="number" class="item-price mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" min="0" step="0.01" placeholder="0.00">
    </div>
    <div class="col-span-2">
      <label class="block text-xs font-medium text-gray-700">Total</label>
      <input type="number" class="item-total mt-1 block w-full text-sm bg-gray-100 border-gray-300 rounded-md shadow-sm" readonly>
    </div>
    <div class="col-span-1">
      <button type="button" onclick="window.removeInvoiceItem(this)" class="w-full h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md flex items-center justify-center">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  `
  
  container.appendChild(itemDiv)
  
  // Add event listeners for calculations
  const quantityInput = itemDiv.querySelector('.item-quantity')
  const priceInput = itemDiv.querySelector('.item-price')
  
  quantityInput.addEventListener('input', () => window.calculateInvoiceTotal())
  priceInput.addEventListener('input', () => window.calculateInvoiceTotal())
  
  // Calculate totals after adding item
  window.calculateInvoiceTotal()
}

window.removeInvoiceItem = (button) => {
  const itemDiv = button.closest('.grid')
  itemDiv.remove()
  window.calculateInvoiceTotal()
}

window.addQuoteItem = () => {
  const container = document.getElementById('quote-items')
  const itemCount = container.children.length
  
  const itemDiv = document.createElement('div')
  itemDiv.className = 'grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg'
  itemDiv.innerHTML = `
    <div class="col-span-5">
      <label class="block text-xs font-medium text-gray-700">Description</label>
      <input type="text" class="item-description mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Description de l'article">
    </div>
    <div class="col-span-2">
      <label class="block text-xs font-medium text-gray-700">Quantité</label>
      <input type="number" class="item-quantity mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" min="1" value="1">
    </div>
    <div class="col-span-2">
      <label class="block text-xs font-medium text-gray-700">Prix unitaire</label>
      <input type="number" class="item-price mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" min="0" step="0.01" placeholder="0.00">
    </div>
    <div class="col-span-2">
      <label class="block text-xs font-medium text-gray-700">Total</label>
      <input type="number" class="item-total mt-1 block w-full text-sm bg-gray-100 border-gray-300 rounded-md shadow-sm" readonly>
    </div>
    <div class="col-span-1">
      <button type="button" onclick="window.removeQuoteItem(this)" class="w-full h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md flex items-center justify-center">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  `
  
  container.appendChild(itemDiv)
  
  // Add event listeners for calculations
  const quantityInput = itemDiv.querySelector('.item-quantity')
  const priceInput = itemDiv.querySelector('.item-price')
  
  quantityInput.addEventListener('input', () => window.calculateQuoteTotal())
  priceInput.addEventListener('input', () => window.calculateQuoteTotal())
  
  // Calculate totals after adding item
  window.calculateQuoteTotal()
}

window.removeQuoteItem = (button) => {
  const itemDiv = button.closest('.grid')
  itemDiv.remove()
  window.calculateQuoteTotal()
}

// Calculation functions
window.calculateInvoiceTotal = () => {
  const itemsContainer = document.getElementById('invoice-items')
  const items = itemsContainer.querySelectorAll('.grid')
  
  let subtotal = 0
  
  items.forEach(item => {
    const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0
    const price = parseFloat(item.querySelector('.item-price').value) || 0
    const total = quantity * price
    
    // Update item total
    item.querySelector('.item-total').value = total.toFixed(2)
    subtotal += total
  })
  
  // Update subtotal
  document.getElementById('invoice-subtotal').value = subtotal.toFixed(2)
  
  // Calculate tax
  const taxRate = parseFloat(document.getElementById('invoice-tax-rate').value) || 0
  const taxAmount = subtotal * (taxRate / 100)
  
  // Calculate total
  const total = subtotal + taxAmount
  
  // Update fields
  document.getElementById('invoice-total').value = total.toFixed(2)
}

window.calculateQuoteTotal = () => {
  const itemsContainer = document.getElementById('quote-items')
  const items = itemsContainer.querySelectorAll('.grid')
  
  let subtotal = 0
  
  items.forEach(item => {
    const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0
    const price = parseFloat(item.querySelector('.item-price').value) || 0
    const total = quantity * price
    
    // Update item total
    item.querySelector('.item-total').value = total.toFixed(2)
    subtotal += total
  })
  
  // Update subtotal
  document.getElementById('quote-subtotal').value = subtotal.toFixed(2)
  
  // Calculate tax
  const taxRate = parseFloat(document.getElementById('quote-tax-rate').value) || 0
  const taxAmount = subtotal * (taxRate / 100)
  
  // Calculate total
  const total = subtotal + taxAmount
  
  // Update fields
  document.getElementById('quote-total').value = total.toFixed(2)
}

// Populate client select dropdown
window.populateClientSelect = (selectId) => {
  const select = document.getElementById(selectId)
  if (!select) return
  
  const clients = DatabaseService.getClients()
  
  // Clear existing options except the first one
  select.innerHTML = '<option value="">Sélectionner un client</option>'
  
  clients.forEach(client => {
    const option = document.createElement('option')
    option.value = client.id
    option.textContent = client.name
    select.appendChild(option)
  })
  
  // Add option to create new client
  const newClientOption = document.createElement('option')
  newClientOption.value = 'new'
  newClientOption.textContent = '+ Nouveau client'
  select.appendChild(newClientOption)
  
  // Handle new client selection
  select.addEventListener('change', (e) => {
    if (e.target.value === 'new') {
      window.showModal('client-modal')
      e.target.value = '' // Reset selection
    }
  })
}

// Setup invoice form
window.setupInvoiceForm = () => {
  const form = document.getElementById('invoice-form')
  if (!form) return
  
  // Remove existing event listener to avoid duplicates
  form.removeEventListener('submit', window.handleInvoiceSubmit)
  form.addEventListener('submit', window.handleInvoiceSubmit)
}

window.handleInvoiceSubmit = async (e) => {
  e.preventDefault()
  
  const submitBtn = document.getElementById('invoice-submit-btn')
  const originalText = submitBtn.textContent
  
  try {
    submitBtn.disabled = true
    submitBtn.textContent = 'Enregistrement...'
    
    // Collect form data
    const invoiceData = {
      client_id: parseInt(document.getElementById('invoice-client').value),
      date: document.getElementById('invoice-date').value,
      due_date: document.getElementById('invoice-due-date').value,
      status: document.getElementById('invoice-status').value,
      tax_rate: parseFloat(document.getElementById('invoice-tax-rate').value) || 0,
      notes: document.getElementById('invoice-notes').value,
      items: [],
      subtotal: parseFloat(document.getElementById('invoice-subtotal').value) || 0,
      tax_amount: 0,
      total: parseFloat(document.getElementById('invoice-total').value) || 0
    }
    
    // Collect items
    const itemElements = document.getElementById('invoice-items').querySelectorAll('.grid')
    itemElements.forEach(item => {
      const description = item.querySelector('.item-description').value
      const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0
      const price = parseFloat(item.querySelector('.item-price').value) || 0
      
      if (description && quantity > 0 && price >= 0) {
        invoiceData.items.push({
          description,
          quantity,
          price,
          total: quantity * price
        })
      }
    })
    
    // Calculate tax amount
    invoiceData.tax_amount = invoiceData.subtotal * (invoiceData.tax_rate / 100)
    
    // Validate
    if (!invoiceData.client_id) {
      window.showNotification('Veuillez sélectionner un client', 'error')
      return
    }
    
    if (!invoiceData.date) {
      window.showNotification('Veuillez saisir une date', 'error')
      return
    }
    
    if (invoiceData.items.length === 0) {
      window.showNotification('Veuillez ajouter au moins un article', 'error')
      return
    }
    
    // Save invoice
    const modal = document.getElementById('invoice-modal')
    const isEditing = modal.dataset.editingId
    
    let result
    if (isEditing) {
      result = DatabaseService.updateInvoice(parseInt(isEditing), invoiceData)
      if (result) {
        window.showNotification('Facture modifiée avec succès', 'success')
      }
    } else {
      result = DatabaseService.addInvoice(invoiceData)
      if (result) {
        window.showNotification('Facture créée avec succès', 'success')
      }
    }
    
    if (result) {
      window.hideModal('invoice-modal')
      window.refreshCurrentView()
      delete modal.dataset.editingId
    } else {
      window.showNotification('Erreur lors de l\'enregistrement de la facture', 'error')
    }
    
  } catch (error) {
    console.error('Error saving invoice:', error)
    window.showNotification('Erreur lors de l\'enregistrement de la facture', 'error')
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = originalText
  }
}

// Setup quote form
window.setupQuoteForm = () => {
  const form = document.getElementById('quote-form')
  if (!form) return
  
  // Remove existing event listener to avoid duplicates
  form.removeEventListener('submit', window.handleQuoteSubmit)
  form.addEventListener('submit', window.handleQuoteSubmit)
}

window.handleQuoteSubmit = async (e) => {
  e.preventDefault()
  
  const submitBtn = document.getElementById('quote-submit-btn')
  const originalText = submitBtn.textContent
  
  try {
    submitBtn.disabled = true
    submitBtn.textContent = 'Enregistrement...'
    
    // Collect form data
    const quoteData = {
      client_id: parseInt(document.getElementById('quote-client').value),
      date: document.getElementById('quote-date').value,
      valid_until: document.getElementById('quote-valid-until').value,
      status: document.getElementById('quote-status').value,
      tax_rate: parseFloat(document.getElementById('quote-tax-rate').value) || 0,
      notes: document.getElementById('quote-notes').value,
      items: [],
      subtotal: parseFloat(document.getElementById('quote-subtotal').value) || 0,
      tax_amount: 0,
      total: parseFloat(document.getElementById('quote-total').value) || 0
    }
    
    // Collect items
    const itemElements = document.getElementById('quote-items').querySelectorAll('.grid')
    itemElements.forEach(item => {
      const description = item.querySelector('.item-description').value
      const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0
      const price = parseFloat(item.querySelector('.item-price').value) || 0
      
      if (description && quantity > 0 && price >= 0) {
        quoteData.items.push({
          description,
          quantity,
          price,
          total: quantity * price
        })
      }
    })
    
    // Calculate tax amount
    quoteData.tax_amount = quoteData.subtotal * (quoteData.tax_rate / 100)
    
    // Validate
    if (!quoteData.client_id) {
      window.showNotification('Veuillez sélectionner un client', 'error')
      return
    }
    
    if (!quoteData.date) {
      window.showNotification('Veuillez saisir une date', 'error')
      return
    }
    
    if (quoteData.items.length === 0) {
      window.showNotification('Veuillez ajouter au moins un article', 'error')
      return
    }
    
    // Save quote
    const modal = document.getElementById('quote-modal')
    const isEditing = modal.dataset.editingId
    
    let result
    if (isEditing) {
      result = DatabaseService.updateQuote(parseInt(isEditing), quoteData)
      if (result) {
        window.showNotification('Devis modifié avec succès', 'success')
      }
    } else {
      result = DatabaseService.addQuote(quoteData)
      if (result) {
        window.showNotification('Devis créé avec succès', 'success')
      }
    }
    
    if (result) {
      window.hideModal('quote-modal')
      window.refreshCurrentView()
      delete modal.dataset.editingId
    } else {
      window.showNotification('Erreur lors de l\'enregistrement du devis', 'error')
    }
    
  } catch (error) {
    console.error('Error saving quote:', error)
    window.showNotification('Erreur lors de l\'enregistrement du devis', 'error')
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = originalText
  }
}

// PDF Generation functions
window.generateInvoicePDF = async (invoiceId) => {
  try {
    window.showNotification('Génération du PDF en cours...', 'info')
    
    const invoice = DatabaseService.getInvoice(invoiceId)
    if (!invoice) {
      window.showNotification('Facture introuvable', 'error')
      return
    }
    
    const client = DatabaseService.getClient(invoice.client_id)
    if (!client) {
      window.showNotification('Client introuvable', 'error')
      return
    }
    
    // Get company info from settings
    const companyInfo = {
      name: DatabaseService.getSetting('company_name') || 'Mon Entreprise',
      email: DatabaseService.getSetting('company_email') || '',
      phone: DatabaseService.getSetting('company_phone') || '',
      address: DatabaseService.getSetting('company_address') || ''
    }
    
    PrintService.printInvoice(invoice, client, companyInfo)
    
    window.showNotification('Facture envoyée à l\'impression', 'success')
    
  } catch (error) {
    console.error('Error printing invoice:', error)
    window.showNotification('Erreur lors de l\'impression de la facture', 'error')
  }
}

window.generateQuotePDF = async (quoteId) => {
  try {
    window.showNotification('Génération du PDF en cours...', 'info')
    
    const quote = DatabaseService.getQuote(quoteId)
    if (!quote) {
      window.showNotification('Devis introuvable', 'error')
      return
    }
    
    const client = DatabaseService.getClient(quote.client_id)
    if (!client) {
      window.showNotification('Client introuvable', 'error')
      return
    }
    
    // Get company info from settings
    const companyInfo = {
      name: DatabaseService.getSetting('company_name') || 'Mon Entreprise',
      email: DatabaseService.getSetting('company_email') || '',
      phone: DatabaseService.getSetting('company_phone') || '',
      address: DatabaseService.getSetting('company_address') || ''
    }
    
    PrintService.printQuote(quote, client, companyInfo)
    
    window.showNotification('Devis envoyé à l\'impression', 'success')
    
  } catch (error) {
    console.error('Error printing quote:', error)
    window.showNotification('Erreur lors de l\'impression du devis', 'error')
  }
}

// Enhanced detail view functions with PDF buttons
window.showInvoiceDetails = (invoice) => {
  const client = DatabaseService.getClient(invoice.client_id)
  
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center'
  modal.innerHTML = `
    <div class="relative bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-96 overflow-y-auto">
      <div class="flex items-center justify-between p-6 border-b">
        <h3 class="text-lg font-medium text-gray-900">Facture ${invoice.number}</h3>
        <div class="flex items-center space-x-2">
          <button onclick="window.generateInvoicePDF(${invoice.id})" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            📄 PDF
          </button>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Informations facture</h4>
            <div class="space-y-2 text-sm">
              <div><span class="font-medium">Numéro:</span> ${invoice.number}</div>
              <div><span class="font-medium">Date:</span> ${new Date(invoice.date).toLocaleDateString('fr-FR')}</div>
              <div><span class="font-medium">Échéance:</span> ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : 'Non définie'}</div>
              <div><span class="font-medium">Statut:</span> <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">${invoice.status}</span></div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Client</h4>
            <div class="space-y-2 text-sm">
              <div><span class="font-medium">Nom:</span> ${client ? client.name : 'Client supprimé'}</div>
              <div><span class="font-medium">Email:</span> ${client?.email || 'Non renseigné'}</div>
              <div><span class="font-medium">Téléphone:</span> ${client?.phone || 'Non renseigné'}</div>
            </div>
          </div>
        </div>
        <div class="border-t pt-4">
          <h4 class="font-medium text-gray-900 mb-2">Montants</h4>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between items-center text-sm mb-2">
              <span>Sous-total:</span>
              <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(invoice.subtotal || 0)}</span>
            </div>
            <div class="flex justify-between items-center text-sm mb-2">
              <span>TVA (${invoice.tax_rate || 0}%):</span>
              <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(invoice.tax_amount || 0)}</span>
            </div>
            <div class="border-t pt-2 flex justify-between items-center font-medium">
              <span>Total:</span>
              <span class="text-lg">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(invoice.total || 0)}</span>
            </div>
          </div>
        </div>
        ${invoice.notes ? `
          <div class="border-t pt-4">
            <h4 class="font-medium text-gray-900 mb-2">Notes</h4>
            <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded">${invoice.notes}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
}

window.showQuoteDetails = (quote) => {
  const client = DatabaseService.getClient(quote.client_id)
  
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center'
  modal.innerHTML = `
    <div class="relative bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-96 overflow-y-auto">
      <div class="flex items-center justify-between p-6 border-b">
        <h3 class="text-lg font-medium text-gray-900">Devis ${quote.number}</h3>
        <div class="flex items-center space-x-2">
          <button onclick="window.generateQuotePDF(${quote.id})" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            📄 PDF
          </button>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Informations devis</h4>
            <div class="space-y-2 text-sm">
              <div><span class="font-medium">Numéro:</span> ${quote.number}</div>
              <div><span class="font-medium">Date:</span> ${new Date(quote.date).toLocaleDateString('fr-FR')}</div>
              <div><span class="font-medium">Valide jusqu'au:</span> ${quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : 'Non définie'}</div>
              <div><span class="font-medium">Statut:</span> <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">${quote.status}</span></div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Client</h4>
            <div class="space-y-2 text-sm">
              <div><span class="font-medium">Nom:</span> ${client ? client.name : 'Client supprimé'}</div>
              <div><span class="font-medium">Email:</span> ${client?.email || 'Non renseigné'}</div>
              <div><span class="font-medium">Téléphone:</span> ${client?.phone || 'Non renseigné'}</div>
            </div>
          </div>
        </div>
        <div class="border-t pt-4">
          <h4 class="font-medium text-gray-900 mb-2">Montants</h4>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between items-center text-sm mb-2">
              <span>Sous-total:</span>
              <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(quote.subtotal || 0)}</span>
            </div>
            <div class="flex justify-between items-center text-sm mb-2">
              <span>TVA (${quote.tax_rate || 0}%):</span>
              <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(quote.tax_amount || 0)}</span>
            </div>
            <div class="border-t pt-2 flex justify-between items-center font-medium">
              <span>Total:</span>
              <span class="text-lg">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(quote.total || 0)}</span>
            </div>
          </div>
        </div>
        ${quote.notes ? `
          <div class="border-t pt-4">
            <h4 class="font-medium text-gray-900 mb-2">Notes</h4>
            <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded">${quote.notes}</p>
          </div>
        ` : ''}
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new SamaFactureApp()
  window.samaFactureApp = app
  app.init()
  
  // Setup forms after DOM is loaded
  setTimeout(() => {
    window.setupClientForm()
  }, 100)
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
