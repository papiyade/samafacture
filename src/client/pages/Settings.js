import { ThemeService } from '../../shared/services/ThemeService.js'
import { DatabaseService } from '../../shared/services/DatabaseService.js'
import { Modal } from '../../shared/components/Modal.js'
import { NotificationService } from '../../shared/services/NotificationService.js'

/**
 * Settings Page - Application settings and company information
 */
export class Settings {
  constructor() {
    this.container = null
    this.companyInfo = null
  }

  async init() {
    await this.loadCompanyInfo()
    console.log('✅ Settings page initialized')
  }

  async loadCompanyInfo() {
    try {
      // Load company info from settings
      this.companyInfo = {
        name: DatabaseService.getSetting('company_name') || 'Mon Entreprise',
        email: DatabaseService.getSetting('company_email') || 'contact@monentreprise.com',
        phone: DatabaseService.getSetting('company_phone') || '+221 XX XXX XX XX',
        address: DatabaseService.getSetting('company_address') || 'Dakar, Sénégal',
        website: DatabaseService.getSetting('company_website') || '',
        taxNumber: DatabaseService.getSetting('company_tax_number') || '',
        logo: DatabaseService.getSetting('company_logo') || null,
        currency: DatabaseService.getSetting('currency') || 'XOF',
        language: DatabaseService.getSetting('language') || 'fr'
      }
    } catch (error) {
      console.error('Error loading company info:', error)
      // Default values in case of error
      this.companyInfo = {
        name: 'Mon Entreprise',
        email: 'contact@monentreprise.com',
        phone: '+221 XX XXX XX XX',
        address: 'Dakar, Sénégal',
        website: '',
        taxNumber: '',
        logo: null,
        currency: 'XOF',
        language: 'fr'
      }
    }
  }

  render() {
    const container = document.createElement('div')
    container.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div class="max-w-4xl mx-auto">
          <!-- Page Header -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Paramètres
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Gérez les informations de votre entreprise et les paramètres de l'application
            </p>
          </div>

          <!-- Settings Sections -->
          <div class="space-y-8">
            
            <!-- Company Information -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                  Informations de l'entreprise
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ces informations apparaîtront sur vos factures et devis
                </p>
              </div>
              
              <form id="company-form" class="px-6 py-6 space-y-6">
                <!-- Logo Upload -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo de l'entreprise
                  </label>
                  <div class="flex items-center space-x-6">
                    <div class="shrink-0">
                      <div id="logo-preview" class="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                        ${this.companyInfo?.logo ? 
                          `<img src="${this.companyInfo.logo}" alt="Logo" class="h-full w-full object-cover rounded-lg">` :
                          `<svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>`
                        }
                      </div>
                    </div>
                    <div class="flex-1">
                      <input type="file" id="logo-input" accept="image/*" class="hidden">
                      <button type="button" onclick="document.getElementById('logo-input').click()" class="bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        Changer le logo
                      </button>
                      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG jusqu'à 2MB. Recommandé : 200x200px
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Company Details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label for="company-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom de l'entreprise *
                    </label>
                    <input type="text" id="company-name" value="${this.companyInfo?.name || ''}" required 
                           class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                  </div>
                  
                  <div>
                    <label for="company-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                    <input type="email" id="company-email" value="${this.companyInfo?.email || ''}" required 
                           class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                  </div>
                  
                  <div>
                    <label for="company-phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Téléphone
                    </label>
                    <input type="tel" id="company-phone" value="${this.companyInfo?.phone || ''}" 
                           class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                  </div>
                  
                  <div>
                    <label for="company-website" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Site web
                    </label>
                    <input type="url" id="company-website" value="${this.companyInfo?.website || ''}" 
                           class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                  </div>
                </div>

                <div>
                  <label for="company-address" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Adresse
                  </label>
                  <textarea id="company-address" rows="3" 
                            class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">${this.companyInfo?.address || ''}</textarea>
                </div>

                <div>
                  <label for="company-tax-number" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Numéro fiscal / NINEA
                  </label>
                  <input type="text" id="company-tax-number" value="${this.companyInfo?.taxNumber || ''}" 
                         class="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
                </div>

