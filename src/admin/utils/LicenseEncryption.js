/**
 * License Encryption Utility - Handles license file encryption/decryption
 */
export class LicenseEncryption {
  // Simple encryption key (in production, use environment variable)
  static ENCRYPTION_KEY = 'SamaFacture2024!@#$%^&*()_+License'
  
  /**
   * Encrypt license data
   * @param {Object} licenseData - License information to encrypt
   * @returns {string} Encrypted license string
   */
  static encrypt(licenseData) {
    try {
      // Add timestamp and signature for validation
      const dataToEncrypt = {
        ...licenseData,
        timestamp: Date.now(),
        signature: this.generateSignature(licenseData)
      }
      
      const jsonString = JSON.stringify(dataToEncrypt)
      const encrypted = this.simpleEncrypt(jsonString, this.ENCRYPTION_KEY)
      
      return this.base64Encode(encrypted)
    } catch (error) {
      console.error('Error encrypting license:', error)
      throw new Error('Erreur lors du chiffrement de la licence')
    }
  }
  
  /**
   * Decrypt license data
   * @param {string} encryptedLicense - Encrypted license string
   * @returns {Object} Decrypted license data
   */
  static decrypt(encryptedLicense) {
    try {
      const decodedData = this.base64Decode(encryptedLicense)
      const decryptedString = this.simpleDecrypt(decodedData, this.ENCRYPTION_KEY)
      const licenseData = JSON.parse(decryptedString)
      
      // Validate signature
      if (!this.validateSignature(licenseData)) {
        throw new Error('Signature de licence invalide')
      }
      
      // Remove internal fields
      const { timestamp, signature, ...cleanLicenseData } = licenseData
      
      return {
        ...cleanLicenseData,
        decryptedAt: new Date(),
        originalTimestamp: new Date(timestamp)
      }
    } catch (error) {
      console.error('Error decrypting license:', error)
      throw new Error('Licence invalide ou corrompue')
    }
  }
  
  /**
   * Generate license file content
   * @param {Object} licenseData - License information
   * @returns {string} License file content
   */
  static generateLicenseFile(licenseData) {
    const encryptedData = this.encrypt(licenseData)
    
    return `# SamaFacture License File
# Generated on: ${new Date().toISOString()}
# Company: ${licenseData.companyName}
# License Type: ${licenseData.licenseType}
# DO NOT MODIFY THIS FILE

-----BEGIN SAMAFACTURE LICENSE-----
${this.formatLicenseData(encryptedData)}
-----END SAMAFACTURE LICENSE-----

# License Information:
# Company ID: ${licenseData.companyId}
# Expires: ${licenseData.expiresAt}
# Features: ${licenseData.features ? licenseData.features.join(', ') : 'Standard'}
`
  }
  
  /**
   * Parse license file content
   * @param {string} fileContent - License file content
   * @returns {Object} Parsed license data
   */
  static parseLicenseFile(fileContent) {
    try {
      // Extract encrypted data between markers
      const startMarker = '-----BEGIN SAMAFACTURE LICENSE-----'
      const endMarker = '-----END SAMAFACTURE LICENSE-----'
      
      const startIndex = fileContent.indexOf(startMarker)
      const endIndex = fileContent.indexOf(endMarker)
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error('Format de fichier de licence invalide')
      }
      
      const encryptedData = fileContent
        .substring(startIndex + startMarker.length, endIndex)
        .replace(/\s/g, '') // Remove whitespace
      
      return this.decrypt(encryptedData)
    } catch (error) {
      console.error('Error parsing license file:', error)
      throw new Error('Fichier de licence invalide')
    }
  }
  
  /**
   * Validate license data
   * @param {Object} licenseData - License data to validate
   * @returns {Object} Validation result
   */
  static validateLicense(licenseData) {
    const now = new Date()
    const expiresAt = new Date(licenseData.expiresAt)
    
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      status: 'ACTIVE'
    }
    
    // Check expiration
    if (expiresAt < now) {
      validation.isValid = false
      validation.errors.push('Licence expirée')
      validation.status = 'EXPIRED'
    } else if (expiresAt.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      validation.warnings.push('Licence expire dans moins de 7 jours')
    }
    
    // Check required fields
    const requiredFields = ['companyId', 'companyName', 'licenseType', 'licenseKey']
    requiredFields.forEach(field => {
      if (!licenseData[field]) {
        validation.isValid = false
        validation.errors.push(`Champ requis manquant: ${field}`)
      }
    })
    
    // Check license status
    if (licenseData.status === 'SUSPENDED') {
      validation.isValid = false
      validation.errors.push('Licence suspendue')
      validation.status = 'SUSPENDED'
    }
    
    return validation
  }
  
  /**
   * Generate signature for license data
   * @param {Object} data - Data to sign
   * @returns {string} Signature
   */
  static generateSignature(data) {
    const signatureData = {
      companyId: data.companyId,
      licenseKey: data.licenseKey,
      expiresAt: data.expiresAt
    }
    
    return this.simpleHash(JSON.stringify(signatureData) + this.ENCRYPTION_KEY)
  }
  
  /**
   * Validate signature
   * @param {Object} licenseData - License data with signature
   * @returns {boolean} Is signature valid
   */
  static validateSignature(licenseData) {
    const expectedSignature = this.generateSignature(licenseData)
    return licenseData.signature === expectedSignature
  }
  
  /**
   * Simple encryption (XOR-based)
   * @param {string} text - Text to encrypt
   * @param {string} key - Encryption key
   * @returns {string} Encrypted text
   */
  static simpleEncrypt(text, key) {
    let result = ''
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    return result
  }
  
  /**
   * Simple decryption (XOR-based)
   * @param {string} encryptedText - Text to decrypt
   * @param {string} key - Decryption key
   * @returns {string} Decrypted text
   */
  static simpleDecrypt(encryptedText, key) {
    return this.simpleEncrypt(encryptedText, key) // XOR is symmetric
  }
  
  /**
   * Base64 encode
   * @param {string} text - Text to encode
   * @returns {string} Base64 encoded text
   */
  static base64Encode(text) {
    return btoa(unescape(encodeURIComponent(text)))
  }
  
  /**
   * Base64 decode
   * @param {string} encodedText - Base64 encoded text
   * @returns {string} Decoded text
   */
  static base64Decode(encodedText) {
    return decodeURIComponent(escape(atob(encodedText)))
  }
  
  /**
   * Simple hash function
   * @param {string} text - Text to hash
   * @returns {string} Hash
   */
  static simpleHash(text) {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }
  
  /**
   * Format license data for file output
   * @param {string} data - Data to format
   * @returns {string} Formatted data
   */
  static formatLicenseData(data) {
    // Split into 64-character lines for readability
    const lines = []
    for (let i = 0; i < data.length; i += 64) {
      lines.push(data.substring(i, i + 64))
    }
    return lines.join('\n')
  }
  
  /**
   * Generate license key
   * @param {number} companyId - Company ID
   * @param {string} licenseType - License type
   * @returns {string} License key
   */
  static generateLicenseKey(companyId, licenseType) {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    const typeCode = licenseType.substring(0, 2).toUpperCase()
    
    return `SF-${typeCode}-${companyId}-${timestamp}-${random}`.toUpperCase()
  }
}

