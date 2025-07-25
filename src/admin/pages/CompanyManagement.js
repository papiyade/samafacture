import { I18nService } from '../../shared/services/I18nService.js'
import { AdminDatabaseService } from '../services/AdminDatabaseService.js'
import { CompanyService } from '../services/CompanyService.js'
import { CompanyModal } from '../components/CompanyModal.js'
import { CredentialsDisplay } from '../components/CredentialsDisplay.js'

/**
 * Company Management Page - Manage all registered companies
 */
export class CompanyManagement {
  constructor() {
    this.companies = []
    this.companyModal = new CompanyModal()
    this.credentialsDisplay = new CredentialsDisplay()
    this.currentFilters = {}
    this.isLoading = false
  }

  async init() {
    try {
      // Initialize database if not already done
      if (!AdminDatabaseService.isInitialized) {
        await AdminDatabaseService.init()
      }
      
      await this.loadCompanies()
      console.log('✅ Company Management initialized')
    } catch (error) {
      console.error('❌ Error initializing Company Management:', error)
      this.showError('Erreur lors de l\'initialisation de la gestion des entreprises')
    }
  }

  async afterRender() {
    // Setup event listeners after DOM is ready
    this.setupEventListeners()
    console.log('✅ Company Management event listeners attached')
  }

  async loadCompanies(filters = {}) {
    try {
      this.isLoading = true
      this.showLoadingState()
      
      this.companies = await CompanyService.getCompanies(filters)
      this.currentFilters = filters
      
      // Re-render the page with new data
      await this.refreshView()
      
    } catch (error) {
      console.error('❌ Error loading companies:', error)
      this.showError('Erreur lors du chargement des entreprises')
    } finally {
      this.isLoading = false
      this.hideLoadingState()
    }
  }

