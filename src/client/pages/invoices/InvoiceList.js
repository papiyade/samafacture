import { I18nService } from '../../../shared/services/I18nService.js'

/**
 * Invoice List Page - Display and manage invoices
 */
export class InvoiceList {
  constructor() {
    this.invoices = []
  }

  async init() {
    await this.loadInvoices()
    this.setupEventListeners()
  }

  async loadInvoices() {
    // TODO: Load from database
    this.invoices = [
      { id: 1, number: 'INV-001', client: 'Entreprise ABC', date: '2024-01-15', amount: 125000, status: 'paid' },
      { id: 2, number: 'INV-002', client: 'Société XYZ', date: '2024-01-16', amount: 89000, status: 'sent' },
      { id: 3, number: 'INV-003', client: 'SARL Exemple', date: '2024-01-17', amount: 156000, status: 'overdue' }
    ]
  }

  async render() {
    return `
      <div class="container-fluid py-6">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            ${I18nService.t('invoices.title')}
          </h1>
          <a href="/invoices/new" data-route="/invoices/new" class="btn btn-primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            ${I18nService.t('invoices.new')}
          </a>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ${I18nService.t('invoices.number')}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ${I18nService.t('invoices.client')}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ${I18nService.t('invoices.date')}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ${I18nService.t('invoices.amount')}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ${I18nService.t('invoices.status')}
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ${I18nService.t('invoices.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  ${this.renderInvoiceRows()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `
  }

  renderInvoiceRows() {
    return this.invoices.map(invoice => `
      <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          ${invoice.number}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          ${invoice.client}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
          ${I18nService.formatDate(invoice.date)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          ${I18nService.formatCurrency(invoice.amount)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusClasses(invoice.status)}">
            ${I18nService.t(`invoices.statuses.${invoice.status}`)}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div class="flex space-x-2">
            <a href="/invoices/${invoice.id}" data-route="/invoices/${invoice.id}" class="text-primary-600 hover:text-primary-900 dark:text-primary-400">
              ${I18nService.t('forms.edit')}
            </a>
            <button class="text-red-600 hover:text-red-900 dark:text-red-400" onclick="deleteInvoice(${invoice.id})">
              ${I18nService.t('forms.delete')}
            </button>
          </div>
        </td>
      </tr>
    `).join('')
  }

  getStatusClasses(status) {
    const classes = {
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
    return classes[status] || classes.draft
  }

  setupEventListeners() {
    // Add event listeners for actions
  }
}

