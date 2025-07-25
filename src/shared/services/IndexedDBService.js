/**
 * IndexedDB Service - Advanced local storage with offline support
 * Replaces localStorage with a more robust solution for PWA
 */

export class IndexedDBService {
  static dbName = 'SamaFactureDB'
  static dbVersion = 1
  static db = null
  static isInitialized = false

  // Database schema definition
  static schema = {
    clients: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'name', keyPath: 'name', unique: false },
        { name: 'email', keyPath: 'email', unique: false },
        { name: 'created_at', keyPath: 'created_at', unique: false }
      ]
    },
    products: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'name', keyPath: 'name', unique: false },
        { name: 'category', keyPath: 'category', unique: false },
        { name: 'price', keyPath: 'price', unique: false }
      ]
    },
    invoices: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'number', keyPath: 'number', unique: true },
        { name: 'client_id', keyPath: 'client_id', unique: false },
        { name: 'date', keyPath: 'date', unique: false },
        { name: 'status', keyPath: 'status', unique: false },
        { name: 'total', keyPath: 'total', unique: false }
      ]
    },
    quotes: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'number', keyPath: 'number', unique: true },
        { name: 'client_id', keyPath: 'client_id', unique: false },
        { name: 'date', keyPath: 'date', unique: false },
        { name: 'status', keyPath: 'status', unique: false }
      ]
    },
    expenses: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'date', keyPath: 'date', unique: false },
        { name: 'category', keyPath: 'category', unique: false },
        { name: 'amount', keyPath: 'amount', unique: false },
        { name: 'supplier', keyPath: 'supplier', unique: false }
      ]
    },
    settings: {
      keyPath: 'key',
      autoIncrement: false,
      indexes: []
    },
    sync_queue: {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp', unique: false },
        { name: 'action', keyPath: 'action', unique: false },
        { name: 'table', keyPath: 'table', unique: false }
      ]
    }
  }

  /**
   * Initialize IndexedDB connection
   */
  static async init() {
    if (this.isInitialized && this.db) {
      return this.db
    }

    try {
      this.db = await this.openDatabase()
      await this.createDefaultData()
      this.isInitialized = true
      console.log('✅ IndexedDB initialized successfully')
      return this.db
    } catch (error) {
      console.error('❌ Failed to initialize IndexedDB:', error)
      throw error
    }
  }

  /**
   * Open IndexedDB connection with schema creation
   */
  static openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('IndexedDB error:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        console.log('IndexedDB opened successfully')
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        console.log('IndexedDB upgrade needed, creating schema...')

        // Create object stores based on schema
        Object.entries(this.schema).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            console.log(`Creating object store: ${storeName}`)
            
            const store = db.createObjectStore(storeName, {
              keyPath: config.keyPath,
              autoIncrement: config.autoIncrement
            })

            // Create indexes
            config.indexes.forEach(index => {
              store.createIndex(index.name, index.keyPath, { unique: index.unique })
            })
          }
        })
      }
    })
  }

  /**
   * Create default data if not exists
   */
  static async createDefaultData() {
    const defaultSettings = {
      company_name: 'Mon Entreprise',
      company_email: '',
      company_phone: '',
      company_address: '',
      currency: 'XOF',
      tax_rate: '18',
      invoice_prefix: 'INV',
      quote_prefix: 'DEV',
      next_invoice_number: '1',
      next_quote_number: '1'
    }

    // Check if settings exist
    const existingSettings = await this.get('settings', 'company_name')
    if (!existingSettings) {
      // Create default settings
      for (const [key, value] of Object.entries(defaultSettings)) {
        await this.put('settings', { key, value })
      }
      console.log('✅ Default settings created')
    }
  }

  /**
   * Generic CRUD Operations
   */

  // Create/Update record
  static async put(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Read single record
  static async get(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Read all records
  static async getAll(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Delete record
  static async delete(storeName, key) {
    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Count records
  static async count(storeName) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Clear all records in store
  static async clear(storeName) {
    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Advanced Query Operations
   */

  // Query by index
  static async getByIndex(storeName, indexName, value) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    
    return new Promise((resolve, reject) => {
      const request = index.get(value)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Get all records by index value
  static async getAllByIndex(storeName, indexName, value) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(value)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Range query
  static async getRange(storeName, indexName, lowerBound, upperBound) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const range = IDBKeyRange.bound(lowerBound, upperBound)
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(range)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Cursor-based iteration for large datasets
  static async iterate(storeName, callback, indexName = null) {
    const transaction = this.db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const source = indexName ? store.index(indexName) : store
    
    return new Promise((resolve, reject) => {
      const request = source.openCursor()
      const results = []
      
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          const shouldContinue = callback(cursor.value, cursor.key)
          results.push(cursor.value)
          
          if (shouldContinue !== false) {
            cursor.continue()
          } else {
            resolve(results)
          }
        } else {
          resolve(results)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Batch Operations
   */

  // Batch insert/update
  static async batchPut(storeName, records) {
    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    const promises = records.map(record => {
      return new Promise((resolve, reject) => {
        const request = store.put(record)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    })
    
    return Promise.all(promises)
  }

  // Batch delete
  static async batchDelete(storeName, keys) {
    const transaction = this.db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    const promises = keys.map(key => {
      return new Promise((resolve, reject) => {
        const request = store.delete(key)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    })
    
    return Promise.all(promises)
  }

  /**
   * Sync Queue Management
   */

  // Add action to sync queue
  static async addToSyncQueue(action, table, data, recordId = null) {
    const queueItem = {
      action, // 'create', 'update', 'delete'
      table,
      data,
      recordId,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    }
    
    return this.put('sync_queue', queueItem)
  }

  // Get pending sync actions
  static async getPendingSyncActions() {
    return this.getAll('sync_queue')
  }

  // Remove sync action after successful sync
  static async removeSyncAction(id) {
    return this.delete('sync_queue', id)
  }

  // Update sync action retry count
  static async updateSyncActionRetries(id, retries) {
    const action = await this.get('sync_queue', id)
    if (action) {
      action.retries = retries
      return this.put('sync_queue', action)
    }
  }

  /**
   * Database Maintenance
   */

  // Get database size estimation
  static async getDatabaseSize() {
    const sizes = {}
    let totalSize = 0
    
    for (const storeName of Object.keys(this.schema)) {
      const count = await this.count(storeName)
      sizes[storeName] = count
      totalSize += count
    }
    
    return { sizes, totalSize }
  }

  // Export all data
  static async exportData() {
    const data = {}
    
    for (const storeName of Object.keys(this.schema)) {
      data[storeName] = await this.getAll(storeName)
    }
    
    return data
  }

  // Import data (with merge strategy)
  static async importData(data, mergeStrategy = 'replace') {
    const results = {}
    
    for (const [storeName, records] of Object.entries(data)) {
      if (this.schema[storeName] && Array.isArray(records)) {
        if (mergeStrategy === 'replace') {
          await this.clear(storeName)
        }
        
        results[storeName] = await this.batchPut(storeName, records)
      }
    }
    
    return results
  }

  // Close database connection
  static close() {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
      console.log('IndexedDB connection closed')
    }
  }
}

// Export singleton instance
export default IndexedDBService

