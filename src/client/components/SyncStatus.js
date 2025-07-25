/**
 * Sync Status Component - Detailed sync status and management interface
 */

import { SyncManager } from '../../shared/services/SyncManager.js'
import { NetworkDetector } from '../../shared/services/NetworkDetector.js'

export class SyncStatus {
  constructor() {
    this.container = null
    this.isVisible = false
    this.syncQueue = []
    this.networkStats = null
    this.refreshInterval = null
  }

  /**
   * Initialize the sync status component
   */
  async init() {
    try {
      // Create the status interface
      this.createStatusInterface()
      
      // Set up event listeners
      this.setupEventListeners()
      
      // Start periodic updates
      this.startPeriodicUpdates()
      
      // Update initial state
      this.updateStatus()
      
      console.log('✅ Sync Status component initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Sync Status:', error)
    }
  }

  /**
   * Create the status interface
   */
  createStatusInterface() {
    // Remove existing interface if any
    const existing = document.getElementById('sync-status-panel')
    if (existing) {
      existing.remove()
    }

    // Create status panel
    this.container = document.createElement('div')
    this.container.id = 'sync-status-panel'
    this.container.className = 'fixed bottom-4 right-4 z-40 transform translate-x-full transition-transform duration-300 ease-in-out'
    
    this.container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-80 max-h-96 overflow-hidden">
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
              <div id="sync-status-icon" class="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              État de synchronisation
            </h3>
            <button
              id="close-sync-panel"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-4 max-h-80 overflow-y-auto">
          <!-- Network Status -->
          <div class="space-y-2">
            <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Connexion réseau
            </h4>
            <div id="network-status" class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div class="flex items-center space-x-2">
                <div id="network-icon" class="w-2 h-2 rounded-full bg-green-500"></div>
                <span id="network-text" class="text-sm text-gray-900 dark:text-white">En ligne</span>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                <span id="connection-type">4G</span> • 
                <span id="connection-quality">Excellente</span>
              </div>
            </div>
          </div>

          <!-- Sync Queue -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                File de synchronisation
              </h4>
              <span id="queue-count" class="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                0 en attente
              </span>
            </div>
            
            <div id="sync-queue-list" class="space-y-1 max-h-32 overflow-y-auto">
              <!-- Queue items will be inserted here -->
            </div>
            
            <div id="empty-queue" class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              <svg class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Toutes les données sont synchronisées
            </div>
          </div>

          <!-- Sync Statistics -->
          <div class="space-y-2">
            <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Statistiques
            </h4>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div class="text-gray-500 dark:text-gray-400">Dernière sync</div>
                <div id="last-sync" class="font-medium text-gray-900 dark:text-white">Jamais</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <div class="text-gray-500 dark:text-gray-400">Échecs</div>
                <div id="failed-count" class="font-medium text-gray-900 dark:text-white">0</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div class="flex space-x-2">
            <button
              id="force-sync-btn"
              class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Forcer la sync
            </button>
            <button
              id="clear-failed-btn"
              class="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nettoyer
            </button>
          </div>
        </div>
      </div>
    `

    // Add to page
    document.body.appendChild(this.container)

    // Set up click handlers
    this.setupClickHandlers()
  }

  /**
   * Set up click handlers
   */
  setupClickHandlers() {
    const closeBtn = this.container.querySelector('#close-sync-panel')
    const forceSyncBtn = this.container.querySelector('#force-sync-btn')
    const clearFailedBtn = this.container.querySelector('#clear-failed-btn')

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide()
      })
    }

    if (forceSyncBtn) {
      forceSyncBtn.addEventListener('click', () => {
        this.handleForceSync()
      })
    }

    if (clearFailedBtn) {
      clearFailedBtn.addEventListener('click', () => {
        this.handleClearFailed()
      })
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Network status changes
    NetworkDetector.addEventListener('online', () => {
      this.updateNetworkStatus()
    })

    NetworkDetector.addEventListener('offline', () => {
      this.updateNetworkStatus()
    })

    NetworkDetector.addEventListener('connection-change', () => {
      this.updateNetworkStatus()
    })

    // Sync status changes
    SyncManager.addEventListener(SyncManager.EVENTS.QUEUE_UPDATED, (data) => {
      this.syncQueue = data.queue
      this.updateSyncQueue()
    })

    SyncManager.addEventListener(SyncManager.EVENTS.SYNC_START, () => {
      this.updateSyncStatus('syncing')
    })

    SyncManager.addEventListener(SyncManager.EVENTS.SYNC_PROGRESS, (data) => {
      this.updateSyncProgress(data)
    })

    SyncManager.addEventListener(SyncManager.EVENTS.SYNC_COMPLETE, (data) => {
      this.updateSyncStatus('completed')
      this.updateLastSync()
    })

    SyncManager.addEventListener(SyncManager.EVENTS.SYNC_ERROR, () => {
      this.updateSyncStatus('error')
    })
  }

  /**
   * Start periodic updates
   */
  startPeriodicUpdates() {
    this.refreshInterval = setInterval(() => {
      this.updateStatus()
    }, 5000) // Update every 5 seconds
  }

  /**
   * Stop periodic updates
   */
  stopPeriodicUpdates() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  /**
   * Update overall status
   */
  async updateStatus() {
    this.updateNetworkStatus()
    this.updateSyncQueue()
    this.updateStatistics()
  }

  /**
   * Update network status display
   */
  updateNetworkStatus() {
    const networkIcon = this.container.querySelector('#network-icon')
    const networkText = this.container.querySelector('#network-text')
    const connectionType = this.container.querySelector('#connection-type')
    const connectionQuality = this.container.querySelector('#connection-quality')

    if (!networkIcon || !networkText) return

    const networkStats = NetworkDetector.getNetworkStats()
    this.networkStats = networkStats

    // Update status
    if (networkStats.isOnline) {
      networkIcon.className = 'w-2 h-2 rounded-full bg-green-500'
      networkText.textContent = 'En ligne'
    } else {
      networkIcon.className = 'w-2 h-2 rounded-full bg-red-500 animate-pulse'
      networkText.textContent = 'Hors ligne'
    }

    // Update connection details
    if (connectionType) {
      connectionType.textContent = networkStats.effectiveType || networkStats.connectionType || 'Inconnue'
    }

    if (connectionQuality) {
      const quality = networkStats.quality
      let qualityText = 'Inconnue'
      
      if (quality >= 80) qualityText = 'Excellente'
      else if (quality >= 60) qualityText = 'Bonne'
      else if (quality >= 40) qualityText = 'Moyenne'
      else if (quality >= 20) qualityText = 'Faible'
      else qualityText = 'Très faible'
      
      connectionQuality.textContent = qualityText
    }
  }

  /**
   * Update sync queue display
   */
  updateSyncQueue() {
    const queueCount = this.container.querySelector('#queue-count')
    const queueList = this.container.querySelector('#sync-queue-list')
    const emptyQueue = this.container.querySelector('#empty-queue')

    if (!queueCount || !queueList || !emptyQueue) return

    const pendingCount = this.syncQueue.filter(item => item.status === 'pending').length
    
    // Update count
    queueCount.textContent = `${pendingCount} en attente`
    
    if (pendingCount === 0) {
      queueList.classList.add('hidden')
      emptyQueue.classList.remove('hidden')
    } else {
      queueList.classList.remove('hidden')
      emptyQueue.classList.add('hidden')
      
      // Render queue items
      queueList.innerHTML = this.syncQueue
        .filter(item => item.status === 'pending' || item.status === 'failed')
        .slice(0, 5) // Show only first 5 items
        .map(item => this.renderQueueItem(item))
        .join('')
    }
  }

  /**
   * Render individual queue item
   */
  renderQueueItem(item) {
    const statusColor = item.status === 'failed' ? 'text-red-600' : 'text-gray-600'
    const actionText = this.getActionText(item.action, item.table)
    const timeAgo = this.getTimeAgo(item.timestamp)

    return `
      <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900 dark:text-white truncate">
            ${actionText}
          </div>
          <div class="text-gray-500 dark:text-gray-400">
            ${timeAgo}
          </div>
        </div>
        <div class="flex-shrink-0 ml-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            item.status === 'failed' 
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }">
            ${item.status === 'failed' ? 'Échec' : 'En attente'}
          </span>
        </div>
      </div>
    `
  }

  /**
   * Update sync status icon
   */
  updateSyncStatus(status) {
    const statusIcon = this.container.querySelector('#sync-status-icon')
    if (!statusIcon) return

    switch (status) {
      case 'syncing':
        statusIcon.className = 'w-3 h-3 rounded-full bg-blue-500 animate-pulse mr-2'
        break
      case 'completed':
        statusIcon.className = 'w-3 h-3 rounded-full bg-green-500 mr-2'
        break
      case 'error':
        statusIcon.className = 'w-3 h-3 rounded-full bg-red-500 mr-2'
        break
      default:
        statusIcon.className = 'w-3 h-3 rounded-full bg-gray-500 mr-2'
    }
  }

  /**
   * Update sync progress
   */
  updateSyncProgress(data) {
    // Could add a progress bar here if needed
    console.log('Sync progress:', data)
  }

  /**
   * Update statistics
   */
  updateStatistics() {
    const lastSync = this.container.querySelector('#last-sync')
    const failedCount = this.container.querySelector('#failed-count')

    if (lastSync) {
      const lastSyncTime = localStorage.getItem('last_sync_time')
      if (lastSyncTime) {
        lastSync.textContent = this.getTimeAgo(parseInt(lastSyncTime))
      } else {
        lastSync.textContent = 'Jamais'
      }
    }

    if (failedCount) {
      const failed = this.syncQueue.filter(item => item.status === 'failed').length
      failedCount.textContent = failed.toString()
    }
  }

  /**
   * Update last sync time
   */
  updateLastSync() {
    localStorage.setItem('last_sync_time', Date.now().toString())
    this.updateStatistics()
  }

  /**
   * Handle force sync button
   */
  async handleForceSync() {
    const forceSyncBtn = this.container.querySelector('#force-sync-btn')
    if (!forceSyncBtn) return

    try {
      forceSyncBtn.disabled = true
      forceSyncBtn.textContent = 'Synchronisation...'

      // Check connectivity first
      const isConnected = await NetworkDetector.checkConnectivity()
      
      if (!isConnected) {
        this.showMessage('Aucune connexion disponible', 'error')
        return
      }

      // Force sync
      await SyncManager.forceSyncAll()
      this.showMessage('Synchronisation lancée', 'success')
      
    } catch (error) {
      console.error('Force sync failed:', error)
      this.showMessage('Erreur lors de la synchronisation', 'error')
    } finally {
      forceSyncBtn.disabled = false
      forceSyncBtn.textContent = 'Forcer la sync'
    }
  }

  /**
   * Handle clear failed actions
   */
  async handleClearFailed() {
    const clearFailedBtn = this.container.querySelector('#clear-failed-btn')
    if (!clearFailedBtn) return

    try {
      clearFailedBtn.disabled = true
      clearFailedBtn.textContent = 'Nettoyage...'

      await SyncManager.clearFailedActions()
      this.showMessage('Actions échouées supprimées', 'success')
      
    } catch (error) {
      console.error('Clear failed actions failed:', error)
      this.showMessage('Erreur lors du nettoyage', 'error')
    } finally {
      clearFailedBtn.disabled = false
      clearFailedBtn.textContent = 'Nettoyer'
    }
  }

  /**
   * Show temporary message
   */
  showMessage(message, type = 'info') {
    // Create temporary message element
    const messageEl = document.createElement('div')
    messageEl.className = `fixed bottom-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm ${
      type === 'success' ? 'bg-green-600' :
      type === 'error' ? 'bg-red-600' :
      'bg-blue-600'
    }`
    messageEl.textContent = message

    document.body.appendChild(messageEl)

    // Remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(messageEl)) {
        document.body.removeChild(messageEl)
      }
    }, 3000)
  }

  /**
   * Helper methods
   */
  getActionText(action, table) {
    const tableNames = {
      clients: 'client',
      products: 'produit',
      invoices: 'facture',
      quotes: 'devis',
      expenses: 'dépense'
    }

    const actionNames = {
      create: 'Créer',
      update: 'Modifier',
      delete: 'Supprimer'
    }

    const tableName = tableNames[table] || table
    const actionName = actionNames[action] || action

    return `${actionName} ${tableName}`
  }

  getTimeAgo(timestamp) {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `il y a ${days}j`
    if (hours > 0) return `il y a ${hours}h`
    if (minutes > 0) return `il y a ${minutes}min`
    return 'À l\'instant'
  }

  /**
   * Show the status panel
   */
  show() {
    if (!this.isVisible && this.container) {
      this.container.classList.remove('translate-x-full')
      this.container.classList.add('translate-x-0')
      this.isVisible = true
      this.updateStatus()
    }
  }

  /**
   * Hide the status panel
   */
  hide() {
    if (this.isVisible && this.container) {
      this.container.classList.remove('translate-x-0')
      this.container.classList.add('translate-x-full')
      this.isVisible = false
    }
  }

  /**
   * Toggle visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * Destroy the component
   */
  destroy() {
    this.stopPeriodicUpdates()
    
    if (this.container) {
      this.container.remove()
      this.container = null
    }
    
    this.isVisible = false
    console.log('🗑️ Sync Status component destroyed')
  }
}

export default SyncStatus

