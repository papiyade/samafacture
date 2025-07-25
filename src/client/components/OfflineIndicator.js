/**
 * Offline Indicator Component - Shows network status and sync information
 */

import { NetworkDetector } from '../../shared/services/NetworkDetector.js'
import { SyncManager } from '../../shared/services/SyncManager.js'

export class OfflineIndicator {
  constructor() {
    this.container = null
    this.isVisible = false
    this.currentStatus = 'online'
    this.syncStatus = null
  }

  /**
   * Initialize the offline indicator
   */
  async init() {
    try {
      // Create the indicator element
      this.createIndicator()
      
      // Set up event listeners
      this.setupEventListeners()
      
      // Update initial state
      this.updateStatus()
      
      console.log('✅ Offline Indicator initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Offline Indicator:', error)
    }
  }

  /**
   * Create the indicator HTML element
   */
  createIndicator() {
    // Remove existing indicator if any
    const existing = document.getElementById('offline-indicator')
    if (existing) {
      existing.remove()
    }

    // Create indicator container
    this.container = document.createElement('div')
    this.container.id = 'offline-indicator'
    this.container.className = 'fixed top-0 left-0 right-0 z-50 transform -translate-y-full transition-transform duration-300 ease-in-out'
    
    this.container.innerHTML = `
      <div class="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3 shadow-lg">
        <div class="flex items-center justify-between max-w-7xl mx-auto">
          <div class="flex items-center space-x-3">
            <!-- Status Icon -->
            <div id="status-icon" class="flex-shrink-0">
              <div class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            </div>
            
            <!-- Status Text -->
            <div class="flex-1">
              <p id="status-text" class="text-sm font-medium">
                Vous êtes hors ligne
              </p>
              <p id="status-detail" class="text-xs text-gray-300 mt-1">
                Vos modifications seront synchronisées dès le retour de la connexion
              </p>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <!-- Sync Status -->
            <div id="sync-info" class="hidden text-xs text-gray-300">
              <span id="sync-count">0</span> en attente
            </div>
            
            <!-- Retry Button -->
            <button
              id="retry-sync-btn"
              class="hidden px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Réessayer
            </button>
            
            <!-- Close Button -->
            <button
              id="close-indicator-btn"
              class="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
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
    const retryBtn = this.container.querySelector('#retry-sync-btn')
    const closeBtn = this.container.querySelector('#close-indicator-btn')

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.handleRetrySync()
      })
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide()
      })
    }
  }

  /**
   * Set up event listeners for network and sync changes
   */
  setupEventListeners() {
    // Network status changes
    NetworkDetector.addEventListener('online', () => {
      this.updateStatus('online')
    })

    NetworkDetector.addEventListener('offline', () => {
      this.updateStatus('offline')
    })

    NetworkDetector.addEventListener('connectivity-test', (data) => {
      if (!data.isConnected && this.currentStatus === 'online') {
        this.updateStatus('poor-connection')
      }
    })

    // Sync status changes
    SyncManager.addEventListener(SyncManager.EVENTS.QUEUE_UPDATED, (data) => {
      this.updateSyncInfo(data.queue)
    })

    SyncManager.addEventListener(SyncManager.EVENTS.SYNC_START, () => {
      this.updateStatus('syncing')
    })

    SyncManager.addEventListener(SyncManager.EVENTS.SYNC_COMPLETE, (data) => {
      this.showSyncComplete(data)
    })

    SyncManager.addEventListener(SyncManager.EVENTS.SYNC_ERROR, () => {
      this.updateStatus('sync-error')
    })
  }

  /**
   * Update the indicator status
   */
  updateStatus(status = null) {
    if (!this.container) return

    // Determine current status
    if (status) {
      this.currentStatus = status
    } else {
      if (NetworkDetector.isOnline()) {
        const syncStatus = SyncManager.getSyncStatus()
        if (syncStatus.syncInProgress) {
          this.currentStatus = 'syncing'
        } else if (syncStatus.queueLength > 0) {
          this.currentStatus = 'pending-sync'
        } else {
          this.currentStatus = 'online'
        }
      } else {
        this.currentStatus = 'offline'
      }
    }

    // Update UI based on status
    this.updateIndicatorUI()

    // Show/hide indicator
    if (this.shouldShowIndicator()) {
      this.show()
    } else {
      this.hide()
    }
  }

  /**
   * Update the indicator UI elements
   */
  updateIndicatorUI() {
    const statusIcon = this.container.querySelector('#status-icon')
    const statusText = this.container.querySelector('#status-text')
    const statusDetail = this.container.querySelector('#status-detail')
    const retryBtn = this.container.querySelector('#retry-sync-btn')
    const syncInfo = this.container.querySelector('#sync-info')

    if (!statusIcon || !statusText || !statusDetail) return

    switch (this.currentStatus) {
      case 'online':
        statusIcon.innerHTML = '<div class="w-3 h-3 rounded-full bg-green-500"></div>'
        statusText.textContent = 'Connexion rétablie'
        statusDetail.textContent = 'Toutes vos données sont synchronisées'
        this.container.querySelector('.bg-gradient-to-r').className = 'bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 shadow-lg'
        retryBtn?.classList.add('hidden')
        break

      case 'offline':
        statusIcon.innerHTML = '<div class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>'
        statusText.textContent = 'Vous êtes hors ligne'
        statusDetail.textContent = 'Vos modifications seront synchronisées dès le retour de la connexion'
        this.container.querySelector('.bg-gradient-to-r').className = 'bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 shadow-lg'
        retryBtn?.classList.add('hidden')
        break

      case 'poor-connection':
        statusIcon.innerHTML = '<div class="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>'
        statusText.textContent = 'Connexion instable'
        statusDetail.textContent = 'La synchronisation peut être ralentie'
        this.container.querySelector('.bg-gradient-to-r').className = 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-4 py-3 shadow-lg'
        retryBtn?.classList.remove('hidden')
        break

      case 'syncing':
        statusIcon.innerHTML = `
          <div class="w-3 h-3 rounded-full bg-blue-500">
            <div class="w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
          </div>
        `
        statusText.textContent = 'Synchronisation en cours...'
        statusDetail.textContent = 'Vos données sont en cours de synchronisation'
        this.container.querySelector('.bg-gradient-to-r').className = 'bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 shadow-lg'
        retryBtn?.classList.add('hidden')
        break

      case 'pending-sync':
        statusIcon.innerHTML = '<div class="w-3 h-3 rounded-full bg-orange-500"></div>'
        statusText.textContent = 'Synchronisation en attente'
        statusDetail.textContent = 'Certaines modifications ne sont pas encore synchronisées'
        this.container.querySelector('.bg-gradient-to-r').className = 'bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-3 shadow-lg'
        retryBtn?.classList.remove('hidden')
        break

      case 'sync-error':
        statusIcon.innerHTML = '<div class="w-3 h-3 rounded-full bg-red-500"></div>'
        statusText.textContent = 'Erreur de synchronisation'
        statusDetail.textContent = 'Impossible de synchroniser certaines données'
        this.container.querySelector('.bg-gradient-to-r').className = 'bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 shadow-lg'
        retryBtn?.classList.remove('hidden')
        break
    }

    // Update sync info
    if (syncInfo && this.syncStatus) {
      const syncCount = this.container.querySelector('#sync-count')
      if (syncCount) {
        syncCount.textContent = this.syncStatus.queueLength || 0
      }
      
      if (this.syncStatus.queueLength > 0) {
        syncInfo.classList.remove('hidden')
      } else {
        syncInfo.classList.add('hidden')
      }
    }
  }

  /**
   * Update sync information
   */
  updateSyncInfo(queue) {
    this.syncStatus = {
      queueLength: queue.length,
      pendingCount: queue.filter(item => item.status === 'pending').length,
      failedCount: queue.filter(item => item.status === 'failed').length
    }

    this.updateStatus()
  }

  /**
   * Show sync completion message
   */
  showSyncComplete(data) {
    if (data.synced > 0) {
      this.showTemporaryMessage(
        `✅ ${data.synced} élément(s) synchronisé(s)`,
        'success',
        3000
      )
    }

    // Update status after sync
    setTimeout(() => {
      this.updateStatus()
    }, 3000)
  }

  /**
   * Show temporary message
   */
  showTemporaryMessage(message, type = 'info', duration = 3000) {
    const statusText = this.container.querySelector('#status-text')
    const statusDetail = this.container.querySelector('#status-detail')
    
    if (!statusText || !statusDetail) return

    const originalText = statusText.textContent
    const originalDetail = statusDetail.textContent

    statusText.textContent = message
    statusDetail.textContent = ''

    // Apply styling based on type
    const bgClass = type === 'success' ? 'from-green-600 to-green-700' : 
                   type === 'error' ? 'from-red-600 to-red-700' : 
                   'from-blue-600 to-blue-700'
    
    this.container.querySelector('.bg-gradient-to-r').className = `bg-gradient-to-r ${bgClass} text-white px-4 py-3 shadow-lg`

    // Restore original content after duration
    setTimeout(() => {
      statusText.textContent = originalText
      statusDetail.textContent = originalDetail
      this.updateIndicatorUI()
    }, duration)
  }

  /**
   * Determine if indicator should be shown
   */
  shouldShowIndicator() {
    return this.currentStatus !== 'online' || 
           (this.syncStatus && this.syncStatus.queueLength > 0)
  }

  /**
   * Show the indicator
   */
  show() {
    if (!this.isVisible && this.container) {
      this.container.classList.remove('-translate-y-full')
      this.container.classList.add('translate-y-0')
      this.isVisible = true
    }
  }

  /**
   * Hide the indicator
   */
  hide() {
    if (this.isVisible && this.container) {
      this.container.classList.remove('translate-y-0')
      this.container.classList.add('-translate-y-full')
      this.isVisible = false
    }
  }

  /**
   * Handle retry sync button click
   */
  async handleRetrySync() {
    try {
      const retryBtn = this.container.querySelector('#retry-sync-btn')
      if (retryBtn) {
        retryBtn.disabled = true
        retryBtn.textContent = 'Synchronisation...'
      }

      // Check connectivity first
      const isConnected = await NetworkDetector.checkConnectivity()
      
      if (isConnected) {
        // Force sync
        await SyncManager.forceSyncAll()
      } else {
        this.showTemporaryMessage('Aucune connexion disponible', 'error', 2000)
      }
    } catch (error) {
      console.error('Retry sync failed:', error)
      this.showTemporaryMessage('Erreur lors de la synchronisation', 'error', 2000)
    } finally {
      const retryBtn = this.container.querySelector('#retry-sync-btn')
      if (retryBtn) {
        retryBtn.disabled = false
        retryBtn.textContent = 'Réessayer'
      }
    }
  }

  /**
   * Destroy the indicator
   */
  destroy() {
    if (this.container) {
      this.container.remove()
      this.container = null
    }
    this.isVisible = false
    console.log('🗑️ Offline Indicator destroyed')
  }
}

export default OfflineIndicator

