/**
 * Admin 404 Not Found Page
 */
export class AdminNotFound {
  constructor() {
    this.container = null
  }

  async init() {
    console.log('✅ Admin 404 Page initialized')
  }

  render() {
    return `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <div class="text-center">
            <h1 class="text-9xl font-bold text-primary-600 dark:text-primary-400">404</h1>
            <h2 class="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
              Page non trouvée
            </h2>
            <p class="mt-2 text-base text-gray-500 dark:text-gray-400">
              La page que vous recherchez n'existe pas dans l'interface d'administration.
            </p>
            <div class="mt-6">
              <a href="#/" class="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <svg class="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                Retour au dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

