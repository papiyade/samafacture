/**
 * Database Service - Enhanced with IndexedDB and offline sync support
 * Provides seamless migration from localStorage to IndexedDB
 */

import { IndexedDBService } from './IndexedDBService.js'
import { DataMigrationService } from './DataMigrationService.js'
import { SyncManager } from './SyncManager.js'

export class DatabaseService {
  static isInitialized = false
  static storagePrefix = 'samafacture_'
  static useIndexedDB = true
  static offlineMode = false

  /**
   * Initialize the database service
   */
  static async init() {
    try {
      console.log('🔄 Initializing Database Service...')
      
      // Try to initialize IndexedDB first
      try {
        await IndexedDBService.init()
        this.useIndexedDB = true
        console.log('✅ Using IndexedDB for storage')
        
        // Perform migration if needed
        const migrationResult = await DataMigrationService.checkAndMigrate()
        if (migrationResult.migrated) {
          console.log('✅ Data migration completed successfully')
        }
        
      } catch (error) {
        console.warn('⚠️ IndexedDB failed, falling back to localStorage:', error)
        this.useIndexedDB = false
        await this.createDefaultData()
      }

      // Initialize sync manager if IndexedDB is available
      if (this.useIndexedDB) {
        try {
          await SyncManager.init()
          console.log('✅ Sync Manager initialized')
        } catch (error) {
          console.warn('⚠️ Sync Manager initialization failed:', error)
        }
      }

      this.isInitialized = true
      console.log('✅ Database Service initialized')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize Database Service:', error)
      throw error
    }
  }

  /**
   * Create default data for localStorage fallback
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

    const existingSettings = this.getItem('settings')
    if (!existingSettings) {
      this.setItem('settings', defaultSettings)
    }

    // Initialize empty arrays for data if they don't exist
    const dataTypes = ['clients', 'products', 'invoices', 'quotes', 'expenses']
    dataTypes.forEach(type => {
      if (!this.getItem(type)) {
        this.setItem(type, [])
      }
    })
  }

  /**
   * Generic storage methods with IndexedDB/localStorage abstraction
   */

  static async getItem(key) {
    try {
      if (this.useIndexedDB) {
        if (key === 'settings') {
          // Settings are stored as key-value pairs in IndexedDB
          const settings = {}
          const allSettings = await IndexedDBService.getAll('settings')
          allSettings.forEach(setting => {
            settings[setting.key] = setting.value
          })
          return Object.keys(settings).length > 0 ? settings : null
        } else {
          return await IndexedDBService.getAll(key)
        }
      } else {
        // localStorage fallback
        const item = localStorage.getItem(this.storagePrefix + key)
        return item ? JSON.parse(item) : null
      }
    } catch (error) {
      console.error('Error getting item from storage:', error)
      return null
    }
  }

