import { I18nService } from '../../../shared/services/I18nService.js'

/**
 * Invoice Form Page - Create and edit invoices
 */
export class InvoiceForm {
  constructor(invoiceId = null) {
    this.invoiceId = invoiceId
    this.isEdit = !!invoiceId
    this.invoice = this.getDefaultInvoice()
  }

  getDefaultInvoice() {
    return {
      id: null,
      number: '',
      client_id: '',
      date: new Date().toISOString().split('T')[0],
      due_date: '',
      status: 'draft',
      items: [
        { description: '', quantity: 1, price: 0, total: 0 }
      ],
      subtotal: 0,
      tax_rate: 18,
      tax_amount: 0,
      discount_rate: 0,
      discount_amount: 0,
      total: 0,
      notes: '',
      terms: ''
    }
  }

  async init() {
    if (this.isEdit) {
      await this.loadInvoice()
    }
    this.setupEventListeners()
    this.calculateTotals()
  }

  async loadInvoice() {
    // TODO: Load from database
    console.log('Loading invoice:', this.invoiceId)
  }

  async render() {
    return `
      <div class="container-fluid py-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              ${this.isEdit ? I18nService.t('invoices.edit') : I18nService.t('invoices.new')}
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              ${this.isEdit ? `Facture ${this.invoice.number}` : 'Créer une nouvelle facture'}
            </p>
          </div>
          <div class="flex space-x-3">
            <a href="/invoices" data-route="/invoices" class="btn btn-outline">
              ${I18nService.t('forms.cancel')}
            </a>
            <button id="save-invoice" class="btn btn-primary">
              ${I18nService.t('forms.save')}
            </button>
          </div>
        </div>

        <form id="invoice-form" class="space-y-6">
          <!-- Invoice Header -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Informations générales</h3>
            </div>
            <div class="card-body">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numéro de facture
                  </label>
                  <input type="text" id="invoice-number" class="input" value="${this.invoice.number}" placeholder="INV-001">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client
                  </label>
                  <select id="client-select" class="input">
                    <option value="">Sélectionner un client</option>
                    <option value="1">Entreprise ABC</option>
                    <option value="2">Société XYZ</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date de facture
                  </label>
                  <input type="date" id="invoice-date" class="input" value="${this.invoice.date}">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date d'échéance
                  </label>
                  <input type="date" id="due-date" class="input" value="${this.invoice.due_date}">
                </div>
              </div>
            </div>
          </div>

          <!-- Invoice Items -->
          <div class="card">
            <div class="card-header flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Articles</h3>
              <button type="button" id="add-item" class="btn btn-secondary btn-sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Ajouter un article
              </button>
            </div>
            <div class="card-body">
              <div class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th class="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                      <th class="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Quantité</th>
                      <th class="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-32">Prix unitaire</th>
                      <th class="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-32">Total</th>
                      <th class="w-12"></th>
                    </tr>
                  </thead>
                  <tbody id="invoice-items">
                    ${this.renderInvoiceItems()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Totals -->
          <div class="card">
            <div class="card-body">
              <div class="flex justify-end">
                <div class="w-full max-w-md space-y-4">
                  <div class="flex justify-between">
                    <span class="text-gray-700 dark:text-gray-300">Sous-total:</span>
                    <span id="subtotal" class="font-medium text-gray-900 dark:text-white">
                      ${I18nService.formatCurrency(this.invoice.subtotal)}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                      <span class="text-gray-700 dark:text-gray-300">TVA:</span>
                      <input type="number" id="tax-rate" class="w-16 px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600" 
                             value="${this.invoice.tax_rate}" min="0" max="100" step="0.1">
                      <span class="text-gray-700 dark:text-gray-300">%</span>
                    </div>
                    <span id="tax-amount" class="font-medium text-gray-900 dark:text-white">
                      ${I18nService.formatCurrency(this.invoice.tax_amount)}
                    </span>
                  </div>
                  <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                      <span class="text-gray-700 dark:text-gray-300">Remise:</span>
                      <input type="number" id="discount-rate" class="w-16 px-2 py-1 text-sm border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-600" 
                             value="${this.invoice.discount_rate}" min="0" max="100" step="0.1">
                      <span class="text-gray-700 dark:text-gray-300">%</span>
                    </div>
                    <span id="discount-amount" class="font-medium text-gray-900 dark:text-white">
                      -${I18nService.formatCurrency(this.invoice.discount_amount)}
                    </span>
                  </div>
                  <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div class="flex justify-between">
                      <span class="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                      <span id="total" class="text-lg font-bold text-gray-900 dark:text-white">
                        ${I18nService.formatCurrency(this.invoice.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes and Terms -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="card">
              <div class="card-header">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Notes</h3>
              </div>
              <div class="card-body">
                <textarea id="notes" class="input h-32" placeholder="Notes internes...">${this.invoice.notes}</textarea>
              </div>
            </div>
            <div class="card">
              <div class="card-header">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Conditions</h3>
              </div>
              <div class="card-body">
                <textarea id="terms" class="input h-32" placeholder="Conditions de paiement...">${this.invoice.terms}</textarea>
              </div>
            </div>
          </div>
        </form>
      </div>
    `
  }

  renderInvoiceItems() {
    return this.invoice.items.map((item, index) => `
      <tr class="invoice-item" data-index="${index}">
        <td class="py-2">
          <input type="text" class="input item-description" value="${item.description}" placeholder="Description de l'article">
        </td>
        <td class="py-2">
          <input type="number" class="input item-quantity" value="${item.quantity}" min="0" step="0.01">
        </td>
        <td class="py-2">
          <input type="number" class="input item-price" value="${item.price}" min="0" step="0.01">
        </td>
        <td class="py-2">
          <span class="item-total font-medium text-gray-900 dark:text-white">
            ${I18nService.formatCurrency(item.total)}
          </span>
        </td>
        <td class="py-2">
          <button type="button" class="remove-item text-red-600 hover:text-red-800 dark:text-red-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </td>
      </tr>
    `).join('')
  }

