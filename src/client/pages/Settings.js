import { ThemeSelector } from '../../shared/components/ThemeSelector.js'
import { I18nService } from '../../shared/services/I18nService.js'

/**
 * Settings Page - Application settings and preferences
 */
export class Settings {
  constructor() {
    this.container = null
    this.themeSelectors = []
  }

  async init() {
    console.log('✅ Settings page initialized')
  }

  render() {
    const container = document.createElement('div')
    container.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <!-- Page Header -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Paramètres
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Personnalisez votre expérience SamaFacture
            </p>
          </div>

          <!-- Settings Sections -->
          <div class="space-y-8">
            
            <!-- Theme Settings -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                  Apparence
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Personnalisez l'apparence de l'application
                </p>
              </div>
              
              <div class="px-6 py-6 space-y-6">
                <!-- Theme Selection -->
                <div>
                  <label class="text-base font-medium text-gray-900 dark:text-white">
                    Thème de l'application
                  </label>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Choisissez le thème qui vous convient le mieux
                  </p>
                  
                  <!-- Dropdown Style -->
                  <div class="mb-6">
                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sélecteur dropdown
                    </h4>
                    <div id="theme-selector-dropdown" class="inline-block"></div>
                  </div>
                  
                  <!-- Inline Style -->
                  <div class="mb-6">
                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sélecteur inline
                    </h4>
                    <div id="theme-selector-inline"></div>
                  </div>
                  
                  <!-- Modal Style -->
                  <div class="mb-6">
                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sélecteur modal
                    </h4>
                    <div id="theme-selector-modal" class="inline-block"></div>
                  </div>
                </div>

                <!-- Theme Preview -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Aperçu du thème
                  </h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Light Theme Preview -->
                    <div class="border border-gray-200 rounded-lg p-4 bg-white">
                      <div class="flex items-center justify-between mb-3">
                        <h5 class="font-medium text-gray-900">Thème Clair</h5>
                        <div class="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      </div>
                      <div class="space-y-2">
                        <div class="h-2 bg-gray-200 rounded"></div>
                        <div class="h-2 bg-gray-100 rounded w-3/4"></div>
                        <div class="h-2 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    
                    <!-- Dark Theme Preview -->
                    <div class="border border-gray-600 rounded-lg p-4 bg-gray-800">
                      <div class="flex items-center justify-between mb-3">
                        <h5 class="font-medium text-white">Thème Sombre</h5>
                        <div class="w-3 h-3 bg-blue-400 rounded-full"></div>
                      </div>
                      <div class="space-y-2">
                        <div class="h-2 bg-gray-600 rounded"></div>
                        <div class="h-2 bg-gray-700 rounded w-3/4"></div>
                        <div class="h-2 bg-gray-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Language Settings -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                  Langue et région
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configurez la langue et les paramètres régionaux
                </p>
              </div>
              
              <div class="px-6 py-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label for="language" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Langue
                    </label>
                    <select id="language" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                  
                  <div>
                    <label for="currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Devise
                    </label>
                    <select id="currency" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500">
                      <option value="XOF">FCFA (XOF)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="USD">Dollar US (USD)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Application Settings -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                  Application
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Paramètres généraux de l'application
                </p>
              </div>
              
              <div class="px-6 py-6 space-y-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Notifications
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Recevoir des notifications pour les événements importants
                    </p>
                  </div>
                  <button type="button" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" role="switch" aria-checked="false">
                    <span class="sr-only">Activer les notifications</span>
                    <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0"></span>
                  </button>
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Sauvegarde automatique
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Sauvegarder automatiquement les modifications
                    </p>
                  </div>
                  <button type="button" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" role="switch" aria-checked="true">
                    <span class="sr-only">Activer la sauvegarde automatique</span>
                    <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5"></span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Data Management -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                  Gestion des données
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Importation, exportation et sauvegarde des données
                </p>
              </div>
              
              <div class="px-6 py-6 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Exporter les données
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Télécharger toutes vos données au format CSV
                    </p>
                  </div>
                  <button class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Exporter
                  </button>
                </div>
                
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Réinitialiser l'application
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Supprimer toutes les données et recommencer
                    </p>
                  </div>
                  <button class="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    
    // Initialize theme selectors after DOM is ready
    setTimeout(() => this.afterRender(), 0)
    
    return container
  }

  afterRender() {
    this.initThemeSelectors()
  }

  initThemeSelectors() {
    // Cleanup existing selectors
    this.themeSelectors.forEach(selector => selector.destroy())
    this.themeSelectors = []

    // Dropdown style
    const dropdownContainer = document.getElementById('theme-selector-dropdown')
    if (dropdownContainer) {
      const dropdownSelector = new ThemeSelector(dropdownContainer, {
        showLabels: true,
        size: 'medium',
        position: 'dropdown'
      })
      dropdownSelector.init()
      this.themeSelectors.push(dropdownSelector)
    }

    // Inline style
    const inlineContainer = document.getElementById('theme-selector-inline')
    if (inlineContainer) {
      const inlineSelector = new ThemeSelector(inlineContainer, {
        showLabels: true,
        size: 'medium',
        position: 'inline'
      })
      inlineSelector.init()
      this.themeSelectors.push(inlineSelector)
    }

    // Modal style
    const modalContainer = document.getElementById('theme-selector-modal')
    if (modalContainer) {
      const modalSelector = new ThemeSelector(modalContainer, {
        showLabels: false,
        size: 'medium',
        position: 'modal'
      })
      modalSelector.init()
      this.themeSelectors.push(modalSelector)
    }
  }

  destroy() {
    // Cleanup theme selectors
    this.themeSelectors.forEach(selector => selector.destroy())
    this.themeSelectors = []
  }
}