  setupEventListeners() {
    // Company actions
    document.addEventListener('click', async (e) => {
      if (e.target.matches('#add-company-btn')) {
        this.showAddCompanyModal()
      }
      if (e.target.matches('.edit-company-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        await this.editCompany(companyId)
      }
      if (e.target.matches('.delete-company-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        await this.deleteCompany(companyId)
      }
      if (e.target.matches('.regenerate-credentials-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        await this.regenerateCredentials(companyId)
      }
      if (e.target.matches('.toggle-status-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        await this.toggleCompanyStatus(companyId)
      }
    })

    // Search and filters
    const searchInput = document.getElementById('company-search')
    if (searchInput) {
      let searchTimeout
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
          this.applyFilters({ search: e.target.value })
        }, 500)
      })
    }

    const statusFilter = document.getElementById('status-filter')
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.applyFilters({ status: e.target.value })
      })
    }

    const licenseFilter = document.getElementById('license-filter')
    if (licenseFilter) {
      licenseFilter.addEventListener('change', (e) => {
        this.applyFilters({ licenseType: e.target.value })
      })
    }
  }

  showAddCompanyModal() {
    this.companyModal.openForCreate(
      async (companyData) => {
        await this.createCompany(companyData)
      },
      () => {
        console.log('Add company cancelled')
      }
    )
  }

  async editCompany(companyId) {
    try {
      const company = await CompanyService.getCompany(companyId)
      if (!company) {
        this.showError('Entreprise non trouvée')
        return
      }

      this.companyModal.openForEdit(
        company,
        async (updates) => {
          await this.updateCompany(companyId, updates)
        },
        () => {
          console.log('Edit company cancelled')
        }
      )
    } catch (error) {
      console.error('❌ Error loading company for edit:', error)
      this.showError('Erreur lors du chargement de l\'entreprise')
    }
  }

  async deleteCompany(companyId) {
    const company = this.companies.find(c => c.id === companyId)
    if (!company) return

    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer l'entreprise "${company.name}" ?\n\n` +
      'Cette action est irréversible et supprimera également :\n' +
      '• Toutes les licences associées\n' +
      '• L\'historique des activités\n' +
      '• Les données de connexion'
    )

    if (!confirmed) return

    try {
      await CompanyService.deleteCompany(companyId)
      this.showSuccess(`Entreprise "${company.name}" supprimée avec succès`)
      await this.loadCompanies(this.currentFilters)
    } catch (error) {
      console.error('❌ Error deleting company:', error)
      this.showError('Erreur lors de la suppression de l\'entreprise')
    }
  }

  async createCompany(companyData) {
    try {
      const result = await CompanyService.createCompany(companyData)
      
      this.showSuccess(`Entreprise "${result.name}" créée avec succès !`)
      
      // Show credentials to admin
      this.credentialsDisplay.show(
        result.credentials,
        result.name,
        () => {
          console.log('Credentials modal closed')
        }
      )
      
      // Reload companies list
      await this.loadCompanies(this.currentFilters)
      
    } catch (error) {
      console.error('❌ Error creating company:', error)
      throw new Error(error.message || 'Erreur lors de la création de l\'entreprise')
    }
  }

  async updateCompany(companyId, updates) {
    try {
      const updatedCompany = await CompanyService.updateCompany(companyId, updates)
      this.showSuccess(`Entreprise "${updatedCompany.name}" mise à jour avec succès`)
      await this.loadCompanies(this.currentFilters)
    } catch (error) {
      console.error('❌ Error updating company:', error)
      throw new Error(error.message || 'Erreur lors de la mise à jour de l\'entreprise')
    }
  }

  async regenerateCredentials(companyId) {
    const company = this.companies.find(c => c.id === companyId)
    if (!company) return

    const confirmed = confirm(
      `Régénérer les identifiants de connexion pour "${company.name}" ?\n\n` +
      'L\'ancien mot de passe ne fonctionnera plus après cette opération.'
    )

    if (!confirmed) return

    try {
      const newCredentials = await CompanyService.regenerateCredentials(companyId, false)
      
      this.showSuccess('Nouveaux identifiants générés avec succès !')
      
      // Show new credentials
      this.credentialsDisplay.show(
        newCredentials,
        company.name,
        () => {
          console.log('New credentials modal closed')
        }
      )
      
    } catch (error) {
      console.error('❌ Error regenerating credentials:', error)
      this.showError('Erreur lors de la régénération des identifiants')
    }
  }

  async toggleCompanyStatus(companyId) {
    const company = this.companies.find(c => c.id === companyId)
    if (!company) return

    const newStatus = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    const action = newStatus === 'ACTIVE' ? 'réactiver' : 'suspendre'

    const confirmed = confirm(`Voulez-vous ${action} l'entreprise "${company.name}" ?`)
    if (!confirmed) return

    try {
      if (newStatus === 'SUSPENDED') {
        await CompanyService.suspendCompany(companyId)
        this.showSuccess('Entreprise suspendue avec succès')
      } else {
        await CompanyService.activateCompany(companyId)
        this.showSuccess('Entreprise réactivée avec succès')
      }
      
      await this.loadCompanies(this.currentFilters)
    } catch (error) {
      console.error('❌ Error toggling company status:', error)
      this.showError(error.message || 'Erreur lors du changement de statut')
    }
  }

  async applyFilters(newFilters) {
    const filters = { ...this.currentFilters, ...newFilters }
    await this.loadCompanies(filters)
  }

  async render() {
    return `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Entreprises</h1>
            <p class="text-gray-600 dark:text-gray-400">Gérez toutes les entreprises enregistrées</p>
          </div>
          <button id="add-company-btn" class="btn btn-primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Ajouter une entreprise
          </button>
        </div>

        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rechercher
              </label>
              <input type="text" id="company-search" placeholder="Nom ou email..."
                     class="form-input w-full" value="${this.currentFilters.search || ''}">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select id="status-filter" class="form-select w-full">
                <option value="">Tous les statuts</option>
                <option value="ACTIVE" ${this.currentFilters.status === 'ACTIVE' ? 'selected' : ''}>Actif</option>
                <option value="SUSPENDED" ${this.currentFilters.status === 'SUSPENDED' ? 'selected' : ''}>Suspendu</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de licence
              </label>
              <select id="license-filter" class="form-select w-full">
                <option value="">Tous les types</option>
                <option value="TRIAL" ${this.currentFilters.licenseType === 'TRIAL' ? 'selected' : ''}>Essai</option>
                <option value="BASIC" ${this.currentFilters.licenseType === 'BASIC' ? 'selected' : ''}>Basic</option>
                <option value="PREMIUM" ${this.currentFilters.licenseType === 'PREMIUM' ? 'selected' : ''}>Premium</option>
              </select>
            </div>
            <div class="flex items-end">
              <button onclick="location.reload()" class="btn btn-secondary w-full">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Actualiser
              </button>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entreprises</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.companies.length}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Licences Actives</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.companies.filter(c => c.license === 'ACTIVE').length}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Licences Expirées</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.companies.filter(c => c.license === 'EXPIRED').length}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">CA Total</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.companies.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()} €</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Companies Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Liste des Entreprises</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entreprise</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Licence</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dernière Activité</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Factures</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CA</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                ${this.companies.length === 0 ? `
                  <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                      <div class="text-gray-500 dark:text-gray-400">
                        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        <p class="text-lg font-medium">Aucune entreprise trouvée</p>
                        <p class="text-sm">Commencez par ajouter votre première entreprise</p>
                        <button onclick="document.getElementById('add-company-btn').click()" class="mt-4 btn btn-primary">
                          Ajouter une entreprise
                        </button>
                      </div>
                    </td>
                  </tr>
                ` : this.companies.map(company => `
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 w-10 h-10">
                          ${company.logo_url ? `
                            <img class="w-10 h-10 rounded-full object-cover" src="${company.logo_url}" alt="${company.name}">
                          ` : `
                            <div class="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                                ${company.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          `}
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900 dark:text-white">${company.name}</div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">${company.email}</div>
                          ${company.business_type ? `<div class="text-xs text-gray-400 dark:text-gray-500">${company.business_type}</div>` : ''}
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex flex-col space-y-1">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          company.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }">
                          ${company.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                        </span>
                        ${company.license_type ? `
                          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            company.license_status === 'ACTIVE' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }">
                            ${company.license_type}
                          </span>
                        ` : ''}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${company.lastActivity || 'Jamais'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${company.invoiceCount || 0}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${(company.revenue || 0).toLocaleString()} ${company.currency || 'XOF'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex items-center space-x-2">
                        <button class="edit-company-btn text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" 
                                data-company-id="${company.id}" title="Modifier">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button class="regenerate-credentials-btn text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" 
                                data-company-id="${company.id}" title="Régénérer les identifiants">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2v6m0 0a2 2 0 01-2 2m2-2h-6m6 0v-6m0 6H9m6 0H9m0-6h6"></path>
                          </svg>
                        </button>
                        <button class="toggle-status-btn ${company.status === 'ACTIVE' ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'}" 
                                data-company-id="${company.id}" title="${company.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}">
                          ${company.status === 'ACTIVE' ? `
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          ` : `
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a3 3 0 016 0v2M5 12h14l-1 7H6l-1-7z"></path>
                            </svg>
                          `}
                        </button>
                        <button class="delete-company-btn text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" 
                                data-company-id="${company.id}" title="Supprimer">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
  }

  // Utility methods
  async refreshView() {
    const mainContent = document.getElementById('admin-main-content')
    if (mainContent) {
      const newContent = await this.render()
      mainContent.innerHTML = newContent
      this.setupEventListeners()
    }
  }

  showLoadingState() {
    const mainContent = document.getElementById('admin-main-content')
    if (mainContent) {
      const loadingOverlay = document.createElement('div')
      loadingOverlay.id = 'loading-overlay'
      loadingOverlay.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-40'
      loadingOverlay.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
          <div class="loading-spinner w-6 h-6"></div>
          <span class="text-gray-700 dark:text-gray-300">Chargement...</span>
        </div>
      `
      document.body.appendChild(loadingOverlay)
    }
  }

  hideLoadingState() {
    const loadingOverlay = document.getElementById('loading-overlay')
    if (loadingOverlay) {
      loadingOverlay.remove()
    }
  }

  showSuccess(message) {
    this.showNotification(message, 'success')
  }

  showError(message) {
    this.showNotification(message, 'error')
  }

  showNotification(message, type = 'info') {
    const notificationId = 'notification-' + Date.now()
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }[type] || 'bg-blue-500'

    const notification = document.createElement('div')
    notification.id = notificationId
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full`
    notification.innerHTML = `
      <div class="flex items-center">
        <span>${message}</span>
        <button onclick="document.getElementById('${notificationId}').remove()" class="ml-4 text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `

    document.body.appendChild(notification)
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full')
    }, 100)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (document.getElementById(notificationId)) {
        notification.classList.add('translate-x-full')
        setTimeout(() => notification.remove(), 300)
      }
    }, 5000)
  }

  destroy() {
    // Cleanup if needed
    this.companyModal = null
    this.credentialsDisplay = null
  }
}
