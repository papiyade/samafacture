import { I18nService } from '../../shared/services/I18nService.js'

/**
 * 404 Not Found Page
 */
export class NotFound {
  async render() {
    return `
      <div class="container-fluid py-12">
        <div class="text-center">
          <div class="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Page non trouvée
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mb-8">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <a href="/" data-route="/" class="btn btn-primary">
            Retour à l'accueil
          </a>
        </div>
      </div>
    `
  }
}

