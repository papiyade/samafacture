/**
 * Offline Manager - Manages offline functionality integration
 */

import { NetworkDetector } from '../../shared/services/NetworkDetector.js'
import { SyncManager } from '../../shared/services/SyncManager.js'
import { OfflineIndicator } from '../components/OfflineIndicator.js'
import { SyncStatus } from '../components/SyncStatus.js'
import { NotificationService } from '../../shared/services/NotificationService.js'

export class OfflineManager {
  constructor() {
    this.offlineIndicator = null
    this.syncStatus = null
    this.serviceWorkerRegistration = null
    this.isInitialized = false
  }

  /**
   * Initialize offline manager
   */
  async init() {
    try {
      console.log('🔄 Initializing Offline Manager...')

      // Register advanced service worker
      await this.registerAdvancedServiceWorker()

      // Initialize network detector
      await NetworkDetector.init()

      // Initialize offline components
      await this.initializeOfflineComponents()

      // Setup offline UI
      this.setupOfflineUI()

      this.isInitialized = true
      console.log('✅ Offline Manager initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Offline Manager:', error)
      throw error
    }
  }

  /**
   * Register advanced service worker with offline support
   */
  async registerAdvancedServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Unregister old service worker first
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
        }

        // Register new advanced service worker
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw-advanced.js')
        console.log('✅ Advanced Service Worker registered:', this.serviceWorkerRegistration)

        // Listen for service worker updates
        this.serviceWorkerRegistration.addEventListener('updatefound', () => {
          const newWorker = this.serviceWorkerRegistration.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is available
              this.showUpdateAvailable()
            }
          })
        })

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data)
        })

      } catch (error) {
        console.error('❌ Advanced Service Worker registration failed:', error)
        // Fallback to basic service worker
        await this.registerBasicServiceWorker()
      }
    }
  }

  /**
   * Fallback to basic service worker
   */
  async registerBasicServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('✅ Basic Service Worker registered:', registration)
      } catch (error) {
        console.error('❌ Basic Service Worker registration failed:', error)
      }
    }
  }

  /**
   * Initialize offline components
   */
  async initializeOfflineComponents() {
    try {
      // Initialize offline indicator
      this.offlineIndicator = new OfflineIndicator()
      await this.offlineIndicator.init()

      // Initialize sync status component
      this.syncStatus = new SyncStatus()
      await this.syncStatus.init()

      console.log('✅ Offline components initialized')
    } catch (error) {
      console.error('❌ Failed to initialize offline components:', error)
    }
  }

  /**
   * Setup offline/sync UI elements
   */
  setupOfflineUI() {
    // Add sync status button to header
    this.addSyncStatusButton()

    // Add keyboard shortcuts
    this.setupKeyboardShortcuts()

    // Setup network status in footer
    this.setupNetworkStatusFooter()
  }

  /**
   * Add sync status button to header
   */
  addSyncStatusButton() {
    const header = document.querySelector('header')
    if (!header) return

    const syncButton = document.createElement('button')
    syncButton.id = 'sync-status-btn'
    syncButton.className = 'p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors'
    syncButton.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
    `
    syncButton.title = 'État de synchronisation (Ctrl+Shift+S)'
    
    syncButton.addEventListener('click', () => {
      if (this.syncStatus) {
        this.syncStatus.toggle()
      }
    })

    // Add to header navigation
    const nav = header.querySelector('nav') || header.querySelector('.flex')
    if (nav) {
      nav.appendChild(syncButton)
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + S to toggle sync status
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        if (this.syncStatus) {
          this.syncStatus.toggle()
        }
      }

      // Ctrl/Cmd + Shift + R to force refresh cache
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        this.forceCacheRefresh()
      }
    })
  }

  /**
   * Setup network status in footer
   */
  setupNetworkStatusFooter() {
    const footer = document.querySelector('footer')
    if (!footer) return

    const networkStatus = document.createElement('div')
    networkStatus.id = 'network-status-footer'
    networkStatus.className = 'text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2'
    
    this.updateNetworkStatusFooter(networkStatus)

    // Listen for network changes
    NetworkDetector.addEventListener('online', () => {
      this.updateNetworkStatusFooter(networkStatus)
    })

    NetworkDetector.addEventListener('offline', () => {
      this.updateNetworkStatusFooter(networkStatus)
    })

    NetworkDetector.addEventListener('connection-change', () => {
      this.updateNetworkStatusFooter(networkStatus)
    })

    footer.appendChild(networkStatus)
  }

  /**
   * Update network status footer
   */
  updateNetworkStatusFooter(element) {
    const networkStats = NetworkDetector.getNetworkStats()
    
    const statusIcon = networkStats.isOnline 
      ? '<div class="w-2 h-2 bg-green-500 rounded-full"></div>'
      : '<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>'
    
    const statusText = networkStats.isOnline 
      ? `En ligne • ${networkStats.effectiveType || 'Connexion'}`
      : 'Hors ligne'

    element.innerHTML = `
      ${statusIcon}
      <span>${statusText}</span>
    `
  }

  /**
   * Handle service worker messages
   */
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'SW_UPDATED':
        console.log('🔄 Service Worker updated to version:', data.version)
        break
      case 'SYNC_COMPLETE':
        console.log('✅ Background sync completed:', data)
        if (data.synced > 0) {
          NotificationService.show(
            `${data.synced} élément(s) synchronisé(s)`, 
            'success'
          )
        }
        break
      case 'CACHE_UPDATED':
        console.log('📦 Cache updated')
        break
      case 'OFFLINE_ACTION_QUEUED':
        console.log('📝 Action queued for offline sync:', data)
        NotificationService.show(
          'Action enregistrée pour synchronisation', 
          'info'
        )
        break
    }
  }

  /**
   * Show update available notification
   */
  showUpdateAvailable() {
    // Check if update banner already exists
    if (document.getElementById('update-banner')) {
      return
    }

    const updateBanner = document.createElement('div')
    updateBanner.id = 'update-banner'
    updateBanner.className = 'fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 shadow-lg'
    updateBanner.innerHTML = `
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center space-x-3">
          <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span class="font-medium">Une nouvelle version est disponible</span>
        </div>
        <div class="flex space-x-2">
          <button id="update-app-btn" class="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white">
            Mettre à jour
          </button>
          <button id="dismiss-update-btn" class="px-3 py-1 border border-white rounded text-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white">
            Plus tard
          </button>
        </div>
      </div>
    `

    document.body.appendChild(updateBanner)

    // Handle update button
    updateBanner.querySelector('#update-app-btn').addEventListener('click', () => {
      if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.waiting) {
        this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
        
        // Show loading message
        updateBanner.innerHTML = `
          <div class="flex items-center justify-center">
            <svg class="w-5 h-5 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Mise à jour en cours...</span>
          </div>
        `
        
        // Reload after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    })

    // Handle dismiss button
    updateBanner.querySelector('#dismiss-update-btn').addEventListener('click', () => {
      updateBanner.remove()
    })

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      if (document.body.contains(updateBanner)) {
        updateBanner.remove()
      }
    }, 30000)
  }

  /**
   * Force cache refresh
   */
  async forceCacheRefresh() {
    try {
      if (this.serviceWorkerRegistration) {
        // Send message to service worker to clear cache
        const messageChannel = new MessageChannel()
        
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            NotificationService.show('Cache actualisé', 'success')
            // Reload page to get fresh content
            setTimeout(() => window.location.reload(), 1000)
          } else {
            NotificationService.show('Erreur lors de l\'actualisation du cache', 'error')
          }
        }

        this.serviceWorkerRegistration.active.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        )
      }
    } catch (error) {
      console.error('Failed to refresh cache:', error)
      NotificationService.show('Erreur lors de l\'actualisation du cache', 'error')
    }
  }

  /**
   * Get offline status
   */
  getOfflineStatus() {
    return {
      isOnline: NetworkDetector.isOnline(),
      networkStats: NetworkDetector.getNetworkStats(),
      syncStatus: SyncManager.isInitialized ? SyncManager.getSyncStatus() : null,
      serviceWorkerActive: !!this.serviceWorkerRegistration?.active
    }
  }

  /**
   * Force sync all pending actions
   */
  async forceSyncAll() {
    try {
      if (SyncManager.isInitialized) {
        await SyncManager.forceSyncAll()
        NotificationService.show('Synchronisation forcée lancée', 'info')
      } else {
        NotificationService.show('Gestionnaire de synchronisation non disponible', 'warning')
      }
    } catch (error) {
      console.error('Force sync failed:', error)
      NotificationService.show('Erreur lors de la synchronisation', 'error')
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.offlineIndicator) {
      this.offlineIndicator.destroy()
      this.offlineIndicator = null
    }

    if (this.syncStatus) {
      this.syncStatus.destroy()
      this.syncStatus = null
    }

    // Remove UI elements
    const syncButton = document.getElementById('sync-status-btn')
    if (syncButton) {
      syncButton.remove()
    }

    const networkStatus = document.getElementById('network-status-footer')
    if (networkStatus) {
      networkStatus.remove()
    }

    const updateBanner = document.getElementById('update-banner')
    if (updateBanner) {
      updateBanner.remove()
    }

    this.isInitialized = false
    console.log('🗑️ Offline Manager destroyed')
  }
}

export default OfflineManager

