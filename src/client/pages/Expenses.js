import { DatabaseService } from '../../shared/services/DatabaseService.js'

export class ExpensesPage {
  constructor() {
    this.expenses = []
    this.filteredExpenses = []
    this.categories = []
    this.currentFilter = 'all'
    this.searchTerm = ''
    this.dateFilter = 'all'
    this.container = null
    this.isModalOpen = false
    this.editingExpense = null
  }

  async init() {
    await this.loadData()
    this.filteredExpenses = [...this.expenses]
  }

  async loadData() {
    try {
      this.expenses = DatabaseService.getExpenses()
      this.categories = DatabaseService.getExpenseCategories()
      console.log('Loaded expenses:', this.expenses)
      console.log('Loaded categories:', this.categories)
    } catch (error) {
      console.error('Error loading expenses data:', error)
      this.expenses = []
      this.categories = []
    }
  }

  async render() {
    await this.init()
    
    this.container = document.createElement('div')
    this.container.className = 'p-6'
    this.container.innerHTML = this.getMainHTML()

    // Attach event listeners after DOM is created
    setTimeout(() => {
      this.attachEventListeners()
      this.updateSummaryCards()
      this.populateCategoryFilter()
      this.renderExpensesTable()
      this.createModal()
    }, 100)

    // Make this instance globally accessible for onclick handlers
    window.expensesPage = this

    return this.container
  }

  getMainHTML() {
    return `
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gestion des Dépenses</h1>
        <p class="text-gray-600 dark:text-gray-400">Suivez et gérez toutes vos dépenses d'entreprise</p>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Dépenses</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white" id="total-expenses">0 XOF</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre de Dépenses</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white" id="total-count">0</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Moyenne par Dépense</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white" id="average-expense">0 XOF</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Actions -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div class="p-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex flex-col sm:flex-row gap-4">
              <!-- Search -->
              <div class="relative">
                <input
                  type="text"
                  id="search-expenses"
                  placeholder="Rechercher une dépense..."
                  class="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>

              <!-- Category Filter -->
              <select id="category-filter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                <option value="all">Toutes les catégories</option>
              </select>

              <!-- Date Filter -->
              <select id="date-filter" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>

            <!-- Add Expense Button -->
            <button
              id="add-expense-btn"
              class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Ajouter une dépense
            </button>
          </div>
        </div>
      </div>

      <!-- Expenses Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden" id="expenses-table-container">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Liste des Dépenses</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catégorie</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fournisseur</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Montant</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="expenses-table-body" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <!-- Expenses will be inserted here -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div id="empty-state" class="hidden text-center py-12">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700">
          <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Aucune dépense trouvée</h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Commencez par ajouter votre première dépense pour suivre vos coûts.</p>
        <div class="mt-6">
          <button
            id="add-first-expense-btn"
            class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Ajouter une dépense
          </button>
        </div>
      </div>
    `
  }

