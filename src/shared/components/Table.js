/**
 * Table Component - Reusable data table
 */
export class Table {
  static create(options = {}) {
    const {
      columns = [],
      data = [],
      actions = [],
      emptyMessage = 'Aucune donnée disponible',
      className = ''
    } = options

    const table = document.createElement('div')
    table.className = `overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg ${className}`

    if (data.length === 0) {
      table.innerHTML = `
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">${emptyMessage}</h3>
        </div>
      `
      return table
    }

    const tableHTML = `
      <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            ${columns.map(col => `
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                ${col.label}
              </th>
            `).join('')}
            ${actions.length > 0 ? '<th scope="col" class="relative px-6 py-3"><span class="sr-only">Actions</span></th>' : ''}
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
          ${data.map((row, index) => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
              ${columns.map(col => `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ${this.formatCellValue(row[col.key], col.type, col.format)}
                </td>
              `).join('')}
              ${actions.length > 0 ? `
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex space-x-2 justify-end">
                    ${actions.map((action, actionIndex) => `
                      <button 
                        class="text-${action.color || 'blue'}-600 hover:text-${action.color || 'blue'}-900 dark:text-${action.color || 'blue'}-400 dark:hover:text-${action.color || 'blue'}-300 p-1 rounded transition-colors duration-200"
                        data-action="${actionIndex}"
                        data-row="${index}"
                        title="${action.label}"
                      >
                        ${action.icon}
                      </button>
                    `).join('')}
                  </div>
                </td>
              ` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    table.innerHTML = tableHTML
    
    // Add event listeners for action buttons
    if (actions.length > 0) {
      table.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-action]')
        if (button) {
          const actionIndex = parseInt(button.dataset.action)
          const rowIndex = parseInt(button.dataset.row)
          const action = actions[actionIndex]
          const rowData = data[rowIndex]
          
          if (action && action.onClick) {
            action.onClick(rowData, rowIndex)
          }
        }
      })
    }
    
    return table
  }

  static formatCellValue(value, type = 'text', format = null) {
    if (value === null || value === undefined) return '-'

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'XOF',
          minimumFractionDigits: 0
        }).format(value)
      
      case 'date':
        return new Date(value).toLocaleDateString('fr-FR')
      
      case 'status':
        const statusColors = {
          draft: 'bg-gray-100 text-gray-800',
          sent: 'bg-blue-100 text-blue-800',
          paid: 'bg-green-100 text-green-800',
          overdue: 'bg-red-100 text-red-800',
          cancelled: 'bg-gray-100 text-gray-800',
          accepted: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800',
          expired: 'bg-yellow-100 text-yellow-800'
        }
        const colorClass = statusColors[value] || 'bg-gray-100 text-gray-800'
        const statusLabels = {
          draft: 'Brouillon',
          sent: 'Envoyé',
          paid: 'Payé',
          overdue: 'En retard',
          cancelled: 'Annulé',
          accepted: 'Accepté',
          rejected: 'Refusé',
          expired: 'Expiré'
        }
        return `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}">${statusLabels[value] || value}</span>`
      
      case 'number':
        return new Intl.NumberFormat('fr-FR').format(value)
      
      default:
        return format ? format(value) : value
    }
  }
}