  setupEventListeners() {
    // Add item button
    document.getElementById('add-item')?.addEventListener('click', () => {
      this.addItem()
    })

    // Save button
    document.getElementById('save-invoice')?.addEventListener('click', (e) => {
      e.preventDefault()
      this.saveInvoice()
    })

    // Tax and discount rate changes
    document.getElementById('tax-rate')?.addEventListener('input', () => {
      this.calculateTotals()
    })

    document.getElementById('discount-rate')?.addEventListener('input', () => {
      this.calculateTotals()
    })

    // Item changes
    this.setupItemEventListeners()
  }

  setupItemEventListeners() {
    const itemsContainer = document.getElementById('invoice-items')
    if (!itemsContainer) return

    itemsContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
        this.updateItemTotal(e.target.closest('.invoice-item'))
        this.calculateTotals()
      }
    })

    itemsContainer.addEventListener('click', (e) => {
      if (e.target.closest('.remove-item')) {
        this.removeItem(e.target.closest('.invoice-item'))
      }
    })
  }

  addItem() {
    this.invoice.items.push({ description: '', quantity: 1, price: 0, total: 0 })
    this.rerenderItems()
  }

  removeItem(itemRow) {
    const index = parseInt(itemRow.dataset.index)
    this.invoice.items.splice(index, 1)
    this.rerenderItems()
    this.calculateTotals()
  }

  rerenderItems() {
    const itemsContainer = document.getElementById('invoice-items')
    if (itemsContainer) {
      itemsContainer.innerHTML = this.renderInvoiceItems()
      this.setupItemEventListeners()
    }
  }

  updateItemTotal(itemRow) {
    const index = parseInt(itemRow.dataset.index)
    const quantity = parseFloat(itemRow.querySelector('.item-quantity').value) || 0
    const price = parseFloat(itemRow.querySelector('.item-price').value) || 0
    const total = quantity * price

    this.invoice.items[index].quantity = quantity
    this.invoice.items[index].price = price
    this.invoice.items[index].total = total

    const totalElement = itemRow.querySelector('.item-total')
    if (totalElement) {
      totalElement.textContent = I18nService.formatCurrency(total)
    }
  }

  calculateTotals() {
    // Calculate subtotal
    this.invoice.subtotal = this.invoice.items.reduce((sum, item) => sum + item.total, 0)

    // Get tax and discount rates
    const taxRateElement = document.getElementById('tax-rate')
    const discountRateElement = document.getElementById('discount-rate')
    
    this.invoice.tax_rate = parseFloat(taxRateElement?.value) || 0
    this.invoice.discount_rate = parseFloat(discountRateElement?.value) || 0

    // Calculate amounts
    this.invoice.discount_amount = (this.invoice.subtotal * this.invoice.discount_rate) / 100
    const discountedSubtotal = this.invoice.subtotal - this.invoice.discount_amount
    this.invoice.tax_amount = (discountedSubtotal * this.invoice.tax_rate) / 100
    this.invoice.total = discountedSubtotal + this.invoice.tax_amount

    // Update UI
    this.updateTotalsDisplay()
  }

  updateTotalsDisplay() {
    const subtotalElement = document.getElementById('subtotal')
    const taxAmountElement = document.getElementById('tax-amount')
    const discountAmountElement = document.getElementById('discount-amount')
    const totalElement = document.getElementById('total')

    if (subtotalElement) subtotalElement.textContent = I18nService.formatCurrency(this.invoice.subtotal)
    if (taxAmountElement) taxAmountElement.textContent = I18nService.formatCurrency(this.invoice.tax_amount)
    if (discountAmountElement) discountAmountElement.textContent = '-' + I18nService.formatCurrency(this.invoice.discount_amount)
    if (totalElement) totalElement.textContent = I18nService.formatCurrency(this.invoice.total)
  }

  async saveInvoice() {
    try {
      // Collect form data
      this.collectFormData()

      // TODO: Save to database
      console.log('Saving invoice:', this.invoice)

      // Show success message
      alert('Facture sauvegardée avec succès!')

      // Redirect to invoice list
      window.history.pushState({}, '', '/invoices')
      window.dispatchEvent(new PopStateEvent('popstate'))

    } catch (error) {
      console.error('Error saving invoice:', error)
      alert('Erreur lors de la sauvegarde de la facture')
    }
  }

  collectFormData() {
    this.invoice.number = document.getElementById('invoice-number')?.value || ''
    this.invoice.client_id = document.getElementById('client-select')?.value || ''
    this.invoice.date = document.getElementById('invoice-date')?.value || ''
    this.invoice.due_date = document.getElementById('due-date')?.value || ''
    this.invoice.notes = document.getElementById('notes')?.value || ''
    this.invoice.terms = document.getElementById('terms')?.value || ''

    // Collect items data
    const itemRows = document.querySelectorAll('.invoice-item')
    this.invoice.items = Array.from(itemRows).map(row => ({
      description: row.querySelector('.item-description')?.value || '',
      quantity: parseFloat(row.querySelector('.item-quantity')?.value) || 0,
      price: parseFloat(row.querySelector('.item-price')?.value) || 0,
      total: parseFloat(row.querySelector('.item-quantity')?.value || 0) * parseFloat(row.querySelector('.item-price')?.value || 0)
    }))
  }
}