                <!-- Save Button -->
                <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button type="submit" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </div>

            <!-- Application Settings -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                  Paramètres de l'application
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configurez les préférences de l'application
                </p>
              </div>
              
              <div class="px-6 py-6 space-y-6">
                <!-- Theme Toggle -->
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Thème sombre
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Basculer entre le thème clair et sombre
                    </p>
                  </div>
                  <button type="button" id="theme-toggle-switch" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${ThemeService.isDark() ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}" role="switch">
                    <span class="sr-only">Activer le thème sombre</span>
                    <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${ThemeService.isDark() ? 'translate-x-5' : 'translate-x-0'}"></span>
                  </button>
                </div>

                <!-- Language and Currency -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label for="app-language" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Langue
                    </label>
                    <select id="app-language" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500">
                      <option value="fr" ${this.companyInfo?.language === 'fr' ? 'selected' : ''}>Français</option>
                      <option value="en" ${this.companyInfo?.language === 'en' ? 'selected' : ''}>English</option>
                      <option value="ar" ${this.companyInfo?.language === 'ar' ? 'selected' : ''}>العربية</option>
                    </select>
                  </div>
                  
                  <div>
                    <label for="app-currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Devise par défaut
                    </label>
                    <select id="app-currency" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500">
                      <option value="XOF" ${this.companyInfo?.currency === 'XOF' ? 'selected' : ''}>FCFA (XOF)</option>
                      <option value="EUR" ${this.companyInfo?.currency === 'EUR' ? 'selected' : ''}>Euro (EUR)</option>
                      <option value="USD" ${this.companyInfo?.currency === 'USD' ? 'selected' : ''}>Dollar US (USD)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Data Management -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                  Gestion des données
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Sauvegarde et restauration de vos données
                </p>
              </div>
              
              <div class="px-6 py-6 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Exporter les données
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Télécharger toutes vos données au format JSON
                    </p>
                  </div>
                  <button id="export-data-btn" class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Exporter
                  </button>
                </div>
                
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Réinitialiser l'application
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Supprimer toutes les données et recommencer
                    </p>
                  </div>
                  <button id="reset-app-btn" class="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    
    // Setup event listeners after DOM is ready
    setTimeout(() => this.setupEventListeners(), 0)
    
