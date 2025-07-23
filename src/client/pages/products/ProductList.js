import { DatabaseService } from '../../../shared/services/DatabaseService.js'
import { Table } from '../../../shared/components/Table.js'
import { Button } from '../../../shared/components/Button.js'
import { Modal } from '../../../shared/components/Modal.js'

export class ProductList {
  constructor() {
    this.element = null
    this.products = []
    this.filteredProducts = []
    this.searchTerm = ''
    this.categoryFilter = 'all'
    this.modal = null
  }

  async render() {
    // Initialize database if not already done
    if (!DatabaseService.isInitialized) {
      await DatabaseService.init()
    }

    await this.loadProducts()

    this.element = document.createElement('div')
    this.element.className = 'p-6'
    this.element.innerHTML = `
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Produits et services</h1>
            <p class="text-gray-600 dark:text-gray-400">Gérez votre catalogue de produits et services</p>
          </div>
          <div id="new-product-btn"></div>
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
                placeholder="Rechercher un produit..."
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
            <select id="category-filter" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="all">Toutes catégories</option>
              <option value="produit">Produit</option>
              <option value="service">Service</option>
              <option value="consultation">Consultation</option>
              <option value="formation">Formation</option>
            </select>
            <div id="export-btn"></div>
            <div id="import-btn"></div>
          </div>
        </div>
      </div>

      <!-- Products Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div id="products-table"></div>
      </div>

      <!-- Stats -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total produits</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.products.length}</p>
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
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Prix moyen</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.getAveragePrice()}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Catégories</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.getUniqueCategories().length}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Stock total</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">${this.getTotalStock()}</p>
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
      this.filterProducts()
      this.renderTable()
    })

    // Category filter
    const categoryFilter = this.element.querySelector('#category-filter')
    categoryFilter.addEventListener('change', (e) => {
      this.categoryFilter = e.target.value
      this.filterProducts()
      this.renderTable()
    })
  }

  renderButtons() {
    // New product button
    const newProductBtn = Button.create({
      text: 'Nouveau produit',
      variant: 'primary',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>`,
      onClick: () => this.showProductForm()
    })
    this.element.querySelector('#new-product-btn').appendChild(newProductBtn)

    // Export button
    const exportBtn = Button.create({
      text: 'Exporter',
      variant: 'outline',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>`,
      onClick: () => this.exportProducts()
    })
    this.element.querySelector('#export-btn').appendChild(exportBtn)

    // Import button
    const importBtn = Button.create({
      text: 'Importer',
      variant: 'outline',
      icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
      </svg>`,
      onClick: () => this.importProducts()
    })
    this.element.querySelector('#import-btn').appendChild(importBtn)
  }

  renderTable() {
    const columns = [
      { key: 'name', label: 'Nom', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'category', label: 'Catégorie', type: 'text' },
      { key: 'price', label: 'Prix', type: 'currency' },
      { key: 'unit', label: 'Unité', type: 'text' },
      { key: 'stock', label: 'Stock', type: 'number' },
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
        onClick: (product) => this.viewProduct(product)
      },
      {
        label: 'Modifier',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>`,
        color: 'green',
        onClick: (product) => this.editProduct(product)
      },
      {
        label: 'Dupliquer',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>`,
        color: 'purple',
        onClick: (product) => this.duplicateProduct(product)
      },
      {
        label: 'Supprimer',
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>`,
        color: 'red',
        onClick: (product) => this.deleteProduct(product)
      }
    ]

    const table = Table.create({
      columns,
      data: this.filteredProducts,
      actions,
      emptyMessage: 'Aucun produit trouvé'
    })

    const container = this.element.querySelector('#products-table')
    container.innerHTML = ''
    container.appendChild(table)
  }

  async loadProducts() {
    this.products = DatabaseService.getProducts()
    this.filterProducts()
  }

  filterProducts() {
    this.filteredProducts = this.products.filter(product => {
      const matchesSearch = !this.searchTerm || 
        product.name.toLowerCase().includes(this.searchTerm) ||
        (product.description && product.description.toLowerCase().includes(this.searchTerm)) ||
        (product.category && product.category.toLowerCase().includes(this.searchTerm))
      
      const matchesCategory = this.categoryFilter === 'all' || 
        (product.category && product.category.toLowerCase() === this.categoryFilter)

      return matchesSearch && matchesCategory
    })
  }

  getAveragePrice() {
    if (this.products.length === 0) return '0 XOF'
    const total = this.products.reduce((sum, product) => sum + (parseFloat(product.price) || 0), 0)
    const average = total / this.products.length
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF', 
      minimumFractionDigits: 0 
    }).format(average)
  }

  getUniqueCategories() {
    const categories = this.products
      .map(product => product.category)
      .filter(category => category && category.trim())
    return [...new Set(categories)]
  }

  getTotalStock() {
    return this.products.reduce((sum, product) => sum + (parseInt(product.stock) || 0), 0)
  }

  showProductForm(product = null) {
    import('./ProductForm.js').then(({ ProductForm }) => {
      const form = new ProductForm(product)
      form.onSave = async (productData) => {
        if (product) {
          DatabaseService.updateProduct(product.id, productData)
        } else {
          DatabaseService.addProduct(productData)
        }
        await this.loadProducts()
        this.renderTable()
        this.modal.close()
      }
      
      form.onCancel = () => {
        this.modal.close()
      }

      this.modal = new Modal({
        title: product ? 'Modifier le produit' : 'Nouveau produit',
        size: 'lg',
        content: '<div id="product-form-container"></div>'
      })

      this.modal.open()
      
      form.render().then(formElement => {
        document.getElementById('product-form-container').appendChild(formElement)
      })
    })
  }

  viewProduct(product) {
    this.modal = new Modal({
      title: `Produit: ${product.name}`,
      size: 'lg',
      content: `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Informations générales</h4>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Nom:</span> ${product.name}</div>
                <div><span class="font-medium">Description:</span> ${product.description || 'Non renseigné'}</div>
                <div><span class="font-medium">Catégorie:</span> ${product.category || 'Non renseigné'}</div>
                <div><span class="font-medium">Unité:</span> ${product.unit || 'pièce'}</div>
              </div>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Prix et stock</h4>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Prix:</span> ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(product.price || 0)}</div>
                <div><span class="font-medium">Stock:</span> ${product.stock || 0} ${product.unit || 'pièce'}(s)</div>
                <div><span class="font-medium">Créé le:</span> ${new Date(product.created_at).toLocaleDateString('fr-FR')}</div>
                <div><span class="font-medium">Modifié le:</span> ${new Date(product.updated_at).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">Valeur du stock</h4>
            <p class="text-2xl font-bold text-green-600">
              ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format((product.price || 0) * (product.stock || 0))}
            </p>
          </div>
        </div>
      `
    })

    this.modal.open()
  }

  viewProduct(product) {
    this.modal = new Modal({
      title: `Produit: ${product.name}`,
      content: `
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Informations générales</h4>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Nom:</span> ${product.name}</div>
                <div><span class="font-medium">Prix:</span> ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(product.price || 0)}</div>
                <div><span class="font-medium">Catégorie:</span> ${product.category || 'Non définie'}</div>
                <div><span class="font-medium">Stock:</span> ${product.stock || 0} unités</div>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Détails</h4>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Créé le:</span> ${new Date(product.created_at).toLocaleDateString('fr-FR')}</div>
                <div><span class="font-medium">Modifié le:</span> ${new Date(product.updated_at).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          </div>
          ${product.description ? `
            <div class="border-t pt-4">
              <h4 class="font-medium text-gray-900 mb-2">Description</h4>
              <p class="text-sm text-gray-600 bg-gray-50 p-3 rounded">${product.description}</p>
            </div>
          ` : ''}
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button class="edit-btn px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
              Modifier
            </button>
            <button class="close-btn px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Fermer
            </button>
          </div>
        </div>
      `
    })

    this.modal.open()

    // Add event listeners
    this.modal.element.querySelector('.close-btn').addEventListener('click', () => {
      this.modal.close()
    })

    this.modal.element.querySelector('.edit-btn').addEventListener('click', () => {
      this.modal.close()
      this.editProduct(product)
    })
  }

  editProduct(product) {
    this.showProductForm(product)
  }

  duplicateProduct(product) {
    const duplicatedProduct = {
      ...product,
      name: `${product.name} (Copie)`,
      id: undefined,
      created_at: undefined,
      updated_at: undefined
    }
    this.showProductForm(duplicatedProduct)
  }

  deleteProduct(product) {
    this.modal = new Modal({
      title: 'Supprimer le produit',
      content: `
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Êtes-vous sûr ?</h3>
          <p class="text-sm text-gray-500 mb-6">
            Cette action supprimera définitivement le produit "${product.name}".
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
      try {
        DatabaseService.deleteProduct(product.id)
        await this.loadProducts()
        this.renderTable()
        this.modal.close()
        
        // Show success notification
        if (window.showNotification) {
          window.showNotification('Produit supprimé avec succès', 'success')
        }
      } catch (error) {
        console.error('Error deleting product:', error)
        if (window.showNotification) {
          window.showNotification('Erreur lors de la suppression du produit', 'error')
        }
      }
    })
  }

  exportProducts() {
    const csvContent = this.generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `produits_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  generateCSV() {
    const headers = ['Nom', 'Description', 'Catégorie', 'Prix', 'Unité', 'Stock', 'Créé le']
    const rows = this.products.map(product => [
      product.name,
      product.description || '',
      product.category || '',
      product.price || 0,
      product.unit || 'pièce',
      product.stock || 0,
      new Date(product.created_at).toLocaleDateString('fr-FR')
    ])

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
  }

  importProducts() {
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
        const product = {
          name: values[0],
          description: values[1],
          category: values[2],
          price: parseFloat(values[3]) || 0,
          unit: values[4] || 'pièce',
          stock: parseInt(values[5]) || 0
        }
        
        if (product.name) {
          DatabaseService.addProduct(product)
          imported++
        }
      }
    }
    
    alert(`${imported} produits importés avec succès`)
    this.loadProducts()
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
