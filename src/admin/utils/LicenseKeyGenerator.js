import { Logger } from './Logger.js'

/**
 * License Key Generator - Générateur de clés de licence sécurisé
 * Utilise des algorithmes cryptographiques pour générer des clés uniques et vérifiables
 */
export class LicenseKeyGenerator {
  
  // Configuration des formats de clés
  static KEY_FORMATS = {
    TRIAL: {
      prefix: 'SAMA-T',
      length: 16,
      segments: 4,
      segmentLength: 4,
      separator: '-'
    },
    BASIC: {
      prefix: 'SAMA-B',
      length: 20,
      segments: 5,
      segmentLength: 4,
      separator: '-'
    },
    PREMIUM: {
      prefix: 'SAMA-P',
      length: 24,
      segments: 6,
      segmentLength: 4,
      separator: '-'
    },
    ENTERPRISE: {
      prefix: 'SAMA-E',
      length: 32,
      segments: 8,
      segmentLength: 4,
      separator: '-'
    }
  }
  
  // Caractères autorisés (évite les caractères ambigus)
  static CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  
  // Salt pour le hachage (à changer en production)
  static SALT = 'SamaFacture2024_LicenseKey_Salt'
  
  /**
   * Générer une clé de licence
   * @param {string} licenseType - Type de licence
   * @param {number} companyId - ID de l'entreprise
   * @param {Object} customData - Données personnalisées
   * @returns {Promise<string>} Clé de licence générée
   */
  static async generateLicenseKey(licenseType, companyId, customData = {}) {
    try {
      Logger.info('Generating license key', { licenseType, companyId })
      
      // Validation des paramètres
      if (!this.KEY_FORMATS[licenseType]) {
        throw new Error(`Type de licence non supporté: ${licenseType}`)
      }
      
      if (!companyId || !Number.isInteger(companyId)) {
        throw new Error('ID entreprise invalide')
      }
      
      const format = this.KEY_FORMATS[licenseType]
      
      // Génération des données de base
      const timestamp = Date.now()
      const random = this.generateSecureRandom(8)
      
      // Création du payload pour le hachage
      const payload = {
        type: licenseType,
        companyId: companyId,
        timestamp: timestamp,
        random: random,
        ...customData
      }
      
      // Génération du hash de vérification
      const hash = await this.generateHash(JSON.stringify(payload))
      
      // Extraction des caractères pour la clé
      const keyData = this.extractKeyData(hash, format.length - format.prefix.length - format.segments + 1)
      
      // Formatage de la clé
      const formattedKey = this.formatKey(keyData, format)
      
      // Ajout du checksum
      const checksum = await this.generateChecksum(formattedKey)
      const finalKey = `${format.prefix}${format.separator}${formattedKey}${format.separator}${checksum}`
      
      // Vérification de l'unicité (optionnel, peut être fait côté service)
      Logger.debug('License key generated', { 
        type: licenseType, 
        companyId, 
        keyLength: finalKey.length 
      })
      
      return finalKey
      
    } catch (error) {
      Logger.error('Error generating license key', { 
        licenseType, 
        companyId, 
        error: error.message 
      })
      throw error
    }
  }
  
