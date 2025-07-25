/**
 * Sync Manager - Handles offline/online synchronization
 * Manages sync queue, conflict resolution, and background sync
 */

import { IndexedDBService } from './IndexedDBService.js'
import { NetworkDetector } from './NetworkDetector.js'

export class SyncManager {
  static instance = null
  static isInitialized = false
  static syncInProgress = false
  static syncQueue = []
  static eventListeners = new Map()

  // Sync strategies
  static SYNC_STRATEGIES = {
    LAST_WRITE_WINS: 'last_write_wins',
    MERGE: 'merge',
    USER_CHOICE: 'user_choice',
    SERVER_WINS: 'server_wins',
    CLIENT_WINS: 'client_wins'
  }

  // Sync events
  static EVENTS = {
    SYNC_START: 'sync_start',
    SYNC_PROGRESS: 'sync_progress',
    SYNC_COMPLETE: 'sync_complete',
    SYNC_ERROR: 'sync_error',
    CONFLICT_DETECTED: 'conflict_detected',
    QUEUE_UPDATED: 'queue_updated'
  }

  /**
   * Initialize Sync Manager
   */
  static async init() {
    if (this.isInitialized) {
      return this.instance
    }

    try {
      console.log('🔄 Initializing Sync Manager...')
      
      // Initialize dependencies
      await IndexedDBService.init()
      await NetworkDetector.init()

      // Load pending sync queue
      await this.loadSyncQueue()

      // Set up network change listeners
      NetworkDetector.addEventListener('online', () => {
        console.log('🌐 Network online - starting sync')
        this.startAutoSync()
      })

      NetworkDetector.addEventListener('offline', () => {
        console.log('📴 Network offline - pausing sync')
        this.pauseSync()
      })

      // Set up service worker message listener
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data)
        })
      }

      // Start auto sync if online
      if (NetworkDetector.isOnline()) {
        this.startAutoSync()
      }

      this.isInitialized = true
      this.instance = this
      console.log('✅ Sync Manager initialized')
      
      return this.instance
    } catch (error) {
      console.error('❌ Failed to initialize Sync Manager:', error)
      throw error
    }
  }

  /**
   * Add action to sync queue
   */
  static async addToQueue(action, table, data, recordId = null, priority = 'normal') {
    try {
      const queueItem = {
        id: Date.now() + Math.random(),
        action, // 'create', 'update', 'delete'
        table,
        data: JSON.parse(JSON.stringify(data)), // Deep clone
        recordId,
        priority, // 'high', 'normal', 'low'
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3,
        status: 'pending' // 'pending', 'syncing', 'completed', 'failed'
      }

      // Add to IndexedDB sync queue
      await IndexedDBService.addToSyncQueue(
        queueItem.action,
        queueItem.table,
        queueItem.data,
        queueItem.recordId
      )

      // Add to memory queue
      this.syncQueue.push(queueItem)

      console.log('📝 Added to sync queue:', queueItem)
      this.emit(this.EVENTS.QUEUE_UPDATED, { queue: this.syncQueue })

      // Try immediate sync if online
      if (NetworkDetector.isOnline() && !this.syncInProgress) {
        this.syncNext()
      }

      return queueItem.id
    } catch (error) {
      console.error('❌ Failed to add to sync queue:', error)
      throw error
    }
  }

  /**
   * Load sync queue from IndexedDB
   */
  static async loadSyncQueue() {
    try {
      const pendingActions = await IndexedDBService.getPendingSyncActions()
      this.syncQueue = pendingActions.map(action => ({
        ...action,
        status: 'pending'
      }))

      console.log(`📋 Loaded ${this.syncQueue.length} pending sync actions`)
      this.emit(this.EVENTS.QUEUE_UPDATED, { queue: this.syncQueue })
    } catch (error) {
      console.error('❌ Failed to load sync queue:', error)
      this.syncQueue = []
    }
  }

  /**
   * Start automatic synchronization
   */
  static startAutoSync() {
    if (this.syncInProgress || !NetworkDetector.isOnline()) {
      return
    }

    console.log('🚀 Starting auto sync...')
    this.syncAll()
  }

  /**
   * Pause synchronization
   */
  static pauseSync() {
    console.log('⏸️ Pausing sync')
    // The sync will naturally pause when network requests fail
  }

  /**
   * Sync all pending actions
   */
  static async syncAll() {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress')
      return
    }

    if (!NetworkDetector.isOnline()) {
      console.log('📴 Cannot sync - offline')
      return
    }

    this.syncInProgress = true
    this.emit(this.EVENTS.SYNC_START, { total: this.syncQueue.length })

    try {
      console.log(`🔄 Starting sync of ${this.syncQueue.length} actions`)
      
      // Sort queue by priority and timestamp
      const sortedQueue = this.sortQueueByPriority()
      let syncedCount = 0
      let failedCount = 0

      for (let i = 0; i < sortedQueue.length; i++) {
        const action = sortedQueue[i]
        
        try {
          action.status = 'syncing'
          this.emit(this.EVENTS.SYNC_PROGRESS, {
            current: i + 1,
            total: sortedQueue.length,
            action
          })

          const result = await this.syncAction(action)
          
          if (result.success) {
            // Remove from queue
            await this.removeFromQueue(action.id)
            syncedCount++
            console.log('✅ Synced action:', action.action, action.table)
          } else {
            // Handle failure
            await this.handleSyncFailure(action, result.error)
            failedCount++
          }
        } catch (error) {
          console.error('❌ Sync action failed:', error)
          await this.handleSyncFailure(action, error)
          failedCount++
        }
      }

      console.log(`🔄 Sync complete: ${syncedCount} synced, ${failedCount} failed`)
      this.emit(this.EVENTS.SYNC_COMPLETE, {
        synced: syncedCount,
        failed: failedCount,
        total: sortedQueue.length
      })

    } catch (error) {
      console.error('❌ Sync failed:', error)
      this.emit(this.EVENTS.SYNC_ERROR, { error })
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Sync next action in queue
   */
  static async syncNext() {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return
    }

    const nextAction = this.syncQueue.find(action => action.status === 'pending')
    if (!nextAction) {
      return
    }

    this.syncInProgress = true
    
    try {
      const result = await this.syncAction(nextAction)
      
      if (result.success) {
        await this.removeFromQueue(nextAction.id)
      } else {
        await this.handleSyncFailure(nextAction, result.error)
      }
    } catch (error) {
      await this.handleSyncFailure(nextAction, error)
    } finally {
      this.syncInProgress = false
      
      // Continue with next action if available
      if (this.syncQueue.length > 0) {
        setTimeout(() => this.syncNext(), 1000)
      }
    }
  }

  /**
   * Sync individual action
   */
  static async syncAction(action) {
    try {
      const { table, action: actionType, data, recordId } = action
      
      // Build API endpoint
      const endpoint = this.getAPIEndpoint(table, actionType, recordId)
      const method = this.getHTTPMethod(actionType)
      
      // Prepare request
      const requestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Sync-Action': 'true'
        }
      }

      if (method !== 'GET' && method !== 'DELETE') {
        requestOptions.body = JSON.stringify(data)
      }

      // Make API request
      const response = await fetch(endpoint, requestOptions)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Handle potential conflicts
      if (result.conflict) {
        return this.handleConflict(action, result)
      }

      return { success: true, result }
    } catch (error) {
      console.error('❌ Sync action failed:', error)
      return { success: false, error }
    }
  }

  /**
   * Handle sync failure
   */
  static async handleSyncFailure(action, error) {
    action.retries++
    action.status = 'failed'
    action.lastError = error.message

    if (action.retries >= action.maxRetries) {
      console.error(`❌ Action failed permanently after ${action.retries} retries:`, action)
      // Keep in queue but mark as permanently failed
      action.status = 'permanently_failed'
    } else {
      console.log(`🔄 Will retry action (${action.retries}/${action.maxRetries}):`, action)
      action.status = 'pending'
      
      // Update retry count in IndexedDB
      await IndexedDBService.updateSyncActionRetries(action.id, action.retries)
    }

    this.emit(this.EVENTS.SYNC_ERROR, { action, error })
  }

  /**
   * Handle data conflicts
   */
  static async handleConflict(action, serverResponse) {
    console.log('⚠️ Conflict detected:', action)
    
    const conflict = {
      action,
      clientData: action.data,
      serverData: serverResponse.serverData,
      timestamp: Date.now()
    }

    this.emit(this.EVENTS.CONFLICT_DETECTED, conflict)

    // Apply default conflict resolution strategy
    const strategy = this.getConflictStrategy(action.table)
    return this.resolveConflict(conflict, strategy)
  }

  /**
   * Resolve data conflict based on strategy
   */
  static async resolveConflict(conflict, strategy) {
    const { action, clientData, serverData } = conflict

    switch (strategy) {
      case this.SYNC_STRATEGIES.LAST_WRITE_WINS:
        // Compare timestamps
        const clientTime = new Date(clientData.updated_at || clientData.created_at)
        const serverTime = new Date(serverData.updated_at || serverData.created_at)
        
        if (clientTime > serverTime) {
          // Client wins - retry sync
          return { success: false, retry: true }
        } else {
          // Server wins - update local data
          await this.updateLocalData(action.table, serverData)
          return { success: true, resolution: 'server_wins' }
        }

      case this.SYNC_STRATEGIES.SERVER_WINS:
        await this.updateLocalData(action.table, serverData)
        return { success: true, resolution: 'server_wins' }

      case this.SYNC_STRATEGIES.CLIENT_WINS:
        return { success: false, retry: true }

      case this.SYNC_STRATEGIES.MERGE:
        const mergedData = this.mergeData(clientData, serverData)
        action.data = mergedData
        return { success: false, retry: true }

      case this.SYNC_STRATEGIES.USER_CHOICE:
        // This would typically show a UI for user to choose
        // For now, default to server wins
        await this.updateLocalData(action.table, serverData)
        return { success: true, resolution: 'server_wins' }

      default:
        return { success: false, error: 'Unknown conflict strategy' }
    }
  }

  /**
   * Helper methods
   */

  static sortQueueByPriority() {
    const priorityOrder = { high: 3, normal: 2, low: 1 }
    
    return [...this.syncQueue].sort((a, b) => {
      // First by priority
      const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2)
      if (priorityDiff !== 0) return priorityDiff
      
      // Then by timestamp (older first)
      return a.timestamp - b.timestamp
    })
  }

  static async removeFromQueue(actionId) {
    // Remove from memory queue
    this.syncQueue = this.syncQueue.filter(action => action.id !== actionId)
    
    // Remove from IndexedDB
    await IndexedDBService.removeSyncAction(actionId)
    
    this.emit(this.EVENTS.QUEUE_UPDATED, { queue: this.syncQueue })
  }

  static getAPIEndpoint(table, action, recordId) {
    const baseURL = '/api' // This would be configurable
    
    switch (action) {
      case 'create':
        return `${baseURL}/${table}`
      case 'update':
        return `${baseURL}/${table}/${recordId}`
      case 'delete':
        return `${baseURL}/${table}/${recordId}`
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }

  static getHTTPMethod(action) {
    switch (action) {
      case 'create': return 'POST'
      case 'update': return 'PUT'
      case 'delete': return 'DELETE'
      default: throw new Error(`Unknown action: ${action}`)
    }
  }

  static getConflictStrategy(table) {
    // This could be configurable per table
    return this.SYNC_STRATEGIES.LAST_WRITE_WINS
  }

  static async updateLocalData(table, data) {
    await IndexedDBService.put(table, data)
  }

  static mergeData(clientData, serverData) {
    // Simple merge strategy - server data takes precedence for conflicts
    return { ...clientData, ...serverData, updated_at: new Date().toISOString() }
  }

  static handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'SYNC_COMPLETE':
        this.emit(this.EVENTS.SYNC_COMPLETE, data)
        break
      case 'SW_UPDATED':
        console.log('🔄 Service Worker updated to version:', data.version)
        break
    }
  }

  /**
   * Event system
   */
  static addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  static removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  static emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Event listener error:', error)
        }
      })
    }
  }

  /**
   * Public API methods
   */

  // Force sync all
  static async forceSyncAll() {
    return this.syncAll()
  }

  // Get sync queue status
  static getSyncStatus() {
    return {
      queueLength: this.syncQueue.length,
      syncInProgress: this.syncInProgress,
      isOnline: NetworkDetector.isOnline(),
      pendingActions: this.syncQueue.filter(a => a.status === 'pending').length,
      failedActions: this.syncQueue.filter(a => a.status === 'failed').length
    }
  }

  // Clear failed actions
  static async clearFailedActions() {
    const failedActions = this.syncQueue.filter(a => a.status === 'permanently_failed')
    
    for (const action of failedActions) {
      await this.removeFromQueue(action.id)
    }
    
    console.log(`🗑️ Cleared ${failedActions.length} failed actions`)
  }

  // Retry failed actions
  static async retryFailedActions() {
    const failedActions = this.syncQueue.filter(a => a.status === 'failed')
    
    failedActions.forEach(action => {
      action.status = 'pending'
      action.retries = 0
    })
    
    console.log(`🔄 Retrying ${failedActions.length} failed actions`)
    
    if (NetworkDetector.isOnline()) {
      this.syncAll()
    }
  }
}

export default SyncManager

