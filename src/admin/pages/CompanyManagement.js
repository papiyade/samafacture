import { I18nService } from '../../shared/services/I18nService.js'

/**
 * Company Management Page - Manage all registered companies
 */
export class CompanyManagement {
  constructor() {
    this.companies = []
  }

  async init() {
    await this.loadCompanies()
    this.setupEventListeners()
  }

  async loadCompanies() {
    // TODO: Load companies from admin API
    this.companies = [
      {
        id: 1,
        name: 'Entreprise Demo 1',
        email: 'demo1@example.com',
        license: 'ACTIVE',
        lastActivity: '2024-01-15',
        invoiceCount: 45,
        revenue: 125000
      },
      {
        id: 2,
        name: 'Entreprise Demo 2', 
        email: 'demo2@example.com',
        license: 'EXPIRED',
        lastActivity: '2024-01-10',
        invoiceCount: 23,
        revenue: 67000
      }
    ]
  }

  setupEventListeners() {
    // Add company button
    document.addEventListener('click', (e) => {
      if (e.target.matches('#add-company-btn')) {
        this.showAddCompanyModal()
      }
      if (e.target.matches('.edit-company-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        this.editCompany(companyId)
      }
      if (e.target.matches('.delete-company-btn')) {
        const companyId = parseInt(e.target.dataset.companyId)
        this.deleteCompany(companyId)
      }
    })
  }

  showAddCompanyModal() {
    // TODO: Implement add company modal
    alert('Fonctionnalité à implémenter : Ajouter une entreprise')
  }

  editCompany(companyId) {
    // TODO: Implement edit company
    alert(`Fonctionnalité à implémenter : Modifier l'entreprise ${companyId}`)
  }

  deleteCompany(companyId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      // TODO: Implement delete company
      alert(`Fonctionnalité à implémenter : Supprimer l'entreprise ${companyId}`)
    }
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
                ${this.companies.map(company => `
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">${company.name}</div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">${company.email}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        company.license === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }">
                        ${company.license}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${company.lastActivity}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${company.invoiceCount}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${company.revenue.toLocaleString()} €</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button class="edit-company-btn text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3" data-company-id="${company.id}">
                        Modifier
                      </button>
                      <button class="delete-company-btn text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" data-company-id="${company.id}">
                        Supprimer
                      </button>
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

  destroy() {
    // Cleanup if needed
  }
}
