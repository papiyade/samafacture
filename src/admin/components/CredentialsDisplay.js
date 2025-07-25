/**
 * Credentials Display Component - Shows generated credentials to admin
 */
export class CredentialsDisplay {
  constructor() {
    this.isOpen = false
    this.credentials = null
    this.companyName = ''
    this.onClose = null
  }

  /**
   * Show credentials modal
   * @param {Object} credentials - Generated credentials
   * @param {string} companyName - Company name
   * @param {Function} onClose - Callback when modal is closed
   */
  show(credentials, companyName, onClose) {
    this.credentials = credentials
    this.companyName = companyName
    this.onClose = onClose
    this.isOpen = true
    this.render()
    this.setupEventListeners()
  }

  hide() {
    this.isOpen = false
    const modal = document.getElementById('credentials-modal')
    if (modal) {
      modal.remove()
    }
  }

  render() {
    // Remove existing modal if any
    const existingModal = document.getElementById('credentials-modal')
    if (existingModal) {
      existingModal.remove()
    }

    const modalHtml = `
      <div id="credentials-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center">
              <div class="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Entreprise créée avec succès !
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Identifiants de connexion pour ${this.companyName}
                </p>
              </div>
            </div>
            <button id="close-credentials-modal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="mt-6">
            
            <!-- Warning Notice -->
            <div class="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 mb-6">
              <div class="flex">
                <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Important !
                  </h3>
                  <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>Ces identifiants ne seront affichés qu'une seule fois. Assurez-vous de les communiquer au client avant de fermer cette fenêtre.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Credentials Display -->
            <div class="space-y-4">
              
              <!-- Username -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom d'utilisateur
                </label>
                <div class="flex items-center space-x-2">
                  <input type="text" id="username-display" readonly
                         class="form-input flex-1 bg-white dark:bg-gray-800 font-mono text-lg"
                         value="${this.credentials.username}">
                  <button id="copy-username" class="btn btn-sm btn-secondary" title="Copier le nom d'utilisateur">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Password -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe
                </label>
                <div class="flex items-center space-x-2">
                  <input type="text" id="password-display" readonly
                         class="form-input flex-1 bg-white dark:bg-gray-800 font-mono text-lg"
                         value="${this.credentials.password}">
                  <button id="copy-password" class="btn btn-sm btn-secondary" title="Copier le mot de passe">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Copy All Button -->
              <div class="flex justify-center">
                <button id="copy-all-credentials" class="btn btn-primary">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  Copier tous les identifiants
                </button>
              </div>

            </div>

            <!-- Instructions -->
            <div class="mt-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md p-4">
              <div class="flex">
                <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Instructions pour le client
                  </h3>
                  <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <ol class="list-decimal list-inside space-y-1">
                      <li>Accéder à l'interface client de SamaFacture</li>
                      <li>Utiliser ces identifiants pour se connecter</li>
                      <li>Modifier le mot de passe lors de la première connexion (recommandé)</li>
                      <li>Configurer les informations de l'entreprise dans les paramètres</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <div class="flex space-x-3">
                <button id="print-credentials" class="btn btn-secondary">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                  </svg>
                  Imprimer
                </button>
                <button id="email-credentials" class="btn btn-secondary">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Envoyer par email
                </button>
              </div>
              <button id="close-credentials" class="btn btn-primary">
                Fermer
              </button>
            </div>

          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  setupEventListeners() {
    const modal = document.getElementById('credentials-modal')
    const closeBtn = document.getElementById('close-credentials-modal')
    const closeCredentialsBtn = document.getElementById('close-credentials')
    const copyUsernameBtn = document.getElementById('copy-username')
    const copyPasswordBtn = document.getElementById('copy-password')
    const copyAllBtn = document.getElementById('copy-all-credentials')
    const printBtn = document.getElementById('print-credentials')
    const emailBtn = document.getElementById('email-credentials')

    // Close modal events
    closeBtn?.addEventListener('click', () => this.handleClose())
    closeCredentialsBtn?.addEventListener('click', () => this.handleClose())

    // Click outside to close
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.handleClose()
      }
    })

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.handleClose()
      }
    })

    // Copy buttons
    copyUsernameBtn?.addEventListener('click', () => this.copyToClipboard(this.credentials.username, 'Nom d\'utilisateur copié !'))
    copyPasswordBtn?.addEventListener('click', () => this.copyToClipboard(this.credentials.password, 'Mot de passe copié !'))
    copyAllBtn?.addEventListener('click', () => this.copyAllCredentials())

    // Action buttons
    printBtn?.addEventListener('click', () => this.printCredentials())
    emailBtn?.addEventListener('click', () => this.emailCredentials())
  }

  async copyToClipboard(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text)
      this.showToast(successMessage, 'success')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      this.showToast('Erreur lors de la copie', 'error')
    }
  }

  async copyAllCredentials() {
    const credentialsText = `Identifiants SamaFacture - ${this.companyName}
    
Nom d'utilisateur: ${this.credentials.username}
Mot de passe: ${this.credentials.password}

Instructions:
1. Accéder à l'interface client de SamaFacture
2. Utiliser ces identifiants pour se connecter
3. Modifier le mot de passe lors de la première connexion (recommandé)
4. Configurer les informations de l'entreprise dans les paramètres

IMPORTANT: Conservez ces identifiants en lieu sûr.`

    await this.copyToClipboard(credentialsText, 'Tous les identifiants copiés !')
  }

  printCredentials() {
    const printWindow = window.open('', '_blank')
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Identifiants SamaFacture - ${this.companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .credentials { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .credential-item { margin: 15px 0; }
          .credential-label { font-weight: bold; }
          .credential-value { font-family: monospace; font-size: 16px; background: white; padding: 8px; border: 1px solid #ddd; }
          .instructions { margin-top: 30px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SamaFacture</h1>
          <h2>Identifiants de connexion</h2>
          <p><strong>Entreprise:</strong> ${this.companyName}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        
        <div class="warning">
          <strong>CONFIDENTIEL:</strong> Ces identifiants sont strictement personnels et ne doivent pas être partagés.
        </div>
        
        <div class="credentials">
          <div class="credential-item">
            <div class="credential-label">Nom d'utilisateur:</div>
            <div class="credential-value">${this.credentials.username}</div>
          </div>
          <div class="credential-item">
            <div class="credential-label">Mot de passe:</div>
            <div class="credential-value">${this.credentials.password}</div>
          </div>
        </div>
        
        <div class="instructions">
          <h3>Instructions:</h3>
          <ol>
            <li>Accéder à l'interface client de SamaFacture</li>
            <li>Utiliser ces identifiants pour se connecter</li>
            <li>Modifier le mot de passe lors de la première connexion (recommandé)</li>
            <li>Configurer les informations de l'entreprise dans les paramètres</li>
          </ol>
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
          Document généré automatiquement par SamaFacture Admin
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  emailCredentials() {
    // TODO: Implement email functionality
    this.showToast('Fonctionnalité d\'envoi par email à implémenter', 'info')
  }

  showToast(message, type = 'info') {
    const toastId = 'toast-' + Date.now()
    const bgColor = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }[type] || 'bg-blue-500'

    const toast = `
      <div id="${toastId}" class="fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full">
        <div class="flex items-center">
          <span>${message}</span>
          <button onclick="document.getElementById('${toastId}').remove()" class="ml-4 text-white hover:text-gray-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', toast)
    
    // Animate in
    setTimeout(() => {
      const toastElement = document.getElementById(toastId)
      if (toastElement) {
        toastElement.classList.remove('translate-x-full')
      }
    }, 100)

    // Auto remove after 5 seconds
    setTimeout(() => {
      const toastElement = document.getElementById(toastId)
      if (toastElement) {
        toastElement.classList.add('translate-x-full')
        setTimeout(() => toastElement.remove(), 300)
      }
    }, 5000)
  }

  handleClose() {
    if (this.onClose) {
      this.onClose()
    }
    this.hide()
  }
}

