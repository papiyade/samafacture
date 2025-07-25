import { I18nService } from '../../shared/services/I18nService.js'

/**
 * License Management Page - Manage licenses for all companies
 */
export class LicenseManagement {
  constructor() {
    this.licenses = []
  }

  async init() {
    await this.loadLicenses()
    this.setupEventListeners()
  }

  async loadLicenses() {
    // TODO: Load licenses from admin API
    this.licenses = [
      {
        id: 1,
        companyName: 'Entreprise Demo 1',
        licenseKey: 'SAMA-2024-ABCD-1234',
        type: 'PREMIUM',
        status: 'ACTIVE',
        createdAt: '2024-01-01',
        expiresAt: '2024-12-31',
        maxInvoices: 1000,
        usedInvoices: 45
      },
      {
        id: 2,
        companyName: 'Entreprise Demo 2',
        licenseKey: 'SAMA-2024-EFGH-5678',
        type: 'BASIC',
        status: 'EXPIRED',
        createdAt: '2023-06-01',
        expiresAt: '2024-01-01',
        maxInvoices: 100,
        usedInvoices: 23
      },
      {
        id: 3,
        companyName: 'Entreprise Demo 3',
        licenseKey: 'SAMA-2024-IJKL-9012',
        type: 'TRIAL',
        status: 'ACTIVE',
        createdAt: '2024-01-20',
        expiresAt: '2024-02-20',
        maxInvoices: 10,
        usedInvoices: 3
      }
    ]
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

  showGenerateLicenseModal() {
    alert('Fonctionnalité à implémenter : Générer une nouvelle licence')
  }

  extendLicense(licenseId) {
    alert(`Fonctionnalité à implémenter : Prolonger la licence ${licenseId}`)
  }

  revokeLicense(licenseId) {
    if (confirm('Êtes-vous sûr de vouloir révoquer cette licence ?')) {
      alert(`Fonctionnalité à implémenter : Révoquer la licence ${licenseId}`)
    }
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
          <button id="generate-license-btn" class="btn btn-primary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2v6m0 0a2 2 0 01-2 2m2-2h-6m6 0v-6m0 6H9m6 0H9m0-6h6"></path>
            </svg>
            Générer une licence
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
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${activeLicenses}</p>
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
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${expiredLicenses}</p>
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
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Licences d'Essai</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${trialLicenses}</p>
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
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.licenses.length}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Licenses Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Liste des Licences</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entreprise</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Clé de Licence</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Expiration</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usage</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                ${this.licenses.map(license => `
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">${license.companyName}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-mono text-gray-900 dark:text-white">${license.licenseKey}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getTypeBadge(license.type)}">
                        ${license.type}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getStatusBadge(license.status)}">
                        ${license.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${license.expiresAt}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 dark:text-white">${license.usedInvoices}/${license.maxInvoices}</div>
                      <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${(license.usedInvoices / license.maxInvoices) * 100}%"></div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button class="extend-license-btn text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3" data-license-id="${license.id}">
                        Prolonger
                      </button>
                      <button class="revoke-license-btn text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" data-license-id="${license.id}">
                        Révoquer
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
