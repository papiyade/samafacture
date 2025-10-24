import { CompanyService } from '../services/CompanyService.js'
import { RemoteLicenseControl } from '../services/RemoteLicenseControl.js'
import { NotificationService } from '../../shared/services/NotificationService.js'
import { CompanyManagementActions } from './CompanyManagementActions.js'

/**
 * Company Management Page - CRUD operations for companies
 */
export class CompanyManagement {
  constructor() {
    this.companies = []
    this.filteredCompanies = []
    this.currentPage = 1
    this.itemsPerPage = 10
    this.filters = {
      search: '',
      status: '',
      licenseType: ''
    }
    this.selectedCompany = null
    this.isLoading = false
  }

  async init() {
    await this.loadCompanies()
    this.setupEventListeners()
    console.log('✅ Company Management initialized')
  }

  async loadCompanies() {
    try {
      this.isLoading = true
      this.companies = await CompanyService.getCompanies(this.filters)
      this.applyFilters()
      this.updateCompanyList()
    } catch (error) {
      console.error('Error loading companies:', error)
      NotificationService.error('Erreur lors du chargement des entreprises')
    } finally {
      this.isLoading = false
    }
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      // Create company button
      if (e.target.matches('#create-company-btn')) {
        this.showCreateCompanyModal()
      }
      
      // Edit company button
      if (e.target.matches('.edit-company-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        this.showEditCompanyModal(companyId)
      }
      
      // Delete company button
      if (e.target.matches('.delete-company-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        this.confirmDeleteCompany(companyId)
      }
      
      // View company details
      if (e.target.matches('.view-company-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        this.showCompanyDetails(companyId)
      }
      
      // Generate license file
      if (e.target.matches('.generate-license-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        this.generateLicenseFile(companyId)
      }
      
      // Suspend/Reactivate license
      if (e.target.matches('.suspend-license-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        this.suspendLicense(companyId)
      }
      
      if (e.target.matches('.reactivate-license-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        this.reactivateLicense(companyId)
      }
      
      // Extend license
      if (e.target.matches('.extend-license-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        this.showExtendLicenseModal(companyId)
      }
      
      // Change license type
      if (e.target.matches('.change-license-type-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        this.showChangeLicenseTypeModal(companyId)
      }
      
      // Modal close buttons
      if (e.target.matches('.modal-close') || e.target.matches('.modal-backdrop')) {
        this.closeModals()
      }
      
      // Pagination
      if (e.target.matches('.pagination-btn')) {
        const page = parseInt(e.target.dataset.page)
        this.goToPage(page)
      }
    })

    // Search and filters
    document.addEventListener('input', (e) => {
      if (e.target.matches('#company-search')) {
        this.filters.search = e.target.value
        this.applyFilters()
      }
    })

    document.addEventListener('change', (e) => {
      if (e.target.matches('#status-filter')) {
        this.filters.status = e.target.value
        this.applyFilters()
      }
      
      if (e.target.matches('#license-type-filter')) {
        this.filters.licenseType = e.target.value
        this.applyFilters()
      }
    })

    // Form submissions
    document.addEventListener('submit', (e) => {
      if (e.target.matches('#create-company-form')) {
        e.preventDefault()
        this.handleCreateCompany(e.target)
      }
      
      if (e.target.matches('#edit-company-form')) {
        e.preventDefault()
        this.handleEditCompany(e.target)
      }
      
      if (e.target.matches('#extend-license-form')) {
        e.preventDefault()
        this.handleExtendLicense(e.target)
      }
      
      if (e.target.matches('#change-license-type-form')) {
        e.preventDefault()
        this.handleChangeLicenseType(e.target)
      }
    })
  }

  applyFilters() {
    this.filteredCompanies = this.companies.filter(company => {
      const matchesSearch = !this.filters.search || 
        company.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        company.email.toLowerCase().includes(this.filters.search.toLowerCase())
      
      const matchesStatus = !this.filters.status || company.status === this.filters.status
      const matchesLicenseType = !this.filters.licenseType || company.license_type === this.filters.licenseType
      
      return matchesSearch && matchesStatus && matchesLicenseType
    })
    
    this.currentPage = 1
    this.updateCompanyList()
  }

  updateCompanyList() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = startIndex + this.itemsPerPage
    const paginatedCompanies = this.filteredCompanies.slice(startIndex, endIndex)
    
    const companyListElement = document.getElementById('company-list')
    if (!companyListElement) return
    
    if (this.isLoading) {
      companyListElement.innerHTML = this.renderLoadingState()
      return
    }
    
    if (paginatedCompanies.length === 0) {
      companyListElement.innerHTML = this.renderEmptyState()
      return
    }
    
    companyListElement.innerHTML = paginatedCompanies.map(company => 
      this.renderCompanyCard(company)
    ).join('')
    
    this.updatePagination()
  }

  renderCompanyCard(company) {
    const statusBadge = this.getStatusBadge(company.status)
    const licenseBadge = this.getLicenseBadge(company.license_type, company.license_status)
    const expiryWarning = this.getExpiryWarning(company.expires_at)
    
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                ${company.name}
              </h3>
              ${statusBadge}
              ${licenseBadge}
            </div>
            
            <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div class="flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                </svg>
                ${company.email}
              </div>
              
              ${company.phone ? `
                <div class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  ${company.phone}
                </div>
              ` : ''}
              
              <div class="flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                ${company.invoiceCount || 0} factures • ${(company.revenue || 0).toLocaleString()} XOF
              </div>
              
              <div class="flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Expire le ${new Date(company.expires_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
            
            ${expiryWarning}
          </div>
          
          <div class="flex items-center space-x-2 ml-4">
            <button 
              class="view-company-btn p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              data-company-id="${company.id}"
              title="Voir les détails"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </button>
            
            <button 
              class="edit-company-btn p-2 text-blue-400 hover:text-blue-600 transition-colors"
              data-company-id="${company.id}"
              title="Modifier"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            
            <div class="relative">
              <button 
                class="license-actions-btn p-2 text-green-400 hover:text-green-600 transition-colors"
                data-company-id="${company.id}"
                title="Actions de licence"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </button>
              
              <!-- License Actions Dropdown -->
              <div class="license-actions-dropdown hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <div class="py-1">
                  <button class="generate-license-btn block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" data-company-id="${company.id}">
                    Générer fichier licence
                  </button>
                  
                  ${company.license_status === 'ACTIVE' ? `
                    <button class="suspend-license-btn block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700" data-company-id="${company.id}">
                      Suspendre licence
                    </button>
                  ` : `
                    <button class="reactivate-license-btn block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700" data-company-id="${company.id}">
                      Réactiver licence
                    </button>
                  `}
                  
                  <button class="extend-license-btn block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700" data-company-id="${company.id}">
                    Prolonger licence
                  </button>
                  
                  <button class="change-license-type-btn block w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-gray-100 dark:hover:bg-gray-700" data-company-id="${company.id}">
                    Changer type de licence
                  </button>
                </div>
              </div>
            </div>
            
            <button 
              class="delete-company-btn p-2 text-red-400 hover:text-red-600 transition-colors"
              data-company-id="${company.id}"
              title="Supprimer"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `
  }

  getStatusBadge(status) {
    const badges = {
      ACTIVE: '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">Actif</span>',
      INACTIVE: '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-full">Inactif</span>',
      SUSPENDED: '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">Suspendu</span>'
    }
    return badges[status] || badges.INACTIVE
  }

  getLicenseBadge(licenseType, licenseStatus) {
    const colors = {
      TRIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      BASIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      PREMIUM: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ENTERPRISE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    }
    
    const color = colors[licenseType] || colors.TRIAL
    const status = licenseStatus === 'SUSPENDED' ? ' (Suspendu)' : ''
    
    return `<span class="px-2 py-1 text-xs font-medium ${color} rounded-full">${licenseType}${status}</span>`
  }

  getExpiryWarning(expiresAt) {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return '<div class="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">⚠️ Licence expirée</div>'
    } else if (daysUntilExpiry <= 7) {
      return `<div class="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-600 dark:text-yellow-400">⚠️ Expire dans ${daysUntilExpiry} jour(s)</div>`
    }
    
    return ''
  }

  renderLoadingState() {
    return `
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400">Chargement des entreprises...</span>
      </div>
    `
  }

  renderEmptyState() {
    return `
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune entreprise trouvée</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          ${this.filters.search || this.filters.status || this.filters.licenseType 
            ? 'Aucune entreprise ne correspond aux filtres appliqués.'
            : 'Commencez par créer votre première entreprise.'
          }
        </p>
        ${!this.filters.search && !this.filters.status && !this.filters.licenseType ? `
          <div class="mt-6">
            <button id="create-company-btn" class="btn-primary">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Créer une entreprise
            </button>
          </div>
        ` : ''}
      </div>
    `
  }

  updatePagination() {
    const totalPages = Math.ceil(this.filteredCompanies.length / this.itemsPerPage)
    const paginationElement = document.getElementById('pagination')
    
    if (!paginationElement || totalPages <= 1) {
      if (paginationElement) paginationElement.innerHTML = ''
      return
    }
    
    let paginationHTML = '<div class="flex items-center justify-between mt-6">'
    
    // Info
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredCompanies.length)
    
    paginationHTML += `
      <div class="text-sm text-gray-700 dark:text-gray-300">
        Affichage de ${startItem} à ${endItem} sur ${this.filteredCompanies.length} entreprises
      </div>
    `
    
    // Pagination buttons
    paginationHTML += '<div class="flex space-x-2">'
    
    // Previous button
    if (this.currentPage > 1) {
      paginationHTML += `
        <button class="pagination-btn px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" data-page="${this.currentPage - 1}">
          Précédent
        </button>
      `
    }
    
    // Page numbers
    for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(totalPages, this.currentPage + 2); i++) {
      const isActive = i === this.currentPage
      paginationHTML += `
        <button class="pagination-btn px-3 py-2 text-sm font-medium ${isActive 
          ? 'text-white bg-primary-600 border border-primary-600' 
          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
        } rounded-md" data-page="${i}">
          ${i}
        </button>
      `
    }
    
    // Next button
    if (this.currentPage < totalPages) {
      paginationHTML += `
        <button class="pagination-btn px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" data-page="${this.currentPage + 1}">
          Suivant
        </button>
      `
    }
    
    paginationHTML += '</div></div>'
    
    paginationElement.innerHTML = paginationHTML
  }

  goToPage(page) {
    this.currentPage = page
    this.updateCompanyList()
  }

  showCreateCompanyModal() {
    const modalHTML = `
      <div id="create-company-modal" class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Créer une nouvelle entreprise</h3>
            <button class="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form id="create-company-form" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom de l'entreprise *
                </label>
                <input type="text" name="name" required class="form-input" placeholder="Ex: Mon Entreprise SARL">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input type="email" name="email" required class="form-input" placeholder="contact@monentreprise.com">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone
                </label>
                <input type="tel" name="phone" class="form-input" placeholder="+221 XX XXX XX XX">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type d'activité
                </label>
                <select name="business_type" class="form-select">
                  <option value="">Sélectionner...</option>
                  <option value="commerce">Commerce</option>
                  <option value="service">Service</option>
                  <option value="industrie">Industrie</option>
                  <option value="artisanat">Artisanat</option>
                  <option value="consulting">Consulting</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse
                </label>
                <textarea name="address" rows="2" class="form-input" placeholder="Adresse complète"></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ville
                </label>
                <input type="text" name="city" class="form-input" placeholder="Dakar">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code postal
                </label>
                <input type="text" name="postal_code" class="form-input" placeholder="12345">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pays
                </label>
                <input type="text" name="country" class="form-input" value="Sénégal">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Numéro fiscal
                </label>
                <input type="text" name="tax_number" class="form-input" placeholder="123456789">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Devise
                </label>
                <select name="currency" class="form-select">
                  <option value="XOF" selected>Franc CFA (XOF)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dollar US (USD)</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Taux de taxe par défaut (%)
                </label>
                <input type="number" name="tax_rate" class="form-input" value="18" min="0" max="100" step="0.1">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type de licence
                </label>
                <select name="licenseType" class="form-select">
                  <option value="TRIAL" selected>Essai (30 jours)</option>
                  <option value="BASIC">Basique</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="ENTERPRISE">Entreprise</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Préfixe factures
                </label>
                <input type="text" name="invoice_prefix" class="form-input" value="INV" maxlength="5">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Préfixe devis
                </label>
                <input type="text" name="quote_prefix" class="form-input" value="DEV" maxlength="5">
              </div>
              
              <div class="md:col-span-2">
                <label class="flex items-center">
                  <input type="checkbox" name="memorablePassword" class="form-checkbox">
                  <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Générer un mot de passe mémorisable (recommandé)
                  </span>
                </label>
              </div>
            </div>
            
            <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" class="modal-close btn-secondary">Annuler</button>
              <button type="submit" class="btn-primary">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Créer l'entreprise
              </button>
            </div>
          </form>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
  }

  async showEditCompanyModal(companyId) {
    try {
      const company = this.companies.find(c => c.id === companyId)
      if (!company) {
        NotificationService.error('Entreprise non trouvée')
        return
      }
      
      const modalHTML = `
        <div id="edit-company-modal" class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Modifier l'entreprise</h3>
              <button class="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form id="edit-company-form" class="p-6 space-y-4" data-company-id="${companyId}">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom de l'entreprise *
                  </label>
                  <input type="text" name="name" required class="form-input" value="${company.name}">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input type="email" name="email" required class="form-input" value="${company.email}">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone
                  </label>
                  <input type="tel" name="phone" class="form-input" value="${company.phone || ''}">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type d'activité
                  </label>
                  <select name="business_type" class="form-select">
                    <option value="">Sélectionner...</option>
                    <option value="commerce" ${company.business_type === 'commerce' ? 'selected' : ''}>Commerce</option>
                    <option value="service" ${company.business_type === 'service' ? 'selected' : ''}>Service</option>
                    <option value="industrie" ${company.business_type === 'industrie' ? 'selected' : ''}>Industrie</option>
                    <option value="artisanat" ${company.business_type === 'artisanat' ? 'selected' : ''}>Artisanat</option>
                    <option value="consulting" ${company.business_type === 'consulting' ? 'selected' : ''}>Consulting</option>
                    <option value="autre" ${company.business_type === 'autre' ? 'selected' : ''}>Autre</option>
                  </select>
                </div>
                
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Adresse
                  </label>
                  <textarea name="address" rows="2" class="form-input">${company.address || ''}</textarea>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ville
                  </label>
                  <input type="text" name="city" class="form-input" value="${company.city || ''}">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Code postal
                  </label>
                  <input type="text" name="postal_code" class="form-input" value="${company.postal_code || ''}">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pays
                  </label>
                  <input type="text" name="country" class="form-input" value="${company.country || 'Sénégal'}">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Numéro fiscal
                  </label>
                  <input type="text" name="tax_number" class="form-input" value="${company.tax_number || ''}">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Devise
                  </label>
                  <select name="currency" class="form-select">
                    <option value="XOF" ${company.currency === 'XOF' ? 'selected' : ''}>Franc CFA (XOF)</option>
                    <option value="EUR" ${company.currency === 'EUR' ? 'selected' : ''}>Euro (EUR)</option>
                    <option value="USD" ${company.currency === 'USD' ? 'selected' : ''}>Dollar US (USD)</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Taux de taxe par défaut (%)
                  </label>
                  <input type="number" name="tax_rate" class="form-input" value="${company.tax_rate || 18}" min="0" max="100" step="0.1">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Préfixe factures
                  </label>
                  <input type="text" name="invoice_prefix" class="form-input" value="${company.invoice_prefix || 'INV'}" maxlength="5">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Préfixe devis
                  </label>
                  <input type="text" name="quote_prefix" class="form-input" value="${company.quote_prefix || 'DEV'}" maxlength="5">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <select name="status" class="form-select">
                    <option value="ACTIVE" ${company.status === 'ACTIVE' ? 'selected' : ''}>Actif</option>
                    <option value="INACTIVE" ${company.status === 'INACTIVE' ? 'selected' : ''}>Inactif</option>
                    <option value="SUSPENDED" ${company.status === 'SUSPENDED' ? 'selected' : ''}>Suspendu</option>
                  </select>
                </div>
              </div>
              
              <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" class="modal-close btn-secondary">Annuler</button>
                <button type="submit" class="btn-primary">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      `
      
      document.body.insertAdjacentHTML('beforeend', modalHTML)
    } catch (error) {
      console.error('Error showing edit modal:', error)
      NotificationService.error('Erreur lors de l\'ouverture du formulaire')
    }
  }

  async handleCreateCompany(form) {
    try {
      const formData = new FormData(form)
      const companyData = Object.fromEntries(formData.entries())
      
      // Convert checkbox to boolean
      companyData.memorablePassword = formData.has('memorablePassword')
      
      // Convert numeric fields
      companyData.tax_rate = parseFloat(companyData.tax_rate) || 18
      
      const submitButton = form.querySelector('button[type="submit"]')
      const originalText = submitButton.innerHTML
      
      submitButton.disabled = true
      submitButton.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Création en cours...
      `
      
      const result = await CompanyService.createCompany(companyData)
      
      NotificationService.success(`Entreprise "${result.name}" créée avec succès !`)
      
      // Show credentials modal
      this.showCredentialsModal(result.credentials, result.name)
      
      // Refresh company list
      await this.loadCompanies()
      
      // Close modal
      this.closeModals()
      
    } catch (error) {
      console.error('Error creating company:', error)
      NotificationService.error(error.message || 'Erreur lors de la création de l\'entreprise')
      
      // Reset button
      const submitButton = form.querySelector('button[type="submit"]')
      if (submitButton) {
        submitButton.disabled = false
        submitButton.innerHTML = originalText
      }
    }
  }

  async handleEditCompany(form) {
    try {
      const companyId = parseInt(form.dataset.companyId)
      const formData = new FormData(form)
      const updates = Object.fromEntries(formData.entries())
      
      // Convert numeric fields
      updates.tax_rate = parseFloat(updates.tax_rate) || 18
      
      const submitButton = form.querySelector('button[type="submit"]')
      const originalText = submitButton.innerHTML
      
      submitButton.disabled = true
      submitButton.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Enregistrement...
      `
      
      const result = await CompanyService.updateCompany(companyId, updates)
      
      NotificationService.success(`Entreprise "${result.name}" modifiée avec succès !`)
      
      // Refresh company list
      await this.loadCompanies()
      
      // Close modal
      this.closeModals()
      
    } catch (error) {
      console.error('Error updating company:', error)
      NotificationService.error(error.message || 'Erreur lors de la modification de l\'entreprise')
      
      // Reset button
      const submitButton = form.querySelector('button[type="submit"]')
      if (submitButton) {
        submitButton.disabled = false
        submitButton.innerHTML = originalText
      }
    }
  }

  showCredentialsModal(credentials, companyName) {
    const modalHTML = `
      <div id="credentials-modal" class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="p-6">
            <div class="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Entreprise créée avec succès !
            </h3>
            
            <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              Voici les identifiants de connexion pour <strong>${companyName}</strong>
            </p>
            
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Nom d'utilisateur
                  </label>
                  <div class="flex items-center justify-between mt-1">
                    <code class="text-sm font-mono text-gray-900 dark:text-white">${credentials.username}</code>
                    <button onclick="navigator.clipboard.writeText('${credentials.username}')" class="text-blue-600 hover:text-blue-800 text-xs">
                      Copier
                    </button>
                  </div>
                </div>
                
                <div>
                  <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Mot de passe
                  </label>
                  <div class="flex items-center justify-between mt-1">
                    <code class="text-sm font-mono text-gray-900 dark:text-white">${credentials.password}</code>
                    <button onclick="navigator.clipboard.writeText('${credentials.password}')" class="text-blue-600 hover:text-blue-800 text-xs">
                      Copier
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
              <div class="flex">
                <svg class="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                <div>
                  <p class="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Important !</p>
                  <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Ces identifiants ne seront affichés qu'une seule fois. Assurez-vous de les communiquer au client.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="flex space-x-3">
              <button onclick="navigator.clipboard.writeText('Nom d\\'utilisateur: ${credentials.username}\\nMot de passe: ${credentials.password}')" class="flex-1 btn-secondary text-sm">
                Copier tout
              </button>
              <button class="modal-close flex-1 btn-primary text-sm">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
  }

  // License actions using the actions helper
  async generateLicenseFile(companyId) {
    await CompanyManagementActions.generateLicenseFile(companyId)
  }

  async suspendLicense(companyId) {
    const success = await CompanyManagementActions.suspendLicense(companyId)
    if (success) await this.loadCompanies()
  }

  async reactivateLicense(companyId) {
    const success = await CompanyManagementActions.reactivateLicense(companyId)
    if (success) await this.loadCompanies()
  }

  async handleExtendLicense(form) {
    const companyId = parseInt(form.dataset.companyId)
    const formData = new FormData(form)
    const days = parseInt(formData.get('days'))
    
    const success = await CompanyManagementActions.extendLicense(companyId, days)
    if (success) {
      await this.loadCompanies()
      this.closeModals()
    }
  }

  async handleChangeLicenseType(form) {
    const companyId = parseInt(form.dataset.companyId)
    const formData = new FormData(form)
    const newLicenseType = formData.get('licenseType')
    
    const success = await CompanyManagementActions.changeLicenseType(companyId, newLicenseType)
    if (success) {
      await this.loadCompanies()
      this.closeModals()
    }
  }

  async confirmDeleteCompany(companyId) {
    const company = this.companies.find(c => c.id === companyId)
    if (!company) return
    
    const success = await CompanyManagementActions.deleteCompany(companyId, company.name)
    if (success) await this.loadCompanies()
  }

  // Modal methods
  showExtendLicenseModal(companyId) {
    const company = this.companies.find(c => c.id === companyId)
    if (!company) return
    
    const modalHTML = `
      <div id="extend-license-modal" class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Prolonger la licence</h3>
            <button class="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form id="extend-license-form" class="p-6" data-company-id="${companyId}">
            <div class="mb-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <strong>${company.name}</strong><br>
                Expire actuellement le : <strong>${new Date(company.expires_at).toLocaleDateString('fr-FR')}</strong>
              </p>
              
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de jours à ajouter
              </label>
              <input 
                type="number" 
                name="days" 
                required 
                min="1" 
                max="3650" 
                value="30"
                class="form-input"
                placeholder="30"
              >
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum : 10 ans (3650 jours)
              </p>
            </div>
            
            <div class="flex items-center justify-end space-x-3">
              <button type="button" class="modal-close btn-secondary">Annuler</button>
              <button type="submit" class="btn-primary">Prolonger la licence</button>
            </div>
          </form>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
  }

  showChangeLicenseTypeModal(companyId) {
    const company = this.companies.find(c => c.id === companyId)
    if (!company) return
    
    const modalHTML = `
      <div id="change-license-type-modal" class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Changer le type de licence</h3>
            <button class="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form id="change-license-type-form" class="p-6" data-company-id="${companyId}">
            <div class="mb-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <strong>${company.name}</strong><br>
                Type actuel : <strong>${company.license_type}</strong>
              </p>
              
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouveau type de licence
              </label>
              <select name="licenseType" required class="form-select">
                <option value="">Sélectionner...</option>
                <option value="TRIAL" ${company.license_type === 'TRIAL' ? 'disabled' : ''}>Essai (30 jours)</option>
                <option value="BASIC" ${company.license_type === 'BASIC' ? 'disabled' : ''}>Basique</option>
                <option value="PREMIUM" ${company.license_type === 'PREMIUM' ? 'disabled' : ''}>Premium</option>
                <option value="ENTERPRISE" ${company.license_type === 'ENTERPRISE' ? 'disabled' : ''}>Entreprise</option>
              </select>
              
              <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <p class="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Note :</strong> Changer le type de licence générera une nouvelle clé de licence. 
                  L'entreprise devra télécharger un nouveau fichier de licence.
                </p>
              </div>
            </div>
            
            <div class="flex items-center justify-end space-x-3">
              <button type="button" class="modal-close btn-secondary">Annuler</button>
              <button type="submit" class="btn-primary">Changer le type</button>
            </div>
          </form>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
  }

  async showCompanyDetails(companyId) {
    const company = this.companies.find(c => c.id === companyId)
    if (!company) return
    
    const modalHTML = `
      <div id="company-details-modal" class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Détails de l'entreprise</h3>
            <button class="modal-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Company Info -->
              <div class="space-y-4">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white">Informations générales</h4>
                
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <div>
                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Nom</label>
                    <p class="text-sm text-gray-900 dark:text-white font-medium">${company.name}</p>
                  </div>
                  
                  <div>
                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</label>
                    <p class="text-sm text-gray-900 dark:text-white">${company.email}</p>
                  </div>
                  
                  ${company.phone ? `
                    <div>
                      <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Téléphone</label>
                      <p class="text-sm text-gray-900 dark:text-white">${company.phone}</p>
                    </div>
                  ` : ''}
                  
                  <div class="flex items-center space-x-2">
                    <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Statut :</span>
                    ${this.getStatusBadge(company.status)}
                  </div>
                </div>
              </div>
              
              <!-- License Info -->
              <div class="space-y-4">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white">Licence</h4>
                
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                  <div class="flex items-center space-x-2">
                    <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type :</span>
                    ${this.getLicenseBadge(company.license_type, company.license_status)}
                  </div>
                  
                  <div>
                    <label class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Expire le</label>
                    <p class="text-sm text-gray-900 dark:text-white">${new Date(company.expires_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  
                  ${this.getExpiryWarning(company.expires_at)}
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div class="flex flex-wrap gap-3">
                <button class="edit-company-btn btn-primary" data-company-id="${company.id}">
                  Modifier
                </button>
                
                <button class="generate-license-btn btn-secondary" data-company-id="${company.id}">
                  Télécharger licence
                </button>
                
                <button class="extend-license-btn btn-secondary" data-company-id="${company.id}">
                  Prolonger licence
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
  }

  closeModals() {
    const modals = document.querySelectorAll('.modal-backdrop')
    modals.forEach(modal => modal.remove())
  }

  async render() {
    return `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Entreprises</h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gérez les entreprises clientes et leurs licences
            </p>
          </div>
          <button id="create-company-btn" class="btn-primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Nouvelle Entreprise
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recherche</label>
              <input 
                type="text" 
                id="company-search" 
                placeholder="Nom ou email..." 
                class="form-input"
                value="${this.filters.search}"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
              <select id="status-filter" class="form-select">
                <option value="">Tous les statuts</option>
                <option value="ACTIVE" ${this.filters.status === 'ACTIVE' ? 'selected' : ''}>Actif</option>
                <option value="INACTIVE" ${this.filters.status === 'INACTIVE' ? 'selected' : ''}>Inactif</option>
                <option value="SUSPENDED" ${this.filters.status === 'SUSPENDED' ? 'selected' : ''}>Suspendu</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de licence</label>
              <select id="license-type-filter" class="form-select">
                <option value="">Tous les types</option>
                <option value="TRIAL" ${this.filters.licenseType === 'TRIAL' ? 'selected' : ''}>Essai</option>
                <option value="BASIC" ${this.filters.licenseType === 'BASIC' ? 'selected' : ''}>Basique</option>
                <option value="PREMIUM" ${this.filters.licenseType === 'PREMIUM' ? 'selected' : ''}>Premium</option>
                <option value="ENTERPRISE" ${this.filters.licenseType === 'ENTERPRISE' ? 'selected' : ''}>Entreprise</option>
              </select>
            </div>
            
            <div class="flex items-end">
              <button 
                onclick="window.location.reload()" 
                class="btn-secondary w-full"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Actualiser
              </button>
            </div>
          </div>
        </div>

        <!-- Company List -->
        <div id="company-list" class="space-y-4">
          ${this.renderLoadingState()}
        </div>

        <!-- Pagination -->
        <div id="pagination"></div>
      </div>
    `
  }
}
