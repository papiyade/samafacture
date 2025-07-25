/**
 * Simple SPA Router for client-side navigation
 */
export class Router {
  constructor(contentElementId = 'main-content') {
    this.routes = new Map()
    this.notFoundHandler = null
    this.currentPage = null
    this.contentElementId = contentElementId
  }

  addRoute(path, handler) {
    this.routes.set(path, handler)
  }

  setNotFoundHandler(handler) {
    this.notFoundHandler = handler
  }

  start() {
    // Handle initial load
    this.handleRoute()

    // Handle browser back/forward and hash changes
    window.addEventListener('popstate', () => {
      this.handleRoute()
    })
    
    window.addEventListener('hashchange', () => {
      this.handleRoute()
    })

    // Handle link clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-route]')) {
        e.preventDefault()
        const path = e.target.getAttribute('data-route') || e.target.getAttribute('href')
        this.navigate(path)
      }
    })
  }

  navigate(path) {
    // Use hash-based navigation for SPA
    const newHash = '#' + path
    if (newHash !== window.location.hash) {
      window.location.hash = newHash
    }
    this.handleRoute()
  }

  async handleRoute() {
    // Use hash for SPA routing, fallback to pathname
    let path = window.location.hash.slice(1) || '/'
    if (path === '') path = '/'
    
    const route = this.findRoute(path)

    if (route) {
      const { handler, params } = route
      await this.loadPage(handler, params)
    } else if (this.notFoundHandler) {
      await this.loadPage(this.notFoundHandler)
    } else {
      console.error('No route found for:', path)
    }
  }

  findRoute(path) {
    // Exact match first
    if (this.routes.has(path)) {
      return { handler: this.routes.get(path), params: {} }
    }

    // Pattern matching for dynamic routes
    for (const [pattern, handler] of this.routes) {
      const params = this.matchRoute(pattern, path)
      if (params !== null) {
        return { handler, params }
      }
    }

    return null
  }

  matchRoute(pattern, path) {
    const patternParts = pattern.split('/')
    const pathParts = path.split('/')

    if (patternParts.length !== pathParts.length) {
      return null
    }

    const params = {}
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]
      const pathPart = pathParts[i]

      if (patternPart.startsWith(':')) {
        // Dynamic parameter
        const paramName = patternPart.slice(1)
        params[paramName] = pathPart
      } else if (patternPart !== pathPart) {
        // Static part doesn't match
        return null
      }
    }

    return params
  }

  async loadPage(handler, params = {}) {
    try {
      // Show loading state
      this.showLoading()

      // Cleanup current page
      if (this.currentPage && typeof this.currentPage.destroy === 'function') {
        this.currentPage.destroy()
      }

      // Load new page
      this.currentPage = await handler(params)
      
      if (this.currentPage && typeof this.currentPage.render === 'function') {
        const content = await this.currentPage.render()
        this.renderContent(content)
        
        // Initialize page if it has an init method
        if (typeof this.currentPage.init === 'function') {
          await this.currentPage.init()
        }
      }

      // Hide loading state
      this.hideLoading()

    } catch (error) {
      console.error('Error loading page:', error)
      this.showError(error)
    }
  }

  renderContent(content) {
    const contentElement = document.getElementById(this.contentElementId)
    if (contentElement) {
      contentElement.innerHTML = content
    }
  }

  showLoading() {
    const contentElement = document.getElementById(this.contentElementId)
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="flex items-center justify-center min-h-64">
          <div class="text-center">
            <div class="loading-spinner w-8 h-8 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
      `
    }
  }

  hideLoading() {
    // Loading is hidden when content is rendered
  }

  showError(error) {
    const contentElement = document.getElementById(this.contentElementId)
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="flex items-center justify-center min-h-64">
          <div class="text-center">
            <div class="text-red-500 mb-4">
              <svg class="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Erreur de chargement</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">${error.message}</p>
            <button onclick="location.reload()" class="btn btn-primary">
              Recharger la page
            </button>
          </div>
        </div>
      `
    }
  }
}
