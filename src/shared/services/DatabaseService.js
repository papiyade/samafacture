/**
 * Database Service - Manages local storage operations (simplified version)
 * Uses localStorage instead of SQLite to avoid WASM issues during development
 */
export class DatabaseService {
  static isInitialized = false
  static storagePrefix = 'samafacture_'

  static async init() {
    try {
      // Initialize with localStorage for now
      await this.createDefaultData()
      this.isInitialized = true
      console.log('✅ Database initialized with localStorage')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize database:', error)
      throw error
    }
  }

  static async createDefaultData() {
    // Create default settings if they don't exist
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
    if (!this.getItem('clients')) {
      this.setItem('clients', [])
    }
    if (!this.getItem('products')) {
      this.setItem('products', [])
    }
    if (!this.getItem('invoices')) {
      this.setItem('invoices', [])
    }
    if (!this.getItem('quotes')) {
      this.setItem('quotes', [])
    }
  }

  static getItem(key) {
    try {
      const item = localStorage.getItem(this.storagePrefix + key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error getting item from storage:', error)
      return null
    }
  }

  static setItem(key, value) {
    try {
      localStorage.setItem(this.storagePrefix + key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Error setting item in storage:', error)
      return false
    }
  }

  static removeItem(key) {
    try {
      localStorage.removeItem(this.storagePrefix + key)
      return true
    } catch (error) {
      console.error('Error removing item from storage:', error)
      return false
    }
  }

  // Settings methods
  static getSetting(key) {
    const settings = this.getItem('settings') || {}
    return settings[key]
  }

  static setSetting(key, value) {
    const settings = this.getItem('settings') || {}
    settings[key] = value
    return this.setItem('settings', settings)
  }

  // Clients methods
  static getClients() {
    return this.getItem('clients') || []
  }

  static addClient(client) {
    const clients = this.getClients()
    const newClient = {
      id: Date.now(),
      ...client,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    clients.push(newClient)
    this.setItem('clients', clients)
    return newClient
  }

  static updateClient(id, updates) {
    const clients = this.getClients()
    const index = clients.findIndex(c => c.id === id)
    if (index !== -1) {
      clients[index] = {
        ...clients[index],
        ...updates,
        updated_at: new Date().toISOString()
      }
      this.setItem('clients', clients)
      return clients[index]
    }
    return null
  }

  static deleteClient(id) {
    const clients = this.getClients()
    const filtered = clients.filter(c => c.id !== id)
    this.setItem('clients', filtered)
    return true
  }

  static getClient(id) {
    const clients = this.getClients()
    return clients.find(c => c.id === id) || null
  }

  // Products methods
  static getProducts() {
    return this.getItem('products') || []
  }

  static addProduct(product) {
    const products = this.getProducts()
    const newProduct = {
      id: Date.now(),
      ...product,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    products.push(newProduct)
    this.setItem('products', products)
    return newProduct
  }

  static updateProduct(id, updates) {
    const products = this.getProducts()
    const index = products.findIndex(p => p.id === id)
    if (index !== -1) {
      products[index] = {
        ...products[index],
        ...updates,
        updated_at: new Date().toISOString()
      }
      this.setItem('products', products)
      return products[index]
    }
    return null
  }

  static deleteProduct(id) {
    const products = this.getProducts()
    const filtered = products.filter(p => p.id !== id)
    this.setItem('products', filtered)
    return true
  }

  // Invoices methods
  static getInvoices() {
    return this.getItem('invoices') || []
  }

  static addInvoice(invoice) {
    const invoices = this.getInvoices()
    const newInvoice = {
      id: Date.now(),
      number: this.generateInvoiceNumber(),
      ...invoice,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    invoices.push(newInvoice)
    this.setItem('invoices', invoices)
    
    // Increment next invoice number
    const nextNumber = parseInt(this.getSetting('next_invoice_number')) + 1
    this.setSetting('next_invoice_number', nextNumber.toString())
    
    return newInvoice
  }

  static updateInvoice(id, updates) {
    const invoices = this.getInvoices()
    const index = invoices.findIndex(i => i.id === id)
    if (index !== -1) {
      invoices[index] = {
        ...invoices[index],
        ...updates,
        updated_at: new Date().toISOString()
      }
      this.setItem('invoices', invoices)
      return invoices[index]
    }
    return null
  }

  static deleteInvoice(id) {
    const invoices = this.getInvoices()
    const filtered = invoices.filter(i => i.id !== id)
    this.setItem('invoices', filtered)
    return true
  }

  static getInvoice(id) {
    const invoices = this.getInvoices()
    return invoices.find(i => i.id === id) || null
  }

  static generateInvoiceNumber() {
    const prefix = this.getSetting('invoice_prefix') || 'INV'
    const nextNumber = this.getSetting('next_invoice_number') || '1'
    return `${prefix}-${nextNumber.padStart(4, '0')}`
  }

  // Quotes methods
  static getQuotes() {
    return this.getItem('quotes') || []
  }

  static addQuote(quote) {
    const quotes = this.getQuotes()
    const newQuote = {
      id: Date.now(),
      number: this.generateQuoteNumber(),
      ...quote,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    quotes.push(newQuote)
    this.setItem('quotes', quotes)
    
    // Increment next quote number
    const nextNumber = parseInt(this.getSetting('next_quote_number')) + 1
    this.setSetting('next_quote_number', nextNumber.toString())
    
    return newQuote
  }

  static generateQuoteNumber() {
    const prefix = this.getSetting('quote_prefix') || 'DEV'
    const nextNumber = this.getSetting('next_quote_number') || '1'
    return `${prefix}-${nextNumber.padStart(4, '0')}`
  }

  // Statistics methods
  static getStats() {
    const invoices = this.getInvoices()
    const clients = this.getClients()
    const products = this.getProducts()
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)
    
    const pendingAmount = invoices
      .filter(inv => inv.status === 'sent')
      .reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0)

    return {
      totalClients: clients.length,
      totalInvoices: invoices.length,
      totalProducts: products.length,
      totalRevenue,
      pendingAmount,
      paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: invoices.filter(inv => inv.status === 'sent').length,
      draftInvoices: invoices.filter(inv => inv.status === 'draft').length
    }
  }

  // Backup and restore
  static async backup() {
    try {
      const data = {
        settings: this.getItem('settings'),
        clients: this.getItem('clients'),
        products: this.getItem('products'),
        invoices: this.getItem('invoices'),
        quotes: this.getItem('quotes'),
        exportDate: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      })
      return blob
    } catch (error) {
      console.error('Failed to create backup:', error)
      throw error
    }
  }

  static async restore(file) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Restore all data
      if (data.settings) this.setItem('settings', data.settings)
      if (data.clients) this.setItem('clients', data.clients)
      if (data.products) this.setItem('products', data.products)
      if (data.invoices) this.setItem('invoices', data.invoices)
      if (data.quotes) this.setItem('quotes', data.quotes)
      
      console.log('✅ Database restored successfully')
      return true
    } catch (error) {
      console.error('Failed to restore database:', error)
      throw error
    }
  }

  // Clear all data
  static clearAll() {
    const keys = ['settings', 'clients', 'products', 'invoices', 'quotes']
    keys.forEach(key => this.removeItem(key))
    return this.createDefaultData()
  }
}

