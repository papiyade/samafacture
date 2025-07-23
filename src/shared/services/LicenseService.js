import CryptoJS from 'crypto-js'

/**
 * License Service - Manages application licensing and trial periods
 */
export class LicenseService {
  static LICENSE_KEY = 'samafacture-license'
  static TRIAL_KEY = 'samafacture-trial'
  static TRIAL_DAYS = 30
  static SECRET_KEY = 'SamaFacture2024SecretKey' // In production, this should be more secure

  static async checkLicense() {
    const license = this.getLicense()
    const trial = this.getTrial()

    if (license && this.validateLicense(license)) {
      return {
        isValid: true,
        isTrial: false,
        type: 'full',
        expiresAt: license.expiresAt,
        daysLeft: this.getDaysUntilExpiration(license.expiresAt)
      }
    }

    if (trial && this.isTrialValid(trial)) {
      const daysLeft = this.getTrialDaysLeft(trial)
      return {
        isValid: true,
        isTrial: true,
        type: 'trial',
        daysLeft: daysLeft,
        expiresAt: trial.expiresAt
      }
    }

    // No valid license or trial
    if (!trial) {
      // Start trial if not started
      this.startTrial()
      return this.checkLicense()
    }

    return {
      isValid: false,
      isTrial: false,
      type: 'expired',
      daysLeft: 0
    }
  }

  static getLicense() {
    try {
      const licenseData = localStorage.getItem(this.LICENSE_KEY)
      return licenseData ? JSON.parse(licenseData) : null
    } catch (error) {
      console.error('Error reading license:', error)
      return null
    }
  }

  static getTrial() {
    try {
      const trialData = localStorage.getItem(this.TRIAL_KEY)
      return trialData ? JSON.parse(trialData) : null
    } catch (error) {
      console.error('Error reading trial:', error)
      return null
    }
  }

  static startTrial() {
    const trial = {
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (this.TRIAL_DAYS * 24 * 60 * 60 * 1000)).toISOString(),
      deviceId: this.getDeviceId()
    }

    localStorage.setItem(this.TRIAL_KEY, JSON.stringify(trial))
    console.log('✅ Trial started:', trial)
    return trial
  }

  static isTrialValid(trial) {
    if (!trial || !trial.expiresAt) return false
    
    const now = new Date()
    const expiresAt = new Date(trial.expiresAt)
    
    return now < expiresAt
  }

  static getTrialDaysLeft(trial) {
    if (!trial || !trial.expiresAt) return 0
    
    const now = new Date()
    const expiresAt = new Date(trial.expiresAt)
    const diffTime = expiresAt - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  static async activateLicense(licenseKey) {
    try {
      // Validate license key format
      if (!this.isValidLicenseKeyFormat(licenseKey)) {
        throw new Error('Format de clé de licence invalide')
      }

      // Decrypt and validate license
      const licenseData = this.decryptLicense(licenseKey)
      
      if (!licenseData) {
        throw new Error('Clé de licence invalide')
      }

      // Check if license is expired
      if (licenseData.expiresAt && new Date(licenseData.expiresAt) < new Date()) {
        throw new Error('Cette licence a expiré')
      }

      // Check device binding if present
      if (licenseData.deviceId && licenseData.deviceId !== this.getDeviceId()) {
        throw new Error('Cette licence est liée à un autre appareil')
      }

      // Save license
      localStorage.setItem(this.LICENSE_KEY, JSON.stringify(licenseData))
      
      // Clear trial
      localStorage.removeItem(this.TRIAL_KEY)

      console.log('✅ License activated successfully')
      return {
        success: true,
        license: licenseData
      }

    } catch (error) {
      console.error('License activation failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  static validateLicense(license) {
    if (!license) return false

    // Check expiration
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return false
    }

    // Check device binding
    if (license.deviceId && license.deviceId !== this.getDeviceId()) {
      return false
    }

    return true
  }

  static isValidLicenseKeyFormat(key) {
    // Expected format: XXXX-XXXX-XXXX-XXXX (base64 encoded data)
    const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
    return pattern.test(key)
  }

  static decryptLicense(licenseKey) {
    try {
      // Remove dashes and decode
      const cleanKey = licenseKey.replace(/-/g, '')
      const encrypted = atob(cleanKey)
      
      // Decrypt using AES
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.SECRET_KEY).toString(CryptoJS.enc.Utf8)
      
      if (!decrypted) return null
      
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('License decryption failed:', error)
      return null
    }
  }

  static generateLicense(options = {}) {
    const license = {
      type: options.type || 'full',
      issuedAt: new Date().toISOString(),
      expiresAt: options.expiresAt || null, // null = lifetime
      deviceId: options.deviceId || null, // null = any device
      features: options.features || ['all'],
      issuer: 'SamaFacture'
    }

    // Encrypt license
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(license), this.SECRET_KEY).toString()
    
    // Encode and format
    const encoded = btoa(encrypted)
    const formatted = encoded.match(/.{1,4}/g).join('-')
    
    return {
      key: formatted,
      license: license
    }
  }

  static getDeviceId() {
    let deviceId = localStorage.getItem('samafacture-device-id')
    
    if (!deviceId) {
      // Generate a unique device ID based on browser characteristics
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('Device fingerprint', 2, 2)
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
      ].join('|')
      
      deviceId = CryptoJS.SHA256(fingerprint).toString()
      localStorage.setItem('samafacture-device-id', deviceId)
    }
    
    return deviceId
  }

  static getDaysUntilExpiration(expiresAt) {
    if (!expiresAt) return null // Lifetime license
    
    const now = new Date()
    const expires = new Date(expiresAt)
    const diffTime = expires - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  static revokeLicense() {
    localStorage.removeItem(this.LICENSE_KEY)
    console.log('License revoked')
  }

  static resetTrial() {
    localStorage.removeItem(this.TRIAL_KEY)
    console.log('Trial reset')
  }

  static getLicenseInfo() {
    const license = this.getLicense()
    const trial = this.getTrial()
    
    if (license && this.validateLicense(license)) {
      return {
        type: 'license',
        isValid: true,
        expiresAt: license.expiresAt,
        daysLeft: this.getDaysUntilExpiration(license.expiresAt),
        features: license.features || ['all']
      }
    }
    
    if (trial && this.isTrialValid(trial)) {
      return {
        type: 'trial',
        isValid: true,
        expiresAt: trial.expiresAt,
        daysLeft: this.getTrialDaysLeft(trial),
        features: ['basic']
      }
    }
    
    return {
      type: 'none',
      isValid: false,
      daysLeft: 0,
      features: []
    }
  }
}

