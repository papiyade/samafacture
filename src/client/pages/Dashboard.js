import { AnalyticsService } from '../../shared/services/AnalyticsService.js'
import { ChartService } from '../../shared/services/ChartService.js'
import { DatabaseService } from '../../shared/services/DatabaseService.js'

/**
 * Dashboard Page - Analytics et KPIs
 */
export class Dashboard {
  constructor() {
    this.container = null
    this.kpis = null
    this.dateRange = {
      startDate: null,
      endDate: null,
      period: 'month' // month, quarter, year, custom
    }
  }

  async init() {
    await ChartService.init()
    await this.loadData()
    console.log('✅ Dashboard page initialized')
  }

  async loadData() {
    try {
      // Set default date range (current month)
      if (!this.dateRange.startDate) {
        const now = new Date()
        this.dateRange.startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        this.dateRange.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }

      this.kpis = AnalyticsService.getKPIs(this.dateRange.startDate, this.dateRange.endDate)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  async render() {
    await this.loadData()
    
    this.container = document.createElement('div')
    this.container.className = 'p-6'
    this.container.innerHTML = `
      <div class="dashboard-page">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de Bord</h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Vue d'ensemble de vos performances commerciales
            </p>
          </div>
          <div class="mt-4 sm:mt-0">
            <div class="flex space-x-2">
              <select id="period-selector" class="input-field">
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
                <option value="year">Cette année</option>
                <option value="custom">Période personnalisée</option>
              </select>
              <button id="refresh-btn" class="btn-secondary">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Custom Date Range (hidden by default) -->
        <div id="custom-date-range" class="hidden bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div class="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date début
              </label>
              <input type="date" id="custom-start-date" class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date fin
              </label>
              <input type="date" id="custom-end-date" class="input-field">
            </div>
            <button id="apply-custom-range" class="btn-primary">
              Appliquer
            </button>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          ${this.renderKPICard('Chiffre d\'Affaires', this.kpis?.totalRevenue || 0, 'revenue', 'green', 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1')}
          ${this.renderKPICard('Dépenses', this.kpis?.totalExpenses || 0, 'expenses', 'red', 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z')}
          ${this.renderKPICard('Bénéfice Net', this.kpis?.netProfit || 0, 'profit', this.kpis?.netProfit >= 0 ? 'green' : 'red', 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z')}
          ${this.renderKPICard('Factures', this.kpis?.invoiceCount || 0, 'invoices', 'blue', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', false)}
        </div>

        <!-- Charts Row 1 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Revenue Evolution Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Évolution Mensuelle</h3>
              <div class="flex space-x-2">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">Revenus</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">Dépenses</span>
                </div>
              </div>
            </div>
            <div class="h-64">
              <canvas id="evolution-chart"></canvas>
            </div>
          </div>

          <!-- Payment Status Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Statut des Paiements</h3>
            <div class="h-64">
              <canvas id="payment-status-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Charts Row 2 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Expenses by Category -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Dépenses par Catégorie</h3>
            <div class="h-64">
              <canvas id="expenses-category-chart"></canvas>
            </div>
          </div>

          <!-- Top Clients -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Clients</h3>
            <div class="space-y-4" id="top-clients-list">
              ${this.renderTopClients()}
            </div>
          </div>
        </div>

        <!-- Statistics Tables -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Invoices -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Factures Récentes</h3>
            </div>
            <div class="p-6">
              <div class="space-y-4" id="recent-invoices">
                ${this.renderRecentInvoices()}
              </div>
            </div>
          </div>

          <!-- Recent Expenses -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Dépenses Récentes</h3>
            </div>
            <div class="p-6">
              <div class="space-y-4" id="recent-expenses">
                ${this.renderRecentExpenses()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    
    this.attachEventListeners()
    return this.container
  }

  renderKPICard(title, value, type, color, iconPath, isCurrency = true) {
    const trends = AnalyticsService.getTrends(this.dateRange.startDate, this.dateRange.endDate)
    const trend = trends[type]
    const trendValue = trend?.trend || 0
    const isPositive = trendValue >= 0
    const trendColor = (type === 'expenses') ? (isPositive ? 'red' : 'green') : (isPositive ? 'green' : 'red')

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-${color}-100 dark:bg-${color}-900/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-${color}-600 dark:text-${color}-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">${title}</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              ${isCurrency ? this.formatCurrency(value) : value.toLocaleString('fr-FR')}
            </p>
            ${trend ? `
              <div class="flex items-center mt-1">
                <svg class="w-4 h-4 text-${trendColor}-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="${isPositive ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'}"></path>
                </svg>
                <span class="text-sm text-${trendColor}-600 dark:text-${trendColor}-400">
                  ${Math.abs(trendValue).toFixed(1)}%
                </span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `
  }

  renderTopClients() {
    const topClients = AnalyticsService.getTopClients(5, this.dateRange.startDate, this.dateRange.endDate)
    
    if (topClients.length === 0) {
      return `
        <div class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">Aucun client pour cette période</p>
        </div>
      `
    }

    return topClients.map((item, index) => `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-3">
            <span class="text-sm font-medium text-blue-600 dark:text-blue-400">${index + 1}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">${item.client.name}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">${item.invoiceCount} facture(s)</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            ${this.formatCurrency(item.revenue)}
          </p>
        </div>
      </div>
    `).join('')
  }

  renderRecentInvoices() {
    const invoices = DatabaseService.getInvoices()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)

    if (invoices.length === 0) {
      return `
        <div class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">Aucune facture récente</p>
        </div>
      `
    }

    return invoices.map(invoice => {
      const client = DatabaseService.getClients().find(c => c.id == invoice.client_id)
      const statusColors = {
        'paid': 'green',
        'pending': 'yellow',
        'overdue': 'red'
      }
      const statusLabels = {
        'paid': 'Payée',
        'pending': 'En attente',
        'overdue': 'En retard'
      }

      return `
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">${invoice.number}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              ${client?.name || 'Client supprimé'} • ${new Date(invoice.date).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              ${this.formatCurrency(invoice.total)}
            </p>
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${statusColors[invoice.status]}-100 text-${statusColors[invoice.status]}-800 dark:bg-${statusColors[invoice.status]}-900/20 dark:text-${statusColors[invoice.status]}-400">
              ${statusLabels[invoice.status] || invoice.status}
            </span>
          </div>
        </div>
      `
    }).join('')
  }

  renderRecentExpenses() {
    const expenses = DatabaseService.getExpenses()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)

    if (expenses.length === 0) {
      return `
        <div class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">Aucune dépense récente</p>
        </div>
      `
    }

    return expenses.map(expense => `
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            ${expense.description || 'Sans description'}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            ${expense.category || 'Autres'} • ${new Date(expense.date).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            ${this.formatCurrency(expense.amount)}
          </p>
        </div>
      </div>
    `).join('')
  }

  async attachEventListeners() {
    // Period selector
    const periodSelector = document.getElementById('period-selector')
    if (periodSelector) {
      periodSelector.addEventListener('change', (e) => this.changePeriod(e.target.value))
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn')
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refresh())
    }

    // Custom date range
    const applyCustomBtn = document.getElementById('apply-custom-range')
    if (applyCustomBtn) {
      applyCustomBtn.addEventListener('click', () => this.applyCustomDateRange())
    }

    // Load charts after DOM is ready
    setTimeout(() => this.loadCharts(), 100)
  }

  changePeriod(period) {
    const now = new Date()
    const customDateRange = document.getElementById('custom-date-range')

    switch (period) {
      case 'month':
        this.dateRange.startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        this.dateRange.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        customDateRange?.classList.add('hidden')
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        this.dateRange.startDate = new Date(now.getFullYear(), quarter * 3, 1)
        this.dateRange.endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        customDateRange?.classList.add('hidden')
        break
      case 'year':
        this.dateRange.startDate = new Date(now.getFullYear(), 0, 1)
        this.dateRange.endDate = new Date(now.getFullYear(), 11, 31)
        customDateRange?.classList.add('hidden')
        break
      case 'custom':
        customDateRange?.classList.remove('hidden')
        return // Don't refresh yet, wait for custom dates
    }

    this.dateRange.period = period
    this.refresh()
  }

  applyCustomDateRange() {
    const startDate = document.getElementById('custom-start-date')?.value
    const endDate = document.getElementById('custom-end-date')?.value

    if (startDate && endDate) {
      this.dateRange.startDate = new Date(startDate)
      this.dateRange.endDate = new Date(endDate)
      this.dateRange.period = 'custom'
      this.refresh()
    }
  }

  async refresh() {
    await this.loadData()
    
    // Update the entire page content
    if (this.container) {
      this.container.innerHTML = this.render()
      this.attachEventListeners()
    }
  }

  async loadCharts() {
    try {
      await this.loadEvolutionChart()
      await this.loadPaymentStatusChart()
      await this.loadExpensesCategoryChart()
    } catch (error) {
      console.error('Error loading charts:', error)
    }
  }

  async loadEvolutionChart() {
    const evolutionData = AnalyticsService.getMonthlyEvolution(12)
    
    const chartData = {
      labels: evolutionData.map(d => d.month),
      datasets: [
        {
          label: 'Revenus',
          data: evolutionData.map(d => d.revenue),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true
        },
        {
          label: 'Dépenses',
          data: evolutionData.map(d => d.expenses),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true
        }
      ]
    }

    ChartService.createLineChart('evolution-chart', chartData)
  }

  async loadPaymentStatusChart() {
    const paymentStats = AnalyticsService.getPaymentStats(this.dateRange.startDate, this.dateRange.endDate)
    
    const chartData = {
      labels: ['Payées', 'En attente', 'En retard'],
      values: [paymentStats.paid.amount, paymentStats.pending.amount, paymentStats.overdue.amount],
      colors: ['#10B981', '#F59E0B', '#EF4444']
    }

    ChartService.createDoughnutChart('payment-status-chart', chartData)
  }

  async loadExpensesCategoryChart() {
    const expensesByCategory = AnalyticsService.getExpensesByCategory(this.dateRange.startDate, this.dateRange.endDate)
    
    if (expensesByCategory.length === 0) {
      // Show empty state
      const canvas = document.getElementById('expenses-category-chart')
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#9CA3AF'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Aucune dépense pour cette période', canvas.width / 2, canvas.height / 2)
      }
      return
    }

    const chartData = {
      labels: expensesByCategory.map(c => c.category),
      values: expensesByCategory.map(c => c.amount)
    }

    ChartService.createDoughnutChart('expenses-category-chart', chartData)
  }

  formatCurrency(amount) {
    const currency = DatabaseService.getSetting('currency') || 'XOF'
    const currencySymbols = {
      'XOF': 'FCFA',
      'EUR': '€',
      'USD': '$'
    }
    return `${amount.toLocaleString('fr-FR')} ${currencySymbols[currency] || currency}`
  }

  destroy() {
    ChartService.destroyAllCharts()
  }
}
