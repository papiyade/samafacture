import { LicenseService } from '../services/LicenseService.js'
import { LicenseKeyGenerator } from '../utils/LicenseKeyGenerator.js'
import { LicenseValidator } from '../utils/LicenseValidator.js'
import { LicenseTypeManager } from '../utils/LicenseTypeManager.js'
import { LicenseExpirationManager } from '../utils/LicenseExpirationManager.js'
import { CompanyService } from '../services/CompanyService.js'
import { Logger } from '../utils/Logger.js'

/**
 * License Management Page - Gestion complète des licences
 */
export class LicenseManagement {
  constructor() {
    this.licenses = []
    this.companies = []
    this.currentPage = 1
    this.itemsPerPage = 10
    this.filters = {
      status: '',
      type: '',
      company: '',
      search: ''
    }
    this.selectedLicenses = new Set()
  }

  async init() {
    try {
      Logger.info('Initializing License Management')
      await this.loadData()
      this.setupEventListeners()
      Logger.success('License Management initialized')
    } catch (error) {
      Logger.error('Error initializing License Management', { error: error.message })
    }
  }

  async loadData() {
    try {
      // Charger les licences et entreprises en parallèle
      const [licenses, companies] = await Promise.all([
        LicenseService.getAllLicenses(),
        CompanyService.getAllCompanies()
      ])
      
      this.licenses = licenses
      this.companies = companies
      
      Logger.debug('License data loaded', { 
        licensesCount: this.licenses.length,
        companiesCount: this.companies.length 
      })
      
      // Mettre à jour l'affichage si la page est déjà rendue
      this.updateDisplay()
      
    } catch (error) {
      Logger.error('Error loading license data', { error: error.message })
      // Fallback avec données de démonstration si erreur
      this.licenses = []
      this.companies = []
    }
  }

  updateDisplay() {
    // Mettre à jour le tableau des licences
    const tableBody = document.getElementById('licenses-table-body')
    if (tableBody) {
      this.renderLicensesTable()
    }
    
    // Mettre à jour les statistiques
    this.updateStats()
  }

