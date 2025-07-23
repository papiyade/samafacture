import { Form } from '../../../shared/components/Form.js'
import { DatabaseService } from '../../../shared/services/DatabaseService.js'

export class QuoteForm {
  constructor(quote = null) {
    this.quote = quote
    this.element = null
    this.form = null
    this.onSave = () => {}
    this.onCancel = () => {}
  }

  async render() {
    // Get clients for dropdown
    const clients = DatabaseService.getClients()
    const clientOptions = clients.map(client => ({
      value: client.id,
      label: client.name
    }))

    const fields = [
      {
        name: 'client_id',
        label: 'Client',
        type: 'select',
        required: true,
        value: this.quote?.client_id || '',
        options: clientOptions
      },
      {
        name: 'number',
        label: 'Numéro de devis',
        type: 'text',
        required: true,
        placeholder: 'Ex: DEV-001',
        value: this.quote?.number || `DEV-${Date.now()}`
      },
      {
        name: 'date',
        label: 'Date du devis',
        type: 'date',
        required: true,
        value: this.quote?.date || new Date().toISOString().split('T')[0]
      },
      {
        name: 'valid_until',
        label: 'Valide jusqu\'au',
        type: 'date',
        value: this.quote?.valid_until || this.getDefaultValidUntil()
      },
      {
        name: 'subtotal',
        label: 'Sous-total (XOF)',
        type: 'number',
        required: true,
        placeholder: '0',
        value: this.quote?.subtotal || '',
        validate: (value) => {
          const amount = parseFloat(value)
          if (isNaN(amount) || amount < 0) {
            return 'Le montant doit être un nombre positif'
          }
          return true
        }
      },
      {
        name: 'tax_rate',
        label: 'Taux de TVA (%)',
        type: 'number',
        placeholder: '18',
        value: this.quote?.tax_rate || '18',
        validate: (value) => {
          const rate = parseFloat(value)
          if (isNaN(rate) || rate < 0 || rate > 100) {
            return 'Le taux de TVA doit être entre 0 et 100'
          }
          return true
        }
      },
      {
        name: 'discount_amount',
        label: 'Remise (XOF)',
        type: 'number',
        placeholder: '0',
        value: this.quote?.discount_amount || '0',
        validate: (value) => {
          const amount = parseFloat(value)
          if (isNaN(amount) || amount < 0) {
            return 'La remise doit être un nombre positif'
          }
          return true
        }
      },
      {
        name: 'notes',
        label: 'Notes et conditions',
        type: 'textarea',
        rows: 4,
        placeholder: 'Conditions de paiement, délais de livraison, garanties...',
        value: this.quote?.notes || ''
      }
    ]

    this.form = new Form({
      fields,
      onSubmit: (data) => this.handleSubmit(data),
      onCancel: () => this.onCancel(),
      submitText: this.quote ? 'Mettre à jour' : 'Créer le devis',
      cancelText: 'Annuler'
    })

    this.element = document.createElement('div')
    this.element.className = 'max-w-2xl mx-auto'
    
    const formElement = this.form.create()
    
    // Add calculation functionality
    this.addCalculationLogic(formElement)
    
    this.element.appendChild(formElement)

    return this.element
  }

  addCalculationLogic(formElement) {
    const subtotalInput = formElement.querySelector('[name="subtotal"]')
    const taxRateInput = formElement.querySelector('[name="tax_rate"]')
    const discountInput = formElement.querySelector('[name="discount_amount"]')

    // Add total display
    const totalDisplay = document.createElement('div')
    totalDisplay.className = 'mt-4 p-4 bg-gray-50 rounded-lg'
    totalDisplay.innerHTML = `
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span>Sous-total:</span>
          <span id="display-subtotal">0 XOF</span>
        </div>
        <div class="flex justify-between text-sm">
          <span>TVA:</span>
          <span id="display-tax">0 XOF</span>
        </div>
        <div class="flex justify-between text-sm">
          <span>Remise:</span>
          <span id="display-discount">0 XOF</span>
        </div>
        <div class="border-t pt-2 flex justify-between font-medium">
          <span>Total:</span>
          <span id="display-total" class="text-lg">0 XOF</span>
        </div>
      </div>
    `
    
    formElement.appendChild(totalDisplay)

    // Calculate totals
    const calculateTotals = () => {
      const subtotal = parseFloat(subtotalInput.value) || 0
      const taxRate = parseFloat(taxRateInput.value) || 0
      const discount = parseFloat(discountInput.value) || 0

      const taxAmount = (subtotal * taxRate) / 100
      const total = subtotal + taxAmount - discount

      // Update display
      document.getElementById('display-subtotal').textContent = 
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(subtotal)
      
      document.getElementById('display-tax').textContent = 
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(taxAmount)
      
      document.getElementById('display-discount').textContent = 
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(discount)
      
      document.getElementById('display-total').textContent = 
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(total)

      // Store calculated values
      this.calculatedTaxAmount = taxAmount
      this.calculatedTotal = total
    }

    // Add event listeners
    subtotalInput.addEventListener('input', calculateTotals)
    taxRateInput.addEventListener('input', calculateTotals)
    discountInput.addEventListener('input', calculateTotals)

    // Initial calculation
    calculateTotals()
  }

  getDefaultValidUntil() {
    const date = new Date()
    date.setDate(date.getDate() + 30) // 30 days from now
    return date.toISOString().split('T')[0]
  }

  handleSubmit(data) {
    // Validation supplémentaire
    if (!data.client_id) {
      alert('Veuillez sélectionner un client')
      return
    }

    if (!data.number.trim()) {
      alert('Le numéro de devis est obligatoire')
      return
    }

    const subtotal = parseFloat(data.subtotal)
    if (isNaN(subtotal) || subtotal <= 0) {
      alert('Le sous-total doit être un nombre positif')
      return
    }

    const taxRate = parseFloat(data.tax_rate) || 0
    const discountAmount = parseFloat(data.discount_amount) || 0

    // Clean data
    const quoteData = {
      client_id: parseInt(data.client_id),
      number: data.number.trim(),
      date: data.date,
      valid_until: data.valid_until || null,
      subtotal: subtotal,
      tax_rate: taxRate,
      tax_amount: this.calculatedTaxAmount || 0,
      discount_amount: discountAmount,
      total: this.calculatedTotal || subtotal,
      notes: data.notes.trim() || null,
      status: this.quote?.status || 'draft'
    }

    this.onSave(quoteData)
  }

  setData(data) {
    if (this.form) {
      this.form.setData(data)
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove()
      this.element = null
    }
  }
}

