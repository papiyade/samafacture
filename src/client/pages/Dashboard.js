import { I18nService } from '../../shared/services/I18nService.js'

/**
 * Dashboard Page - Main dashboard with statistics and overview
 */
export class Dashboard {
  constructor() {
    this.stats = {
      totalRevenue: 0,
      totalInvoices: 0,
      totalClients: 0,
      pendingPayments: 0
    }
  }

  async init() {
    await this.loadStats()
    this.setupEventListeners()
  }

  async loadStats() {
    // TODO: Load actual stats from database
    this.stats = {
      totalRevenue: 2450000,
      totalInvoices: 156,
      totalClients: 42,
      pendingPayments: 8
    }
  }

  async render() {
    return `
      <div class="container-fluid py-6">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ${I18nService.t('dashboard.title')}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            ${I18nService.t('dashboard.welcome')}
          </p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <!-- Total Revenue -->
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    ${I18nService.t('dashboard.stats.totalRevenue')}
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${I18nService.formatCurrency(this.stats.totalRevenue)}
                  </p>
                </div>
                <div class="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
              </div>
              <div class="mt-4">
                <span class="text-sm text-green-600 dark:text-green-400 font-medium">+12.5%</span>
                <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">vs mois dernier</span>
              </div>
            </div>
          </div>

          <!-- Total Invoices -->
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    ${I18nService.t('dashboard.stats.totalInvoices')}
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${this.stats.totalInvoices}
                  </p>
                </div>
                <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
              </div>
              <div class="mt-4">
                <span class="text-sm text-blue-600 dark:text-blue-400 font-medium">+8.2%</span>
                <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">vs mois dernier</span>
              </div>
            </div>
          </div>

          <!-- Total Clients -->
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    ${I18nService.t('dashboard.stats.totalClients')}
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${this.stats.totalClients}
                  </p>
                </div>
                <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                  </svg>
                </div>
              </div>
              <div class="mt-4">
                <span class="text-sm text-purple-600 dark:text-purple-400 font-medium">+3 nouveaux</span>
                <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">ce mois</span>
              </div>
            </div>
          </div>

          <!-- Pending Payments -->
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    ${I18nService.t('dashboard.stats.pendingPayments')}
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    ${this.stats.pendingPayments}
                  </p>
                </div>
                <div class="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                  <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div class="mt-4">
                <span class="text-sm text-yellow-600 dark:text-yellow-400 font-medium">2 en retard</span>
                <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">à relancer</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts and Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Revenue Chart -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                ${I18nService.t('dashboard.monthlyRevenue')}
              </h3>
            </div>
            <div class="card-body">
              <div class="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p class="text-gray-500 dark:text-gray-400">Graphique des revenus (à implémenter)</p>
              </div>
            </div>
          </div>

          <!-- Recent Invoices -->
          <div class="card">
            <div class="card-header flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                ${I18nService.t('dashboard.recentInvoices')}
              </h3>
              <a href="/invoices" data-route="/invoices" class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
                Voir tout
              </a>
            </div>
            <div class="card-body">
              <div class="space-y-4">
                ${this.renderRecentInvoices()}
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-8">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/invoices/new" data-route="/invoices/new" class="card hover:shadow-md transition-shadow cursor-pointer">
              <div class="card-body text-center">
                <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                </div>
                <h4 class="font-medium text-gray-900 dark:text-white">Nouvelle facture</h4>
              </div>
            </a>

            <a href="/quotes/new" data-route="/quotes/new" class="card hover:shadow-md transition-shadow cursor-pointer">
              <div class="card-body text-center">
                <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h4 class="font-medium text-gray-900 dark:text-white">Nouveau devis</h4>
              </div>
            </a>

            <a href="/clients/new" data-route="/clients/new" class="card hover:shadow-md transition-shadow cursor-pointer">
              <div class="card-body text-center">
                <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <h4 class="font-medium text-gray-900 dark:text-white">Nouveau client</h4>
              </div>
            </a>

            <a href="/products/new" data-route="/products/new" class="card hover:shadow-md transition-shadow cursor-pointer">
              <div class="card-body text-center">
                <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                <h4 class="font-medium text-gray-900 dark:text-white">Nouveau produit</h4>
              </div>
            </a>
          </div>
        </div>
      </div>
    `
  }

  renderRecentInvoices() {
    // Mock data - will be replaced with real data
    const recentInvoices = [
      { id: 1, number: 'INV-001', client: 'Entreprise ABC', amount: 125000, status: 'paid' },
      { id: 2, number: 'INV-002', client: 'Société XYZ', amount: 89000, status: 'sent' },
      { id: 3, number: 'INV-003', client: 'SARL Exemple', amount: 156000, status: 'overdue' }
    ]

    return recentInvoices.map(invoice => `
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <span class="text-xs font-medium text-gray-600 dark:text-gray-400">${invoice.number.slice(-2)}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">${invoice.number}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">${invoice.client}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            ${I18nService.formatCurrency(invoice.amount)}
          </p>
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getStatusClasses(invoice.status)}">
            ${I18nService.t(`invoices.statuses.${invoice.status}`)}
          </span>
        </div>
      </div>
    `).join('')
  }

  getStatusClasses(status) {
    const classes = {
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
    return classes[status] || classes.draft
  }

  setupEventListeners() {
    // Add any dashboard-specific event listeners here
  }
}

