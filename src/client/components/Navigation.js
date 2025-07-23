import { I18nService } from '../../shared/services/I18nService.js'
import { ThemeService } from '../../shared/services/ThemeService.js'

/**
 * Navigation Component - Main navigation sidebar
 */
export class Navigation {
  constructor() {
    this.isCollapsed = false
    this.currentPath = window.location.pathname
  }

  async init() {
    this.render()
    this.setupEventListeners()
    this.updateActiveLink()
  }

  render() {
    const navigationElement = document.getElementById('navigation')
    if (!navigationElement) return

    navigationElement.innerHTML = `
      <div class="sidebar ${this.isCollapsed ? 'sidebar-collapsed' : ''}">
        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">SF</span>
              </div>
              <span class="font-semibold text-gray-900 dark:text-white ${this.isCollapsed ? 'hidden' : ''}">
                ${I18nService.t('app.name')}
              </span>
            </div>
            <button id="sidebar-toggle" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>

          <!-- Navigation Links -->
          <nav class="flex-1 p-4 space-y-2">
            <a href="/" data-route="/" class="nav-link flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"></path>
              </svg>
              <span class="${this.isCollapsed ? 'hidden' : ''}">${I18nService.t('navigation.dashboard')}</span>
            </a>

            <a href="/invoices" data-route="/invoices" class="nav-link flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span class="${this.isCollapsed ? 'hidden' : ''}">${I18nService.t('navigation.invoices')}</span>
            </a>

            <a href="/quotes" data-route="/quotes" class="nav-link flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span class="${this.isCollapsed ? 'hidden' : ''}">${I18nService.t('navigation.quotes')}</span>
            </a>

            <a href="/clients" data-route="/clients" class="nav-link flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
              <span class="${this.isCollapsed ? 'hidden' : ''}">${I18nService.t('navigation.clients')}</span>
            </a>

            <a href="/products" data-route="/products" class="nav-link flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
              <span class="${this.isCollapsed ? 'hidden' : ''}">${I18nService.t('navigation.products')}</span>
            </a>
          </nav>

          <!-- Footer -->
          <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-3">
              <button id="theme-toggle" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
              </button>
              
              <a href="/settings" data-route="/settings" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </a>
            </div>
            
            <a href="/license" data-route="/license" class="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
              </svg>
              <span class="${this.isCollapsed ? 'hidden' : ''}">${I18nService.t('navigation.license')}</span>
            </a>
          </div>
        </div>
      </div>
    `

    // Update main content margin
    this.updateMainContentMargin()
  }

  setupEventListeners() {
    // Sidebar toggle
    const toggleButton = document.getElementById('sidebar-toggle')
    if (toggleButton) {
      toggleButton.addEventListener('click', () => {
        this.toggleSidebar()
      })
    }

    // Theme toggle
    const themeButton = document.getElementById('theme-toggle')
    if (themeButton) {
      themeButton.addEventListener('click', () => {
        ThemeService.toggleTheme()
      })
    }

    // Route changes
    window.addEventListener('popstate', () => {
      this.updateActiveLink()
    })

    // Language changes
    window.addEventListener('languagechange', () => {
      this.render()
    })
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed
    const sidebar = document.querySelector('.sidebar')
    const mainContent = document.getElementById('main-content')
    
    if (sidebar) {
      sidebar.classList.toggle('sidebar-collapsed', this.isCollapsed)
    }
    
    this.updateMainContentMargin()
    this.render()
  }

  updateMainContentMargin() {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      if (this.isCollapsed) {
        mainContent.classList.remove('main-content-expanded')
        mainContent.classList.add('main-content-collapsed')
      } else {
        mainContent.classList.remove('main-content-collapsed')
        mainContent.classList.add('main-content-expanded')
      }
    }
  }

  updateActiveLink() {
    const currentPath = window.location.pathname
    const navLinks = document.querySelectorAll('.nav-link')
    
    navLinks.forEach(link => {
      const route = link.getAttribute('data-route')
      if (route === currentPath || (currentPath === '/' && route === '/')) {
        link.classList.add('bg-primary-100', 'text-primary-700', 'dark:bg-primary-900', 'dark:text-primary-300')
        link.classList.remove('text-gray-700', 'dark:text-gray-300')
      } else {
        link.classList.remove('bg-primary-100', 'text-primary-700', 'dark:bg-primary-900', 'dark:text-primary-300')
        link.classList.add('text-gray-700', 'dark:text-gray-300')
      }
    })
  }
}

