/**
 * Network Detector - Advanced network connectivity detection
 * Provides real connectivity testing beyond navigator.onLine
 */

export class NetworkDetector {
  static instance = null
  static isInitialized = false
  static eventListeners = new Map()
  
  // Network state
  static networkState = {
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
    lastCheck: null,
    consecutiveFailures: 0
  }

  // Configuration
  static config = {
    checkInterval: 30000, // 30 seconds
    timeoutDuration: 5000, // 5 seconds
    maxRetries: 3,
    testEndpoints: [
      '/api/health',
      '/manifest.json',
      'https://www.google.com/favicon.ico'
    ]
  }

  static checkTimer = null

  /**
   * Initialize Network Detector
   */
  static async init() {
    if (this.isInitialized) {
      return this.instance
    }

    try {
      console.log('🌐 Initializing Network Detector...')
      
      // Set up basic online/offline listeners
      window.addEventListener('online', () => this.handleOnlineEvent())
      window.addEventListener('offline', () => this.handleOfflineEvent())

      // Set up connection change listener if available
      if ('connection' in navigator) {
        navigator.connection.addEventListener('change', () => {
          this.updateConnectionInfo()
        })
        this.updateConnectionInfo()
      }

      // Perform initial connectivity test
      await this.performConnectivityTest()

      // Start periodic checks
      this.startPeriodicChecks()

      this.isInitialized = true
      this.instance = this
      console.log('✅ Network Detector initialized')
      
      return this.instance
    } catch (error) {
      console.error('❌ Failed to initialize Network Detector:', error)
      throw error
    }
  }

  /**
   * Handle browser online event
   */
  static handleOnlineEvent() {
    console.log('🌐 Browser reports online')
    this.networkState.isOnline = true
    
    // Verify with actual connectivity test
    this.performConnectivityTest().then(isConnected => {
      if (isConnected) {
        this.networkState.consecutiveFailures = 0
        this.emit('online', this.networkState)
      }
    })
  }

  /**
   * Handle browser offline event
   */
  static handleOfflineEvent() {
    console.log('📴 Browser reports offline')
    this.networkState.isOnline = false
    this.networkState.lastCheck = Date.now()
    this.emit('offline', this.networkState)
  }

  /**
   * Update connection information from Network Information API
   */
  static updateConnectionInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection
      
      this.networkState.connectionType = connection.type || 'unknown'
      this.networkState.effectiveType = connection.effectiveType || 'unknown'
      this.networkState.downlink = connection.downlink || 0
      this.networkState.rtt = connection.rtt || 0
      this.networkState.saveData = connection.saveData || false

      console.log('📊 Connection info updated:', {
        type: this.networkState.connectionType,
        effectiveType: this.networkState.effectiveType,
        downlink: this.networkState.downlink,
        rtt: this.networkState.rtt
      })

