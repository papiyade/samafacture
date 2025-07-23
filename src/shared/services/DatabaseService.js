/**
 * Database Service - Manages SQLite database operations
 */
export class DatabaseService {
  static db = null
  static isInitialized = false

  static async init() {
    try {
      // Import sql.js
      const initSqlJs = (await import('sql.js')).default
      const SQL = await initSqlJs({
        locateFile: file => `/node_modules/sql.js/dist/${file}`
      })

      // Try to load existing database from IndexedDB
      const existingDb = await this.loadFromIndexedDB()
      
      if (existingDb) {
        this.db = new SQL.Database(existingDb)
        console.log('✅ Loaded existing database from IndexedDB')
      } else {
        // Create new database
        this.db = new SQL.Database()
        await this.createTables()
        await this.saveToIndexedDB()
        console.log('✅ Created new database')
      }

      this.isInitialized = true
      return this.db

    } catch (error) {
      console.error('❌ Failed to initialize database:', error)
      throw error
    }
  }

  static async createTables() {
    const schema = `
      -- Settings table
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Clients table
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        company TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        category TEXT,
        unit TEXT DEFAULT 'pièce',
        stock INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Invoices table
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT UNIQUE NOT NULL,
        client_id INTEGER NOT NULL,
        date DATE NOT NULL,
        due_date DATE,
        status TEXT DEFAULT 'draft',
        subtotal DECIMAL(10,2) DEFAULT 0,
        tax_rate DECIMAL(5,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_rate DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        terms TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id)
      );

      -- Invoice items table
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        product_id INTEGER,
        description TEXT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );

      -- Quotes table
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number TEXT UNIQUE NOT NULL,
        client_id INTEGER NOT NULL,
        date DATE NOT NULL,
        valid_until DATE,
        status TEXT DEFAULT 'draft',
        subtotal DECIMAL(10,2) DEFAULT 0,
        tax_rate DECIMAL(5,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_rate DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        terms TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id)
      );

      -- Quote items table
      CREATE TABLE IF NOT EXISTS quote_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote_id INTEGER NOT NULL,
        product_id INTEGER,
        description TEXT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );

      -- Insert default settings
      INSERT OR IGNORE INTO settings (key, value) VALUES 
        ('company_name', 'Mon Entreprise'),
        ('company_email', ''),
        ('company_phone', ''),
        ('company_address', ''),
        ('currency', 'XOF'),
        ('tax_rate', '18'),
        ('invoice_prefix', 'INV'),
        ('quote_prefix', 'DEV'),
        ('next_invoice_number', '1'),
        ('next_quote_number', '1');
    `

    this.db.exec(schema)
  }

  static async saveToIndexedDB() {
    if (!this.db) return

    try {
      const data = this.db.export()
      const request = indexedDB.open('SamaFactureDB', 1)
      
      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['database'], 'readwrite')
          const store = transaction.objectStore('database')
          store.put(data, 'main')
          transaction.oncomplete = () => resolve()
          transaction.onerror = () => reject(transaction.error)
        }
        request.onupgradeneeded = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('database')) {
            db.createObjectStore('database')
          }
        }
      })
    } catch (error) {
      console.error('Failed to save database to IndexedDB:', error)
    }
  }

  static async loadFromIndexedDB() {
    try {
      const request = indexedDB.open('SamaFactureDB', 1)
      
      return new Promise((resolve, reject) => {
        request.onerror = () => resolve(null) // Return null if no database exists
        request.onsuccess = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('database')) {
            resolve(null)
            return
          }
          
          const transaction = db.transaction(['database'], 'readonly')
          const store = transaction.objectStore('database')
          const getRequest = store.get('main')
          
          getRequest.onsuccess = () => {
            resolve(getRequest.result || null)
          }
          getRequest.onerror = () => resolve(null)
        }
        request.onupgradeneeded = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('database')) {
            db.createObjectStore('database')
          }
        }
      })
    } catch (error) {
      console.error('Failed to load database from IndexedDB:', error)
      return null
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
      console.error('Database query error:', error)
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
      console.error('Database query error:', error)
      throw error
    }
  }

  static exec(sql, params = []) {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized')
    }

    try {
      if (params.length > 0) {
        const stmt = this.db.prepare(sql)
        stmt.run(params)
        stmt.free()
      } else {
        this.db.exec(sql)
      }
      
      // Save to IndexedDB after modifications
      this.saveToIndexedDB()
      
      return true
    } catch (error) {
      console.error('Database exec error:', error)
      throw error
    }
  }

  static getLastInsertId() {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized')
    }

    const result = this.query('SELECT last_insert_rowid() as id')
    return result.id
  }

  static async backup() {
    if (!this.db) return null
    
    try {
      const data = this.db.export()
      const blob = new Blob([data], { type: 'application/octet-stream' })
      return blob
    } catch (error) {
      console.error('Failed to create backup:', error)
      throw error
    }
  }

  static async restore(file) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      
      // Import sql.js
      const initSqlJs = (await import('sql.js')).default
      const SQL = await initSqlJs({
        locateFile: file => `/node_modules/sql.js/dist/${file}`
      })
      
      this.db = new SQL.Database(data)
      await this.saveToIndexedDB()
      
      console.log('✅ Database restored successfully')
      return true
    } catch (error) {
      console.error('Failed to restore database:', error)
      throw error
    }
  }
}

