/**
 * Modal Component - Reusable modal dialog
 */
export class Modal {
  constructor(options = {}) {
    this.options = {
      title: '',
      content: '',
      size: 'md',
      closable: true,
      onClose: () => {},
      ...options
    }
    
    this.element = null
    this.isOpen = false
  }

  create() {
    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4'
    }

    this.element = document.createElement('div')
    this.element.className = 'fixed inset-0 z-50 overflow-y-auto hidden'
    this.element.innerHTML = `
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" aria-hidden="true"></div>
        
        <!-- Modal panel -->
        <div class="inline-block w-full ${sizes[this.options.size]} p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          ${this.options.title ? `
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">${this.options.title}</h3>
              ${this.options.closable ? `
                <button type="button" class="modal-close text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 focus:outline-none">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="modal-content">
            ${this.options.content}
          </div>
        </div>
      </div>
    `

    // Add event listeners
    if (this.options.closable) {
      const closeBtn = this.element.querySelector('.modal-close')
      const overlay = this.element.querySelector('.bg-gray-500')
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.close())
      }
      
      if (overlay) {
        overlay.addEventListener('click', () => this.close())
      }
    }

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen && this.options.closable) {
        this.close()
      }
    })

    document.body.appendChild(this.element)
    return this.element
  }

  open() {
    if (!this.element) {
      this.create()
    }
    
    this.element.classList.remove('hidden')
    this.isOpen = true
    document.body.style.overflow = 'hidden'
    
    return this
  }

  close() {
    if (this.element) {
      this.element.classList.add('hidden')
      this.isOpen = false
      document.body.style.overflow = ''
      this.options.onClose()
    }
    
    return this
  }

  setContent(content) {
    if (this.element) {
      const contentEl = this.element.querySelector('.modal-content')
      if (contentEl) {
        contentEl.innerHTML = content
      }
    }
    
    return this
  }

  destroy() {
    if (this.element) {
      this.element.remove()
      this.element = null
      this.isOpen = false
      document.body.style.overflow = ''
    }
  }
}
