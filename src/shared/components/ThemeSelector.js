import { ThemeService } from '../services/ThemeService.js'

/**
 * Theme Selector Component - Advanced theme switcher with Light/Dark/System options
 */
export class ThemeSelector {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container
    this.options = {
      showLabels: options.showLabels !== false, // true by default
      size: options.size || 'medium', // small, medium, large
      position: options.position || 'dropdown', // dropdown, inline, modal
      ...options
    }
    this.currentTheme = ThemeService.getTheme()
    this.isOpen = false
  }

  init() {
    if (!this.container) {
      console.error('ThemeSelector: Container not found')
      return
    }

    this.render()
    this.attachEventListeners()
    this.updateThemeDisplay()

    // Listen for theme changes from other sources
    window.addEventListener('themechange', (e) => {
      this.currentTheme = e.detail.theme
      this.updateThemeDisplay()
    })

    console.log('✅ ThemeSelector initialized')
  }

  render() {
    const { showLabels, size, position } = this.options
    
    if (position === 'dropdown') {
      this.renderDropdown()
    } else if (position === 'inline') {
      this.renderInline()
    } else if (position === 'modal') {
      this.renderModalTrigger()
    }
  }

  renderDropdown() {
    const { showLabels, size } = this.options
    const sizeClasses = {
      small: 'p-1.5 text-sm',
      medium: 'p-2 text-base',
      large: 'p-3 text-lg'
    }

    this.container.innerHTML = `
      <div class="relative">
        <!-- Theme Toggle Button -->
        <button 
          id="theme-selector-button" 
          class="${sizeClasses[size]} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label="Sélectionner le thème"
          aria-expanded="false"
          aria-haspopup="true"
        >
          <div class="flex items-center space-x-2">
            <span id="current-theme-icon" class="w-5 h-5">
              ${this.getThemeIcon(this.currentTheme)}
            </span>
            ${showLabels ? `<span id="current-theme-label" class="hidden sm:inline">${this.getThemeLabel(this.currentTheme)}</span>` : ''}
            <svg class="w-4 h-4 transition-transform duration-200" id="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </button>

        <!-- Dropdown Menu -->
        <div 
          id="theme-dropdown" 
          class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 opacity-0 scale-95 transform transition-all duration-200 pointer-events-none"
          role="menu"
          aria-orientation="vertical"
        >
          <div class="py-1">
            ${this.renderThemeOption('light', 'Clair', this.getLightIcon())}
            ${this.renderThemeOption('dark', 'Sombre', this.getDarkIcon())}
            ${this.renderThemeOption('system', 'Système', this.getSystemIcon())}
          </div>
        </div>
      </div>
    `
  }

  renderInline() {
    this.container.innerHTML = `
      <div class="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        ${this.renderInlineOption('light', 'Clair', this.getLightIcon())}
        ${this.renderInlineOption('dark', 'Sombre', this.getDarkIcon())}
        ${this.renderInlineOption('system', 'Système', this.getSystemIcon())}
      </div>
    `
  }

  renderModalTrigger() {
    this.container.innerHTML = `
      <button 
        id="theme-modal-trigger"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Paramètres de thème"
      >
        <span class="w-5 h-5">
          ${this.getThemeIcon(this.currentTheme)}
        </span>
      </button>
      ${this.renderModal()}
    `
  }

  renderThemeOption(theme, label, icon) {
    const isActive = this.currentTheme === theme
    return `
      <button 
        class="theme-option w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}"
        data-theme="${theme}"
        role="menuitem"
      >
        <span class="w-5 h-5">${icon}</span>
        <span>${label}</span>
        ${isActive ? '<span class="ml-auto"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></span>' : ''}
      </button>
    `
  }

  renderInlineOption(theme, label, icon) {
    const isActive = this.currentTheme === theme
    return `
      <button 
        class="theme-option-inline px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
        data-theme="${theme}"
        title="${label}"
      >
        <span class="w-4 h-4">${icon}</span>
        ${this.options.showLabels ? `<span class="ml-1 hidden sm:inline">${label}</span>` : ''}
      </button>
    `
  }

  renderModal() {
    return `
      <div id="theme-modal" class="fixed inset-0 z-50 hidden">
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full">
            <div class="p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Choisir le thème
              </h3>
              <div class="space-y-2">
                ${this.renderModalOption('light', 'Thème clair', this.getLightIcon(), 'Utilise toujours le thème clair')}
                ${this.renderModalOption('dark', 'Thème sombre', this.getDarkIcon(), 'Utilise toujours le thème sombre')}
                ${this.renderModalOption('system', 'Thème système', this.getSystemIcon(), 'Suit les préférences de votre système')}
              </div>
              <div class="mt-6 flex justify-end">
                <button id="close-theme-modal" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  renderModalOption(theme, label, icon, description) {
    const isActive = this.currentTheme === theme
    return `
      <button 
        class="theme-option-modal w-full text-left p-3 rounded-lg border-2 transition-colors ${isActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}"
        data-theme="${theme}"
      >
        <div class="flex items-start space-x-3">
          <span class="w-5 h-5 mt-0.5">${icon}</span>
          <div>
            <div class="font-medium text-gray-900 dark:text-white">${label}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">${description}</div>
          </div>
          ${isActive ? '<span class="ml-auto"><svg class="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg></span>' : ''}
        </div>
      </button>
    `
  }

  attachEventListeners() {
    const { position } = this.options

    if (position === 'dropdown') {
      this.attachDropdownListeners()
    } else if (position === 'inline') {
      this.attachInlineListeners()
    } else if (position === 'modal') {
      this.attachModalListeners()
    }
  }

  attachDropdownListeners() {
    const button = this.container.querySelector('#theme-selector-button')
    const dropdown = this.container.querySelector('#theme-dropdown')
    const arrow = this.container.querySelector('#dropdown-arrow')

    // Toggle dropdown
    button?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleDropdown()
    })

    // Theme selection
    const options = this.container.querySelectorAll('.theme-option')
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        const theme = e.currentTarget.dataset.theme
        this.selectTheme(theme)
        this.closeDropdown()
      })
    })

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.closeDropdown()
      }
    })

    // Keyboard navigation
    button?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.toggleDropdown()
      }
    })
  }

  attachInlineListeners() {
    const options = this.container.querySelectorAll('.theme-option-inline')
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        const theme = e.currentTarget.dataset.theme
        this.selectTheme(theme)
      })
    })
  }

  attachModalListeners() {
    const trigger = this.container.querySelector('#theme-modal-trigger')
    const modal = this.container.querySelector('#theme-modal')
    const closeBtn = this.container.querySelector('#close-theme-modal')
    const options = this.container.querySelectorAll('.theme-option-modal')

    trigger?.addEventListener('click', () => {
      modal?.classList.remove('hidden')
    })

    closeBtn?.addEventListener('click', () => {
      modal?.classList.add('hidden')
    })

    // Close modal when clicking backdrop
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden')
      }
    })

    // Theme selection
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        const theme = e.currentTarget.dataset.theme
        this.selectTheme(theme)
        modal?.classList.add('hidden')
      })
    })
  }

  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown()
    } else {
      this.openDropdown()
    }
  }

  openDropdown() {
    const dropdown = this.container.querySelector('#theme-dropdown')
    const arrow = this.container.querySelector('#dropdown-arrow')
    const button = this.container.querySelector('#theme-selector-button')

    if (dropdown) {
      dropdown.classList.remove('opacity-0', 'scale-95', 'pointer-events-none')
      dropdown.classList.add('opacity-100', 'scale-100')
      arrow?.classList.add('rotate-180')
      button?.setAttribute('aria-expanded', 'true')
      this.isOpen = true
    }
  }

  closeDropdown() {
    const dropdown = this.container.querySelector('#theme-dropdown')
    const arrow = this.container.querySelector('#dropdown-arrow')
    const button = this.container.querySelector('#theme-selector-button')

    if (dropdown) {
      dropdown.classList.remove('opacity-100', 'scale-100')
      dropdown.classList.add('opacity-0', 'scale-95', 'pointer-events-none')
      arrow?.classList.remove('rotate-180')
      button?.setAttribute('aria-expanded', 'false')
      this.isOpen = false
    }
  }

  selectTheme(theme) {
    if (theme !== this.currentTheme) {
      this.currentTheme = theme
      ThemeService.setTheme(theme)
      this.updateThemeDisplay()
    }
  }

  updateThemeDisplay() {
    // Update dropdown version
    const currentIcon = this.container.querySelector('#current-theme-icon')
    const currentLabel = this.container.querySelector('#current-theme-label')
    
    if (currentIcon) {
      currentIcon.innerHTML = this.getThemeIcon(this.currentTheme)
    }
    if (currentLabel) {
      currentLabel.textContent = this.getThemeLabel(this.currentTheme)
    }

    // Update active states
    const allOptions = this.container.querySelectorAll('[data-theme]')
    allOptions.forEach(option => {
      const theme = option.dataset.theme
      const isActive = theme === this.currentTheme

      if (option.classList.contains('theme-option')) {
        // Dropdown option
        if (isActive) {
          option.classList.add('bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400')
          option.classList.remove('text-gray-700', 'dark:text-gray-300')
        } else {
          option.classList.remove('bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400')
          option.classList.add('text-gray-700', 'dark:text-gray-300')
        }
      } else if (option.classList.contains('theme-option-inline')) {
        // Inline option
        if (isActive) {
          option.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm')
          option.classList.remove('text-gray-600', 'dark:text-gray-400')
        } else {
          option.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white', 'shadow-sm')
          option.classList.add('text-gray-600', 'dark:text-gray-400')
        }
      } else if (option.classList.contains('theme-option-modal')) {
        // Modal option
        if (isActive) {
          option.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20')
          option.classList.remove('border-gray-200', 'dark:border-gray-700')
        } else {
          option.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20')
          option.classList.add('border-gray-200', 'dark:border-gray-700')
        }
      }
    })
  }

  getThemeIcon(theme) {
    switch (theme) {
      case ThemeService.THEMES.LIGHT:
        return this.getLightIcon()
      case ThemeService.THEMES.DARK:
        return this.getDarkIcon()
      case ThemeService.THEMES.SYSTEM:
        return this.getSystemIcon()
      default:
        return this.getSystemIcon()
    }
  }

  getThemeLabel(theme) {
    switch (theme) {
      case ThemeService.THEMES.LIGHT:
        return 'Clair'
      case ThemeService.THEMES.DARK:
        return 'Sombre'
      case ThemeService.THEMES.SYSTEM:
        return 'Système'
      default:
        return 'Système'
    }
  }

  getLightIcon() {
    return `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
      </svg>
    `
  }

  getDarkIcon() {
    return `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
      </svg>
    `
  }

  getSystemIcon() {
    return `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
      </svg>
    `
  }

  // Public API methods
  setTheme(theme) {
    this.selectTheme(theme)
  }

  getCurrentTheme() {
    return this.currentTheme
  }

  destroy() {
    // Clean up event listeners
    document.removeEventListener('click', this.closeDropdown)
    window.removeEventListener('themechange', this.updateThemeDisplay)
  }
}

