import { DatabaseService } from '../../shared/services/DatabaseService.js'
import { Modal } from '../../shared/components/Modal.js'
import { NotificationService } from '../../shared/services/NotificationService.js'

/**
 * Expenses Page - Gestion des dépenses
 */
export class Expenses {
  constructor() {
    this.container = null
    this.expenses = []
    this.categories = []
    this.currentExpense = null
    this.filters = {
      category: '',
      startDate: '',
      endDate: '',
      search: ''
    }
  }

  async init() {
    await this.loadData()
    console.log('✅ Expenses page initialized')
  }

  async loadData() {
    try {
      this.expenses = DatabaseService.getExpenses()
      this.categories = DatabaseService.getExpenseCategories()
    } catch (error) {
      console.error('Error loading expenses data:', error)
      NotificationService.show('Erreur lors du chargement des données', 'error')
    }
  }

  async render() {
    await this.loadData()
    
    this.container = document.createElement('div')
    this.container.className = 'p-6'
    this.container.innerHTML = `
      <div class="expenses-page">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Gestion des Dépenses</h1>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Suivez et gérez toutes vos dépenses professionnelles
            </p>
          </div>
          <div class="mt-4 sm:mt-0">
            <button id="add-expense-btn" class="btn-primary">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Nouvelle Dépense
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rechercher
              </label>
              <input type="text" id="search-filter" placeholder="Description, fournisseur..."
                class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catégorie
              </label>
              <select id="category-filter" class="input-field">
                <option value="">Toutes les catégories</option>
                ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date début
              </label>
              <input type="date" id="start-date-filter" class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date fin
              </label>
              <input type="date" id="end-date-filter" class="input-field">
            </div>
          </div>
          <div class="mt-4 flex justify-end space-x-2">
            <button id="clear-filters-btn" class="btn-secondary">
              Effacer les filtres
            </button>
            <button id="apply-filters-btn" class="btn-primary">
              Appliquer
            </button>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Dépenses</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white" id="total-expenses">
                  ${this.formatCurrency(this.getTotalExpenses())}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre de Dépenses</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white" id="expenses-count">
                  ${this.getFilteredExpenses().length}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Dépense Moyenne</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white" id="average-expense">
                  ${this.formatCurrency(this.getAverageExpense())}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Expenses Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Liste des Dépenses</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Montant
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody id="expenses-table-body" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                ${this.renderExpensesRows()}
              </tbody>
            </table>
          </div>
          ${this.getFilteredExpenses().length === 0 ? `
            <div class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune dépense</h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Commencez par ajouter votre première dépense.</p>
            </div>
          ` : ''}
        </div>
      </div>
    `
    
    this.attachEventListeners()
    return this.container
  }

