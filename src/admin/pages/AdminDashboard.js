import { CompanyService } from '../services/CompanyService.js'
import { LicenseService } from '../services/LicenseService.js'
import { LicenseExpirationManager } from '../utils/LicenseExpirationManager.js'
import { LicenseAuditService } from '../services/LicenseAuditService.js'
import { Logger } from '../utils/Logger.js'

/**
 * Admin Dashboard Page - Vue d'ensemble complète
 */
export class AdminDashboard {
  constructor() {
    this.container = null
    this.stats = {
      companies: { total: 0, active: 0, inactive: 0 },
      licenses: { total: 0, active: 0, expired: 0, expiring: 0 },
      revenue: { monthly: 0, yearly: 0 },
      activity: { last24h: 0, last7days: 0 }
    }
    this.refreshInterval = null
  }

  async init() {
    try {
      Logger.info('Initializing Admin Dashboard')
      await this.loadStats()
      this.setupEventListeners()
      this.startAutoRefresh()
      Logger.success('Admin Dashboard initialized')
    } catch (error) {
      Logger.error('Error initializing dashboard', { error: error.message })
    }
  }

  async loadStats() {
    try {
      // Charger les statistiques des entreprises
      const companyStats = await CompanyService.getStatistics()
      this.stats.companies = {
        total: companyStats.totalCompanies || 0,
        active: companyStats.activeCompanies || 0,
        inactive: companyStats.suspendedCompanies || 0
      }

      // Charger les statistiques des licences
      const licenseStats = await LicenseService.getStatistics()
      this.stats.licenses = {
        total: licenseStats.totalLicenses || 0,
        active: licenseStats.activeLicenses || 0,
        expired: licenseStats.expiredLicenses || 0,
        expiring: 0 // Sera mis à jour ci-dessous
      }

      // Charger les statistiques d'expiration
      try {
        const expirationStats = await LicenseExpirationManager.getExpirationStats()
        this.stats.licenses.expiring = expirationStats.expiring30Days || 0
      } catch (error) {
        Logger.warn('Could not load expiration stats', { error: error.message })
        this.stats.licenses.expiring = 0
      }

      // Charger les statistiques d'audit
      try {
        const auditStats = await LicenseAuditService.getAuditStatistics()
        this.stats.activity = {
          last24h: auditStats.eventsLast24h || 0,
          last7days: auditStats.eventsLast7days || 0
        }
      } catch (error) {
        Logger.warn('Could not load audit stats', { error: error.message })
        this.stats.activity = { last24h: 0, last7days: 0 }
      }

      Logger.debug('Dashboard stats loaded', this.stats)
      
      // Mettre à jour l'affichage
      this.updateStatsDisplay()
      
    } catch (error) {
      Logger.error('Error loading dashboard stats', { error: error.message })
      // Utiliser des valeurs par défaut en cas d'erreur
      this.stats = {
        companies: { total: 0, active: 0, inactive: 0 },
        licenses: { total: 0, active: 0, expired: 0, expiring: 0 },
        revenue: { monthly: 0, yearly: 0 },
        activity: { last24h: 0, last7days: 0 }
      }
      this.updateStatsDisplay()
    }
  }

  setupEventListeners() {
    // Écouter les événements de mise à jour
    document.addEventListener('company-updated', () => this.loadStats())
    document.addEventListener('license-updated', () => this.loadStats())
  }

