import { NotificationService } from '../../shared/services/NotificationService.js'

/**
 * Admin Login Page - Authentication for admin access
 */
export class AdminLogin {
  constructor() {
    this.isLoading = false
  }

  async init() {
    // Check if already authenticated
    if (this.isAuthenticated()) {
      window.location.hash = '#/admin/dashboard'
      return
    }
    
    this.setupEventListeners()
    console.log('✅ Admin login page initialized')
  }

  isAuthenticated() {
    const token = localStorage.getItem('admin_token')
    const expiry = localStorage.getItem('admin_token_expiry')
    
    if (!token || !expiry) return false
    
    // Check if token is expired
    if (new Date().getTime() > parseInt(expiry)) {
      this.logout()
      return false
    }
    
    return true
  }

  setupEventListeners() {
    document.addEventListener('submit', (e) => {
      if (e.target.matches('#admin-login-form')) {
        e.preventDefault()
        this.handleLogin(e.target)
      }
    })

    // Handle Enter key
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.target.matches('#admin-login-form input')) {
        e.preventDefault()
        const form = document.getElementById('admin-login-form')
        if (form) this.handleLogin(form)
      }
    })
  }

  async handleLogin(form) {
    if (this.isLoading) return

    const formData = new FormData(form)
    const username = formData.get('username')
    const password = formData.get('password')

    // Basic validation
    if (!username || !password) {
      NotificationService.error('Veuillez remplir tous les champs')
      return
    }

    this.isLoading = true
    this.updateLoginButton(true)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Simple authentication (in production, this should be server-side)
      if (this.validateCredentials(username, password)) {
        this.setAuthToken()
        NotificationService.success('Connexion réussie !')
        
        // Redirect to admin dashboard
        setTimeout(() => {
          window.location.hash = '#/admin/dashboard'
        }, 500)
      } else {
        NotificationService.error('Identifiants incorrects')
      }
    } catch (error) {
      console.error('Login error:', error)
      NotificationService.error('Erreur de connexion')
    } finally {
      this.isLoading = false
      this.updateLoginButton(false)
    }
  }

  validateCredentials(username, password) {
    // TODO: Replace with secure server-side authentication
    // For now, using simple hardcoded credentials
    const validCredentials = [
      { username: 'admin', password: 'admin123' },
      { username: 'samafacture', password: 'sama2024!' },
      { username: 'root', password: 'root@sama' }
    ]

    return validCredentials.some(cred => 
      cred.username === username && cred.password === password
    )
  }

  setAuthToken() {
    const token = this.generateToken()
    const expiry = new Date().getTime() + (24 * 60 * 60 * 1000) // 24 hours
    
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin_token_expiry', expiry.toString())
    localStorage.setItem('admin_login_time', new Date().toISOString())
  }

  generateToken() {
    // Simple token generation (in production, use JWT or similar)
    return 'admin_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
  }

  logout() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_token_expiry')
    localStorage.removeItem('admin_login_time')
    window.location.hash = '#/admin/login'
  }

  updateLoginButton(loading) {
    const button = document.getElementById('login-btn')
    if (!button) return

    if (loading) {
      button.disabled = true
      button.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Connexion...
      `
    } else {
      button.disabled = false
      button.innerHTML = 'Se connecter'
    }
  }

  async render() {
    return `
      <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <!-- Header -->
          <div>
            <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
              <svg class="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Administration SamaFacture
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Connectez-vous pour accéder au panneau d'administration
            </p>
          </div>

          <!-- Login Form -->
          <form id="admin-login-form" class="mt-8 space-y-6">
            <div class="rounded-md shadow-sm -space-y-px">
              <div>
                <label for="username" class="sr-only">Nom d'utilisateur</label>
                <input 
                  id="username" 
                  name="username" 
                  type="text" 
                  required 
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" 
                  placeholder="Nom d'utilisateur"
                  autocomplete="username"
                >
              </div>
              <div>
                <label for="password" class="sr-only">Mot de passe</label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm" 
                  placeholder="Mot de passe"
                  autocomplete="current-password"
                >
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <input 
                  id="remember-me" 
                  name="remember-me" 
                  type="checkbox" 
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                >
                <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Se souvenir de moi
                </label>
              </div>
            </div>

            <div>
              <button 
                id="login-btn"
                type="submit" 
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Se connecter
              </button>
            </div>
          </form>

          <!-- Demo Credentials -->
          <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Identifiants de démonstration :
            </h3>
            <div class="text-xs text-blue-600 dark:text-blue-300 space-y-1">
              <div><strong>admin</strong> / admin123</div>
              <div><strong>samafacture</strong> / sama2024!</div>
              <div><strong>root</strong> / root@sama</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              © 2024 SamaFacture. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    `
  }
}

