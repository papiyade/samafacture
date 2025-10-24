import { Router } from '../../shared/utils/Router.js'
import { AuthMiddleware } from '../middleware/AuthMiddleware.js'

/**
 * Admin Router with Authentication - Extends base router with auth middleware
 */
export class AdminRouter extends Router {
  constructor(contentElementId = 'admin-content') {
    super(contentElementId)
    this.middleware = []
    this.isInitialized = false
  }

  /**
   * Add middleware to router
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware)
  }

  /**
   * Add route with authentication check
   */
  addRoute(path, handler, requiresAuth = true) {
    const wrappedHandler = async () => {
      try {
        // Run middleware chain
        for (const middleware of this.middleware) {
          const result = await middleware(path, () => {})
          if (result === false) return // Middleware blocked the request
        }

        // Check authentication if required
        if (requiresAuth) {
          return AuthMiddleware.checkAuth(path, async () => {
            await this.executeHandler(handler)
          })
        } else {
          await this.executeHandler(handler)
        }
      } catch (error) {
        console.error('Route handler error:', error)
        this.handleError(error)
      }
    }

    super.addRoute(path, wrappedHandler)
  }

  /**
   * Execute route handler
   */
  async executeHandler(handler) {
    try {
      // Clean up previous page
      if (this.currentPage && typeof this.currentPage.destroy === 'function') {
        this.currentPage.destroy()
      }

      // Create new page instance
      const pageInstance = new handler()
      this.currentPage = pageInstance

      // Initialize page
      if (typeof pageInstance.init === 'function') {
        await pageInstance.init()
      }

      // Render page
      const content = await pageInstance.render()
      const contentElement = document.getElementById(this.contentElementId)
      
      if (contentElement) {
        contentElement.innerHTML = content
        
        // Call afterRender if available
        if (typeof pageInstance.afterRender === 'function') {
          await pageInstance.afterRender()
        }
      }

    } catch (error) {
      console.error('Error executing route handler:', error)
      this.handleError(error)
    }
  }

  /**
   * Handle routing errors
   */
  handleError(error) {
    const contentElement = document.getElementById(this.contentElementId)
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div class="max-w-md w-full text-center">
            <div class="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <svg class="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
              Erreur de chargement
            </h2>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Une erreur s'est produite lors du chargement de la page.
            </p>
            <div class="mt-6">
              <button 
                onclick="window.location.reload()" 
                class="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Recharger la page
              </button>
            </div>
            <div class="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Erreur: ${error.message}
            </div>
          </div>
        </div>
      `
    }
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    const hash = window.location.hash
    return hash ? hash.substring(1) : '/admin/dashboard'
  }

  /**
   * Check if current route is active
   */
  isRouteActive(route) {
    return this.getCurrentRoute() === route
  }

  /**
   * Navigate with authentication check
   */
  async navigate(path) {
    // Check if user is authenticated for protected routes
    if (AuthMiddleware.requiresAuth(path) && !AuthMiddleware.isAuthenticated()) {
      window.location.hash = '#/admin/login'
      return
    }

    super.navigate(path)
  }

  /**
   * Initialize admin router
   */
  init() {
    if (this.isInitialized) return

    // Initialize auth middleware
    AuthMiddleware.init()

    // Add auth middleware to router
    this.addMiddleware(async (route, next) => {
      // This middleware runs before each route
      console.log('🔍 Checking route:', route)
      return next()
    })

    // Set default route
    if (!window.location.hash) {
      window.location.hash = '#/admin/dashboard'
    }

    this.isInitialized = true
    console.log('✅ AdminRouter initialized')
  }

  /**
   * Start the router
   */
  start() {
    this.init()
    super.start()
  }

  /**
   * Get user info for navigation
   */
  getUserInfo() {
    return AuthMiddleware.getUserInfo()
  }

  /**
   * Logout user
   */
  logout() {
    AuthMiddleware.logout()
  }
}