  startAutoRefresh() {
    // Actualiser les stats toutes les 5 minutes
    this.refreshInterval = setInterval(() => {
      this.loadStats()
      this.updateStatsDisplay()
    }, 5 * 60 * 1000)
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  updateStatsDisplay() {
    // Mettre à jour les cartes de statistiques
    const elements = {
      totalCompanies: document.getElementById('total-companies'),
      activeCompanies: document.getElementById('active-companies'),
      totalLicenses: document.getElementById('total-licenses'),
      activeLicenses: document.getElementById('active-licenses'),
      expiredLicenses: document.getElementById('expired-licenses'),
      expiringLicenses: document.getElementById('expiring-licenses'),
      activity24h: document.getElementById('activity-24h'),
      activity7days: document.getElementById('activity-7days')
    }

    if (elements.totalCompanies) elements.totalCompanies.textContent = this.stats.companies.total
    if (elements.activeCompanies) elements.activeCompanies.textContent = this.stats.companies.active
    if (elements.totalLicenses) elements.totalLicenses.textContent = this.stats.licenses.total
    if (elements.activeLicenses) elements.activeLicenses.textContent = this.stats.licenses.active
    if (elements.expiredLicenses) elements.expiredLicenses.textContent = this.stats.licenses.expired
    if (elements.expiringLicenses) elements.expiringLicenses.textContent = this.stats.licenses.expiring
    if (elements.activity24h) elements.activity24h.textContent = this.stats.activity.last24h
    if (elements.activity7days) elements.activity7days.textContent = this.stats.activity.last7days
  }

  async processExpiredLicenses() {
    try {
      Logger.info('Processing expired licenses from dashboard')
      
      // Afficher un indicateur de chargement
      const button = event.target
      const originalText = button.textContent
      button.textContent = '⏳ Traitement...'
      button.disabled = true
      
      // Traiter les licences expirées
      const result = await LicenseExpirationManager.processExpiredLicenses()
      
      // Afficher le résultat
      alert(`✅ Traitement terminé:\n- ${result.processed} licences traitées\n- ${result.expired} expirées\n- ${result.suspended} suspendues\n- ${result.notified} notifications envoyées`)
      
      // Recharger les statistiques
      await this.loadStats()
      this.updateStatsDisplay()
      
      // Restaurer le bouton
      button.textContent = originalText
      button.disabled = false
      
    } catch (error) {
      Logger.error('Error processing expired licenses', { error: error.message })
      alert('❌ Erreur lors du traitement des licences expirées')
      
      // Restaurer le bouton en cas d'erreur
      const button = event.target
      button.textContent = '⚠️ Traiter Expirations'
      button.disabled = false
    }
  }

  async exportData() {
    try {
      Logger.info('Exporting dashboard data')
      
      const button = event.target
      const originalText = button.textContent
      button.textContent = '⏳ Export...'
      button.disabled = true
      
      // Préparer les données d'export
      const exportData = {
        timestamp: new Date().toISOString(),
        stats: this.stats,
        companies: await CompanyService.getAllCompanies(),
        licenses: await LicenseService.getAllLicenses(),
        auditEvents: await LicenseAuditService.getAllAuditEvents({ limit: 1000 })
      }
      
      // Créer et télécharger le fichier
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `samafacture-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Restaurer le bouton
      button.textContent = originalText
      button.disabled = false
      
      Logger.success('Data exported successfully')
      
    } catch (error) {
      Logger.error('Error exporting data', { error: error.message })
      alert('❌ Erreur lors de l\'export des données')
      
      // Restaurer le bouton en cas d'erreur
      const button = event.target
      button.textContent = '📊 Exporter Données'
      button.disabled = false
    }
  }

  async loadRecentActivity() {
    try {
      Logger.debug('Loading recent activity')
      
      // Récupérer les événements d'audit récents
      const recentEvents = await LicenseAuditService.getAllAuditEvents({ 
        limit: 10,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Dernières 24h
      })
      
      const activityList = document.getElementById('recent-activity-list')
      
      if (recentEvents.length === 0) {
        activityList.innerHTML = `
          <div class="text-center py-8">
            <div class="mx-auto h-12 w-12 text-gray-400 mb-4">📭</div>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune activité récente</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Aucune activité dans les dernières 24 heures.
            </p>
          </div>
        `
        return
      }
      
      // Générer la liste des activités
      const activitiesHtml = recentEvents.map(event => {
        const timeAgo = this.getTimeAgo(new Date(event.timestamp))
        const icon = this.getEventIcon(event.event_type)
        const description = this.getEventDescription(event)
        
        return `
          <div class="flex items-start space-x-3 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div class="flex-shrink-0">
              <span class="text-lg">${icon}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900 dark:text-white">
                ${description}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                ${event.company_name || 'Système'} • ${timeAgo}
              </p>
            </div>
            <div class="flex-shrink-0">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getSeverityClass(event.severity)}">
                ${event.severity}
              </span>
            </div>
          </div>
        `
      }).join('')
      
      activityList.innerHTML = `<div class="space-y-0">${activitiesHtml}</div>`
      
    } catch (error) {
      Logger.error('Error loading recent activity', { error: error.message })
      
      const activityList = document.getElementById('recent-activity-list')
      activityList.innerHTML = `
        <div class="text-center py-8">
          <div class="mx-auto h-12 w-12 text-red-400 mb-4">❌</div>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Erreur de chargement</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Impossible de charger l'activité récente.
          </p>
        </div>
      `
    }
  }

  getEventIcon(eventType) {
    const icons = {
      'LICENSE_CREATED': '🆕',
      'LICENSE_ACTIVATED': '✅',
      'LICENSE_SUSPENDED': '⏸️',
      'LICENSE_EXPIRED': '❌',
      'LICENSE_RENEWED': '🔄',
      'COMPANY_CREATED': '🏢',
      'EXPIRATION_WARNING_SENT': '⚠️',
      'INVALID_KEY_ATTEMPT': '🚫',
      'SUSPICIOUS_ACTIVITY': '🔒',
      'ADMIN_ACCESS': '👤'
    }
    return icons[eventType] || '📋'
  }

  getEventDescription(event) {
    const descriptions = {
      'LICENSE_CREATED': 'Nouvelle licence créée',
      'LICENSE_ACTIVATED': 'Licence activée',
      'LICENSE_SUSPENDED': 'Licence suspendue',
      'LICENSE_EXPIRED': 'Licence expirée',
      'LICENSE_RENEWED': 'Licence renouvelée',
      'COMPANY_CREATED': 'Nouvelle entreprise créée',
      'EXPIRATION_WARNING_SENT': 'Avertissement d\'expiration envoyé',
      'INVALID_KEY_ATTEMPT': 'Tentative d\'accès avec clé invalide',
      'SUSPICIOUS_ACTIVITY': 'Activité suspecte détectée',
      'ADMIN_ACCESS': 'Accès administrateur'
    }
    return descriptions[event.event_type] || event.event_type
  }

  getSeverityClass(severity) {
    const classes = {
      'LOW': 'bg-gray-100 text-gray-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    }
    return classes[severity] || 'bg-gray-100 text-gray-800'
  }

  getTimeAgo(date) {
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    return `Il y a ${diffDays}j`
  }

  destroy() {
    this.stopAutoRefresh()
    document.removeEventListener('company-updated', () => this.loadStats())
    document.removeEventListener('license-updated', () => this.loadStats())
  }

  render() {
    return `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <!-- Page header -->
          <div class="md:flex md:items-center md:justify-between mb-8">
            <div class="flex-1 min-w-0">
              <h2 class="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                📊 Dashboard Admin SamaFacture
              </h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Vue d'ensemble complète des entreprises, licences et activités
              </p>
            </div>
            <div class="mt-4 flex md:mt-0 md:ml-4">
              <button onclick="window.adminDashboard.loadStats()" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                🔄 Actualiser
              </button>
            </div>
          </div>

          <!-- Stats cards -->
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <!-- Total Companies -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">🏢</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Entreprises totales
                      </dt>
                      <dd id="total-companies" class="text-lg font-medium text-gray-900 dark:text-white">
                        ${this.stats.companies.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Companies -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">✅</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Entreprises actives
                      </dt>
                      <dd id="active-companies" class="text-lg font-medium text-gray-900 dark:text-white">
                        ${this.stats.companies.active}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total Licenses -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">🔑</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Licences totales
                      </dt>
                      <dd id="total-licenses" class="text-lg font-medium text-gray-900 dark:text-white">
                        ${this.stats.licenses.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Licenses -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">🟢</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Licences actives
                      </dt>
                      <dd id="active-licenses" class="text-lg font-medium text-gray-900 dark:text-white">
                        ${this.stats.licenses.active}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Second row of stats -->
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <!-- Expired Licenses -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">❌</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Licences expirées
                      </dt>
                      <dd id="expired-licenses" class="text-lg font-medium text-gray-900 dark:text-white">
                        ${this.stats.licenses.expired}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <!-- Expiring Soon -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">⚠️</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Expirent bientôt
                      </dt>
                      <dd id="expiring-licenses" class="text-lg font-medium text-gray-900 dark:text-white">
                        ${this.stats.licenses.expiring}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <!-- Activity 24h -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">📊</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Activité 24h
                      </dt>
                      <dd id="activity-24h" class="text-lg font-medium text-gray-900 dark:text-white">
                        ${this.stats.activity.last24h}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <!-- Activity 7 days -->
            <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-cyan-500 rounded-md flex items-center justify-center">
                      <span class="text-white text-sm">📈</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Activité 7j
                      </dt>
                      <dd id="activity-7days" class="text-lg font-medium text-gray-900 dark:text-white">
                        ${this.stats.activity.last7days}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
            <!-- Quick Actions Card -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  🚀 Actions rapides
                </h3>
                <div class="grid grid-cols-2 gap-4">
                  <button onclick="window.location.hash = '#/companies'" class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    🏢 Gérer Entreprises
                  </button>
                  <button onclick="window.location.hash = '#/licenses'" class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    🔑 Gérer Licences
                  </button>
                  <button onclick="window.adminDashboard.processExpiredLicenses()" class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                    ⚠️ Traiter Expirations
                  </button>
                  <button onclick="window.adminDashboard.exportData()" class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    📊 Exporter Données
                  </button>
                </div>
              </div>
            </div>

            <!-- System Status -->
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  🔧 État du système
                </h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Base de données</span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      🟢 Opérationnel
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Service de licences</span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      🟢 Opérationnel
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Audit système</span>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      🟢 Opérationnel
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Dernière sauvegarde</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400" id="last-backup">
                      Il y a 2 heures
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  📋 Activité récente
                </h3>
                <button onclick="window.adminDashboard.loadRecentActivity()" class="text-sm text-blue-600 hover:text-blue-500">
                  Actualiser
                </button>
              </div>
              <div id="recent-activity-list">
                <div class="text-center py-8">
                  <div class="mx-auto h-12 w-12 text-gray-400 mb-4">📊</div>
                  <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Chargement...</h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Récupération des activités récentes...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  async afterRender() {
    // Charger l'activité récente après le rendu
    setTimeout(() => {
      this.loadRecentActivity()
    }, 500)
    
    // Exposer l'instance globalement pour les boutons
    window.adminDashboard = this
  }
}
