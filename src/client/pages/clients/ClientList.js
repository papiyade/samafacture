import { DatabaseService } from '../../../shared/services/DatabaseService.js'
import { Table } from '../../../shared/components/Table.js'
import { Button } from '../../../shared/components/Button.js'
import { Modal } from '../../../shared/components/Modal.js'

export class ClientList {
  constructor() {
    this.element = null
    this.clients = []
    this.filteredClients = []
    this.searchTerm = ''
    this.modal = null
  }

  async render() {
    // Initialize database if not already done
    if (!DatabaseService.isInitialized) {
      await DatabaseService.init()
    }

    await this.loadClients()

    this.element = document.createElement('div')
    this.element.className = 'p-6'
    this.element.innerHTML = `
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
            <p class="text-gray-600 dark:text-gray-400">Gérez vos clients et leurs informations</p>
          </div>
          <div id="new-client-btn"></div>
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
                placeholder="Rechercher un client..."
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
            <div id="export-btn"></div>
            <div id="import-btn"></div>
          </div>
        </div>
      </div>

      <!-- Clients Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div id="clients-table"></div>
      </div>

      <!-- Stats -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total clients</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.clients.length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Factures totales</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.getTotalInvoices()}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Chiffre d'affaires</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.getTotalRevenue()}</p>
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
      this.filterClients()
      this.renderTable()
    })
  }

  renderButtons() {
    // New client button
    const newClientBtn = Button.create({
      text: 'Nouveau client',
      variant: 'primary',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>`,
      onClick: () => window.showModal('client-modal')
    })
    this.element.querySelector('#new-client-btn').appendChild(newClientBtn)

    // Export button
    const exportBtn = Button.create({
      text: 'Exporter',
      variant: 'outline',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>`,
      onClick: () => this.exportClients()
    })
    this.element.querySelector('#export-btn').appendChild(exportBtn)

    // Import button
    const importBtn = Button.create({
      text: 'Importer',
      variant: 'outline',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
      </svg>`,
      onClick: () => this.importClients()
    })
    this.element.querySelector('#import-btn').appendChild(importBtn)
  }

  renderTable() {
    const columns = [
      { key: 'name', label: 'Nom', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Téléphone', type: 'text' },
      { key: 'company', label: 'Entreprise', type: 'text' },
      { key: 'totalInvoices', label: 'Factures', type: 'number' },
      { key: 'totalAmount', label: 'Montant total', type: 'currency' },
      { key: 'created_at', label: 'Créé le', type: 'date' }
    ]

    const actions = [
      {
        label: 'Voir',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>`,
        color: 'blue',
        onClick: (client) => window.viewItem('client', client.id)
      },
      {
        label: 'Modifier',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>`,
        color: 'green',
        onClick: (client) => window.editItem('client', client.id)
      },
      {
        label: 'Dupliquer',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>`,
        color: 'purple',
        onClick: (client) => window.duplicateItem('client', client.id)
      },
      {
        label: 'Supprimer',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>`,
        color: 'red',
        onClick: (client) => window.deleteItem('client', client.id)
      }
    ]

    const table = Table.create({
      columns,
      data: this.filteredClients,
      actions,
      emptyMessage: 'Aucun client trouvé'
    })

    const container = this.element.querySelector('#clients-table')
    container.innerHTML = ''
    container.appendChild(table)
  }

  async loadClients() {
    this.clients = DatabaseService.getClients().map(client => {
      const invoices = DatabaseService.getInvoices().filter(inv => inv.client_id === client.id)
      const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)
      
      return {
        ...client,
        totalInvoices: invoices.length,
        totalAmount
      }
    })
    
    this.filterClients()
  }

  filterClients() {
    if (!this.searchTerm) {
      this.filteredClients = [...this.clients]
    } else {
      this.filteredClients = this.clients.filter(client =>
        client.name.toLowerCase().includes(this.searchTerm) ||
        (client.email && client.email.toLowerCase().includes(this.searchTerm)) ||
        (client.company && client.company.toLowerCase().includes(this.searchTerm)) ||
        (client.phone && client.phone.includes(this.searchTerm))
      )
    }
  }

  getTotalInvoices() {
    return this.clients.reduce((sum, client) => sum + client.totalInvoices, 0)
  }

  getTotalRevenue() {
    const total = this.clients.reduce((sum, client) => sum + client.totalAmount, 0)
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF', 
      minimumFractionDigits: 0 
    }).format(total)
  }

  showClientForm(client = null) {
    import('./ClientForm.js').then(({ ClientForm }) => {
      const form = new ClientForm(client)
      form.onSave = async (clientData) => {
        if (client) {
          DatabaseService.updateClient(client.id, clientData)
        } else {
          DatabaseService.addClient(clientData)
        }
        await this.loadClients()
        this.renderTable()
        this.modal.close()
      }
      
      form.onCancel = () => {
        this.modal.close()
      }

      this.modal = new Modal({
        title: client ? 'Modifier le client' : 'Nouveau client',
        size: 'lg',
        content: '<div id="client-form-container"></div>'
      })

      this.modal.open()
      
      form.render().then(formElement => {
        document.getElementById('client-form-container').appendChild(formElement)
      })
    })
  }

  viewClient(client) {
    const invoices = DatabaseService.getInvoices().filter(inv => inv.client_id === client.id)
    
    this.modal = new Modal({
      title: `Client: ${client.name}`,
      size: 'lg',
      content: `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Informations personnelles</h4>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Nom:</span> ${client.name}</div>
                <div><span class="font-medium">Email:</span> ${client.email || 'Non renseigné'}</div>
                <div><span class="font-medium">Téléphone:</span> ${client.phone || 'Non renseigné'}</div>
                <div><span class="font-medium">Entreprise:</span> ${client.company || 'Non renseigné'}</div>
                <div><span class="font-medium">Adresse:</span> ${client.address || 'Non renseigné'}</div>
              </div>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Statistiques</h4>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Factures:</span> ${client.totalInvoices}</div>
                <div><span class="font-medium">Montant total:</span> ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(client.totalAmount)}</div>
                <div><span class="font-medium">Client depuis:</span> ${new Date(client.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          </div>
          
          ${invoices.length > 0 ? `
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Factures récentes</h4>
              <div class="space-y-2">
                ${invoices.slice(0, 5).map(invoice => `
                  <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="font-medium">${invoice.number}</span>
                    <span class="text-sm text-gray-600">${new Date(invoice.date).toLocaleDateString('fr-FR')}</span>
                    <span class="font-medium">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(invoice.total || 0)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : '<p class="text-gray-500">Aucune facture pour ce client</p>'}
        </div>
      `
    })

    this.modal.open()
  }

  editClient(client) {
    this.showClientForm(client)
  }

  deleteClient(client) {
    this.modal = new Modal({
      title: 'Supprimer le client',
      content: `
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Êtes-vous sûr ?</h3>
          <p class="text-sm text-gray-500 mb-6">
            Cette action supprimera définitivement le client "${client.name}" et toutes ses données associées.
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
      DatabaseService.deleteClient(client.id)
      await this.loadClients()
      this.renderTable()
      this.modal.close()
    })
  }

  exportClients() {
    const csvContent = this.generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  generateCSV() {
    const headers = ['Nom', 'Email', 'Téléphone', 'Entreprise', 'Adresse', 'Factures', 'Montant total', 'Créé le']
    const rows = this.clients.map(client => [
      client.name,
      client.email || '',
      client.phone || '',
      client.company || '',
      client.address || '',
      client.totalInvoices,
      client.totalAmount,
      new Date(client.created_at).toLocaleDateString('fr-FR')
    ])

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
  }

  importClients() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            this.processCSV(e.target.result)
          } catch (error) {
            alert('Erreur lors de l\'importation: ' + error.message)
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  processCSV(csvContent) {
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    
    let imported = 0
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
        const client = {
          name: values[0],
          email: values[1],
          phone: values[2],
          company: values[3],
          address: values[4]
        }
        
        if (client.name) {
          DatabaseService.addClient(client)
          imported++
        }
      }
    }
    
    alert(`${imported} clients importés avec succès`)
    this.loadClients()
    this.renderTable()
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
