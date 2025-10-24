import { Logger } from '../utils/Logger.js'

/**
 * Admin Database Service - Manages SQLite database for admin operations
 * Uses sql.js for web compatibility
 */
export class AdminDatabaseService {
  static db = null
  static isInitialized = false

  static async init() {
    try {
      Logger.info('Initializing admin database')
      
      // Import sql.js
      const initSqlJs = (await import('sql.js')).default
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      })
      Logger.debug('sql.js loaded successfully')

      // Create or load database
      const savedDb = localStorage.getItem('samafacture_admin_db')
      if (savedDb) {
        Logger.debug('Loading existing database from localStorage')
        // Load existing database
        const uInt8Array = new Uint8Array(JSON.parse(savedDb))
        this.db = new SQL.Database(uInt8Array)
        // Always ensure tables exist (in case schema changed)
        await this.createTables()
      } else {
        Logger.debug('Creating new database')
        // Create new database
        this.db = new SQL.Database()
        await this.createTables()
      }

      this.isInitialized = true
      Logger.success('Admin Database initialized successfully')
      return true
    } catch (error) {
      Logger.error('Failed to initialize admin database', { error: error.message, stack: error.stack })
      throw error
    }
  }

  static async createTables() {
    const createCompaniesTable = `
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        city TEXT,
        postal_code TEXT,
        country TEXT DEFAULT 'Sénégal',
        
        -- Identifiants de connexion
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        
        -- Informations business
        business_type TEXT,
        tax_number TEXT,
        logo_url TEXT,
        
        -- Configuration
        currency TEXT DEFAULT 'XOF',
        tax_rate REAL DEFAULT 18.0,
        invoice_prefix TEXT DEFAULT 'INV',
        quote_prefix TEXT DEFAULT 'DEV',
        
        -- Statut et dates
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `

    const createLicensesTable = `
      CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        license_key TEXT UNIQUE NOT NULL,
        license_type TEXT NOT NULL DEFAULT 'TRIAL',
        
        -- Contrôle d'accès
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        last_check DATETIME,
        
        -- Limites
        max_invoices INTEGER DEFAULT 100,
        used_invoices INTEGER DEFAULT 0,
        max_clients INTEGER DEFAULT 50,
        used_clients INTEGER DEFAULT 0,
        
        -- Sécurité
        encrypted_data TEXT,
        signature TEXT,
        
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `

    const createAuditTable = `
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER,
        action TEXT NOT NULL,
        old_values TEXT,
        new_values TEXT,
        user_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    try {
      Logger.debug('Creating database tables')
      this.db.run(createCompaniesTable)
      this.db.run(createLicensesTable)
      this.db.run(createAuditTable)
      
      Logger.success('Database tables created successfully')
      this.saveDatabase()
    } catch (error) {
      Logger.error('Error creating tables', { error: error.message, stack: error.stack })
      throw error
    }
  }

  static saveDatabase() {
    if (!this.db) return
    
    try {
      const data = this.db.export()
      const buffer = Array.from(data)
      localStorage.setItem('samafacture_admin_db', JSON.stringify(buffer))
    } catch (error) {
      console.error('❌ Error saving database:', error)
    }
  }

  static query(sql, params = []) {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized')
    }

    try {
      const stmt = this.db.prepare(sql)
      const result = stmt.getAsObject(params)
      stmt.free()
      return result
    } catch (error) {
      console.error('❌ Database query error:', error)
      throw error
    }
  }

  static queryAll(sql, params = []) {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized')
    }

    try {
      const stmt = this.db.prepare(sql)
      const results = []
      while (stmt.step()) {
        results.push(stmt.getAsObject())
      }
      stmt.free()
      return results
    } catch (error) {
      console.error('❌ Database query error:', error)
      throw error
    }
  }

  static run(sql, params = []) {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized')
    }

    try {
      Logger.debug('Executing SQL run', { sql: sql.substring(0, 100) + '...', paramsCount: params.length })
      const stmt = this.db.prepare(sql)
      stmt.run(params)
      stmt.free()
      this.saveDatabase()
      const rowsModified = this.db.getRowsModified()
      Logger.debug('SQL run completed successfully', { rowsModified })
      return rowsModified
    } catch (error) {
      Logger.error('Database run error', { sql, params, error: error.message })
      throw error
    }
  }

  static getLastInsertId() {
    if (!this.db) return null
    try {
      const result = this.db.exec("SELECT last_insert_rowid() as id")
      if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
        const id = result[0].values[0][0]
        Logger.debug('Last insert ID retrieved', { id })
        return id
      }
      Logger.warn('No last insert ID found')
      return null
    } catch (error) {
      Logger.error('Error getting last insert ID', { error: error.message })
      return null
    }
  }

  // Audit logging
  static logAudit(tableName, recordId, action, oldValues = null, newValues = null, userId = 'admin') {
    const sql = `
      INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    
    try {
      this.run(sql, [
        tableName,
        recordId,
        action,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        userId
      ])
    } catch (error) {
      console.error('❌ Error logging audit:', error)
    }
  }

  // Backup and restore
  static exportDatabase() {
    if (!this.db) return null
    
    try {
      const data = this.db.export()
      const blob = new Blob([data], { type: 'application/octet-stream' })
      return blob
    } catch (error) {
      console.error('❌ Error exporting database:', error)
      return null
    }
  }

  static async importDatabase(file) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const uInt8Array = new Uint8Array(arrayBuffer)
      
      // Import sql.js
      const initSqlJs = (await import('sql.js')).default
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      })
      
      this.db = new SQL.Database(uInt8Array)
      this.saveDatabase()
      
      console.log('✅ Database imported successfully')
      return true
    } catch (error) {
      console.error('❌ Error importing database:', error)
      throw error
    }
  }
}
