/**
 * Notification Service - Manages toast notifications
 */
export class NotificationService {
  static notifications = []
  static container = null

  static init() {
    this.createContainer()
  }

  static createContainer() {
    if (this.container) return

    this.container = document.createElement('div')
    this.container.id = 'notification-container'
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2'
    document.body.appendChild(this.container)
  }

  static show(message, type = 'info', duration = 5000) {
    this.createContainer()

    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration
    }

    this.notifications.push(notification)
    this.renderNotification(notification)

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification.id)
      }, duration)
    }

    return notification.id
  }

  static renderNotification(notification) {
    const element = document.createElement('div')
    element.id = `notification-${notification.id}`
    element.className = this.getNotificationClasses(notification.type)
    
    element.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          ${this.getIcon(notification.type)}
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            ${notification.message}
          </p>
        </div>
        <div class="ml-auto pl-3">
          <div class="-mx-1.5 -my-1.5">
            <button type="button" onclick="NotificationService.remove(${notification.id})" class="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-gray-100 dark:hover:bg-gray-700">
              <span class="sr-only">Fermer</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `

    // Add animation
    element.style.transform = 'translateX(100%)'
    element.style.opacity = '0'
    this.container.appendChild(element)

    // Animate in
    requestAnimationFrame(() => {
      element.style.transition = 'all 0.3s ease-out'
      element.style.transform = 'translateX(0)'
      element.style.opacity = '1'
    })
  }

  static getNotificationClasses(type) {
    const baseClasses = 'max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden'
    
    const typeClasses = {
      success: 'border-l-4 border-green-400',
      error: 'border-l-4 border-red-400',
      warning: 'border-l-4 border-yellow-400',
      info: 'border-l-4 border-blue-400'
    }

    return `${baseClasses} ${typeClasses[type] || typeClasses.info} p-4`
  }

  static getIcon(type) {
    const icons = {
      success: `
        <svg class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `,
      error: `
        <svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `,
      warning: `
        <svg class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      `,
      info: `
        <svg class="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `
    }

    return icons[type] || icons.info
  }

  static remove(id) {
    const element = document.getElementById(`notification-${id}`)
    if (element) {
      // Animate out
      element.style.transition = 'all 0.3s ease-in'
      element.style.transform = 'translateX(100%)'
      element.style.opacity = '0'

      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      }, 300)
    }

    // Remove from array
    this.notifications = this.notifications.filter(n => n.id !== id)
  }

  static clear() {
    this.notifications.forEach(notification => {
      this.remove(notification.id)
    })
  }

  // Convenience methods
  static success(message, duration = 5000) {
    return this.show(message, 'success', duration)
  }

  static error(message, duration = 7000) {
    return this.show(message, 'error', duration)
  }

  static warning(message, duration = 6000) {
    return this.show(message, 'warning', duration)
  }

  static info(message, duration = 5000) {
    return this.show(message, 'info', duration)
  }
}

// Make it globally available for onclick handlers
window.NotificationService = NotificationService

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  NotificationService.init()
})

