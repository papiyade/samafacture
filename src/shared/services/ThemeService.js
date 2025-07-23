/**
 * Theme Service - Manages dark/light theme switching
 */
export class ThemeService {
  static THEME_KEY = 'samafacture-theme'
  static THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
  }

  static init() {
    this.applyTheme(this.getTheme())
    this.setupSystemThemeListener()
  }

  static getTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY)
    return savedTheme || this.THEMES.SYSTEM
  }

  static setTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme)
    this.applyTheme(theme)
    this.notifyThemeChange(theme)
  }

  static applyTheme(theme) {
    const root = document.documentElement
    
    if (theme === this.THEMES.DARK) {
      root.classList.add('dark')
    } else if (theme === this.THEMES.LIGHT) {
      root.classList.remove('dark')
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  static setupSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (this.getTheme() === this.THEMES.SYSTEM) {
        this.applyTheme(this.THEMES.SYSTEM)
      }
    })
  }

  static toggleTheme() {
    const currentTheme = this.getTheme()
    const isDark = document.documentElement.classList.contains('dark')
    
    if (currentTheme === this.THEMES.SYSTEM) {
      // If system theme, switch to opposite of current appearance
      this.setTheme(isDark ? this.THEMES.LIGHT : this.THEMES.DARK)
    } else {
      // Toggle between light and dark
      this.setTheme(isDark ? this.THEMES.LIGHT : this.THEMES.DARK)
    }
  }

  static notifyThemeChange(theme) {
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
  }

  static isDark() {
    return document.documentElement.classList.contains('dark')
  }
}

