import { AdminAuthService } from '../services/AdminAuthService.js'

/**
 * Authentication Middleware - Protects admin routes
 */
export class AuthMiddleware {
  /**
   * Check if route requires authentication
   */
  static requiresAuth(route) {
    // Public routes that don't require authentication
    const publicRoutes = [
      '/admin/login',
      '/admin/forgot-password'
    ]
    
    return !publicRoutes.includes(route)
  }

  /**
   * Check if user has permission for route
   */
  static hasRoutePermission(route) {
    const routePermissions = {
      '/admin/dashboard': ['all', 'stats'],
      '/admin/companies': ['all', 'companies'],
      '/admin/licenses': ['all', 'licenses'],
      '/admin/stats': ['all', 'stats'],
      '/admin/settings': ['all', 'settings'],
      '/admin/users': ['all', 'users']
    }
    
    const requiredPermissions = routePermissions[route]
    if (!requiredPermissions) return true // No specific permission required
    
    return requiredPermissions.some(permission => 
      AdminAuthService.hasPermission(permission)
    )
  }

  /**
   * Middleware function to check authentication and authorization
   */
  static async checkAuth(route, next) {
    try {
      // Check if route requires authentication
      if (!this.requiresAuth(route)) {
        return next()
      }

      // Check if user is authenticated
      if (!AdminAuthService.isAuthenticated()) {
        console.log('🔒 Access denied: Not authenticated')
        window.location.hash = '#/admin/login'
        return
      }

      // Check if user has permission for this route
      if (!this.hasRoutePermission(route)) {
        console.log('🔒 Access denied: Insufficient permissions')
        this.showAccessDenied()
        return
      }

      // User is authenticated and authorized
      console.log('✅ Access granted to:', route)
      return next()
      
    } catch (error) {
      console.error('Auth middleware error:', error)
      window.location.hash = '#/admin/login'
    }
  }

  /**
   * Show access denied message
   */
  static showAccessDenied() {
    const content = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div class="max-w-md w-full text-center">
          <div class="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg class="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Accès refusé
          </h2>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <div class="mt-6 space-y-3">
            <button 
              onclick="window.history.back()" 
              class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Retour
            </button>
            <button 
              onclick="window.location.hash = '#/admin/dashboard'" 
              class="w-full bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Tableau de bord
            </button>
          </div>
        </div>
      </div>
    `
    
    document.getElementById('app').innerHTML = content
  }

  /**
   * Get user info for display
   */
  static getUserInfo() {
    const user = AdminAuthService.getCurrentUser()
    const sessionInfo = AdminAuthService.getSessionInfo()
    
    return {
      user: user,
      session: sessionInfo,
      isAuthenticated: AdminAuthService.isAuthenticated()
    }
  }

  /**
   * Auto-logout when token expires
   */
  static setupAutoLogout() {
    const checkInterval = 60000 // Check every minute
    
    setInterval(() => {
      if (!AdminAuthService.isAuthenticated()) {
        console.log('🔒 Session expired, redirecting to login')
        AdminAuthService.logout()
      }
    }, checkInterval)
  }

  /**
   * Initialize middleware
   */
  static init() {
    // Initialize auth service
    AdminAuthService.init()
    
    // Setup auto-logout
    this.setupAutoLogout()
    
    console.log('✅ AuthMiddleware initialized')
  }
}

