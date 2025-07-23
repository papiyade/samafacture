/**
 * Form Component - Reusable form builder
 */
export class Form {
  constructor(options = {}) {
    this.options = {
      fields: [],
      onSubmit: () => {},
      onCancel: () => {},
      submitText: 'Enregistrer',
      cancelText: 'Annuler',
      showCancel: true,
      className: '',
      ...options
    }
    
    this.element = null
    this.data = {}
  }

  create() {
    this.element = document.createElement('form')
    this.element.className = `space-y-6 ${this.options.className}`
    
    // Create fields
    const fieldsHTML = this.options.fields.map(field => this.createField(field)).join('')
    
    // Create buttons
    const buttonsHTML = `
      <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        ${this.options.showCancel ? `
          <button type="button" class="cancel-btn px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            ${this.options.cancelText}
          </button>
        ` : ''}
        <button type="submit" class="submit-btn px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          ${this.options.submitText}
        </button>
      </div>
    `

    this.element.innerHTML = fieldsHTML + buttonsHTML

    // Add event listeners
    this.element.addEventListener('submit', (e) => {
      e.preventDefault()
      this.handleSubmit()
    })

    const cancelBtn = this.element.querySelector('.cancel-btn')
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.options.onCancel())
    }

    // Add input event listeners for real-time validation
    this.options.fields.forEach(field => {
      const input = this.element.querySelector(`[name="${field.name}"]`)
      if (input) {
        input.addEventListener('input', () => this.validateField(field, input))
        input.addEventListener('blur', () => this.validateField(field, input))
      }
    })

    return this.element
  }

  createField(field) {
    const {
      name,
      label,
      type = 'text',
      placeholder = '',
      required = false,
      options = [],
      value = '',
      className = '',
      rows = 3
    } = field

    let inputHTML = ''
    const inputClasses = 'mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm'

    switch (type) {
      case 'select':
        inputHTML = `
          <select name="${name}" class="${inputClasses}" ${required ? 'required' : ''}>
            <option value="">Sélectionner...</option>
            ${options.map(opt => `
              <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>
                ${opt.label}
              </option>
            `).join('')}
          </select>
        `
        break
      
      case 'textarea':
        inputHTML = `
          <textarea 
            name="${name}" 
            rows="${rows}"
            class="${inputClasses}" 
            placeholder="${placeholder}"
            ${required ? 'required' : ''}
          >${value}</textarea>
        `
        break
      
      case 'checkbox':
        inputHTML = `
          <div class="flex items-center">
            <input 
              type="checkbox" 
              name="${name}" 
              value="1"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              ${value ? 'checked' : ''}
              ${required ? 'required' : ''}
            >
            <label class="ml-2 block text-sm text-gray-900">${label}</label>
          </div>
        `
        return `<div class="field-group ${className}">${inputHTML}</div>`
      
      default:
        inputHTML = `
          <input 
            type="${type}" 
            name="${name}" 
            value="${value}"
            class="${inputClasses}" 
            placeholder="${placeholder}"
            ${required ? 'required' : ''}
          >
        `
    }

    return `
      <div class="field-group ${className}">
        <label for="${name}" class="block text-sm font-medium text-gray-700">
          ${label} ${required ? '<span class="text-red-500">*</span>' : ''}
        </label>
        ${inputHTML}
        <div class="field-error text-red-600 text-sm mt-1 hidden"></div>
      </div>
    `
  }

  validateField(field, input) {
    const errorEl = input.closest('.field-group').querySelector('.field-error')
    let isValid = true
    let errorMessage = ''

    // Required validation
    if (field.required && !input.value.trim()) {
      isValid = false
      errorMessage = 'Ce champ est obligatoire'
    }

    // Email validation
    if (field.type === 'email' && input.value && !this.isValidEmail(input.value)) {
      isValid = false
      errorMessage = 'Format email invalide'
    }

    // Custom validation
    if (field.validate && input.value) {
      const customValidation = field.validate(input.value)
      if (customValidation !== true) {
        isValid = false
        errorMessage = customValidation
      }
    }

    // Show/hide error
    if (isValid) {
      errorEl.classList.add('hidden')
      input.classList.remove('border-red-300')
    } else {
      errorEl.textContent = errorMessage
      errorEl.classList.remove('hidden')
      input.classList.add('border-red-300')
    }

    return isValid
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  handleSubmit() {
    const formData = new FormData(this.element)
    this.data = {}
    
    // Collect form data
    for (const [key, value] of formData.entries()) {
      this.data[key] = value
    }

    // Validate all fields
    let isFormValid = true
    this.options.fields.forEach(field => {
      const input = this.element.querySelector(`[name="${field.name}"]`)
      if (input && !this.validateField(field, input)) {
        isFormValid = false
      }
    })

    if (isFormValid) {
      this.options.onSubmit(this.data)
    }
  }

  setData(data) {
    Object.keys(data).forEach(key => {
      const input = this.element.querySelector(`[name="${key}"]`)
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = !!data[key]
        } else {
          input.value = data[key] || ''
        }
      }
    })
  }

  getData() {
    return this.data
  }

  reset() {
    this.element.reset()
    // Hide all error messages
    this.element.querySelectorAll('.field-error').forEach(el => {
      el.classList.add('hidden')
    })
    // Remove error styling
    this.element.querySelectorAll('input, select, textarea').forEach(el => {
      el.classList.remove('border-red-300')
    })
  }
}