  static async setItem(key, value) {
    try {
      if (this.useIndexedDB) {
        if (key === 'settings') {
          // Settings are stored as key-value pairs in IndexedDB
          for (const [settingKey, settingValue] of Object.entries(value)) {
            await IndexedDBService.put('settings', { key: settingKey, value: settingValue })
          }
        } else {
          // For arrays, clear and batch insert
          await IndexedDBService.clear(key)
          if (Array.isArray(value) && value.length > 0) {
            await IndexedDBService.batchPut(key, value)
          }
        }
      } else {
        // localStorage fallback
        localStorage.setItem(this.storagePrefix + key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error('Error setting item in storage:', error)
      return false
    }
  }

  static async removeItem(key) {
    try {
      if (this.useIndexedDB) {
        await IndexedDBService.clear(key)
      } else {
        localStorage.removeItem(this.storagePrefix + key)
      }
      return true
    } catch (error) {
      console.error('Error removing item from storage:', error)
      return false
    }
  }

  /**
   * Settings methods
   */
  static async getSetting(key) {
    try {
      if (this.useIndexedDB) {
        const setting = await IndexedDBService.get('settings', key)
        return setting ? setting.value : null
      } else {
        const settings = await this.getItem('settings') || {}
        return settings[key]
      }
    } catch (error) {
      console.error('Error getting setting:', error)
      return null
    }
  }

  static async setSetting(key, value) {
    try {
      if (this.useIndexedDB) {
        await IndexedDBService.put('settings', { key, value })
        
        // Add to sync queue if not in offline mode
        if (!this.offlineMode && SyncManager.isInitialized) {
          await SyncManager.addToQueue('update', 'settings', { key, value }, key)
        }
      } else {
        const settings = await this.getItem('settings') || {}
        settings[key] = value
        await this.setItem('settings', settings)
      }
      return true
    } catch (error) {
      console.error('Error setting setting:', error)
      return false
    }
  }

  /**
   * Client methods
   */
  static async getClients() {
    return await this.getItem('clients') || []
  }

  static async getClient(id) {
    try {
      if (this.useIndexedDB) {
        return await IndexedDBService.get('clients', parseInt(id))
      } else {
        const clients = await this.getClients()
        return clients.find(client => client.id == id)
      }
    } catch (error) {
      console.error('Error getting client:', error)
      return null
    }
  }

  static async addClient(clientData) {
    try {
      const client = {
        ...clientData,
        id: this.useIndexedDB ? undefined : Date.now(), // IndexedDB auto-generates IDs
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (this.useIndexedDB) {
        const id = await IndexedDBService.put('clients', client)
        client.id = id
        
        // Add to sync queue
        if (!this.offlineMode && SyncManager.isInitialized) {
          await SyncManager.addToQueue('create', 'clients', client)
        }
      } else {
        const clients = await this.getClients()
        clients.push(client)
        await this.setItem('clients', clients)
      }

      console.log('✅ Client added:', client)
      return client
    } catch (error) {
      console.error('Error adding client:', error)
      throw error
    }
  }

  static async updateClient(id, clientData) {
    try {
      const updatedClient = {
        ...clientData,
        id: parseInt(id),
        updated_at: new Date().toISOString()
      }

      if (this.useIndexedDB) {
        await IndexedDBService.put('clients', updatedClient)
        
        // Add to sync queue
        if (!this.offlineMode && SyncManager.isInitialized) {
          await SyncManager.addToQueue('update', 'clients', updatedClient, id)
        }
      } else {
        const clients = await this.getClients()
        const index = clients.findIndex(client => client.id == id)
        if (index !== -1) {
          clients[index] = updatedClient
          await this.setItem('clients', clients)
        }
      }

      console.log('✅ Client updated:', updatedClient)
      return updatedClient
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  }

  static async deleteClient(id) {
    try {
      if (this.useIndexedDB) {
        await IndexedDBService.delete('clients', parseInt(id))
        
        // Add to sync queue
        if (!this.offlineMode && SyncManager.isInitialized) {
          await SyncManager.addToQueue('delete', 'clients', null, id)
        }
      } else {
        const clients = await this.getClients()
        const filteredClients = clients.filter(client => client.id != id)
        await this.setItem('clients', filteredClients)
      }

      console.log('✅ Client deleted:', id)
      return true
    } catch (error) {
      console.error('Error deleting client:', error)
      throw error
    }
  }

  /**
   * Product methods
   */
  static async getProducts() {
    return await this.getItem('products') || []
  }

  static async getProduct(id) {
    try {
      if (this.useIndexedDB) {
        return await IndexedDBService.get('products', parseInt(id))
      } else {
        const products = await this.getProducts()
        return products.find(product => product.id == id)
      }
    } catch (error) {
      console.error('Error getting product:', error)
      return null
    }
  }

  static async addProduct(productData) {
    try {
      const product = {
        ...productData,
        id: this.useIndexedDB ? undefined : Date.now(),
        price: parseFloat(productData.price) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (this.useIndexedDB) {
        const id = await IndexedDBService.put('products', product)
        product.id = id
        
        if (!this.offlineMode && SyncManager.isInitialized) {
          await SyncManager.addToQueue('create', 'products', product)
        }
      } else {
        const products = await this.getProducts()
        products.push(product)
        await this.setItem('products', products)
      }

      console.log('✅ Product added:', product)
      return product
    } catch (error) {
      console.error('Error adding product:', error)
      throw error
    }
  }

  static async updateProduct(id, productData) {
    try {
      const updatedProduct = {
        ...productData,
        id: parseInt(id),
        price: parseFloat(productData.price) || 0,
        updated_at: new Date().toISOString()
      }

      if (this.useIndexedDB) {
        await IndexedDBService.put('products', updatedProduct)
        
        if (!this.offlineMode && SyncManager.isInitialized) {
          await SyncManager.addToQueue('update', 'products', updatedProduct, id)
        }
      } else {
        const products = await this.getProducts()
        const index = products.findIndex(product => product.id == id)
        if (index !== -1) {
          products[index] = updatedProduct
          await this.setItem('products', products)
        }
      }

      console.log('✅ Product updated:', updatedProduct)
      return updatedProduct
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  static async deleteProduct(id) {
    try {
      if (this.useIndexedDB) {
        await IndexedDBService.delete('products', parseInt(id))
        
        if (!this.offlineMode && SyncManager.isInitialized) {
          await SyncManager.addToQueue('delete', 'products', null, id)
        }
      } else {
        const products = await this.getProducts()
        const filteredProducts = products.filter(product => product.id != id)
        await this.setItem('products', filteredProducts)
      }

      console.log('✅ Product deleted:', id)
      return true
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  /**
   * Expense methods
   */
  static async getExpenses() {
    return await this.getItem('expenses') || []
  }

  static async getExpense(id) {
    try {
      if (this.useIndexedDB) {
        return await IndexedDBService.get('expenses', parseInt(id))
      } else {
        const expenses = await this.getExpenses()
        return expenses.find(expense => expense.id == id)
      }
    } catch (error) {
      console.error('Error getting expense:', error)
      return null
    }
  }

  static async addExpense(expenseData) {
    try {
      const expense = {
        ...expenseData,
        id: this.useIndexedDB ? undefined : Date.now(),
        amount: parseFloat(expenseData.amount) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (this.useIndexedDB) {
        const id = await IndexedDBService.put('expenses', expense)
        expense.id = id
        
        if (!this.offlineMode && SyncManager.isInitialized) {
          await SyncManager.addToQueue('create', 'expenses', expense)
        }
      } else {
        const expenses = await this.getExpenses()
        expenses.push(expense)
        await this.setItem('expenses', expenses)
      }

      console.log('✅ Expense added:', expense)
      return expense
    } catch (error) {
      console.error('Error adding expense:', error)
      throw error
    }
  }

  static async updateExpense(id, expenseData) {
    try {
      const updatedExpense = {
        ...expenseData,
        id: parseInt(id),
        amount: parseFloat(expenseData.amount) || 0,
        updated_at: new Date().toISOString()
      }

      if (this.useIndexedDB) {
        await IndexedDBService.put('expenses', updatedExpense)
        
        if (!this.offlineMode && SyncManager.isInitialized) {
          await SyncManager.addToQueue('update', 'expenses', updatedExpense, id)
        }
      } else {
        const expenses = await this.getExpenses()
        const index = expenses.findIndex(expense => expense.id == id)
        if (index !== -1) {
          expenses[index] = updatedExpense
          await this.setItem('expenses', expenses)
        }
      }

      console.log('✅ Expense updated:', updatedExpense)
      return updatedExpense
    } catch (error) {
      console.error('Error updating expense:', error)
      throw error
    }
  }

  static async deleteExpense(id) {
    try {
      if (this.useIndexedDB) {
        await IndexedDBService.delete('expenses', parseInt(id))
        
        if (!this.offlineMode && SyncManager.isInitialized) {
          await SyncManager.addToQueue('delete', 'expenses', null, id)
        }
      } else {
        const expenses = await this.getExpenses()
        const filteredExpenses = expenses.filter(expense => expense.id != id)
        await this.setItem('expenses', filteredExpenses)
      }

      console.log('✅ Expense deleted:', id)
      return true
    } catch (error) {
      console.error('Error deleting expense:', error)
      throw error
    }
  }

  /**
   * Expense categories
   */
  static getExpenseCategories() {
    return [
      'Bureau et fournitures',
      'Marketing et publicité',
      'Transport et déplacement',
      'Repas et restauration',
      'Télécommunications',
      'Services professionnels',
      'Formation et développement',
      'Équipement et matériel',
      'Maintenance et réparation',
      'Assurance',
      'Taxes et frais',
      'Autres'
    ]
  }

  /**
   * Invoice methods (simplified for now)
   */
  static async getInvoices() {
    return await this.getItem('invoices') || []
  }

  static async getInvoice(id) {
    try {
      if (this.useIndexedDB) {
        return await IndexedDBService.get('invoices', parseInt(id))
      } else {
        const invoices = await this.getInvoices()
        return invoices.find(invoice => invoice.id == id)
      }
    } catch (error) {
      console.error('Error getting invoice:', error)
      return null
    }
  }

  /**
   * Quote methods (simplified for now)
   */
  static async getQuotes() {
    return await this.getItem('quotes') || []
  }

  static async getQuote(id) {
    try {
      if (this.useIndexedDB) {
        return await IndexedDBService.get('quotes', parseInt(id))
      } else {
        const quotes = await this.getQuotes()
        return quotes.find(quote => quote.id == id)
      }
    } catch (error) {
      console.error('Error getting quote:', error)
      return null
    }
  }

  /**
   * Utility methods
   */

  // Check if using IndexedDB
  static isUsingIndexedDB() {
    return this.useIndexedDB
  }

  // Get storage statistics
  static async getStorageStats() {
    try {
      if (this.useIndexedDB) {
        return await IndexedDBService.getDatabaseSize()
      } else {
        // Estimate localStorage usage
        let totalSize = 0
        for (let key in localStorage) {
          if (key.startsWith(this.storagePrefix)) {
            totalSize += localStorage[key].length
          }
        }
        return { totalSize, type: 'localStorage' }
      }
    } catch (error) {
      console.error('Error getting storage stats:', error)
      return null
    }
  }

  // Export all data
  static async exportData() {
    try {
      if (this.useIndexedDB) {
        return await IndexedDBService.exportData()
      } else {
        const data = {}
        const keys = ['clients', 'products', 'invoices', 'quotes', 'expenses', 'settings']
        
        for (const key of keys) {
          data[key] = await this.getItem(key)
        }
        
        return data
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      throw error
    }
  }

  // Import data
  static async importData(data, mergeStrategy = 'replace') {
    try {
      if (this.useIndexedDB) {
        return await IndexedDBService.importData(data, mergeStrategy)
      } else {
        const results = {}
        
        for (const [key, value] of Object.entries(data)) {
          if (mergeStrategy === 'replace' || !await this.getItem(key)) {
            await this.setItem(key, value)
            results[key] = { success: true }
          }
        }
        
        return results
      }
    } catch (error) {
      console.error('Error importing data:', error)
      throw error
    }
  }

  // Enable/disable offline mode
  static setOfflineMode(enabled) {
    this.offlineMode = enabled
    console.log(`${enabled ? '📴' : '🌐'} Offline mode ${enabled ? 'enabled' : 'disabled'}`)
  }

  // Get sync status
  static getSyncStatus() {
    if (this.useIndexedDB && SyncManager.isInitialized) {
      return SyncManager.getSyncStatus()
    }
    return { available: false, reason: 'IndexedDB or SyncManager not available' }
  }
}

export default DatabaseService

