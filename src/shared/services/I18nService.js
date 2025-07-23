/**
 * Internationalization Service - Manages translations and localization
 */
export class I18nService {
  static currentLanguage = 'fr'
  static translations = {}
  static fallbackLanguage = 'fr'

  static async init(language = 'fr') {
    this.currentLanguage = language
    await this.loadTranslations(language)
    
    // Load fallback language if different
    if (language !== this.fallbackLanguage) {
      await this.loadTranslations(this.fallbackLanguage)
    }
  }

  static async loadTranslations(language) {
    try {
      const response = await fetch(`/src/shared/i18n/translations/${language}.json`)
      if (response.ok) {
        const translations = await response.json()
        this.translations[language] = translations
      } else {
        console.warn(`Failed to load translations for ${language}`)
      }
    } catch (error) {
      console.error(`Error loading translations for ${language}:`, error)
    }
  }

  static t(key, params = {}) {
    const translation = this.getTranslation(key)
    return this.interpolate(translation, params)
  }

  static getTranslation(key) {
    const keys = key.split('.')
    let translation = this.translations[this.currentLanguage]
    
    // Try current language
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k]
      } else {
        translation = null
        break
      }
    }

    // Fallback to default language
    if (!translation && this.currentLanguage !== this.fallbackLanguage) {
      translation = this.translations[this.fallbackLanguage]
      for (const k of keys) {
        if (translation && typeof translation === 'object' && k in translation) {
          translation = translation[k]
        } else {
          translation = null
          break
        }
      }
    }

    return translation || key
  }

  static interpolate(text, params) {
    if (typeof text !== 'string') return text
    
    return text.replace(/\\{\\{(\\w+)\\}\\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match
    })
  }

  static async setLanguage(language) {
    if (language !== this.currentLanguage) {
      await this.loadTranslations(language)
      this.currentLanguage = language
      localStorage.setItem('samafacture-language', language)
      
      // Notify components of language change
      window.dispatchEvent(new CustomEvent('languagechange', { 
        detail: { language } 
      }))
    }
  }

  static getCurrentLanguage() {
    return this.currentLanguage
  }

  static getSupportedLanguages() {
    return ['fr', 'en']
  }

  static formatCurrency(amount, currency = 'XOF') {
    return new Intl.NumberFormat(this.currentLanguage === 'fr' ? 'fr-SN' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  static formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    
    return new Intl.DateTimeFormat(
      this.currentLanguage === 'fr' ? 'fr-SN' : 'en-US',
      { ...defaultOptions, ...options }
    ).format(new Date(date))
  }

  static formatNumber(number, options = {}) {
    return new Intl.NumberFormat(
      this.currentLanguage === 'fr' ? 'fr-SN' : 'en-US',
      options
    ).format(number)
  }
}

