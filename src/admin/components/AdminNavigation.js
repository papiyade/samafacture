import { I18nService } from '../../shared/services/I18nService.js'
import { ThemeSelector } from '../../shared/components/ThemeSelector.js'

/**
 * Admin Navigation Component
 */
export class AdminNavigation {
  constructor() {
    this.container = null
    this.currentRoute = '/'
  }

  async init() {
    this.container = document.getElementById('admin-navigation')
    if (!this.container) {
      console.error('Admin navigation container not found')
      return
    }

    this.render()
    this.attachEventListeners()
    console.log('✅ Admin Navigation initialized')
  }

  render() {
    this.container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                  SamaFacture Admin
                </h1>
              </div>
              <nav class="hidden md:ml-6 md:flex md:space-x-8">
                <a href="#/" class="nav-link border-primary-500 text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </a>
                <a href="#/companies" class="nav-link border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Entreprises
                </a>
                <a href="#/licenses" class="nav-link border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Licences
                </a>
                <a href="#/stats" class="nav-link border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Statistiques
                </a>
                <a href="#/settings" class="nav-link border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Paramètres
                </a>
              </nav>
            </div>
            <div class="flex items-center">
              <!-- Theme Selector -->
              <div id="admin-theme-selector"></div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  attachEventListeners() {
    // Initialize Theme Selector
    this.initThemeSelector()

    // Navigation links
    const navLinks = this.container.querySelectorAll('.nav-link')
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const href = link.getAttribute('href')
        if (href) {
          window.location.hash = href.substring(1) // Remove the #
          this.updateActiveLink(href)
        }
      })
    })
  }

  updateActiveLink(currentPath) {
    const navLinks = this.container.querySelectorAll('.nav-link')
    navLinks.forEach(link => {
      const href = link.getAttribute('href')
      if (href === `#${currentPath}`) {
        link.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400')
        link.classList.add('border-primary-500', 'text-gray-900', 'dark:text-white')
      } else {
        link.classList.remove('border-primary-500', 'text-gray-900', 'dark:text-white')
        link.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400')
      }
    })
  }

  initThemeSelector() {
    const container = document.getElementById('admin-theme-selector')
    if (container) {
      this.themeSelector = new ThemeSelector(container, {
        showLabels: true, // Show labels in admin header
        size: 'medium',
        position: 'dropdown'
      })
      this.themeSelector.init()
    }
  }
}
