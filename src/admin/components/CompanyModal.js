/**
 * Company Modal Component - Modal for creating/editing companies
 */
export class CompanyModal {
  constructor() {
    this.isOpen = false
    this.mode = 'create' // 'create' or 'edit'
    this.companyData = null
    this.onSave = null
    this.onCancel = null
  }

  /**
   * Open modal for creating a new company
   * @param {Function} onSave - Callback when company is saved
   * @param {Function} onCancel - Callback when modal is cancelled
   */
  openForCreate(onSave, onCancel) {
    this.mode = 'create'
    this.companyData = null
    this.onSave = onSave
    this.onCancel = onCancel
    this.show()
  }

  /**
   * Open modal for editing an existing company
   * @param {Object} companyData - Existing company data
   * @param {Function} onSave - Callback when company is saved
   * @param {Function} onCancel - Callback when modal is cancelled
   */
  openForEdit(companyData, onSave, onCancel) {
    this.mode = 'edit'
    this.companyData = companyData
    this.onSave = onSave
    this.onCancel = onCancel
    this.show()
  }

  show() {
    this.isOpen = true
    this.render()
    this.setupEventListeners()
    
    // Focus first input
    setTimeout(() => {
      const firstInput = document.querySelector('#company-modal input[type="text"]')
      if (firstInput) firstInput.focus()
    }, 100)
  }

  hide() {
    this.isOpen = false
    const modal = document.getElementById('company-modal')
    if (modal) {
      modal.remove()
    }
  }

