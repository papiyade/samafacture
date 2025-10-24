/**
 * Credential Generator - Generates secure login credentials for companies
 */
export class CredentialGenerator {
  
  /**
   * Generate a unique username based on company name
   * @param {string} companyName - The company name
   * @param {Array} existingUsernames - Array of existing usernames to avoid duplicates
   * @returns {string} Generated username
   */
  static generateUsername(companyName, existingUsernames = []) {
    // Clean company name: remove special chars, spaces, accents
    let baseUsername = companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric
      .substring(0, 12) // Limit length
    
    // Ensure minimum length
    if (baseUsername.length < 3) {
      baseUsername = 'company' + baseUsername
    }
    
    let username = baseUsername
    let counter = 1
    
    // Check for uniqueness and add counter if needed
    while (existingUsernames.includes(username)) {
      username = baseUsername + counter
      counter++
    }
    
    return username
  }

  /**
   * Generate a secure password
   * @param {number} length - Password length (default: 12)
   * @param {boolean} includeSymbols - Include special symbols (default: true)
   * @returns {string} Generated password
   */
  static generatePassword(length = 12, includeSymbols = true) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = includeSymbols ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : ''
    
    const allChars = lowercase + uppercase + numbers + symbols
    
    let password = ''
    
    // Ensure at least one character from each category
    password += this.getRandomChar(lowercase)
    password += this.getRandomChar(uppercase)
    password += this.getRandomChar(numbers)
    if (includeSymbols) {
      password += this.getRandomChar(symbols)
    }
    
    // Fill the rest randomly
    const remainingLength = length - password.length
    for (let i = 0; i < remainingLength; i++) {
      password += this.getRandomChar(allChars)
    }
    
    // Shuffle the password
    return this.shuffleString(password)
  }

  /**
   * Generate a memorable password (easier to communicate)
   * @returns {string} Generated memorable password
   */
  static generateMemorablePassword() {
    const adjectives = [
      'Rapide', 'Solide', 'Brillant', 'Moderne', 'Efficace',
      'Puissant', 'Elegant', 'Dynamique', 'Robuste', 'Innovant'
    ]
    
    const nouns = [
      'Lion', 'Aigle', 'Baobab', 'Soleil', 'Ocean',
      'Montagne', 'Etoile', 'Diamant', 'Faucon', 'Leopard'
    ]
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const number = Math.floor(Math.random() * 99) + 1
    
    return `${adjective}${noun}${number}`
  }

  /**
   * Hash a password using a simple but secure method
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    // Use Web Crypto API for hashing
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'samafacture_salt_2024')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Verify a password against its hash
   * @param {string} password - Plain text password
   * @param {string} hash - Stored hash
   * @returns {Promise<boolean>} True if password matches
   */
  static async verifyPassword(password, hash) {
    const newHash = await this.hashPassword(password)
    return newHash === hash
  }

  /**
   * Generate complete credentials for a company
   * @param {string} companyName - Company name
   * @param {Array} existingUsernames - Existing usernames to avoid duplicates
   * @param {boolean} memorablePassword - Use memorable password format
   * @returns {Object} Generated credentials
   */
  static async generateCredentials(companyName, existingUsernames = [], memorablePassword = false) {
    const username = this.generateUsername(companyName, existingUsernames)
    const password = memorablePassword 
      ? this.generateMemorablePassword()
      : this.generatePassword()
    const passwordHash = await this.hashPassword(password)
    
    return {
      username,
      password, // Plain text for display (will be shown once)
      passwordHash, // Hashed for storage
      generatedAt: new Date().toISOString()
    }
  }

  /**
   * Regenerate password for existing username
   * @param {boolean} memorablePassword - Use memorable password format
   * @returns {Object} New password data
   */
  static async regeneratePassword(memorablePassword = false) {
    const password = memorablePassword 
      ? this.generateMemorablePassword()
      : this.generatePassword()
    const passwordHash = await this.hashPassword(password)
    
    return {
      password,
      passwordHash,
      regeneratedAt: new Date().toISOString()
    }
  }

  // Helper methods
  static getRandomChar(chars) {
    return chars.charAt(Math.floor(Math.random() * chars.length))
  }

  static shuffleString(str) {
    const arr = str.split('')
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr.join('')
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  static validatePasswordStrength(password) {
    const result = {
      isValid: true,
      score: 0,
      feedback: []
    }

    if (password.length < 8) {
      result.isValid = false
      result.feedback.push('Le mot de passe doit contenir au moins 8 caractères')
    } else {
      result.score += 1
    }

    if (!/[a-z]/.test(password)) {
      result.feedback.push('Ajouter des lettres minuscules')
    } else {
      result.score += 1
    }

    if (!/[A-Z]/.test(password)) {
      result.feedback.push('Ajouter des lettres majuscules')
    } else {
      result.score += 1
    }

    if (!/[0-9]/.test(password)) {
      result.feedback.push('Ajouter des chiffres')
    } else {
      result.score += 1
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      result.feedback.push('Ajouter des caractères spéciaux')
    } else {
      result.score += 1
    }

    if (result.score < 3) {
      result.isValid = false
    }

    return result
  }
}