  attachEventListeners() {
    console.log('Attaching event listeners...')
    
    // Search functionality
    const searchInput = document.getElementById('search-expenses')
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase()
        this.applyFilters()
      })
      console.log('Search input listener attached')
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter')
    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        this.currentFilter = e.target.value
        this.applyFilters()
      })
      console.log('Category filter listener attached')
    }

    // Date filter
    const dateFilter = document.getElementById('date-filter')
    if (dateFilter) {
      dateFilter.addEventListener('change', (e) => {
        this.dateFilter = e.target.value
        this.applyFilters()
      })
      console.log('Date filter listener attached')
    }

    // Add expense buttons
    const addExpenseBtn = document.getElementById('add-expense-btn')
    const addFirstExpenseBtn = document.getElementById('add-first-expense-btn')
    
    if (addExpenseBtn) {
      addExpenseBtn.addEventListener('click', (e) => {
        e.preventDefault()
        console.log('Add expense button clicked')
        this.showAddExpenseModal()
      })
      console.log('Add expense button listener attached')
    }
    
    if (addFirstExpenseBtn) {
      addFirstExpenseBtn.addEventListener('click', (e) => {
        e.preventDefault()
        console.log('Add first expense button clicked')
        this.showAddExpenseModal()
      })
      console.log('Add first expense button listener attached')
    }
  }

  populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter')
    if (categoryFilter && this.categories.length > 0) {
      // Clear existing options except "all"
      categoryFilter.innerHTML = '<option value="all">Toutes les catégories</option>'
      
      this.categories.forEach(category => {
        const option = document.createElement('option')
        option.value = category
        option.textContent = category
        categoryFilter.appendChild(option)
      })
      console.log('Category filter populated with', this.categories.length, 'categories')
    }
  }

  applyFilters() {
    let filtered = [...this.expenses]

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description?.toLowerCase().includes(this.searchTerm) ||
        expense.supplier?.toLowerCase().includes(this.searchTerm) ||
        expense.category?.toLowerCase().includes(this.searchTerm)
      )
    }

    // Apply category filter
    if (this.currentFilter && this.currentFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === this.currentFilter)
    }

    // Apply date filter
    if (this.dateFilter && this.dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date)
        
        switch (this.dateFilter) {
          case 'today':
            return expenseDate >= today
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            return expenseDate >= weekAgo
          case 'month':
            return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
          case 'year':
            return expenseDate.getFullYear() === now.getFullYear()
          default:
            return true
        }
      })
    }

    this.filteredExpenses = filtered
    this.renderExpensesTable()
    this.updateSummaryCards()
  }

  updateSummaryCards() {
    const totalExpenses = this.filteredExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
    const count = this.filteredExpenses.length
    const average = count > 0 ? totalExpenses / count : 0

    const totalElement = document.getElementById('total-expenses')
    const countElement = document.getElementById('total-count')
    const averageElement = document.getElementById('average-expense')

    if (totalElement) totalElement.textContent = `${totalExpenses.toLocaleString('fr-FR')} XOF`
    if (countElement) countElement.textContent = count.toString()
    if (averageElement) averageElement.textContent = `${Math.round(average).toLocaleString('fr-FR')} XOF`
  }

  renderExpensesTable() {
    const tableBody = document.getElementById('expenses-table-body')
    const emptyState = document.getElementById('empty-state')
    const tableContainer = document.getElementById('expenses-table-container')
    
    if (!tableBody) return

    if (this.filteredExpenses.length === 0) {
      tableBody.innerHTML = ''
      if (emptyState) emptyState.classList.remove('hidden')
      if (tableContainer) tableContainer.classList.add('hidden')
      return
    }

    if (emptyState) emptyState.classList.add('hidden')
    if (tableContainer) tableContainer.classList.remove('hidden')

    tableBody.innerHTML = this.filteredExpenses.map(expense => `
      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          ${new Date(expense.date).toLocaleDateString('fr-FR')}
        </td>
        <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
          <div class="font-medium">${expense.description || 'N/A'}</div>
          ${expense.notes ? `<div class="text-gray-500 dark:text-gray-400 text-xs mt-1">${expense.notes}</div>` : ''}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            ${expense.category || 'N/A'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          ${expense.supplier || 'N/A'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
          ${parseFloat(expense.amount || 0).toLocaleString('fr-FR')} XOF
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div class="flex space-x-3">
            <button
              onclick="window.expensesPage.editExpense(${expense.id})"
              class="inline-flex items-center px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              Modifier
            </button>
            <button
              onclick="window.expensesPage.deleteExpense(${expense.id})"
              class="inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Supprimer
            </button>
          </div>
        </td>
      </tr>
    `).join('')
  }

  createModal() {
    console.log('Creating modal...')
    
    // Remove existing modal if any
    const existingModal = document.getElementById('expense-modal')
    if (existingModal) {
      existingModal.remove()
    }

    // Create modal HTML
    const modalHTML = `
      <div id="expense-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 hidden">
        <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
          <div class="mt-3">
            <!-- Modal Header -->
            <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white" id="modal-title">
                Ajouter une dépense
              </h3>
              <button
                id="close-modal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <form id="expense-form" class="mt-6 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Description -->
                <div class="md:col-span-2">
                  <label for="expense-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    id="expense-description"
                    name="description"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: Achat de fournitures de bureau"
                  >
                </div>

                <!-- Amount -->
                <div>
                  <label for="expense-amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Montant (XOF) *
                  </label>
                  <input
                    type="number"
                    id="expense-amount"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  >
                </div>

                <!-- Date -->
                <div>
                  <label for="expense-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="expense-date"
                    name="date"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                </div>

                <!-- Category -->
                <div>
                  <label for="expense-category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catégorie *
                  </label>
                  <select
                    id="expense-category"
                    name="category"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Sélectionner une catégorie</option>
                  </select>
                </div>

                <!-- Supplier -->
                <div>
                  <label for="expense-supplier" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fournisseur
                  </label>
                  <input
                    type="text"
                    id="expense-supplier"
                    name="supplier"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Nom du fournisseur"
                  >
                </div>

                <!-- Payment Method -->
                <div>
                  <label for="expense-payment-method" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mode de paiement
                  </label>
                  <select
                    id="expense-payment-method"
                    name="payment_method"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Sélectionner</option>
                    <option value="cash">Espèces</option>
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="check">Chèque</option>
                    <option value="card">Carte bancaire</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                <!-- Notes -->
                <div class="md:col-span-2">
                  <label for="expense-notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="expense-notes"
                    name="notes"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Notes additionnelles..."
                  ></textarea>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700 space-x-4">
                <button
                  type="button"
                  id="cancel-expense"
                  class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  class="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                >
                  <span id="submit-text">Ajouter la dépense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `

    // Add modal to the page
    document.body.insertAdjacentHTML('beforeend', modalHTML)

    // Set up modal event listeners
    this.setupModalEventListeners()
    console.log('Modal created and event listeners attached')
  }

  setupModalEventListeners() {
    const modal = document.getElementById('expense-modal')
    const closeBtn = document.getElementById('close-modal')
    const cancelBtn = document.getElementById('cancel-expense')
    const form = document.getElementById('expense-form')

    // Close modal events
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        console.log('Close button clicked')
        this.hideModal()
      })
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        console.log('Cancel button clicked')
        this.hideModal()
      })
    }
    
    // Close modal when clicking outside
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          console.log('Modal backdrop clicked')
          this.hideModal()
        }
      })
    }

    // Form submission
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        console.log('Form submitted')
        this.handleFormSubmit()
      })
    }

    // Set today's date as default
    const dateInput = document.getElementById('expense-date')
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0]
    }

    // Populate categories in modal
    this.populateModalCategories()
  }

  populateModalCategories() {
    const categorySelect = document.getElementById('expense-category')
    if (categorySelect && this.categories.length > 0) {
      categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>'
      
      this.categories.forEach(category => {
        const option = document.createElement('option')
        option.value = category
        option.textContent = category
        categorySelect.appendChild(option)
      })
      console.log('Modal categories populated')
    }
  }

  showAddExpenseModal() {
    console.log('showAddExpenseModal called')
    this.editingExpense = null
    const modal = document.getElementById('expense-modal')
    const title = document.getElementById('modal-title')
    const submitText = document.getElementById('submit-text')
    const form = document.getElementById('expense-form')

    if (title) title.textContent = 'Ajouter une dépense'
    if (submitText) submitText.textContent = 'Ajouter la dépense'
    if (form) form.reset()

    // Set today's date as default
    const dateInput = document.getElementById('expense-date')
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0]
    }

    if (modal) {
      modal.classList.remove('hidden')
      this.isModalOpen = true
      console.log('Modal should be visible now')
      
      // Focus on first input
      const firstInput = document.getElementById('expense-description')
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100)
      }
    } else {
      console.error('Modal not found!')
    }
  }

  hideModal() {
    console.log('hideModal called')
    const modal = document.getElementById('expense-modal')
    if (modal) {
      modal.classList.add('hidden')
      this.isModalOpen = false
      this.editingExpense = null
      console.log('Modal hidden')
    }
  }

  async handleFormSubmit() {
    console.log('handleFormSubmit called')
    const form = document.getElementById('expense-form')
    if (!form) return

    const formData = new FormData(form)
    const expenseData = {
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      date: formData.get('date'),
      category: formData.get('category'),
      supplier: formData.get('supplier') || '',
      payment_method: formData.get('payment_method') || '',
      notes: formData.get('notes') || ''
    }

    console.log('Form data:', expenseData)

    // Validation
    if (!expenseData.description || !expenseData.amount || !expenseData.date || !expenseData.category) {
      alert('Veuillez remplir tous les champs obligatoires.')
      return
    }

    if (expenseData.amount <= 0) {
      alert('Le montant doit être supérieur à 0.')
      return
    }

    try {
      if (this.editingExpense) {
        // Update existing expense
        DatabaseService.updateExpense(this.editingExpense.id, expenseData)
        this.showNotification('Dépense modifiée avec succès!', 'success')
        console.log('Expense updated')
      } else {
        // Add new expense
        const newExpense = DatabaseService.addExpense(expenseData)
        this.showNotification('Dépense ajoutée avec succès!', 'success')
        console.log('New expense added:', newExpense)
      }

      // Refresh data and UI
      await this.loadData()
      this.applyFilters()
      this.hideModal()

    } catch (error) {
      console.error('Error saving expense:', error)
      this.showNotification('Erreur lors de la sauvegarde de la dépense.', 'error')
    }
  }

  editExpense(id) {
    console.log('editExpense called with id:', id)
    const expense = DatabaseService.getExpense(id)
    if (!expense) {
      this.showNotification('Dépense introuvable.', 'error')
      return
    }

    this.editingExpense = expense
    
    // Show modal
    const modal = document.getElementById('expense-modal')
    const title = document.getElementById('modal-title')
    const submitText = document.getElementById('submit-text')

    if (title) title.textContent = 'Modifier la dépense'
    if (submitText) submitText.textContent = 'Modifier la dépense'

    // Populate form with expense data
    document.getElementById('expense-description').value = expense.description || ''
    document.getElementById('expense-amount').value = expense.amount || ''
    document.getElementById('expense-date').value = expense.date || ''
    document.getElementById('expense-category').value = expense.category || ''
    document.getElementById('expense-supplier').value = expense.supplier || ''
    document.getElementById('expense-payment-method').value = expense.payment_method || ''
    document.getElementById('expense-notes').value = expense.notes || ''

    if (modal) {
      modal.classList.remove('hidden')
      this.isModalOpen = true
    }
  }

  deleteExpense(id) {
    console.log('deleteExpense called with id:', id)
    if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.')) {
      try {
        DatabaseService.deleteExpense(id)
        this.showNotification('Dépense supprimée avec succès!', 'success')
        console.log('Expense deleted')
        
        // Refresh data and UI
        this.loadData().then(() => {
          this.applyFilters()
        })
      } catch (error) {
        console.error('Error deleting expense:', error)
        this.showNotification('Erreur lors de la suppression de la dépense.', 'error')
      }
    }
  }

  showNotification(message, type = 'info') {
    console.log('Showing notification:', message, type)
    
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`
    notification.textContent = message

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full')
    }, 100)

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full')
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 3000)
  }
}