    return container
  }

  setupEventListeners() {
    // Company form submission
    const companyForm = document.getElementById('company-form')
    if (companyForm) {
      companyForm.addEventListener('submit', (e) => this.handleCompanyFormSubmit(e))
    }

    // Logo upload
    const logoInput = document.getElementById('logo-input')
    if (logoInput) {
      logoInput.addEventListener('change', (e) => this.handleLogoUpload(e))
    }

    // Theme toggle switch
    const themeToggleSwitch = document.getElementById('theme-toggle-switch')
    if (themeToggleSwitch) {
      themeToggleSwitch.addEventListener('click', () => {
        ThemeService.toggleTheme()
        this.updateThemeToggleUI()
      })
    }

    // Export data
    const exportBtn = document.getElementById('export-data-btn')
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData())
    }

    // Reset app
    const resetBtn = document.getElementById('reset-app-btn')
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetApp())
    }
  }

  async handleCompanyFormSubmit(e) {
    e.preventDefault()
    
    try {
      // Get form data
      const formData = {
        name: document.getElementById('company-name').value,
        email: document.getElementById('company-email').value,
        phone: document.getElementById('company-phone').value,
        website: document.getElementById('company-website').value,
        address: document.getElementById('company-address').value,
        taxNumber: document.getElementById('company-tax-number').value,
        language: document.getElementById('app-language').value,
        currency: document.getElementById('app-currency').value
      }

      // Update company info in memory
      this.companyInfo = { ...this.companyInfo, ...formData }
      
      // Save each setting individually
      DatabaseService.setSetting('company_name', formData.name)
      DatabaseService.setSetting('company_email', formData.email)
      DatabaseService.setSetting('company_phone', formData.phone)
      DatabaseService.setSetting('company_website', formData.website)
      DatabaseService.setSetting('company_address', formData.address)
      DatabaseService.setSetting('company_tax_number', formData.taxNumber)
      DatabaseService.setSetting('language', formData.language)
      DatabaseService.setSetting('currency', formData.currency)
      
      // Save logo if it exists
      if (this.companyInfo.logo) {
        DatabaseService.setSetting('company_logo', this.companyInfo.logo)
      }
      
      // Show success notification
      NotificationService.show('Informations sauvegardées avec succès', 'success')
      
    } catch (error) {
      console.error('Error saving company info:', error)
      NotificationService.show('Erreur lors de la sauvegarde', 'error')
    }
  }

  handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      NotificationService.show('Veuillez sélectionner une image', 'error')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      NotificationService.show('L\'image ne doit pas dépasser 2MB', 'error')
      return
    }

    // Read file as data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const logoUrl = e.target.result
      this.companyInfo.logo = logoUrl
      
      // Save logo to settings immediately
      DatabaseService.setSetting('company_logo', logoUrl)
      
      // Update preview
      const preview = document.getElementById('logo-preview')
      if (preview) {
        preview.innerHTML = `<img src="${logoUrl}" alt="Logo" class="h-full w-full object-cover rounded-lg">`
      }
      
      // Show success notification
      NotificationService.show('Logo mis à jour avec succès', 'success')
    }
    reader.readAsDataURL(file)
  }

  updateThemeToggleUI() {
    const toggle = document.getElementById('theme-toggle-switch')
    const span = toggle?.querySelector('span:last-child')
    
    if (toggle && span) {
      const isDark = ThemeService.isDark()
      toggle.className = toggle.className.replace(/bg-\w+-\d+/g, '')
      toggle.classList.add(isDark ? 'bg-primary-600' : 'bg-gray-200')
      
      span.className = span.className.replace(/translate-x-\d+/g, '')
      span.classList.add(isDark ? 'translate-x-5' : 'translate-x-0')
    }
  }

  async exportData() {
    try {
      // Get all data from database
      const data = {
        settings: DatabaseService.getItem('settings') || {},
        clients: DatabaseService.getClients(),
        products: DatabaseService.getProducts(),
        invoices: DatabaseService.getInvoices(),
        quotes: DatabaseService.getQuotes(),
        exportDate: new Date().toISOString()
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `samafacture-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      NotificationService.show('Données exportées avec succès', 'success')
    } catch (error) {
      console.error('Error exporting data:', error)
      NotificationService.show('Erreur lors de l\'exportation', 'error')
    }
  }

  async resetApp() {
    const modal = Modal.create({
      title: 'Réinitialiser l\'application',
      content: `
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Êtes-vous sûr ?
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Cette action supprimera définitivement toutes vos données (clients, factures, devis, produits). Cette action ne peut pas être annulée.
          </p>
        </div>
      `,
      actions: [
        {
          label: 'Annuler',
          variant: 'secondary',
          onClick: () => modal.close()
        },
        {
          label: 'Réinitialiser',
          variant: 'danger',
          onClick: async () => {
            try {
              // Clear all data
              localStorage.clear()
              
              // Reinitialize with default settings
              DatabaseService.setSetting('company_name', 'Mon Entreprise')
              DatabaseService.setSetting('company_email', 'contact@monentreprise.com')
              DatabaseService.setSetting('company_phone', '+221 XX XXX XX XX')
              DatabaseService.setSetting('company_address', 'Dakar, Sénégal')
              DatabaseService.setSetting('currency', 'XOF')
              DatabaseService.setSetting('language', 'fr')
              
              modal.close()
              NotificationService.show('Application réinitialisée avec succès', 'success')
              
              // Reload page after a short delay
              setTimeout(() => {
                window.location.reload()
              }, 1500)
            } catch (error) {
              console.error('Error resetting app:', error)
              NotificationService.show('Erreur lors de la réinitialisation', 'error')
            }
          }
        }
      ]
    })
    
    modal.show()
  }

  destroy() {
    // Cleanup if needed
  }
}
