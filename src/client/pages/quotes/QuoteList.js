import { DatabaseService } from '../../../shared/services/DatabaseService.js'
import { Table } from '../../../shared/components/Table.js'
import { Button } from '../../../shared/components/Button.js'
import { Modal } from '../../../shared/components/Modal.js'

export class QuoteList {
  constructor() {
    this.element = null
    this.quotes = []
    this.filteredQuotes = []
    this.searchTerm = ''
    this.statusFilter = 'all'
    this.modal = null
  }

  async render() {
    // Initialize database if not already done
    if (!DatabaseService.isInitialized) {
      await DatabaseService.init()
    }

    await this.loadQuotes()

    this.element = document.createElement('div')
    this.element.className = 'p-6'
    this.element.innerHTML = `
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Devis</h1>
            <p class="text-gray-600 dark:text-gray-400">Gérez vos devis et propositions commerciales</p>
          </div>
          <div id="new-quote-btn"></div>
        </div>
      </div>

      <!-- Search and Filters -->
      <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div class="flex-1 max-w-md">
            <div class="relative">
              <input
                type="text"
                id="search-input"
                placeholder="Rechercher un devis..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div class="flex space-x-3">
            <select id="status-filter" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyé</option>
              <option value="accepted">Accepté</option>
              <option value="rejected">Refusé</option>
              <option value="expired">Expiré</option>
            </select>
            <div id="export-btn"></div>
          </div>
        </div>
      </div>

      <!-- Quotes Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div id="quotes-table"></div>
      </div>

      <!-- Stats -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total devis</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.quotes.length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Acceptés</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.getQuotesByStatus('accepted').length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">En attente</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.getQuotesByStatus('sent').length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Valeur totale</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.getTotalValue()}</p>
            </div>
          </div>
        </div>
      </div>
    `

    this.setupEventListeners()
    this.renderButtons()
    this.renderTable()

    return this.element
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = this.element.querySelector('#search-input')
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase()
      this.filterQuotes()
      this.renderTable()
    })

    // Status filter
    const statusFilter = this.element.querySelector('#status-filter')
    statusFilter.addEventListener('change', (e) => {
      this.statusFilter = e.target.value
      this.filterQuotes()
      this.renderTable()
    })
  }

  renderButtons() {
    // New quote button
    const newQuoteBtn = Button.create({
      text: 'Nouveau devis',
      variant: 'primary',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>`,
      onClick: () => this.showQuoteForm()
    })
    this.element.querySelector('#new-quote-btn').appendChild(newQuoteBtn)

    // Export button
    const exportBtn = Button.create({
      text: 'Exporter',
      variant: 'outline',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>`,
      onClick: () => this.exportQuotes()
    })
    this.element.querySelector('#export-btn').appendChild(exportBtn)
  }

  renderTable() {
    const columns = [
      { key: 'number', label: 'Numéro', type: 'text' },
      { key: 'clientName', label: 'Client', type: 'text' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'valid_until', label: 'Valide jusqu\'au', type: 'date' },
      { key: 'total', label: 'Montant', type: 'currency' },
      { key: 'status', label: 'Statut', type: 'status' }
    ]

    const actions = [
      {
        label: 'Voir',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>`,
        color: 'blue',
        onClick: (quote) => this.viewQuote(quote)
      },
      {
        label: 'Modifier',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>`,
        color: 'green',
        onClick: (quote) => this.editQuote(quote)
      },
      {
        label: 'Convertir en facture',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
        </svg>`,
        color: 'purple',
        onClick: (quote) => this.convertToInvoice(quote)
      },
      {
        label: 'PDF',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>`,
        color: 'indigo',
        onClick: (quote) => this.downloadPDF(quote)
      },
      {
        label: 'Supprimer',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>`,
        color: 'red',
        onClick: (quote) => this.deleteQuote(quote)
      }
    ]

    const table = Table.create({
      columns,
      data: this.filteredQuotes,
      actions,
      emptyMessage: 'Aucun devis trouvé'
    })

    const container = this.element.querySelector('#quotes-table')
    container.innerHTML = ''
    container.appendChild(table)
  }

  async loadQuotes() {
    const rawQuotes = DatabaseService.getQuotes()
    this.quotes = rawQuotes.map(quote => {
      const client = DatabaseService.getClient(quote.client_id)
      return {
        ...quote,
        clientName: client ? client.name : 'Client supprimé'
      }
    })
    
    this.filterQuotes()
  }

  filterQuotes() {
    this.filteredQuotes = this.quotes.filter(quote => {
      const matchesSearch = !this.searchTerm || 
        quote.number.toLowerCase().includes(this.searchTerm) ||
        quote.clientName.toLowerCase().includes(this.searchTerm)
      
      const matchesStatus = this.statusFilter === 'all' || quote.status === this.statusFilter

      return matchesSearch && matchesStatus
    })
  }

  getQuotesByStatus(status) {
    return this.quotes.filter(quote => quote.status === status)
  }

  getTotalValue() {
    const total = this.quotes.reduce((sum, quote) => sum + (parseFloat(quote.total) || 0), 0)
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF', 
      minimumFractionDigits: 0 
    }).format(total)
  }

  showQuoteForm(quote = null) {
    import('./QuoteForm.js').then(({ QuoteForm }) => {
      const form = new QuoteForm(quote)
      form.onSave = async (quoteData) => {
        if (quote) {
          DatabaseService.updateQuote(quote.id, quoteData)
        } else {
          DatabaseService.addQuote(quoteData)
        }
        await this.loadQuotes()
        this.renderTable()
        this.modal.close()
      }
      
      form.onCancel = () => {
        this.modal.close()
      }

      this.modal = new Modal({
        title: quote ? 'Modifier le devis' : 'Nouveau devis',
        size: 'xl',
        content: '<div id="quote-form-container"></div>'
      })

      this.modal.open()
      
      form.render().then(formElement => {
        document.getElementById('quote-form-container').appendChild(formElement)
      })
    })
  }

  viewQuote(quote) {
    const client = DatabaseService.getClient(quote.client_id)
    
    this.modal = new Modal({
      title: `Devis ${quote.number}`,
      size: 'lg',
      content: `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Informations devis</h4>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Numéro:</span> ${quote.number}</div>
                <div><span class="font-medium">Date:</span> ${new Date(quote.date).toLocaleDateString('fr-FR')}</div>
                <div><span class="font-medium">Valide jusqu'au:</span> ${quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                <div><span class="font-medium">Statut:</span> <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusColor(quote.status)}">${this.getStatusLabel(quote.status)}</span></div>
              </div>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Client</h4>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Nom:</span> ${client ? client.name : 'Client supprimé'}</div>
                <div><span class="font-medium">Email:</span> ${client?.email || 'Non renseigné'}</div>
                <div><span class="font-medium">Téléphone:</span> ${client?.phone || 'Non renseigné'}</div>
                <div><span class="font-medium">Entreprise:</span> ${client?.company || 'Non renseigné'}</div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Montants</h4>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex justify-between items-center text-sm mb-2">
                <span>Sous-total:</span>
                <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(quote.subtotal || 0)}</span>
              </div>
              <div class="flex justify-between items-center text-sm mb-2">
                <span>TVA (${quote.tax_rate || 0}%):</span>
                <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(quote.tax_amount || 0)}</span>
              </div>
              <div class="flex justify-between items-center text-sm mb-2">
                <span>Remise:</span>
                <span>-${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(quote.discount_amount || 0)}</span>
              </div>
              <div class="border-t pt-2 flex justify-between items-center font-medium">
                <span>Total:</span>
                <span class="text-lg">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(quote.total || 0)}</span>
              </div>
            </div>
          </div>
          
          ${quote.notes ? `
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Notes</h4>
              <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded">${quote.notes}</p>
            </div>
          ` : ''}

          ${quote.status === 'sent' ? `
            <div class="flex space-x-3">
              <button class="accept-btn px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700">
                Marquer comme accepté
              </button>
              <button class="reject-btn px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
                Marquer comme refusé
              </button>
            </div>
          ` : ''}
        </div>
      `
    })

    this.modal.open()

    // Add event listeners for status change
    if (quote.status === 'sent') {
      const acceptBtn = this.modal.element.querySelector('.accept-btn')
      const rejectBtn = this.modal.element.querySelector('.reject-btn')

      if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
          DatabaseService.updateQuote(quote.id, { status: 'accepted' })
          this.loadQuotes()
          this.renderTable()
          this.modal.close()
        })
      }

      if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
          DatabaseService.updateQuote(quote.id, { status: 'rejected' })
          this.loadQuotes()
          this.renderTable()
          this.modal.close()
        })
      }
    }
  }

  editQuote(quote) {
    this.showQuoteForm(quote)
  }

  convertToInvoice(quote) {
    if (quote.status !== 'accepted') {
      alert('Seuls les devis acceptés peuvent être convertis en facture')
      return
    }

    // Create invoice from quote
    const invoiceData = {
      client_id: quote.client_id,
      number: `INV-${Date.now()}`, // Generate unique invoice number
      date: new Date().toISOString().split('T')[0],
      due_date: null,
      items: quote.items || [],
      subtotal: quote.subtotal,
      tax_rate: quote.tax_rate,
      tax_amount: quote.tax_amount,
      discount_amount: quote.discount_amount,
      total: quote.total,
      notes: quote.notes,
      status: 'draft'
    }

    DatabaseService.addInvoice(invoiceData)
    
    // Update quote status
    DatabaseService.updateQuote(quote.id, { status: 'converted' })
    
    alert('Devis converti en facture avec succès!')
    this.loadQuotes()
    this.renderTable()
  }

  downloadPDF(quote) {
    // TODO: Implement PDF generation
    alert('Génération PDF en cours de développement')
  }

  deleteQuote(quote) {
    this.modal = new Modal({
      title: 'Supprimer le devis',
      content: `
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Êtes-vous sûr ?</h3>
          <p class="text-sm text-gray-500 mb-6">
            Cette action supprimera définitivement le devis "${quote.number}".
            Cette action ne peut pas être annulée.
          </p>
          <div class="flex justify-center space-x-3">
            <button class="cancel-btn px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Annuler
            </button>
            <button class="delete-btn px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">
              Supprimer
            </button>
          </div>
        </div>
      `
    })

    this.modal.open()

    // Add event listeners
    this.modal.element.querySelector('.cancel-btn').addEventListener('click', () => {
      this.modal.close()
    })

    this.modal.element.querySelector('.delete-btn').addEventListener('click', async () => {
      DatabaseService.deleteQuote(quote.id)
      await this.loadQuotes()
      this.renderTable()
      this.modal.close()
    })
  }

  getStatusColor(status) {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
      converted: 'bg-purple-100 text-purple-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  getStatusLabel(status) {
    const labels = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      accepted: 'Accepté',
      rejected: 'Refusé',
      expired: 'Expiré',
      converted: 'Converti'
    }
    return labels[status] || status
  }

  exportQuotes() {
    const csvContent = this.generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `devis_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  generateCSV() {
    const headers = ['Numéro', 'Client', 'Date', 'Valide jusqu\'au', 'Montant', 'Statut', 'Créé le']
    const rows = this.quotes.map(quote => [
      quote.number,
      quote.clientName,
      new Date(quote.date).toLocaleDateString('fr-FR'),
      quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : '',
      quote.total || 0,
      this.getStatusLabel(quote.status),
      new Date(quote.created_at).toLocaleDateString('fr-FR')
    ])

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
  }

  destroy() {
    if (this.modal) {
      this.modal.destroy()
    }
    if (this.element) {
      this.element.remove()
      this.element = null
    }
  }
}

