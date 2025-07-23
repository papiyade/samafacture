import { Router } from '../../shared/utils/Router.js'
import { Navigation } from './Navigation.js'
import { I18nService } from '../../shared/services/I18nService.js'

/**
 * Main App Component - Manages the client application
 */
export class App {
  constructor() {
    this.router = null
    this.navigation = null
  }

  async init() {
    // Initialize router
    this.router = new Router()
    this.setupRoutes()

    // Initialize navigation
    this.navigation = new Navigation()
    await this.navigation.init()

    // Start the router
    this.router.start()

    console.log('✅ Client App initialized')
  }

  setupRoutes() {
    // Dashboard
    this.router.addRoute('/', async () => {
      const { Dashboard } = await import('../pages/Dashboard.js')
      return new Dashboard()
    })

    // Invoices
    this.router.addRoute('/invoices', async () => {
      const { InvoiceList } = await import('../pages/invoices/InvoiceList.js')
      return new InvoiceList()
    })

    this.router.addRoute('/invoices/new', async () => {
      const { InvoiceForm } = await import('../pages/invoices/InvoiceForm.js')
      return new InvoiceForm()
    })

    this.router.addRoute('/invoices/:id', async (params) => {
      const { InvoiceForm } = await import('../pages/invoices/InvoiceForm.js')
      return new InvoiceForm(params.id)
    })

    // Quotes
    this.router.addRoute('/quotes', async () => {
      const { QuoteList } = await import('../pages/quotes/QuoteList.js')
      return new QuoteList()
    })

    this.router.addRoute('/quotes/new', async () => {
      const { QuoteForm } = await import('../pages/quotes/QuoteForm.js')
      return new QuoteForm()
    })

    this.router.addRoute('/quotes/:id', async (params) => {
      const { QuoteForm } = await import('../pages/quotes/QuoteForm.js')
      return new QuoteForm(params.id)
    })

    // Clients
    this.router.addRoute('/clients', async () => {
      const { ClientList } = await import('../pages/clients/ClientList.js')
      return new ClientList()
    })

    this.router.addRoute('/clients/new', async () => {
      const { ClientForm } = await import('../pages/clients/ClientForm.js')
      return new ClientForm()
    })

    this.router.addRoute('/clients/:id', async (params) => {
      const { ClientForm } = await import('../pages/clients/ClientForm.js')
      return new ClientForm(params.id)
    })

    // Products
    this.router.addRoute('/products', async () => {
      const { ProductList } = await import('../pages/products/ProductList.js')
      return new ProductList()
    })

    this.router.addRoute('/products/new', async () => {
      const { ProductForm } = await import('../pages/products/ProductForm.js')
      return new ProductForm()
    })

    this.router.addRoute('/products/:id', async (params) => {
      const { ProductForm } = await import('../pages/products/ProductForm.js')
      return new ProductForm(params.id)
    })

    // Settings
    this.router.addRoute('/settings', async () => {
      const { Settings } = await import('../pages/Settings.js')
      return new Settings()
    })

    // License
    this.router.addRoute('/license', async () => {
      const { License } = await import('../pages/License.js')
      return new License()
    })

    // 404 Not Found
    this.router.setNotFoundHandler(async () => {
      const { NotFound } = await import('../pages/NotFound.js')
      return new NotFound()
    })
  }
}