      this.emit('connection-change', this.networkState)
    }
  }

  /**
   * Perform actual connectivity test
   */
  static async performConnectivityTest() {
    console.log('🔍 Performing connectivity test...')
    
    const startTime = Date.now()
    let isConnected = false

    for (const endpoint of this.config.testEndpoints) {
      try {
        const response = await this.testEndpoint(endpoint)
        if (response.ok) {
          isConnected = true
          break
        }
      } catch (error) {
        console.log(`❌ Test failed for ${endpoint}:`, error.message)
      }
    }

    const duration = Date.now() - startTime
    this.networkState.lastCheck = Date.now()

    if (isConnected) {
      this.networkState.isOnline = true
      this.networkState.consecutiveFailures = 0
      console.log(`✅ Connectivity test passed (${duration}ms)`)
      
      if (!navigator.onLine) {
        // Browser thinks we're offline but we're actually online
        console.log('🔄 Browser state corrected: actually online')
        this.emit('online', this.networkState)
      }
    } else {
      this.networkState.consecutiveFailures++
      console.log(`❌ Connectivity test failed (${this.networkState.consecutiveFailures} consecutive failures)`)
      
      // Only mark as offline after multiple failures to avoid false positives
      if (this.networkState.consecutiveFailures >= 2) {
        this.networkState.isOnline = false
        this.emit('offline', this.networkState)
      }
    }

    this.emit('connectivity-test', {
      isConnected,
      duration,
      consecutiveFailures: this.networkState.consecutiveFailures
    })

    return isConnected
  }

  /**
   * Test individual endpoint
   */
  static async testEndpoint(endpoint) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutDuration)

    try {
      const response = await fetch(endpoint, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return { ok: true, response }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Start periodic connectivity checks
   */
  static startPeriodicChecks() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
    }

    this.checkTimer = setInterval(() => {
      // Only check if browser thinks we're online
      // This prevents unnecessary requests when clearly offline
      if (navigator.onLine) {
        this.performConnectivityTest()
      }
    }, this.config.checkInterval)

    console.log(`🔄 Started periodic checks every ${this.config.checkInterval / 1000}s`)
  }

  /**
   * Stop periodic checks
   */
  static stopPeriodicChecks() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
      console.log('⏹️ Stopped periodic checks')
    }
  }

  /**
   * Check if connection is fast enough for sync
   */
  static isFastConnection() {
    const { effectiveType, downlink } = this.networkState
    
    // Consider 3G and above as fast
    if (['4g', '3g'].includes(effectiveType)) {
      return true
    }
    
    // Or if downlink is above 1 Mbps
    if (downlink > 1) {
      return true
    }
    
    return false
  }

  /**
   * Check if user has data saving enabled
   */
  static isDataSaverEnabled() {
    return this.networkState.saveData
  }

  /**
   * Get connection quality score (0-100)
   */
  static getConnectionQuality() {
    if (!this.networkState.isOnline) {
      return 0
    }

    const { effectiveType, downlink, rtt } = this.networkState
    let score = 50 // Base score

    // Adjust based on effective type
    switch (effectiveType) {
      case '4g':
        score += 40
        break
      case '3g':
        score += 20
        break
      case '2g':
        score -= 20
        break
      case 'slow-2g':
        score -= 40
        break
    }

    // Adjust based on downlink (if available)
    if (downlink > 0) {
      if (downlink > 10) score += 10
      else if (downlink > 5) score += 5
      else if (downlink < 1) score -= 10
    }

    // Adjust based on RTT (if available)
    if (rtt > 0) {
      if (rtt < 100) score += 10
      else if (rtt < 300) score += 5
      else if (rtt > 1000) score -= 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Wait for online connection
   */
  static async waitForOnline(timeout = 30000) {
    if (this.isOnline()) {
      return true
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeEventListener('online', onlineHandler)
        reject(new Error('Timeout waiting for online connection'))
      }, timeout)

      const onlineHandler = () => {
        clearTimeout(timeoutId)
        this.removeEventListener('online', onlineHandler)
        resolve(true)
      }

      this.addEventListener('online', onlineHandler)
    })
  }

  /**
   * Event system
   */
  static addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  static removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  static emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Network event listener error:', error)
        }
      })
    }
  }

  /**
   * Public API methods
   */

  // Check if currently online
  static isOnline() {
    return this.networkState.isOnline
  }

  // Get current network state
  static getNetworkState() {
    return { ...this.networkState }
  }

  // Force connectivity check
  static async checkConnectivity() {
    return this.performConnectivityTest()
  }

  // Get network statistics
  static getNetworkStats() {
    return {
      isOnline: this.networkState.isOnline,
      connectionType: this.networkState.connectionType,
      effectiveType: this.networkState.effectiveType,
      quality: this.getConnectionQuality(),
      isFast: this.isFastConnection(),
      dataSaver: this.isDataSaverEnabled(),
      lastCheck: this.networkState.lastCheck,
      consecutiveFailures: this.networkState.consecutiveFailures
    }
  }

  // Update configuration
  static updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    
    // Restart periodic checks with new interval if changed
    if (newConfig.checkInterval) {
      this.startPeriodicChecks()
    }
    
    console.log('⚙️ Network detector config updated:', this.config)
  }

  // Cleanup
  static destroy() {
    this.stopPeriodicChecks()
    
    window.removeEventListener('online', this.handleOnlineEvent)
    window.removeEventListener('offline', this.handleOfflineEvent)
    
    if ('connection' in navigator) {
      navigator.connection.removeEventListener('change', this.updateConnectionInfo)
    }
    
    this.eventListeners.clear()
    this.isInitialized = false
    this.instance = null
    
    console.log('🗑️ Network Detector destroyed')
  }
}

export default NetworkDetector