  /**
   * Valider une clé de licence (vérification du format et checksum)
   * @param {string} licenseKey - Clé à valider
   * @returns {Promise<Object>} Résultat de validation
   */
  static async validateKeyFormat(licenseKey) {
    try {
      if (!licenseKey || typeof licenseKey !== 'string') {
        return {
          valid: false,
          error: 'INVALID_FORMAT',
          message: 'Clé de licence invalide'
        }
      }
      
      // Extraction du préfixe
      const parts = licenseKey.split('-')
      if (parts.length < 3) {
        return {
          valid: false,
          error: 'INVALID_FORMAT',
          message: 'Format de clé invalide'
        }
      }
      
      const prefix = `${parts[0]}-${parts[1]}`
      const licenseType = this.getLicenseTypeFromPrefix(prefix)
      
      if (!licenseType) {
        return {
          valid: false,
          error: 'UNKNOWN_TYPE',
          message: 'Type de licence non reconnu'
        }
      }
      
      const format = this.KEY_FORMATS[licenseType]
      
      // Vérification de la longueur
      const expectedLength = format.prefix.length + 1 + format.length + 1 + 4 // +1 pour séparateurs, +4 pour checksum
      if (licenseKey.length !== expectedLength) {
        return {
          valid: false,
          error: 'INVALID_LENGTH',
          message: 'Longueur de clé invalide'
        }
      }
      
      // Extraction du checksum
      const checksum = parts[parts.length - 1]
      const keyWithoutChecksum = licenseKey.substring(0, licenseKey.lastIndexOf('-'))
      
      // Vérification du checksum
      const expectedChecksum = await this.generateChecksum(keyWithoutChecksum.replace(prefix + '-', ''))
      
      if (checksum !== expectedChecksum) {
        return {
          valid: false,
          error: 'INVALID_CHECKSUM',
          message: 'Checksum invalide'
        }
      }
      
      return {
        valid: true,
        type: licenseType,
        prefix: prefix,
        checksum: checksum
      }
      
    } catch (error) {
      Logger.error('Error validating key format', { licenseKey, error: error.message })
      return {
        valid: false,
        error: 'VALIDATION_ERROR',
        message: 'Erreur lors de la validation'
      }
    }
  }
  
  /**
   * Extraire les informations d'une clé de licence
   * @param {string} licenseKey - Clé de licence
   * @returns {Object} Informations extraites
   */
  static extractKeyInfo(licenseKey) {
    try {
      const parts = licenseKey.split('-')
      if (parts.length < 3) {
        return null
      }
      
      const prefix = `${parts[0]}-${parts[1]}`
      const licenseType = this.getLicenseTypeFromPrefix(prefix)
      
      return {
        type: licenseType,
        prefix: prefix,
        segments: parts.slice(2, -1), // Tous les segments sauf le checksum
        checksum: parts[parts.length - 1],
        fullKey: licenseKey
      }
      
    } catch (error) {
      Logger.error('Error extracting key info', { licenseKey, error: error.message })
      return null
    }
  }
  
  /**
   * Générer un hash sécurisé
   * @param {string} data - Données à hacher
   * @returns {Promise<string>} Hash généré
   */
  static async generateHash(data) {
    try {
      const encoder = new TextEncoder()
      const dataWithSalt = data + this.SALT
      const dataBuffer = encoder.encode(dataWithSalt)
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
    } catch (error) {
      Logger.error('Error generating hash', { error: error.message })
      throw new Error('Erreur lors de la génération du hash')
    }
  }
  
  /**
   * Générer un checksum pour une clé
   * @param {string} key - Clé sans checksum
   * @returns {Promise<string>} Checksum généré
   */
  static async generateChecksum(key) {
    try {
      const hash = await this.generateHash(key)
      
      // Extraction de 4 caractères du hash et conversion vers le charset
      let checksum = ''
      for (let i = 0; i < 4; i++) {
        const hexPair = hash.substring(i * 2, i * 2 + 2)
        const value = parseInt(hexPair, 16)
        checksum += this.CHARSET[value % this.CHARSET.length]
      }
      
      return checksum
      
    } catch (error) {
      Logger.error('Error generating checksum', { key, error: error.message })
      throw new Error('Erreur lors de la génération du checksum')
    }
  }
  
  /**
   * Générer des données aléatoires sécurisées
   * @param {number} length - Longueur des données
   * @returns {string} Données aléatoires
   */
  static generateSecureRandom(length) {
    try {
      const array = new Uint8Array(length)
      crypto.getRandomValues(array)
      
      let result = ''
      for (let i = 0; i < length; i++) {
        result += this.CHARSET[array[i] % this.CHARSET.length]
      }
      
      return result
      
    } catch (error) {
      Logger.error('Error generating secure random', { length, error: error.message })
      throw new Error('Erreur lors de la génération aléatoire')
    }
  }
  