  updateStats() {
    const stats = {
      total: this.licenses.length,
      active: this.licenses.filter(l => l.status === 'ACTIVE').length,
      expired: this.licenses.filter(l => l.status === 'EXPIRED' || l.status === 'SUSPENDED').length,
      expiring: this.licenses.filter(l => {
        const expiresAt = new Date(l.expires_at)
        const now = new Date()
        const daysUntilExpiration = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
        return daysUntilExpiration <= 30 && daysUntilExpiration > 0
      }).length
    }
    
    // Mettre à jour les éléments du DOM
    const elements = {
      total: document.getElementById('total-licenses-count'),
      active: document.getElementById('active-licenses-count'),
      expired: document.getElementById('expired-licenses-count'),
      expiring: document.getElementById('expiring-licenses-count')
    }
    
    if (elements.total) elements.total.textContent = stats.total
    if (elements.active) elements.active.textContent = stats.active
    if (elements.expired) elements.expired.textContent = stats.expired
    if (elements.expiring) elements.expiring.textContent = stats.expiring
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('#generate-license-btn')) {
        this.showGenerateLicenseModal()
      }
      if (e.target.matches('.extend-license-btn')) {
        const licenseId = parseInt(e.target.dataset.licenseId)
        this.extendLicense(licenseId)
      }
      if (e.target.matches('.revoke-license-btn')) {
        const licenseId = parseInt(e.target.dataset.licenseId)
        this.revokeLicense(licenseId)
      }
    })
  }

  async showGenerateLicenseModal() {
    try {
      Logger.info('Opening generate license modal')
      
      // Créer le modal de génération de licence
      const modal = this.createGenerateLicenseModal()
      document.body.appendChild(modal)
      
      // Afficher le modal
      modal.classList.remove('hidden')
      
    } catch (error) {
      Logger.error('Error showing generate license modal', { error: error.message })
      alert('❌ Erreur lors de l\'ouverture du modal')
    }
  }

  createGenerateLicenseModal() {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'
    modal.id = 'generate-license-modal'
    
    const licenseTypes = LicenseTypeManager.getAllTypes()
    const typeOptions = Object.entries(licenseTypes).map(([key, type]) => 
      `<option value="${key}">${type.name} - ${LicenseTypeManager.formatPrice(type.price, type.currency)}</option>`
    ).join('')
    
    const companyOptions = this.companies.map(company => 
      `<option value="${company.id}">${company.name}</option>`
    ).join('')
    
    modal.innerHTML = `
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              🆕 Générer une nouvelle licence
            </h3>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form id="generate-license-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entreprise
              </label>
              <select name="companyId" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Sélectionner une entreprise</option>
                ${companyOptions}
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de licence
              </label>
              <select name="licenseType" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Sélectionner un type</option>
                ${typeOptions}
              </select>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durée (nombre)
                </label>
                <input type="number" name="durationValue" min="1" value="1" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unité
                </label>
                <select name="durationUnit" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="days">Jours</option>
                  <option value="months" selected>Mois</option>
                  <option value="years">Années</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (optionnel)
              </label>
              <textarea name="notes" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Notes sur cette licence..."></textarea>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500">
                Annuler
              </button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                🔑 Générer la licence
              </button>
            </div>
          </form>
        </div>
      </div>
    `
    
    // Ajouter l'événement de soumission
    modal.querySelector('#generate-license-form').addEventListener('submit', (e) => {
      e.preventDefault()
      this.handleGenerateLicense(e.target)
    })
    
    return modal
  }

  async handleGenerateLicense(form) {
    try {
      const formData = new FormData(form)
      const data = {
        companyId: parseInt(formData.get('companyId')),
        type: formData.get('licenseType'),
        duration: {
          value: parseInt(formData.get('durationValue')),
          unit: formData.get('durationUnit')
        },
        notes: formData.get('notes')
      }
      
      Logger.info('Generating new license', data)
      
      // Désactiver le bouton de soumission
      const submitBtn = form.querySelector('button[type="submit"]')
      const originalText = submitBtn.textContent
      submitBtn.textContent = '⏳ Génération...'
      submitBtn.disabled = true
      
      // Créer la licence
      const newLicense = await LicenseService.createLicense(data)
      
      Logger.success('License generated successfully', { licenseId: newLicense.id })
      
      // Fermer le modal
      document.getElementById('generate-license-modal').remove()
      
      // Recharger les données
      await this.loadData()
      
      // Afficher un message de succès
      alert(`✅ Licence générée avec succès !\n\nClé: ${newLicense.license_key}\nType: ${newLicense.license_type}\nExpire le: ${new Date(newLicense.expires_at).toLocaleDateString('fr-FR')}`)
      
    } catch (error) {
      Logger.error('Error generating license', { error: error.message })
      alert(`❌ Erreur lors de la génération de la licence:\n${error.message}`)
      
      // Réactiver le bouton
      const submitBtn = form.querySelector('button[type="submit"]')
      submitBtn.textContent = '🔑 Générer la licence'
      submitBtn.disabled = false
    }
  }

  async extendLicense(licenseId) {
    try {
      const license = this.licenses.find(l => l.id === licenseId)
      if (!license) {
        throw new Error('Licence non trouvée')
      }
      
      const extension = prompt(`Prolonger la licence de ${license.license_key}\n\nCombien de mois voulez-vous ajouter ?`, '1')
      if (!extension || isNaN(extension) || extension <= 0) {
        return
      }
      
      Logger.info('Extending license', { licenseId, months: extension })
      
      // Calculer la nouvelle date d'expiration
      const currentExpiration = new Date(license.expires_at)
      const newExpiration = new Date(currentExpiration)
      newExpiration.setMonth(newExpiration.getMonth() + parseInt(extension))
      
      // Mettre à jour la licence
      await LicenseService.updateLicense(licenseId, {
        expires_at: newExpiration.toISOString()
      })
      
      // Recharger les données
      await this.loadData()
      
      alert(`✅ Licence prolongée de ${extension} mois\nNouvelle expiration: ${newExpiration.toLocaleDateString('fr-FR')}`)
      
    } catch (error) {
      Logger.error('Error extending license', { licenseId, error: error.message })
      alert(`❌ Erreur lors de la prolongation:\n${error.message}`)
    }
  }

  async revokeLicense(licenseId) {
    try {
      const license = this.licenses.find(l => l.id === licenseId)
      if (!license) {
        throw new Error('Licence non trouvée')
      }
      
      if (!confirm(`Êtes-vous sûr de vouloir révoquer la licence ?\n\nClé: ${license.license_key}\nEntreprise: ${license.company_name}\n\nCette action est irréversible.`)) {
        return
      }
      
      Logger.info('Revoking license', { licenseId })
      
      // Révoquer la licence
      await LicenseService.revokeLicense(licenseId, 'Révoquée par l\'administrateur')
      
      // Recharger les données
      await this.loadData()
      
      alert('✅ Licence révoquée avec succès')
      
    } catch (error) {
      Logger.error('Error revoking license', { licenseId, error: error.message })
      alert(`❌ Erreur lors de la révocation:\n${error.message}`)
    }
  }

  renderLicensesTable() {
    const tableBody = document.getElementById('licenses-table-body')
    if (!tableBody) return
    
    // Filtrer les licences selon les critères
    const filteredLicenses = this.getFilteredLicenses()
    
    if (filteredLicenses.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
            <div class="flex flex-col items-center">
              <div class="text-4xl mb-2">📭</div>
              <p>Aucune licence trouvée</p>
            </div>
          </td>
        </tr>
      `
      return
    }
    
    // Pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    const paginatedLicenses = filteredLicenses.slice(startIndex, endIndex)
    
    tableBody.innerHTML = paginatedLicenses.map(license => {
      const company = this.companies.find(c => c.id === license.company_id)
      const expiresAt = new Date(license.expires_at)
      const now = new Date()
      const daysUntilExpiration = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
      
      return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
          <td class="px-6 py-4 whitespace-nowrap">
            <input type="checkbox" class="license-checkbox" value="${license.id}" 
                   onchange="window.licenseManagement.toggleLicenseSelection(${license.id}, this.checked)">
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              ${company?.name || 'Entreprise inconnue'}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              ${company?.email || ''}
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-mono text-gray-900 dark:text-white">
              ${license.license_key}
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getTypeBadgeClass(license.license_type)}">
              ${this.getTypeIcon(license.license_type)} ${license.license_type}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusBadgeClass(license.status)}">
              ${this.getStatusIcon(license.status)} ${license.status}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
            ${new Date(license.created_at).toLocaleDateString('fr-FR')}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm">
            <div class="text-gray-900 dark:text-white">
              ${expiresAt.toLocaleDateString('fr-FR')}
            </div>
            <div class="text-xs ${daysUntilExpiration <= 7 ? 'text-red-500' : daysUntilExpiration <= 30 ? 'text-orange-500' : 'text-gray-500'}">
              ${daysUntilExpiration > 0 ? `Dans ${daysUntilExpiration} jours` : `Expirée depuis ${Math.abs(daysUntilExpiration)} jours`}
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div class="flex space-x-2">
              <button onclick="window.licenseManagement.extendLicense(${license.id})" 
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Prolonger">
                🔄
              </button>
              <button onclick="window.licenseManagement.revokeLicense(${license.id})" 
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      title="Révoquer">
                ❌
              </button>
              <button onclick="window.licenseManagement.viewLicenseDetails(${license.id})" 
                      class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      title="Détails">
                👁️
              </button>
            </div>
          </td>
        </tr>
      `
    }).join('')
    
    // Mettre à jour la pagination
    this.updatePagination(filteredLicenses.length)
  }

  getFilteredLicenses() {
    return this.licenses.filter(license => {
      const company = this.companies.find(c => c.id === license.company_id)
      
      // Filtre par statut
      if (this.filters.status && license.status !== this.filters.status) {
        return false
      }
      
      // Filtre par type
      if (this.filters.type && license.license_type !== this.filters.type) {
        return false
      }
      
      // Filtre par entreprise
      if (this.filters.company && license.company_id !== parseInt(this.filters.company)) {
        return false
      }
      
      // Filtre par recherche
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase()
        const searchableText = [
          license.license_key,
          company?.name || '',
          company?.email || '',
          license.license_type,
          license.status
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }
      
      return true
    })
  }

  toggleLicenseSelection(licenseId, selected) {
    if (selected) {
      this.selectedLicenses.add(licenseId)
    } else {
      this.selectedLicenses.delete(licenseId)
    }
    
    // Mettre à jour l'interface des actions en lot
    this.updateBulkActions()
  }

  updateBulkActions() {
    const bulkActionsDiv = document.getElementById('bulk-actions')
    if (!bulkActionsDiv) return
    
    const selectedCount = this.selectedLicenses.size
    
    if (selectedCount > 0) {
      bulkActionsDiv.classList.remove('hidden')
      bulkActionsDiv.querySelector('#selected-count').textContent = selectedCount
    } else {
      bulkActionsDiv.classList.add('hidden')
    }
  }

  changePage(page) {
    const totalPages = Math.ceil(this.getFilteredLicenses().length / this.itemsPerPage)
    
    if (page < 1 || page > totalPages) return
    
    this.currentPage = page
    this.renderLicensesTable()
  }

  async viewLicenseDetails(licenseId) {
    try {
      const license = this.licenses.find(l => l.id === licenseId)
      if (!license) {
        throw new Error('Licence non trouvée')
      }
      
      const company = this.companies.find(c => c.id === license.company_id)
      const licenseType = LicenseTypeManager.getType(license.license_type)
      
      const details = `
📋 DÉTAILS DE LA LICENCE

🔑 Clé: ${license.license_key}
🏢 Entreprise: ${company?.name || 'Inconnue'}
📧 Email: ${company?.email || 'N/A'}
📦 Type: ${license.license_type} (${licenseType?.name || 'N/A'})
📊 Statut: ${license.status}

📅 Créée le: ${new Date(license.created_at).toLocaleDateString('fr-FR')}
⏰ Expire le: ${new Date(license.expires_at).toLocaleDateString('fr-FR')}

📈 Limites:
• Factures: ${license.max_invoices === -1 ? 'Illimité' : license.max_invoices}
• Clients: ${license.max_clients === -1 ? 'Illimité' : license.max_clients}
• Utilisateurs: ${license.max_users === -1 ? 'Illimité' : license.max_users}

🎯 Fonctionnalités: ${license.features?.join(', ') || 'Aucune'}

📝 Notes: ${license.notes || 'Aucune note'}
      `
      
      alert(details)
      
    } catch (error) {
      Logger.error('Error viewing license details', { licenseId, error: error.message })
      alert(`❌ Erreur lors de l'affichage des détails:\n${error.message}`)
    }
  }

  getStatusBadgeClass(status) {
    const classes = {
      'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'EXPIRED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'SUSPENDED': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'REVOKED': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
    return classes[status] || 'bg-gray-100 text-gray-800'
  }

  getStatusIcon(status) {
    const icons = {
      'ACTIVE': '✅',
      'EXPIRED': '❌',
      'SUSPENDED': '⏸️',
      'REVOKED': '🚫'
    }
    return icons[status] || '❓'
  }

  getTypeBadgeClass(type) {
    const classes = {
      'TRIAL': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'BASIC': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'PREMIUM': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'ENTERPRISE': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    }
    return classes[type] || 'bg-gray-100 text-gray-800'
  }

  getTypeIcon(type) {
    const icons = {
      'TRIAL': '🆓',
      'BASIC': '📊',
      'PREMIUM': '⭐',
      'ENTERPRISE': '🏢'
    }
    return icons[type] || '🔑'
  }

  getStatusBadge(status) {
    const badges = {
      'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'EXPIRED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'REVOKED': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
    return badges[status] || badges['EXPIRED']
  }

  getTypeBadge(type) {
    const badges = {
      'TRIAL': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'BASIC': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'PREMIUM': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
    return badges[type] || badges['BASIC']
  }

  async render() {
    const activeLicenses = this.licenses.filter(l => l.status === 'ACTIVE').length
    const expiredLicenses = this.licenses.filter(l => l.status === 'EXPIRED').length
    const trialLicenses = this.licenses.filter(l => l.type === 'TRIAL').length

    return `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Licences</h1>
            <p class="text-gray-600 dark:text-gray-400">Gérez les licences de toutes les entreprises</p>
          </div>
          <button onclick="window.licenseManagement.showGenerateLicenseModal()" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            🔑 Générer une licence
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Licences Actives</p>
                <p id="active-licenses-count" class="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Licences Expirées</p>
                <p id="expired-licenses-count" class="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Expirent bientôt</p>
                <p id="expiring-licenses-count" class="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2v6m0 0a2 2 0 01-2 2m2-2h-6m6 0v-6m0 6H9m6 0H9m0-6h6"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Licences</p>
                <p id="total-licenses-count" class="text-2xl font-semibold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Licenses Table -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                📋 Liste des Licences
              </h3>
              <div class="flex space-x-2">
                <input type="text" placeholder="Rechercher..." class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <select class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">Tous les statuts</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="EXPIRED">Expiré</option>
                  <option value="SUSPENDED">Suspendu</option>
                  <option value="REVOKED">Révoqué</option>
                </select>
              </div>
            </div>
            
            <!-- Bulk Actions (hidden by default) -->
            <div id="bulk-actions" class="hidden mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
              <div class="flex items-center justify-between">
                <span class="text-sm text-blue-700 dark:text-blue-300">
                  <span id="selected-count">0</span> licence(s) sélectionnée(s)
                </span>
                <div class="space-x-2">
                  <button class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                    Prolonger
                  </button>
                  <button class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                    Révoquer
                  </button>
                </div>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <input type="checkbox" class="select-all-checkbox">
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entreprise</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clé de Licence</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Créée le</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Expiration</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody id="licenses-table-body" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <!-- Les licences seront chargées ici par JavaScript -->
                </tbody>
              </table>
            </div>
            
            <!-- Pagination -->
            <div id="pagination" class="hidden mt-4">
              <!-- La pagination sera générée par JavaScript -->
            </div>
          </div>
        </div>
      </div>
    `
  }

  async afterRender() {
    // Exposer l'instance globalement pour les boutons
    window.licenseManagement = this
    
    // Charger les données initiales
    await this.loadData()
    
    // Charger le tableau des licences après le rendu
    setTimeout(() => {
      this.renderLicensesTable()
    }, 100)
  }

  async loadData() {
    try {
      // Charger les licences
      this.licenses = await LicenseService.getLicenses()
      
      // Charger les entreprises
      this.companies = await CompanyService.getCompanies()
      
      console.log('✅ Données des licences chargées:', {
        licenses: this.licenses.length,
        companies: this.companies.length
      })
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error)
      this.licenses = []
      this.companies = []
    }
  }

  showGenerateLicenseModal() {
    // Créer le modal de génération de licence
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'
    modal.id = 'generate-license-modal'
    
    modal.innerHTML = `
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">🔑 Générer une nouvelle licence</h3>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form id="generate-license-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🏢 Entreprise
              </label>
              <select id="company-select" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Sélectionner une entreprise...</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ⭐ Type de licence
              </label>
              <select id="license-type-select" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">Sélectionner un type...</option>
                <option value="TRIAL">🆓 Essai (30 jours)</option>
                <option value="BASIC">🥉 Basic (100 factures/mois)</option>
                <option value="PREMIUM">🥈 Premium (500 factures/mois)</option>
                <option value="ENTERPRISE">🥇 Enterprise (Illimité)</option>
              </select>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📅 Durée
                </label>
                <input type="number" id="license-duration" min="1" max="365" value="30" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📊 Unité
                </label>
                <select id="duration-unit" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="days">Jours</option>
                  <option value="months">Mois</option>
                  <option value="years">Années</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📝 Notes (optionnel)
              </label>
              <textarea id="license-notes" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Notes additionnelles..."></textarea>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
                Annuler
              </button>
              <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                🔑 Générer la licence
              </button>
            </div>
          </form>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Charger les entreprises
    this.loadCompaniesForModal()
    
    // Gérer la soumission du formulaire
    document.getElementById('generate-license-form').addEventListener('submit', (e) => {
      e.preventDefault()
      this.handleGenerateLicense()
    })
  }

  async loadCompaniesForModal() {
    try {
      const companies = await CompanyService.getCompanies()
      const select = document.getElementById('company-select')
      
      if (select) {
        select.innerHTML = '<option value="">Sélectionner une entreprise...</option>'
        companies.forEach(company => {
          const option = document.createElement('option')
          option.value = company.id
          option.textContent = `${company.name} (${company.email})`
          select.appendChild(option)
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des entreprises:', error)
    }
  }

  async handleGenerateLicense() {
    try {
      const companyId = document.getElementById('company-select').value
      const licenseType = document.getElementById('license-type-select').value
      const duration = parseInt(document.getElementById('license-duration').value)
      const unit = document.getElementById('duration-unit').value
      const notes = document.getElementById('license-notes').value
      
      if (!companyId || !licenseType) {
        alert('Veuillez remplir tous les champs obligatoires')
        return
      }
      
      // Calculer la date d'expiration
      const now = new Date()
      let expiresAt = new Date(now)
      
      switch (unit) {
        case 'days':
          expiresAt.setDate(now.getDate() + duration)
          break
        case 'months':
          expiresAt.setMonth(now.getMonth() + duration)
          break
        case 'years':
          expiresAt.setFullYear(now.getFullYear() + duration)
          break
      }
      
      // Générer la licence
      const licenseData = {
        companyId: parseInt(companyId),
        licenseType,
        expiresAt: expiresAt.toISOString(),
        notes: notes || null,
        status: 'ACTIVE'
      }
      
      const newLicense = await LicenseService.createLicense(licenseData)
      
      // Fermer le modal
      document.getElementById('generate-license-modal').remove()
      
      // Recharger les données
      await this.loadData()
      this.renderLicensesTable()
      
      // Afficher un message de succès
      this.showSuccessMessage(`Licence ${newLicense.licenseKey} générée avec succès !`)
      
    } catch (error) {
      console.error('Erreur lors de la génération de la licence:', error)
      alert('Erreur lors de la génération de la licence: ' + error.message)
    }
  }

  showSuccessMessage(message) {
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50'
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  async renderLicensesTable() {
    const tableBody = document.getElementById('licenses-table-body')
    if (!tableBody) return

    try {
      // Charger les licences
      const licenses = await LicenseService.getLicenses()
      
      if (licenses.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="8" class="px-6 py-12 text-center">
              <div class="text-gray-500 dark:text-gray-400">
                <div class="text-6xl mb-4">🔑</div>
                <p class="text-lg font-medium">Aucune licence trouvée</p>
                <p class="text-sm">Commencez par générer votre première licence</p>
                <button onclick="window.licenseManagement.showGenerateLicenseModal()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  🔑 Générer une licence
                </button>
              </div>
            </td>
          </tr>
        `
        return
      }

      // Générer les lignes du tableau
      tableBody.innerHTML = licenses.map(license => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
          <td class="px-6 py-4 whitespace-nowrap">
            <input type="checkbox" class="license-checkbox" data-license-id="${license.id}">
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 w-8 h-8">
                <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span class="text-xs font-medium text-blue-600 dark:text-blue-400">
                    ${license.companyName ? license.companyName.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
              </div>
              <div class="ml-3">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  ${license.companyName || 'Entreprise inconnue'}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  ${license.companyEmail || ''}
                </div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              ${license.licenseKey}
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getLicenseTypeBadge(license.licenseType)}">
              ${this.getLicenseTypeIcon(license.licenseType)} ${license.licenseType}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getLicenseStatusBadge(license.status)}">
              ${this.getLicenseStatusIcon(license.status)} ${this.getLicenseStatusText(license.status)}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
            ${license.createdAt ? new Date(license.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
            <div class="flex flex-col">
              <span class="${this.getExpirationClass(license.expiresAt)}">
                ${license.expiresAt ? new Date(license.expiresAt).toLocaleDateString('fr-FR') : 'Jamais'}
              </span>
              ${this.getExpirationWarning(license.expiresAt)}
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div class="flex items-center space-x-2">
              <button onclick="window.licenseManagement.extendLicense('${license.id}')" 
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" 
                      title="Prolonger">
                ⏰
              </button>
              <button onclick="window.licenseManagement.revokeLicense('${license.id}')" 
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" 
                      title="Révoquer">
                ❌
              </button>
              <button onclick="window.licenseManagement.viewLicenseDetails('${license.id}')" 
                      class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300" 
                      title="Voir détails">
                👁️
              </button>
            </div>
          </td>
        </tr>
      `).join('')

      // Mettre à jour les statistiques
      this.updateLicenseStats(licenses)

    } catch (error) {
      console.error('Erreur lors du chargement des licences:', error)
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="px-6 py-12 text-center text-red-500">
            ❌ Erreur lors du chargement des licences
          </td>
        </tr>
      `
    }
  }

  getLicenseTypeBadge(type) {
    const badges = {
      'TRIAL': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'BASIC': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'PREMIUM': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'ENTERPRISE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
    return badges[type] || 'bg-gray-100 text-gray-800'
  }

  getLicenseTypeIcon(type) {
    const icons = {
      'TRIAL': '🆓',
      'BASIC': '🥉',
      'PREMIUM': '🥈',
      'ENTERPRISE': '🥇'
    }
    return icons[type] || '📄'
  }

  getLicenseStatusBadge(status) {
    const badges = {
      'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'EXPIRED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'SUSPENDED': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'REVOKED': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  getLicenseStatusIcon(status) {
    const icons = {
      'ACTIVE': '✅',
      'EXPIRED': '❌',
      'SUSPENDED': '⏸️',
      'REVOKED': '🚫'
    }
    return icons[status] || '❓'
  }

  getLicenseStatusText(status) {
    const texts = {
      'ACTIVE': 'Actif',
      'EXPIRED': 'Expiré',
      'SUSPENDED': 'Suspendu',
      'REVOKED': 'Révoqué'
    }
    return texts[status] || status
  }

  getExpirationClass(expiresAt) {
    if (!expiresAt) return ''
    
    const now = new Date()
    const expiration = new Date(expiresAt)
    const daysUntilExpiration = Math.ceil((expiration - now) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiration < 0) return 'text-red-600 font-semibold'
    if (daysUntilExpiration <= 7) return 'text-orange-600 font-semibold'
    if (daysUntilExpiration <= 30) return 'text-yellow-600'
    return ''
  }

  getExpirationWarning(expiresAt) {
    if (!expiresAt) return ''
    
    const now = new Date()
    const expiration = new Date(expiresAt)
    const daysUntilExpiration = Math.ceil((expiration - now) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiration < 0) return '<span class="text-xs text-red-500">Expirée</span>'
    if (daysUntilExpiration <= 7) return '<span class="text-xs text-orange-500">Expire bientôt</span>'
    if (daysUntilExpiration <= 30) return '<span class="text-xs text-yellow-500">Expire dans ' + daysUntilExpiration + ' jours</span>'
    return ''
  }

  updateLicenseStats(licenses) {
    const stats = {
      total: licenses.length,
      active: licenses.filter(l => l.status === 'ACTIVE').length,
      expired: licenses.filter(l => l.status === 'EXPIRED').length,
      expiring: 0
    }

    // Calculer les licences qui expirent bientôt
    const now = new Date()
    stats.expiring = licenses.filter(license => {
      if (!license.expiresAt || license.status !== 'ACTIVE') return false
      const expiration = new Date(license.expiresAt)
      const daysUntilExpiration = Math.ceil((expiration - now) / (1000 * 60 * 60 * 24))
      return daysUntilExpiration > 0 && daysUntilExpiration <= 30
    }).length

    // Mettre à jour l'affichage
    const totalElement = document.getElementById('total-licenses-count')
    const activeElement = document.getElementById('active-licenses-count')
    const expiredElement = document.getElementById('expired-licenses-count')
    const expiringElement = document.getElementById('expiring-licenses-count')

    if (totalElement) totalElement.textContent = stats.total
    if (activeElement) activeElement.textContent = stats.active
    if (expiredElement) expiredElement.textContent = stats.expired
    if (expiringElement) expiringElement.textContent = stats.expiring
  }

  // Méthodes d'action sur les licences
  async extendLicense(licenseId) {
    // TODO: Implémenter l'extension de licence
    alert('Fonctionnalité d\'extension de licence à implémenter')
  }

  async revokeLicense(licenseId) {
    if (confirm('Êtes-vous sûr de vouloir révoquer cette licence ?')) {
      try {
        await LicenseService.revokeLicense(licenseId)
        this.showSuccessMessage('Licence révoquée avec succès')
        this.renderLicensesTable()
      } catch (error) {
        console.error('Erreur lors de la révocation:', error)
        alert('Erreur lors de la révocation de la licence')
      }
    }
  }

  async viewLicenseDetails(licenseId) {
    // TODO: Implémenter l'affichage des détails
    alert('Fonctionnalité de détails de licence à implémenter')
  }

  destroy() {
    // Cleanup if needed
    document.removeEventListener('license-updated', () => this.loadData())
    document.removeEventListener('company-updated', () => this.loadData())
  }
}
