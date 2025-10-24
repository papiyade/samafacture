/**
 * Admin Authentication Service - Manages admin authentication and authorization
 */
export class AdminAuthService {
  static TOKEN_KEY = 'admin_token'
  static EXPIRY_KEY = 'admin_token_expiry'
  static LOGIN_TIME_KEY = 'admin_login_time'
  static USER_KEY = 'admin_user'

  /**
   * Check if admin is currently authenticated
   */
  static isAuthenticated() {
    const token = localStorage.getItem(this.TOKEN_KEY)
    const expiry = localStorage.getItem(this.EXPIRY_KEY)
    
    if (!token || !expiry) return false
    
    // Check if token is expired
    if (new Date().getTime() > parseInt(expiry)) {
      this.logout()
      return false
    }
    
    return true
  }

  /**
   * Authenticate admin with credentials
   */
  static async authenticate(username, password) {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800))

      // Validate credentials
      const user = this.validateCredentials(username, password)
      if (!user) {
        throw new Error('Identifiants incorrects')
      }

      // Set authentication data
      this.setAuthData(user)
      
      return {
        success: true,
        user: user,
        message: 'Connexion réussie'
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur de connexion'
      }
    }
  }

  /**
   * Validate admin credentials
   */
  static validateCredentials(username, password) {
    // TODO: Replace with secure server-side authentication
    const validCredentials = [
      { 
        id: 1,
        username: 'admin', 
        password: 'admin123',
        name: 'Administrateur Principal',
        role: 'super_admin',
        permissions: ['all']
      },
      { 
        id: 2,
        username: 'samafacture', 
        password: 'sama2024!',
        name: 'Admin SamaFacture',
        role: 'admin',
        permissions: ['companies', 'licenses', 'stats', 'settings']
      },
      { 
        id: 3,
        username: 'root', 
        password: 'root@sama',
        name: 'Root Admin',
        role: 'super_admin',
        permissions: ['all']
      }
    ]

    const user = validCredentials.find(cred => 
      cred.username === username && cred.password === password
    )

    if (user) {
      // Remove password from returned user object
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    }

    return null
  }

  /**
   * Set authentication data in localStorage
   */
  static setAuthData(user) {
    const token = this.generateToken()
    const expiry = new Date().getTime() + (24 * 60 * 60 * 1000) // 24 hours
    const loginTime = new Date().toISOString()
    
    localStorage.setItem(this.TOKEN_KEY, token)
    localStorage.setItem(this.EXPIRY_KEY, expiry.toString())
    localStorage.setItem(this.LOGIN_TIME_KEY, loginTime)
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  /**
   * Generate authentication token
   */
  static generateToken() {
    // Simple token generation (in production, use JWT or similar)
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `admin_${random}_${timestamp}`
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser() {
    if (!this.isAuthenticated()) return null
    
    try {
      const userData = localStorage.getItem(this.USER_KEY)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  }

  /**
   * Check if user has specific permission
   */
  static hasPermission(permission) {
    const user = this.getCurrentUser()
    if (!user) return false
    
    // Super admin has all permissions
    if (user.permissions.includes('all')) return true
    
    return user.permissions.includes(permission)
  }

  /**
   * Get authentication token
   */
  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  /**
   * Get token expiry time
   */
  static getTokenExpiry() {
    const expiry = localStorage.getItem(this.EXPIRY_KEY)
    return expiry ? new Date(parseInt(expiry)) : null
  }

  /**
   * Get login time
   */
  static getLoginTime() {
    const loginTime = localStorage.getItem(this.LOGIN_TIME_KEY)
    return loginTime ? new Date(loginTime) : null
  }

  /**
   * Refresh authentication token
   */
  static refreshToken() {
    if (!this.isAuthenticated()) return false
    
    const user = this.getCurrentUser()
    if (!user) return false
    
    // Extend token expiry by 24 hours
    const newExpiry = new Date().getTime() + (24 * 60 * 60 * 1000)
    localStorage.setItem(this.EXPIRY_KEY, newExpiry.toString())
    
    return true
  }

  /**
   * Logout admin user
   */
  static logout() {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.EXPIRY_KEY)
    localStorage.removeItem(this.LOGIN_TIME_KEY)
    localStorage.removeItem(this.USER_KEY)
    
    // Redirect to login page
    window.location.hash = '#/admin/login'
  }

  /**
   * Get session info
   */
  static getSessionInfo() {
    if (!this.isAuthenticated()) return null
    
    const user = this.getCurrentUser()
    const loginTime = this.getLoginTime()
    const expiry = this.getTokenExpiry()
    
    return {
      user: user,
      loginTime: loginTime,
      expiryTime: expiry,
      timeRemaining: expiry ? expiry.getTime() - new Date().getTime() : 0,
      isExpired: expiry ? new Date() > expiry : true
    }
  }

  /**
   * Initialize authentication check
   */
  static init() {
    // Check authentication on page load
    if (!this.isAuthenticated() && !window.location.hash.includes('/admin/login')) {
      this.logout()
    }
    
    // Set up token refresh interval (every 30 minutes)
    setInterval(() => {
      if (this.isAuthenticated()) {
        this.refreshToken()
      }
    }, 30 * 60 * 1000)
    
    console.log('✅ AdminAuthService initialized')
  }
}