  renderExpensesRows() {
    const filteredExpenses = this.getFilteredExpenses()
    
    return filteredExpenses.map(expense => `
      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          ${new Date(expense.date).toLocaleDateString('fr-FR')}
        </td>
        <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
          <div class="max-w-xs truncate" title="${expense.description || ''}">
            ${expense.description || '-'}
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            ${expense.category || 'Autres'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          ${expense.supplier || '-'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          ${this.formatCurrency(expense.amount)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex justify-end space-x-2">
            <button onclick="window.expensesPage.editExpense(${expense.id})" 
              class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button onclick="window.expensesPage.deleteExpense(${expense.id})" 
              class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('')
  }

  attachEventListeners() {
    // Add expense button
    const addBtn = document.getElementById('add-expense-btn')
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showExpenseModal())
    }

    // Filter buttons
    const applyFiltersBtn = document.getElementById('apply-filters-btn')
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => this.applyFilters())
    }

    const clearFiltersBtn = document.getElementById('clear-filters-btn')
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => this.clearFilters())
    }

    // Search input with debounce
    const searchInput = document.getElementById('search-filter')
    if (searchInput) {
      let timeout
      searchInput.addEventListener('input', () => {
        clearTimeout(timeout)
        timeout = setTimeout(() => this.applyFilters(), 300)
      })
    }

    // Make this instance globally accessible for onclick handlers
    window.expensesPage = this
  }

  showExpenseModal(expense = null) {
    this.currentExpense = expense
    const isEdit = !!expense

    const modal = Modal.create({
      title: isEdit ? 'Modifier la Dépense' : 'Nouvelle Dépense',
      content: `
        <form id="expense-form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date *
              </label>
              <input type="date" id="expense-date" required class="input-field"
                value="${expense?.date || new Date().toISOString().split('T')[0]}">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Montant *
              </label>
              <input type="number" id="expense-amount" required step="0.01" min="0" 
                placeholder="0.00" class="input-field" value="${expense?.amount || ''}">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Catégorie *
            </label>
            <select id="expense-category" required class="input-field">
              <option value="">Sélectionner une catégorie</option>
              ${this.categories.map(cat => `
                <option value="${cat}" ${expense?.category === cat ? 'selected' : ''}>${cat}</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea id="expense-description" required rows="3" 
              placeholder="Description de la dépense..." class="input-field">${expense?.description || ''}</textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fournisseur
            </label>
            <input type="text" id="expense-supplier" placeholder="Nom du fournisseur" 
              class="input-field" value="${expense?.supplier || ''}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mode de paiement
            </label>
            <select id="expense-payment-method" class="input-field">
              <option value="">Sélectionner</option>
              <option value="cash" ${expense?.payment_method === 'cash' ? 'selected' : ''}>Espèces</option>
              <option value="card" ${expense?.payment_method === 'card' ? 'selected' : ''}>Carte bancaire</option>
              <option value="transfer" ${expense?.payment_method === 'transfer' ? 'selected' : ''}>Virement</option>
              <option value="check" ${expense?.payment_method === 'check' ? 'selected' : ''}>Chèque</option>
            </select>
          </div>
        </form>
      `,
      actions: [
        {
          label: 'Annuler',
          variant: 'secondary',
          onClick: () => modal.close()
        },
        {
          label: isEdit ? 'Modifier' : 'Ajouter',
          variant: 'primary',
          onClick: () => this.saveExpense(modal)
        }
      ]
    })

    modal.show()
  }

  async saveExpense(modal) {
    try {
      const form = document.getElementById('expense-form')
      if (!form.checkValidity()) {
        form.reportValidity()
        return
      }

      const expenseData = {
        date: document.getElementById('expense-date').value,
        amount: parseFloat(document.getElementById('expense-amount').value),
        category: document.getElementById('expense-category').value,
        description: document.getElementById('expense-description').value,
        supplier: document.getElementById('expense-supplier').value,
        payment_method: document.getElementById('expense-payment-method').value
      }

      if (this.currentExpense) {
        // Update existing expense
        DatabaseService.updateExpense(this.currentExpense.id, expenseData)
        NotificationService.show('Dépense modifiée avec succès', 'success')
      } else {
        // Add new expense
        DatabaseService.addExpense(expenseData)
        NotificationService.show('Dépense ajoutée avec succès', 'success')
      }

      await this.loadData()
      this.refreshView()
      modal.close()

    } catch (error) {
      console.error('Error saving expense:', error)
      NotificationService.show('Erreur lors de la sauvegarde', 'error')
    }
  }

  editExpense(id) {
    const expense = this.expenses.find(e => e.id === id)
    if (expense) {
      this.showExpenseModal(expense)
    }
  }

  deleteExpense(id) {
    const expense = this.expenses.find(e => e.id === id)
    if (!expense) return

    const modal = Modal.create({
      title: 'Supprimer la Dépense',
      content: `
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Êtes-vous sûr ?
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Cette action supprimera définitivement la dépense "${expense.description}". Cette action ne peut pas être annulée.
          </p>
        </div>
      `,
      actions: [
        {
          label: 'Annuler',
          variant: 'secondary',
          onClick: () => modal.close()
        },
        {
          label: 'Supprimer',
          variant: 'danger',
          onClick: async () => {
            try {
              DatabaseService.deleteExpense(id)
              await this.loadData()
              this.refreshView()
              modal.close()
              NotificationService.show('Dépense supprimée avec succès', 'success')
            } catch (error) {
              console.error('Error deleting expense:', error)
              NotificationService.show('Erreur lors de la suppression', 'error')
            }
          }
        }
      ]
    })

    modal.show()
  }

  applyFilters() {
    this.filters = {
      search: document.getElementById('search-filter')?.value || '',
      category: document.getElementById('category-filter')?.value || '',
      startDate: document.getElementById('start-date-filter')?.value || '',
      endDate: document.getElementById('end-date-filter')?.value || ''
    }
    this.refreshView()
  }

  clearFilters() {
    this.filters = { category: '', startDate: '', endDate: '', search: '' }
    
    // Clear form inputs
    const searchInput = document.getElementById('search-filter')
    const categorySelect = document.getElementById('category-filter')
    const startDateInput = document.getElementById('start-date-filter')
    const endDateInput = document.getElementById('end-date-filter')
    
    if (searchInput) searchInput.value = ''
    if (categorySelect) categorySelect.value = ''
    if (startDateInput) startDateInput.value = ''
    if (endDateInput) endDateInput.value = ''
    
    this.refreshView()
  }

  getFilteredExpenses() {
    let filtered = [...this.expenses]

    // Filter by search
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase()
      filtered = filtered.filter(expense => 
        (expense.description || '').toLowerCase().includes(search) ||
        (expense.supplier || '').toLowerCase().includes(search) ||
        (expense.category || '').toLowerCase().includes(search)
      )
    }

    // Filter by category
    if (this.filters.category) {
      filtered = filtered.filter(expense => expense.category === this.filters.category)
    }

    // Filter by date range
    if (this.filters.startDate) {
      filtered = filtered.filter(expense => expense.date >= this.filters.startDate)
    }
    if (this.filters.endDate) {
      filtered = filtered.filter(expense => expense.date <= this.filters.endDate)
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  getTotalExpenses() {
    return this.getFilteredExpenses().reduce((sum, expense) => sum + (expense.amount || 0), 0)
  }

  getAverageExpense() {
    const filtered = this.getFilteredExpenses()
    return filtered.length > 0 ? this.getTotalExpenses() / filtered.length : 0
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

  refreshView() {
    // Update summary cards
    const totalExpensesEl = document.getElementById('total-expenses')
    const expensesCountEl = document.getElementById('expenses-count')
    const averageExpenseEl = document.getElementById('average-expense')

    if (totalExpensesEl) totalExpensesEl.textContent = this.formatCurrency(this.getTotalExpenses())
    if (expensesCountEl) expensesCountEl.textContent = this.getFilteredExpenses().length
    if (averageExpenseEl) averageExpenseEl.textContent = this.formatCurrency(this.getAverageExpense())

    // Update table
    const tableBody = document.getElementById('expenses-table-body')
    if (tableBody) {
      tableBody.innerHTML = this.renderExpensesRows()
    }
  }

  destroy() {
    // Clean up global reference
    if (window.expensesPage === this) {
      delete window.expensesPage
    }
  }
}
