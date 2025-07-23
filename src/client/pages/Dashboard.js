import { DatabaseService } from '../../shared/services/DatabaseService.js'

export class Dashboard {
  constructor() {
    this.element = null
  }

  async render() {
    // Initialize database if not already done
    if (!DatabaseService.isInitialized) {
      await DatabaseService.init()
    }

    // Get real statistics from database
    const stats = await this.getStats()
    
    this.element = document.createElement('div')
    this.element.className = 'p-6'
    this.element.innerHTML = `
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <p class="text-gray-600 dark:text-gray-400">Bienvenue sur SamaFacture</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        ${this.renderStatsCard('Chiffre d\'affaires', stats.totalRevenue, 'XOF', 'text-green-600', `
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
          </svg>
        `)}
        
        ${this.renderStatsCard('Factures', stats.totalInvoices, '', 'text-blue-600', `
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        `)}
        
        ${this.renderStatsCard('Clients', stats.totalClients, '', 'text-purple-600', `
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
          </svg>
        `)}
        
        ${this.renderStatsCard('En attente', stats.pendingAmount, 'XOF', 'text-orange-600', `
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        `)}
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button class="quick-action-btn bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow transition-colors" data-action="new-invoice">
          <div class="flex items-center">
            <svg class="w-8 h-8 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <div class="text-left">
              <div class="font-semibold">Nouvelle facture</div>
              <div class="text-sm opacity-90">Créer une facture rapidement</div>
            </div>
          </div>
        </button>

        <button class="quick-action-btn bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg shadow transition-colors" data-action="new-quote">
          <div class="flex items-center">
            <svg class="w-8 h-8 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <div class="text-left">
              <div class="font-semibold">Nouveau devis</div>
              <div class="text-sm opacity-90">Créer un devis rapidement</div>
            </div>
          </div>
        </button>

        <button class="quick-action-btn bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg shadow transition-colors" data-action="new-client">
          <div class="flex items-center">
            <svg class="w-8 h-8 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <div class="text-left">
              <div class="font-semibold">Nouveau client</div>
              <div class="text-sm opacity-90">Ajouter un client</div>
            </div>
          </div>
        </button>
      </div>

      <!-- Charts and Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Invoices -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Factures récentes</h3>
            <button class="text-blue-600 hover:text-blue-800 text-sm font-medium" onclick="window.app.navigate('invoices')">
              Voir tout
            </button>
          </div>
          <div id="recent-invoices">
            <!-- Recent invoices will be loaded here -->
          </div>
        </div>

        <!-- Recent Clients -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Clients récents</h3>
            <button class="text-blue-600 hover:text-blue-800 text-sm font-medium" onclick="window.app.navigate('clients')">
              Voir tout
            </button>
          </div>
          <div id="recent-clients">
            <!-- Recent clients will be loaded here -->
          </div>
        </div>
      </div>

      <!-- Status Overview -->
      <div class="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Aperçu des statuts</h3>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-600">${stats.draftInvoices}</div>
            <div class="text-sm text-gray-500">Brouillons</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">${stats.pendingInvoices}</div>
            <div class="text-sm text-gray-500">En attente</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">${stats.paidInvoices}</div>
            <div class="text-sm text-gray-500">Payées</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">${stats.totalProducts}</div>
            <div class="text-sm text-gray-500">Produits</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">${DatabaseService.getQuotes().length}</div>
            <div class="text-sm text-gray-500">Devis</div>
          </div>
        </div>
      </div>
    `

    // Add event listeners for quick actions
    this.element.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action
        this.handleQuickAction(action)
      })
    })

    // Load recent data
    await this.loadRecentInvoices()
    await this.loadRecentClients()
    
    return this.element
  }

  handleQuickAction(action) {
    switch (action) {
      case 'new-invoice':
        window.app.navigate('invoices', { action: 'new' })
        break
      case 'new-quote':
        window.app.navigate('quotes', { action: 'new' })
        break
      case 'new-client':
        window.app.navigate('clients', { action: 'new' })
        break
    }
  }

  renderStatsCard(title, value, suffix, colorClass, icon) {
    const formattedValue = suffix === 'XOF' 
      ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(value)
      : new Intl.NumberFormat('fr-FR').format(value)

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="${colorClass}">
              ${icon}
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                ${title}
              </dt>
              <dd class="text-lg font-medium text-gray-900 dark:text-white">
                ${formattedValue}${suffix && suffix !== 'XOF' ? ' ' + suffix : ''}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    `
  }

  async getStats() {
    return DatabaseService.getStats()
  }

  async loadRecentInvoices() {
    const container = this.element.querySelector('#recent-invoices')
    const invoices = DatabaseService.getInvoices()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)

    if (invoices.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <p class="text-gray-500 dark:text-gray-400">Aucune facture récente</p>
          <button class="mt-2 text-blue-600 hover:text-blue-800 text-sm" onclick="window.app.navigate('invoices', { action: 'new' })">
            Créer votre première facture
          </button>
        </div>
      `
      return
    }

    container.innerHTML = `
      <div class="space-y-3">
        ${invoices.map(invoice => {
          const client = DatabaseService.getClient(invoice.client_id)
          return `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer" onclick="window.app.navigate('invoices', { id: ${invoice.id} })">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <div class="font-medium text-gray-900 dark:text-white">${invoice.number}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">${client ? client.name : 'Client supprimé'}</div>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">${new Date(invoice.date).toLocaleDateString('fr-FR')}</div>
              </div>
              <div class="text-right">
                <div class="font-medium text-gray-900 dark:text-white">
                  ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(invoice.total || 0)}
                </div>
                <div class="text-sm">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusColor(invoice.status)}">
                    ${this.getStatusLabel(invoice.status)}
                  </span>
                </div>
              </div>
            </div>
          `
        }).join('')}
      </div>
    `
  }

  async loadRecentClients() {
    const container = this.element.querySelector('#recent-clients')
    const clients = DatabaseService.getClients()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)

    if (clients.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <p class="text-gray-500 dark:text-gray-400">Aucun client récent</p>
          <button class="mt-2 text-blue-600 hover:text-blue-800 text-sm" onclick="window.app.navigate('clients', { action: 'new' })">
            Ajouter votre premier client
          </button>
        </div>
      `
      return
    }

    container.innerHTML = `
      <div class="space-y-3">
        ${clients.map(client => {
          const invoices = DatabaseService.getInvoices().filter(inv => inv.client_id === client.id)
          const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)
          
          return `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer" onclick="window.app.navigate('clients', { id: ${client.id} })">
              <div class="flex-1">
                <div class="font-medium text-gray-900 dark:text-white">${client.name}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">${client.email || client.company || 'Pas d\'email'}</div>
              </div>
              <div class="text-right">
                <div class="font-medium text-gray-900 dark:text-white">
                  ${invoices.length} facture${invoices.length > 1 ? 's' : ''}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(totalAmount)}
                </div>
              </div>
            </div>
          `
        }).join('')}
      </div>
    `
  }

  getStatusColor(status) {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  getStatusLabel(status) {
    const labels = {
      draft: 'Brouillon',
      sent: 'Envoyée',
      paid: 'Payée',
      overdue: 'En retard',
      cancelled: 'Annulée'
    }
    return labels[status] || status
  }

  destroy() {
    if (this.element) {
      this.element.remove()
      this.element = null
    }
  }
}

