import { I18nService } from '../../shared/services/I18nService.js'

/**
 * System Settings Page - Configure global system settings
 */
export class SystemSettings {
  constructor() {
    this.settings = {}
  }

  async init() {
    await this.loadSettings()
    this.setupEventListeners()
  }

  async loadSettings() {
    try {
      // TODO: Load settings from admin API
      this.settings = {
      general: {
        appName: 'SamaFacture',
        appVersion: '1.0.0',
        defaultLanguage: 'fr',
        defaultCurrency: 'EUR',
        defaultTaxRate: 20,
        maintenanceMode: false
      },
      license: {
        trialDuration: 30,
        basicMaxInvoices: 100,
        premiumMaxInvoices: 1000,
        autoRenewal: true
      },
      email: {
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        smtpUser: 'admin@samafacture.com',
        smtpPassword: '••••••••',
        fromEmail: 'noreply@samafacture.com',
        fromName: 'SamaFacture Admin'
      },
      security: {
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireTwoFactor: false
      },
      backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        retentionDays: 30,
        lastBackup: '2024-01-25 02:00:00'
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      // Default settings in case of error
      this.settings = {
        general: {
          appName: 'SamaFacture',
          appVersion: '1.0.0',
          defaultLanguage: 'fr',
          defaultCurrency: 'XOF',
          defaultTaxRate: 18,
          maintenanceMode: false
        },
        license: {
          trialDuration: 30,
          basicMaxInvoices: 100,
          premiumMaxInvoices: 1000,
          autoRenewal: true
        },
        email: {
          smtpHost: '',
          smtpPort: 587,
          smtpUser: '',
          smtpPassword: '',
          fromEmail: '',
          fromName: 'SamaFacture Admin'
        },
        security: {
          sessionTimeout: 3600,
          maxLoginAttempts: 5,
          passwordMinLength: 8,
          requireTwoFactor: false
        },
        backup: {
          autoBackup: true,
          backupFrequency: 'daily',
          retentionDays: 30,
          lastBackup: null
        }
      }
    }
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('#save-settings-btn')) {
        this.saveSettings()
      }
      if (e.target.matches('#reset-settings-btn')) {
        this.resetSettings()
      }
      if (e.target.matches('#backup-now-btn')) {
        this.createBackup()
      }
      if (e.target.matches('#test-email-btn')) {
        this.testEmailSettings()
      }
    })

    // Handle form changes
    document.addEventListener('change', (e) => {
      if (e.target.matches('.setting-input')) {
        this.handleSettingChange(e.target)
      }
    })
  }

  handleSettingChange(input) {
    const category = input.dataset.category
    const setting = input.dataset.setting
    let value = input.value

    // Handle different input types
    if (input.type === 'checkbox') {
      value = input.checked
    } else if (input.type === 'number') {
      value = parseInt(value)
    }

    // Update local settings
    if (this.settings[category]) {
      this.settings[category][setting] = value
    }

    console.log(`Setting changed: ${category}.${setting} = ${value}`)
  }

  async saveSettings() {
    try {
      // TODO: Save settings via admin API
      alert('Paramètres sauvegardés avec succès !')
      console.log('Settings to save:', this.settings)
    } catch (error) {
      alert('Erreur lors de la sauvegarde des paramètres')
      console.error('Error saving settings:', error)
    }
  }

  async resetSettings() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      await this.loadSettings()
      alert('Paramètres réinitialisés')
      // TODO: Refresh the page or update the form
    }
  }

  async createBackup() {
    alert('Fonctionnalité à implémenter : Créer une sauvegarde manuelle')
  }

  async testEmailSettings() {
    alert('Fonctionnalité à implémenter : Tester la configuration email')
  }

  // Helper method to safely get setting values
  getSetting(category, setting, defaultValue = '') {
    return this.settings?.[category]?.[setting] ?? defaultValue
  }

  async render() {
    return `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Paramètres Système</h1>
            <p class="text-gray-600 dark:text-gray-400">Configurez les paramètres globaux de l'application</p>
          </div>
          <div class="flex space-x-3">
            <button id="reset-settings-btn" class="btn btn-secondary">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Réinitialiser
            </button>
            <button id="save-settings-btn" class="btn btn-primary">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              Sauvegarder
            </button>
          </div>
        </div>

        <!-- Settings Sections -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- General Settings -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Paramètres Généraux</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l'application</label>
                <input type="text" class="setting-input form-input" data-category="general" data-setting="appName" value="${this.getSetting('general', 'appName', 'SamaFacture')}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version</label>
                <input type="text" class="setting-input form-input" data-category="general" data-setting="appVersion" value="${this.getSetting('general', 'appVersion', '1.0.0')}" readonly>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Langue par défaut</label>
                <select class="setting-input form-select" data-category="general" data-setting="defaultLanguage">
                  <option value="fr" ${this.getSetting('general', 'defaultLanguage', 'fr') === 'fr' ? 'selected' : ''}>Français</option>
                  <option value="en" ${this.getSetting('general', 'defaultLanguage', 'fr') === 'en' ? 'selected' : ''}>English</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Devise par défaut</label>
                <select class="setting-input form-select" data-category="general" data-setting="defaultCurrency">
                  <option value="EUR" ${this.settings.general.defaultCurrency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                  <option value="USD" ${this.settings.general.defaultCurrency === 'USD' ? 'selected' : ''}>Dollar ($)</option>
                  <option value="XOF" ${this.settings.general.defaultCurrency === 'XOF' ? 'selected' : ''}>Franc CFA</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Taux de TVA par défaut (%)</label>
                <input type="number" class="setting-input form-input" data-category="general" data-setting="defaultTaxRate" value="${this.settings.general.defaultTaxRate}" min="0" max="100">
              </div>
              <div class="flex items-center">
                <input type="checkbox" class="setting-input form-checkbox" data-category="general" data-setting="maintenanceMode" ${this.settings.general.maintenanceMode ? 'checked' : ''}>
                <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">Mode maintenance</label>
              </div>
            </div>
          </div>

          <!-- License Settings -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Paramètres des Licences</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durée d'essai (jours)</label>
                <input type="number" class="setting-input form-input" data-category="license" data-setting="trialDuration" value="${this.settings.license.trialDuration}" min="1" max="365">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limite factures Basic</label>
                <input type="number" class="setting-input form-input" data-category="license" data-setting="basicMaxInvoices" value="${this.settings.license.basicMaxInvoices}" min="1">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limite factures Premium</label>
                <input type="number" class="setting-input form-input" data-category="license" data-setting="premiumMaxInvoices" value="${this.settings.license.premiumMaxInvoices}" min="1">
              </div>
              <div class="flex items-center">
                <input type="checkbox" class="setting-input form-checkbox" data-category="license" data-setting="autoRenewal" ${this.settings.license.autoRenewal ? 'checked' : ''}>
                <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">Renouvellement automatique</label>
              </div>
            </div>
          </div>

          <!-- Email Settings -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">Configuration Email</h3>
              <button id="test-email-btn" class="btn btn-sm btn-secondary">Tester</button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serveur SMTP</label>
                <input type="text" class="setting-input form-input" data-category="email" data-setting="smtpHost" value="${this.settings.email.smtpHost}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port SMTP</label>
                <input type="number" class="setting-input form-input" data-category="email" data-setting="smtpPort" value="${this.settings.email.smtpPort}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Utilisateur SMTP</label>
                <input type="email" class="setting-input form-input" data-category="email" data-setting="smtpUser" value="${this.settings.email.smtpUser}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe SMTP</label>
                <input type="password" class="setting-input form-input" data-category="email" data-setting="smtpPassword" value="${this.settings.email.smtpPassword}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email expéditeur</label>
                <input type="email" class="setting-input form-input" data-category="email" data-setting="fromEmail" value="${this.settings.email.fromEmail}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom expéditeur</label>
                <input type="text" class="setting-input form-input" data-category="email" data-setting="fromName" value="${this.settings.email.fromName}">
              </div>
            </div>
          </div>

          <!-- Security Settings -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Paramètres de Sécurité</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeout session (secondes)</label>
                <input type="number" class="setting-input form-input" data-category="security" data-setting="sessionTimeout" value="${this.settings.security.sessionTimeout}" min="300">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tentatives de connexion max</label>
                <input type="number" class="setting-input form-input" data-category="security" data-setting="maxLoginAttempts" value="${this.settings.security.maxLoginAttempts}" min="1" max="10">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longueur mot de passe min</label>
                <input type="number" class="setting-input form-input" data-category="security" data-setting="passwordMinLength" value="${this.settings.security.passwordMinLength}" min="6" max="20">
              </div>
              <div class="flex items-center">
                <input type="checkbox" class="setting-input form-checkbox" data-category="security" data-setting="requireTwoFactor" ${this.settings.security.requireTwoFactor ? 'checked' : ''}>
                <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">Authentification à deux facteurs obligatoire</label>
              </div>
            </div>
          </div>

        </div>

        <!-- Backup Settings -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Paramètres de Sauvegarde</h3>
            <button id="backup-now-btn" class="btn btn-sm btn-primary">Sauvegarder maintenant</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex items-center">
              <input type="checkbox" class="setting-input form-checkbox" data-category="backup" data-setting="autoBackup" ${this.settings.backup.autoBackup ? 'checked' : ''}>
              <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">Sauvegarde automatique</label>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fréquence</label>
              <select class="setting-input form-select" data-category="backup" data-setting="backupFrequency">
                <option value="daily" ${this.settings.backup.backupFrequency === 'daily' ? 'selected' : ''}>Quotidienne</option>
                <option value="weekly" ${this.settings.backup.backupFrequency === 'weekly' ? 'selected' : ''}>Hebdomadaire</option>
                <option value="monthly" ${this.settings.backup.backupFrequency === 'monthly' ? 'selected' : ''}>Mensuelle</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rétention (jours)</label>
              <input type="number" class="setting-input form-input" data-category="backup" data-setting="retentionDays" value="${this.settings.backup.retentionDays}" min="1" max="365">
            </div>
          </div>
          <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <strong>Dernière sauvegarde :</strong> ${this.settings.backup.lastBackup}
            </p>
          </div>
        </div>

      </div>
    `
  }

  destroy() {
    // Cleanup if needed
  }
}
