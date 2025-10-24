import { DatabaseService } from '../../../shared/services/DatabaseService.js'
import { Table } from '../../../shared/components/Table.js'
import { Button } from '../../../shared/components/Button.js'
import { Modal } from '../../../shared/components/Modal.js'

export class InvoiceList {
  constructor() {
    this.element = null
    this.invoices = []
    this.filteredInvoices = []
    this.searchTerm = ''
    this.statusFilter = 'all'
    this.modal = null
  }

  async render() {
    // Initialize database if not already done
    if (!DatabaseService.isInitialized) {
      await DatabaseService.init()
    }

    await this.loadInvoices()

    this.element = document.createElement('div')
    this.element.className = 'p-6'
    this.element.innerHTML = `
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Factures</h1>
            <p class="text-gray-600 dark:text-gray-400">Gérez vos factures et suivez les paiements</p>
          </div>
          <div id="new-invoice-btn"></div>
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
                placeholder="Rechercher une facture..."
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
              <option value="sent">Envoyée</option>
              <option value="paid">Payée</option>
              <option value="overdue">En retard</option>
              <option value="cancelled">Annulée</option>
            </select>
            <div id="export-btn"></div>
          </div>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div id="invoices-table"></div>
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
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total factures</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.invoices.length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Payées</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.getInvoicesByStatus('paid').length}</p>
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
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.getInvoicesByStatus('sent').length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">En retard</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.getOverdueInvoices().length}</p>
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
      this.filterInvoices()
      this.renderTable()
    })

    // Status filter
    const statusFilter = this.element.querySelector('#status-filter')
    statusFilter.addEventListener('change', (e) => {
      this.statusFilter = e.target.value
      this.filterInvoices()
      this.renderTable()
    })
  }

  renderButtons() {
    // New invoice button
    const newInvoiceBtn = Button.create({
      text: 'Nouvelle facture',
      variant: 'primary',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>`,
      onClick: () => window.showModal('invoice-modal')
    })
    this.element.querySelector('#new-invoice-btn').appendChild(newInvoiceBtn)

    // Export button
    const exportBtn = Button.create({
      text: 'Exporter',
      variant: 'outline',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>`,
      onClick: () => this.exportInvoices()
    })
    this.element.querySelector('#export-btn').appendChild(exportBtn)
  }

  renderTable() {
    const columns = [
      { key: 'number', label: 'Numéro', type: 'text' },
      { key: 'clientName', label: 'Client', type: 'text' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'due_date', label: 'Échéance', type: 'date' },
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
        onClick: (invoice) => window.viewItem('invoice', invoice.id)
      },
      {
        label: 'Modifier',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>`,
        color: 'green',
        onClick: (invoice) => window.editItem('invoice', invoice.id)
      },
      {
        label: 'Dupliquer',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>`,
        color: 'purple',
        onClick: (invoice) => window.duplicateItem('invoice', invoice.id)
      },
      {
        label: 'Supprimer',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>`,
        color: 'red',
        onClick: (invoice) => window.deleteItem('invoice', invoice.id)
      }
    ]

    const table = Table.create({
      columns,
      data: this.filteredInvoices,
      actions,
      emptyMessage: 'Aucune facture trouvée'
    })

    const container = this.element.querySelector('#invoices-table')
    container.innerHTML = ''
    container.appendChild(table)
  }

  async loadInvoices() {
    const rawInvoices = DatabaseService.getInvoices()
    this.invoices = rawInvoices.map(invoice => {
      const client = DatabaseService.getClient(invoice.client_id)
      return {
        ...invoice,
        clientName: client ? client.name : 'Client supprimé'
      }
    })
    
    this.filterInvoices()
  }

  filterInvoices() {
    this.filteredInvoices = this.invoices.filter(invoice => {
      const matchesSearch = !this.searchTerm || 
        invoice.number.toLowerCase().includes(this.searchTerm) ||
        invoice.clientName.toLowerCase().includes(this.searchTerm)
      
      const matchesStatus = this.statusFilter === 'all' || invoice.status === this.statusFilter

      return matchesSearch && matchesStatus
    })
  }

  getInvoicesByStatus(status) {
    return this.invoices.filter(invoice => invoice.status === status)
  }

  getOverdueInvoices() {
    const today = new Date()
    return this.invoices.filter(invoice => 
      invoice.status === 'sent' && 
      invoice.due_date && 
      new Date(invoice.due_date) < today
    )
  }

  showInvoiceForm(invoice = null) {
    import('./InvoiceForm.js').then(({ InvoiceForm }) => {
      const form = new InvoiceForm(invoice)
      form.onSave = async (invoiceData) => {
        if (invoice) {
          DatabaseService.updateInvoice(invoice.id, invoiceData)
        } else {
          DatabaseService.addInvoice(invoiceData)
        }
        await this.loadInvoices()
        this.renderTable()
        this.modal.close()
      }
      
      form.onCancel = () => {
        this.modal.close()
      }

      this.modal = new Modal({
        title: invoice ? 'Modifier la facture' : 'Nouvelle facture',
        size: 'xl',
        content: '<div id="invoice-form-container"></div>'
      })

      this.modal.open()
      
      form.render().then(formElement => {
        document.getElementById('invoice-form-container').appendChild(formElement)
      })
    })
  }

  viewInvoice(invoice) {
    const client = DatabaseService.getClient(invoice.client_id)
    
    this.modal = new Modal({
      title: `Facture ${invoice.number}`,
      size: 'lg',
      content: `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Informations facture</h4>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Numéro:</span> ${invoice.number}</div>
                <div><span class="font-medium">Date:</span> ${new Date(invoice.date).toLocaleDateString('fr-FR')}</div>
                <div><span class="font-medium">Échéance:</span> ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : 'Non définie'}</div>
                <div><span class="font-medium">Statut:</span> <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusColor(invoice.status)}">${this.getStatusLabel(invoice.status)}</span></div>
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
                <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(invoice.subtotal || 0)}</span>
              </div>
              <div class="flex justify-between items-center text-sm mb-2">
                <span>TVA (${invoice.tax_rate || 0}%):</span>
                <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(invoice.tax_amount || 0)}</span>
              </div>
              <div class="flex justify-between items-center text-sm mb-2">
                <span>Remise:</span>
                <span>-${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(invoice.discount_amount || 0)}</span>
              </div>
              <div class="border-t pt-2 flex justify-between items-center font-medium">
                <span>Total:</span>
                <span class="text-lg">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(invoice.total || 0)}</span>
              </div>
            </div>
          </div>
          
          ${invoice.notes ? `
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Notes</h4>
              <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded">${invoice.notes}</p>
            </div>
          ` : ''}
        </div>
      `
    })

    this.modal.open()
  }

  editInvoice(invoice) {
    this.showInvoiceForm(invoice)
  }

  downloadPDF(invoice) {
    // TODO: Implement PDF generation
    alert('Génération PDF en cours de développement')
  }

  deleteInvoice(invoice) {
    this.modal = new Modal({
      title: 'Supprimer la facture',
      content: `
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Êtes-vous sûr ?</h3>
          <p class="text-sm text-gray-500 mb-6">
            Cette action supprimera définitivement la facture "${invoice.number}".
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
      DatabaseService.deleteInvoice(invoice.id)
      await this.loadInvoices()
      this.renderTable()
      this.modal.close()
    })
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

  exportInvoices() {
    const csvContent = this.generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `factures_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  generateCSV() {
    const headers = ['Numéro', 'Client', 'Date', 'Échéance', 'Montant', 'Statut', 'Créé le']
    const rows = this.invoices.map(invoice => [
      invoice.number,
      invoice.clientName,
      new Date(invoice.date).toLocaleDateString('fr-FR'),
      invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '',
      invoice.total || 0,
      this.getStatusLabel(invoice.status),
      new Date(invoice.created_at).toLocaleDateString('fr-FR')
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