  render() {
    // Remove existing modal if any
    const existingModal = document.getElementById('company-modal')
    if (existingModal) {
      existingModal.remove()
    }

    const modalHtml = `
      <div id="company-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              ${this.mode === 'create' ? 'Ajouter une Entreprise' : 'Modifier l\'Entreprise'}
            </h3>
            <button id="close-modal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <form id="company-form" class="mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- Informations de base -->
              <div class="md:col-span-2">
                <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">Informations de base</h4>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom de l'entreprise *
                </label>
                <input type="text" id="company-name" name="name" required
                       class="form-input w-full" 
                       value="${this.companyData?.name || ''}"
                       placeholder="Ex: SARL Mon Entreprise">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input type="email" id="company-email" name="email" required
                       class="form-input w-full" 
                       value="${this.companyData?.email || ''}"
                       placeholder="contact@monentreprise.com">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone
                </label>
                <input type="tel" id="company-phone" name="phone"
                       class="form-input w-full" 
                       value="${this.companyData?.phone || ''}"
                       placeholder="+221 77 123 45 67">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type d'activité
                </label>
                <select id="business-type" name="business_type" class="form-select w-full">
                  <option value="">Sélectionner...</option>
                  <option value="commerce" ${this.companyData?.business_type === 'commerce' ? 'selected' : ''}>Commerce</option>
                  <option value="service" ${this.companyData?.business_type === 'service' ? 'selected' : ''}>Service</option>
                  <option value="industrie" ${this.companyData?.business_type === 'industrie' ? 'selected' : ''}>Industrie</option>
                  <option value="artisanat" ${this.companyData?.business_type === 'artisanat' ? 'selected' : ''}>Artisanat</option>
                  <option value="agriculture" ${this.companyData?.business_type === 'agriculture' ? 'selected' : ''}>Agriculture</option>
                  <option value="autre" ${this.companyData?.business_type === 'autre' ? 'selected' : ''}>Autre</option>
                </select>
              </div>

              <!-- Adresse -->
              <div class="md:col-span-2">
                <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3 mt-4">Adresse</h4>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse
                </label>
                <input type="text" id="company-address" name="address"
                       class="form-input w-full" 
                       value="${this.companyData?.address || ''}"
                       placeholder="123 Rue de la République">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ville
                </label>
                <input type="text" id="company-city" name="city"
                       class="form-input w-full" 
                       value="${this.companyData?.city || ''}"
                       placeholder="Dakar">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code postal
                </label>
                <input type="text" id="postal-code" name="postal_code"
                       class="form-input w-full" 
                       value="${this.companyData?.postal_code || ''}"
                       placeholder="12345">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pays
                </label>
                <select id="company-country" name="country" class="form-select w-full">
                  <option value="Sénégal" ${(this.companyData?.country || 'Sénégal') === 'Sénégal' ? 'selected' : ''}>Sénégal</option>
                  <option value="Mali" ${this.companyData?.country === 'Mali' ? 'selected' : ''}>Mali</option>
                  <option value="Burkina Faso" ${this.companyData?.country === 'Burkina Faso' ? 'selected' : ''}>Burkina Faso</option>
                  <option value="Côte d'Ivoire" ${this.companyData?.country === "Côte d'Ivoire" ? 'selected' : ''}>Côte d'Ivoire</option>
                  <option value="Niger" ${this.companyData?.country === 'Niger' ? 'selected' : ''}>Niger</option>
                  <option value="Guinée" ${this.companyData?.country === 'Guinée' ? 'selected' : ''}>Guinée</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Numéro fiscal
                </label>
                <input type="text" id="tax-number" name="tax_number"
                       class="form-input w-full" 
                       value="${this.companyData?.tax_number || ''}"
                       placeholder="123456789">
              </div>

              <!-- Configuration -->
              <div class="md:col-span-2">
                <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3 mt-4">Configuration</h4>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Devise
                </label>
                <select id="currency" name="currency" class="form-select w-full">
                  <option value="XOF" ${(this.companyData?.currency || 'XOF') === 'XOF' ? 'selected' : ''}>Franc CFA (XOF)</option>
                  <option value="EUR" ${this.companyData?.currency === 'EUR' ? 'selected' : ''}>Euro (EUR)</option>
                  <option value="USD" ${this.companyData?.currency === 'USD' ? 'selected' : ''}>Dollar US (USD)</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Taux de TVA (%)
                </label>
                <input type="number" id="tax-rate" name="tax_rate" step="0.1" min="0" max="100"
                       class="form-input w-full" 
                       value="${this.companyData?.tax_rate || 18}"
                       placeholder="18">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Préfixe factures
                </label>
                <input type="text" id="invoice-prefix" name="invoice_prefix"
                       class="form-input w-full" 
                       value="${this.companyData?.invoice_prefix || 'INV'}"
                       placeholder="INV">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Préfixe devis
                </label>
                <input type="text" id="quote-prefix" name="quote_prefix"
                       class="form-input w-full" 
                       value="${this.companyData?.quote_prefix || 'DEV'}"
                       placeholder="DEV">
              </div>

              ${this.mode === 'create' ? `
                <!-- Licence -->
                <div class="md:col-span-2">
                  <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3 mt-4">Type de licence</h4>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type de licence
                  </label>
                  <select id="license-type" name="licenseType" class="form-select w-full">
                    <option value="TRIAL">Essai (30 jours, 10 factures)</option>
                    <option value="BASIC">Basic (1 mois, 100 factures)</option>
                    <option value="PREMIUM">Premium (1 an, 1000 factures)</option>
                  </select>
                </div>

                <div>
                  <label class="flex items-center">
                    <input type="checkbox" id="memorable-password" name="memorablePassword" class="form-checkbox">
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Mot de passe mémorisable (plus facile à communiquer)
                    </span>
                  </label>
                </div>
              ` : ''}

            </div>

            <!-- Error display -->
            <div id="form-errors" class="mt-4 hidden">
              <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-3">
                <div class="flex">
                  <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                  </svg>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                      Erreur de validation
                    </h3>
                    <div id="error-list" class="mt-2 text-sm text-red-700 dark:text-red-300">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-end pt-4 mt-6 border-t border-gray-200 dark:border-gray-700 space-x-3">
              <button type="button" id="cancel-btn" class="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" id="save-btn" class="btn btn-primary">
                <span class="btn-text">${this.mode === 'create' ? 'Créer l\'entreprise' : 'Sauvegarder'}</span>
                <span class="btn-loading hidden">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Traitement...
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  setupEventListeners() {
    const modal = document.getElementById('company-modal')
    const form = document.getElementById('company-form')
    const closeBtn = document.getElementById('close-modal')
    const cancelBtn = document.getElementById('cancel-btn')
    const saveBtn = document.getElementById('save-btn')

    // Close modal events
    closeBtn?.addEventListener('click', () => this.handleCancel())
    cancelBtn?.addEventListener('click', () => this.handleCancel())

    // Click outside to close
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.handleCancel()
      }
    })

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.handleCancel()
      }
    })

    // Form submission
    form?.addEventListener('submit', (e) => this.handleSubmit(e))

    // Real-time validation
    const requiredFields = form?.querySelectorAll('input[required]')
    requiredFields?.forEach(field => {
      field.addEventListener('blur', () => this.validateField(field))
    })
  }

  validateField(field) {
    const value = field.value.trim()
    let isValid = true
    let message = ''

    if (field.hasAttribute('required') && !value) {
      isValid = false
      message = 'Ce champ est requis'
    } else if (field.type === 'email' && value && !this.isValidEmail(value)) {
      isValid = false
      message = 'Format d\'email invalide'
    }

    // Update field styling
    if (isValid) {
      field.classList.remove('border-red-500', 'focus:border-red-500')
      field.classList.add('border-gray-300', 'focus:border-blue-500')
    } else {
      field.classList.remove('border-gray-300', 'focus:border-blue-500')
      field.classList.add('border-red-500', 'focus:border-red-500')
    }

    return isValid
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async handleSubmit(e) {
    e.preventDefault()
    
    const saveBtn = document.getElementById('save-btn')
    const btnText = saveBtn?.querySelector('.btn-text')
    const btnLoading = saveBtn?.querySelector('.btn-loading')

    try {
      // Show loading state
      if (btnText) btnText.classList.add('hidden')
      if (btnLoading) btnLoading.classList.remove('hidden')
      if (saveBtn) saveBtn.disabled = true

      // Collect form data
      const formData = new FormData(e.target)
      const companyData = Object.fromEntries(formData.entries())

      // Convert numeric fields
      if (companyData.tax_rate) {
        companyData.tax_rate = parseFloat(companyData.tax_rate)
      }

      // Convert boolean fields
      companyData.memorablePassword = formData.has('memorablePassword')

      // Validate form
      const validation = this.validateForm(companyData)
      if (!validation.isValid) {
        this.showErrors(validation.errors)
        return
      }

      // Hide errors
      this.hideErrors()

      // Call save callback
      if (this.onSave) {
        await this.onSave(companyData)
      }

      // Close modal on success
      this.hide()

    } catch (error) {
      console.error('Error saving company:', error)
      this.showErrors([error.message || 'Une erreur est survenue'])
    } finally {
      // Hide loading state
      if (btnText) btnText.classList.remove('hidden')
      if (btnLoading) btnLoading.classList.add('hidden')
      if (saveBtn) saveBtn.disabled = false
    }
  }

  validateForm(data) {
    const errors = []

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Le nom de l\'entreprise doit contenir au moins 2 caractères')
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Une adresse email valide est requise')
    }

    if (data.phone && data.phone.length > 0 && data.phone.length < 8) {
      errors.push('Le numéro de téléphone doit contenir au moins 8 caractères')
    }

    if (data.tax_rate && (data.tax_rate < 0 || data.tax_rate > 100)) {
      errors.push('Le taux de TVA doit être entre 0 et 100%')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  showErrors(errors) {
    const errorContainer = document.getElementById('form-errors')
    const errorList = document.getElementById('error-list')
    
    if (errorContainer && errorList) {
      errorList.innerHTML = errors.map(error => `<p>• ${error}</p>`).join('')
      errorContainer.classList.remove('hidden')
      
      // Scroll to errors
      errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  hideErrors() {
    const errorContainer = document.getElementById('form-errors')
    if (errorContainer) {
      errorContainer.classList.add('hidden')
    }
  }

  handleCancel() {
    if (this.onCancel) {
      this.onCancel()
    }
    this.hide()
  }
}