  /**
   * Extraire les données de clé depuis un hash
   * @param {string} hash - Hash source
   * @param {number} length - Longueur désirée
   * @returns {string} Données extraites
   */
  static extractKeyData(hash, length) {
    let keyData = ''
    
    for (let i = 0; i < length && i * 2 < hash.length; i++) {
      const hexPair = hash.substring(i * 2, i * 2 + 2)
      const value = parseInt(hexPair, 16)
      keyData += this.CHARSET[value % this.CHARSET.length]
    }
    
    // Si pas assez de données, compléter avec des données aléatoires
    while (keyData.length < length) {
      keyData += this.generateSecureRandom(1)
    }
    
    return keyData.substring(0, length)
  }
  
  /**
   * Formater une clé selon le format spécifié
   * @param {string} keyData - Données de la clé
   * @param {Object} format - Format de clé
   * @returns {string} Clé formatée
   */
  static formatKey(keyData, format) {
    const segments = []
    
    for (let i = 0; i < format.segments - 1; i++) {
      const start = i * format.segmentLength
      const end = start + format.segmentLength
      segments.push(keyData.substring(start, end))
    }
    
    return segments.join(format.separator)
  }
  
  /**
   * Obtenir le type de licence depuis le préfixe
   * @param {string} prefix - Préfixe de la clé
   * @returns {string|null} Type de licence
   */
  static getLicenseTypeFromPrefix(prefix) {
    for (const [type, format] of Object.entries(this.KEY_FORMATS)) {
      if (format.prefix === prefix) {
        return type
      }
    }
    return null
  }
  
  /**
   * Générer une clé de licence temporaire (pour tests)
   * @param {string} licenseType - Type de licence
   * @returns {Promise<string>} Clé temporaire
   */
  static async generateTemporaryKey(licenseType = 'TRIAL') {
    try {
      const tempCompanyId = Math.floor(Math.random() * 1000) + 9000 // ID temporaire
      const customData = {
        temporary: true,
        generatedAt: new Date().toISOString()
      }
      
      const key = await this.generateLicenseKey(licenseType, tempCompanyId, customData)
      
      Logger.debug('Temporary license key generated', { licenseType, key })
      return key
      
    } catch (error) {
      Logger.error('Error generating temporary key', { licenseType, error: error.message })
      throw error
    }
  }
  
  /**
   * Générer plusieurs clés en lot
   * @param {Array} requests - Tableau de requêtes de génération
   * @returns {Promise<Array>} Clés générées
   */
  static async generateBatch(requests) {
    try {
      Logger.info('Generating license keys batch', { count: requests.length })
      
      const results = []
      
      for (const request of requests) {
        try {
          const key = await this.generateLicenseKey(
            request.licenseType,
            request.companyId,
            request.customData
          )
          
          results.push({
            success: true,
            key: key,
            request: request
          })
          
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            request: request
          })
        }
      }
      
      const successCount = results.filter(r => r.success).length
      Logger.success('License keys batch generated', { 
        total: requests.length, 
        success: successCount, 
        failed: requests.length - successCount 
      })
      
      return results
      
    } catch (error) {
      Logger.error('Error generating license keys batch', { error: error.message })
      throw error
    }
  }
  
  /**
   * Vérifier l'unicité d'une clé (à utiliser avec une base de données)
   * @param {string} licenseKey - Clé à vérifier
   * @param {Function} checkFunction - Fonction de vérification
   * @returns {Promise<boolean>} True si unique
   */
  static async isKeyUnique(licenseKey, checkFunction) {
    try {
      if (typeof checkFunction !== 'function') {
        throw new Error('Fonction de vérification requise')
      }
      
      const exists = await checkFunction(licenseKey)
      return !exists
      
    } catch (error) {
      Logger.error('Error checking key uniqueness', { licenseKey, error: error.message })
      return false
    }
  }
  
  /**
   * Obtenir les statistiques du générateur
   * @returns {Object} Statistiques
   */
  static getGeneratorStats() {
    return {
      supportedTypes: Object.keys(this.KEY_FORMATS),
      charsetLength: this.CHARSET.length,
      charset: this.CHARSET,
      formats: this.KEY_FORMATS
    }
  }
}
