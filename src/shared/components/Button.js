/**
 * Button Component - Reusable button with variants
 */
export class Button {
  static create(options = {}) {
    const {
      text = '',
      variant = 'primary',
      size = 'md',
      icon = null,
      onClick = () => {},
      disabled = false,
      type = 'button',
      className = ''
    } = options

    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      warning: 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
      ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-blue-500'
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }

    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

    const button = document.createElement('button')
    button.type = type
    button.className = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`
    button.disabled = disabled

    if (icon) {
      const iconEl = document.createElement('span')
      iconEl.innerHTML = icon
      iconEl.className = text ? 'mr-2' : ''
      button.appendChild(iconEl)
    }

    if (text) {
      const textEl = document.createElement('span')
      textEl.textContent = text
      button.appendChild(textEl)
    }

    button.addEventListener('click', onClick)

    return button
  }
}

