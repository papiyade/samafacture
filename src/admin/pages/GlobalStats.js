import { I18nService } from '../../shared/services/I18nService.js'

/**
 * Global Statistics Page - Display global statistics across all companies
 */
export class GlobalStats {
  constructor() {
    this.stats = {}
  }

  async init() {
    await this.loadStats()
    this.setupEventListeners()
    this.initCharts()
  }

  async loadStats() {
    try {
      // TODO: Load stats from admin API
      this.stats = {
        totalCompanies: 15,
        activeCompanies: 12,
        totalRevenue: 2450000,
        totalInvoices: 1250,
        averageRevenuePerCompany: 163333,
        monthlyGrowth: 12.5,
      topCompanies: [
        { name: 'Entreprise Alpha', revenue: 450000, invoices: 180 },
        { name: 'Entreprise Beta', revenue: 380000, invoices: 145 },
        { name: 'Entreprise Gamma', revenue: 320000, invoices: 120 },
        { name: 'Entreprise Delta', revenue: 280000, invoices: 95 },
        { name: 'Entreprise Epsilon', revenue: 250000, invoices: 85 }
      ],
      monthlyData: [
        { month: 'Jan', revenue: 180000, invoices: 95 },
        { month: 'Fév', revenue: 220000, invoices: 110 },
        { month: 'Mar', revenue: 195000, invoices: 102 },
        { month: 'Avr', revenue: 240000, invoices: 125 },
        { month: 'Mai', revenue: 280000, invoices: 145 },
        { month: 'Jun', revenue: 320000, invoices: 165 }
      ],
      licenseDistribution: {
        trial: 3,
        basic: 7,
        premium: 5
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      // Default values in case of error
      this.stats = {
        totalCompanies: 0,
        activeCompanies: 0,
        totalRevenue: 0,
        totalInvoices: 0,
        averageRevenuePerCompany: 0,
        monthlyGrowth: 0,
        topCompanies: [],
        monthlyData: [],
        licenseDistribution: {
          trial: 0,
          basic: 0,
          premium: 0
        }
      }
    }
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('#export-stats-btn')) {
        this.exportStats()
      }
      if (e.target.matches('#refresh-stats-btn')) {
        this.refreshStats()
      }
    })
  }

  exportStats() {
    alert('Fonctionnalité à implémenter : Exporter les statistiques')
  }

  async refreshStats() {
    alert('Fonctionnalité à implémenter : Actualiser les statistiques')
  }

  initCharts() {
    // TODO: Initialize Chart.js charts
    console.log('Charts would be initialized here with Chart.js')
  }

  async render() {
    return `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Statistiques Globales</h1>
            <p class="text-gray-600 dark:text-gray-400">Vue d'ensemble des performances de toutes les entreprises</p>
          </div>
          <div class="flex space-x-3">
            <button id="refresh-stats-btn" class="btn btn-secondary">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Actualiser
            </button>
            <button id="export-stats-btn" class="btn btn-primary">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Exporter
            </button>
          </div>
        </div>

        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Entreprises</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.stats.totalCompanies}</p>
                <p class="text-sm text-green-600 dark:text-green-400">${this.stats.activeCompanies} actives</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">CA Total</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${(this.stats.totalRevenue || 0).toLocaleString()} XOF</p>
                <p class="text-sm text-green-600 dark:text-green-400">+${this.stats.monthlyGrowth}% ce mois</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Factures</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.stats.totalInvoices}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Toutes entreprises</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">CA Moyen</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">${(this.stats.averageRevenuePerCompany || 0).toLocaleString()} XOF</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Par entreprise</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Revenue Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Évolution du CA</h3>
              <div class="text-sm text-gray-500 dark:text-gray-400">6 derniers mois</div>
            </div>
            <div class="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded">
              <div class="text-center">
                <svg class="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <p class="text-gray-500 dark:text-gray-400">Graphique CA mensuel</p>
                <p class="text-sm text-gray-400 dark:text-gray-500">(Chart.js à intégrer)</p>
              </div>
            </div>
          </div>

          <!-- License Distribution -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Répartition des Licences</h3>
            </div>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">Essai</span>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">${this.stats.licenseDistribution.trial}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">Basic</span>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">${this.stats.licenseDistribution.basic}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">Premium</span>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">${this.stats.licenseDistribution.premium}</span>
              </div>
            </div>
            <div class="mt-6 h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded">
              <div class="text-center">
                <svg class="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                </svg>
                <p class="text-xs text-gray-400">Graphique circulaire</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Companies -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Top 5 Entreprises</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rang</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entreprise</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Chiffre d'Affaires</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Factures</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CA Moyen/Facture</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                ${this.stats.topCompanies.map((company, index) => `
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span class="text-sm font-medium text-blue-600 dark:text-blue-400">${index + 1}</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">${company.name}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 dark:text-white">${company.revenue.toLocaleString()} €</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 dark:text-white">${company.invoices}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 dark:text-white">${Math.round(company.revenue / company.invoices).toLocaleString()} €</div>
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
