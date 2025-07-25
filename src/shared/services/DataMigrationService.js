/**
 * Data Migration Service - Migrates data from localStorage to IndexedDB
 * Handles version upgrades and data transformations
 */

import { IndexedDBService } from './IndexedDBService.js'

export class DataMigrationService {
  static storagePrefix = 'samafacture_'
  static migrationVersion = '1.0.0'
  static migrationKey = 'migration_status'

  /**
   * Check if migration is needed and perform it
   */
  static async checkAndMigrate() {
    try {
      console.log('🔄 Checking migration status...')
      
      // Check if migration has already been completed
      const migrationStatus = localStorage.getItem(this.migrationKey)
      if (migrationStatus === this.migrationVersion) {
        console.log('✅ Migration already completed')
        return { success: true, migrated: false }
      }

      // Check if there's data in localStorage to migrate
      const hasLocalStorageData = this.hasLocalStorageData()
      if (!hasLocalStorageData) {
        console.log('ℹ️ No localStorage data found, marking migration as complete')
        localStorage.setItem(this.migrationKey, this.migrationVersion)
        return { success: true, migrated: false }
      }

      console.log('🚀 Starting data migration from localStorage to IndexedDB...')
      const result = await this.performMigration()
      
      if (result.success) {
        localStorage.setItem(this.migrationKey, this.migrationVersion)
        console.log('✅ Migration completed successfully')
      }
      
      return result
    } catch (error) {
      console.error('❌ Migration failed:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Check if localStorage contains SamaFacture data
   */
  static hasLocalStorageData() {
    const keys = Object.keys(localStorage)
    return keys.some(key => 
      key.startsWith(this.storagePrefix) || 
      ['clients', 'products', 'invoices', 'quotes', 'expenses', 'settings'].includes(key)
    )
  }

  /**
   * Perform the actual migration
   */
  static async performMigration() {
    const migrationResults = {
      success: true,
      migrated: true,
      tables: {},
      errors: []
    }

    try {
      // Ensure IndexedDB is initialized
      await IndexedDBService.init()

      // Migrate each data type
      const migrations = [
        { key: 'settings', table: 'settings', transformer: this.transformSettings },
        { key: 'clients', table: 'clients', transformer: this.transformClients },
        { key: 'products', table: 'products', transformer: this.transformProducts },
        { key: 'invoices', table: 'invoices', transformer: this.transformInvoices },
        { key: 'quotes', table: 'quotes', transformer: this.transformQuotes },
        { key: 'expenses', table: 'expenses', transformer: this.transformExpenses }
      ]

      for (const migration of migrations) {
        try {
          const result = await this.migrateTable(migration)
          migrationResults.tables[migration.table] = result
          console.log(`✅ Migrated ${migration.table}: ${result.count} records`)
        } catch (error) {
          console.error(`❌ Failed to migrate ${migration.table}:`, error)
          migrationResults.errors.push({
            table: migration.table,
            error: error.message
          })
        }
      }

      // Create backup of localStorage data before cleanup
      await this.createBackup()

      // Clean up localStorage data (optional - keep for safety)
      // this.cleanupLocalStorage()

      return migrationResults
    } catch (error) {
      migrationResults.success = false
      migrationResults.error = error.message
      return migrationResults
    }
  }

  /**
   * Migrate a single table
   */
  static async migrateTable({ key, table, transformer }) {
    // Get data from localStorage
    const rawData = this.getLocalStorageItem(key)
    if (!rawData) {
      return { count: 0, skipped: true }
    }

    // Transform data if transformer provided
    const transformedData = transformer ? transformer(rawData) : rawData
    
    // Ensure data is an array
    const dataArray = Array.isArray(transformedData) ? transformedData : [transformedData]
    
    if (dataArray.length === 0) {
      return { count: 0, skipped: true }
    }

    // Batch insert into IndexedDB
    if (table === 'settings') {
      // Settings are handled differently (key-value pairs)
      let count = 0
      for (const [settingKey, value] of Object.entries(transformedData)) {
        await IndexedDBService.put('settings', { key: settingKey, value })
        count++
      }
      return { count, migrated: true }
    } else {
      // Regular tables
      await IndexedDBService.batchPut(table, dataArray)
      return { count: dataArray.length, migrated: true }
    }
  }

  /**
   * Data Transformers - Convert localStorage format to IndexedDB format
   */

  static transformSettings(data) {
    // Settings are already in the correct format
    return data || {}
  }

  static transformClients(data) {
    if (!Array.isArray(data)) return []
    
    return data.map(client => ({
      ...client,
      id: client.id || Date.now() + Math.random(),
      created_at: client.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }

  static transformProducts(data) {
    if (!Array.isArray(data)) return []
    
    return data.map(product => ({
      ...product,
      id: product.id || Date.now() + Math.random(),
      price: parseFloat(product.price) || 0,
      created_at: product.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }

  static transformInvoices(data) {
    if (!Array.isArray(data)) return []
    
    return data.map(invoice => ({
      ...invoice,
      id: invoice.id || Date.now() + Math.random(),
      subtotal: parseFloat(invoice.subtotal) || 0,
      tax_amount: parseFloat(invoice.tax_amount) || 0,
      total: parseFloat(invoice.total) || 0,
      tax_rate: parseFloat(invoice.tax_rate) || 0,
      created_at: invoice.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }

  static transformQuotes(data) {
    if (!Array.isArray(data)) return []
    
    return data.map(quote => ({
      ...quote,
      id: quote.id || Date.now() + Math.random(),
      subtotal: parseFloat(quote.subtotal) || 0,
      tax_amount: parseFloat(quote.tax_amount) || 0,
      total: parseFloat(quote.total) || 0,
      tax_rate: parseFloat(quote.tax_rate) || 0,
      created_at: quote.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }

  static transformExpenses(data) {
    if (!Array.isArray(data)) return []
    
    return data.map(expense => ({
      ...expense,
      id: expense.id || Date.now() + Math.random(),
      amount: parseFloat(expense.amount) || 0,
      created_at: expense.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  }

  /**
   * Helper methods
   */

  static getLocalStorageItem(key) {
    try {
      // Try with prefix first
      let item = localStorage.getItem(this.storagePrefix + key)
      if (!item) {
        // Try without prefix
        item = localStorage.getItem(key)
      }
      
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error parsing localStorage item ${key}:`, error)
      return null
    }
  }

  /**
   * Create backup of localStorage data
   */
  static async createBackup() {
    try {
      const backup = {}
      const keys = Object.keys(localStorage)
      
      keys.forEach(key => {
        if (key.startsWith(this.storagePrefix) || 
            ['clients', 'products', 'invoices', 'quotes', 'expenses', 'settings'].includes(key)) {
          backup[key] = localStorage.getItem(key)
        }
      })

      // Store backup in IndexedDB
      await IndexedDBService.put('settings', {
        key: 'localStorage_backup',
        value: JSON.stringify(backup)
      })

      console.log('✅ localStorage backup created')
    } catch (error) {
      console.error('❌ Failed to create backup:', error)
    }
  }

  /**
   * Clean up localStorage data after successful migration
   */
  static cleanupLocalStorage() {
    try {
      const keys = Object.keys(localStorage)
      const keysToRemove = keys.filter(key => 
        key.startsWith(this.storagePrefix) || 
        ['clients', 'products', 'invoices', 'quotes', 'expenses', 'settings'].includes(key)
      )

      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })

      console.log(`✅ Cleaned up ${keysToRemove.length} localStorage items`)
    } catch (error) {
      console.error('❌ Failed to cleanup localStorage:', error)
    }
  }

  /**
   * Restore from backup (emergency function)
   */
  static async restoreFromBackup() {
    try {
      const backupData = await IndexedDBService.get('settings', 'localStorage_backup')
      if (!backupData || !backupData.value) {
        throw new Error('No backup found')
      }

      const backup = JSON.parse(backupData.value)
      
      Object.entries(backup).forEach(([key, value]) => {
        localStorage.setItem(key, value)
      })

      console.log('✅ Restored from backup')
      return { success: true }
    } catch (error) {
      console.error('❌ Failed to restore from backup:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get migration statistics
   */
  static async getMigrationStats() {
    try {
      const stats = {
        migrationVersion: this.migrationVersion,
        migrationCompleted: localStorage.getItem(this.migrationKey) === this.migrationVersion,
        hasLocalStorageData: this.hasLocalStorageData(),
        indexedDBSize: await IndexedDBService.getDatabaseSize()
      }

      return stats
    } catch (error) {
      console.error('❌ Failed to get migration stats:', error)
      return null
    }
  }
}

export default DataMigrationService

