/**
 * Print Service - Handles printing for invoices and quotes
 * Uses browser's native print functionality
 */

export class PrintService {
  static printInvoice(invoice, client, companyInfo = {}) {
    try {
      console.log('Starting print for invoice:', invoice.number)
      
      // Create print content
      const printContent = this.generateInvoiceHTML(invoice, client, companyInfo)
      
      // Open print window
      this.openPrintWindow(printContent, `Facture_${invoice.number}`)
      
    } catch (error) {
      console.error('Error printing invoice:', error)
      throw new Error('Erreur lors de l\'impression de la facture')
    }
  }

  static generateInvoiceHTML(invoice, client, companyInfo = {}) {
    const items = invoice.items || []
    const subtotal = invoice.subtotal || 0
    const taxRate = invoice.tax_rate || 0
    const taxAmount = invoice.tax_amount || (subtotal * taxRate / 100)
    const total = invoice.total || (subtotal + taxAmount)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Facture ${invoice.number}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
          }
          .company-info h1 {
            font-size: 24px;
            color: #2563eb;
            margin: 0 0 10px 0;
          }
          .company-info p {
            margin: 2px 0;
            color: #666;
          }
          .invoice-info h2 {
            font-size: 28px;
            color: #1f2937;
            margin: 0 0 10px 0;
          }
          .invoice-info p {
            margin: 2px 0;
          }
          .client-info {
            margin-bottom: 30px;
          }
          .client-info h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #1f2937;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th {
            background-color: #f3f4f6;
            padding: 12px 8px;
            text-align: left;
            border: 1px solid #d1d5db;
            font-weight: bold;
          }
          .items-table td {
            padding: 10px 8px;
            border: 1px solid #d1d5db;
          }
          .items-table tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .totals {
            margin-left: auto;
            width: 300px;
          }
          .totals table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 14px;
            background-color: #f3f4f6;
          }
          .notes {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9fafb;
            border-left: 4px solid #2563eb;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>${companyInfo.name || 'Mon Entreprise'}</h1>
            ${companyInfo.address ? `<p>${companyInfo.address}</p>` : ''}
            ${companyInfo.phone ? `<p>Tél: ${companyInfo.phone}</p>` : ''}
            ${companyInfo.email ? `<p>Email: ${companyInfo.email}</p>` : ''}
          </div>
          <div class="invoice-info">
            <h2>FACTURE</h2>
            <p><strong>N° ${invoice.number}</strong></p>
            <p>Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
            ${invoice.due_date ? `<p>Échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}</p>` : ''}
          </div>
        </div>

        <div class="client-info">
          <h3>Facturé à:</h3>
          <p><strong>${client.name || 'Client'}</strong></p>
          ${client.company ? `<p>${client.company}</p>` : ''}
          ${client.address ? `<p>${client.address}</p>` : ''}
          ${client.email ? `<p>${client.email}</p>` : ''}
          ${client.phone ? `<p>${client.phone}</p>` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="width: 80px;">Quantité</th>
              <th style="width: 120px;">Prix unitaire</th>
              <th style="width: 120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.description || 'Article'}</td>
                <td style="text-align: center;">${item.quantity || 1}</td>
                <td style="text-align: right;">${(item.price || 0).toLocaleString('fr-FR')} XOF</td>
                <td style="text-align: right;">${((item.quantity || 1) * (item.price || 0)).toLocaleString('fr-FR')} XOF</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Sous-total:</td>
              <td style="text-align: right;">${subtotal.toLocaleString('fr-FR')} XOF</td>
            </tr>
            <tr>
              <td>TVA (${taxRate}%):</td>
              <td style="text-align: right;">${taxAmount.toLocaleString('fr-FR')} XOF</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL:</td>
              <td style="text-align: right;">${total.toLocaleString('fr-FR')} XOF</td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `
          <div class="notes">
            <h4>Notes:</h4>
            <p>${invoice.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Merci pour votre confiance !</p>
        </div>
      </body>
      </html>
    `
  }

  static openPrintWindow(htmlContent, title = 'Document') {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        // Close window after printing (optional)
        printWindow.onafterprint = () => {
          printWindow.close()
        }
      }, 500)
    }
  }
  
  static printQuote(quote, client, companyInfo = {}) {
    try {
      console.log('Starting print for quote:', quote.number)
      
      // Create print content
      const printContent = this.generateQuoteHTML(quote, client, companyInfo)
      
      // Open print window
      this.openPrintWindow(printContent, `Devis_${quote.number}`)
      
    } catch (error) {
      console.error('Error printing quote:', error)
      throw new Error('Erreur lors de l\'impression du devis')
    }
  }

  static generateQuoteHTML(quote, client, companyInfo = {}) {
    const items = quote.items || []
    const subtotal = quote.subtotal || 0
    const taxRate = quote.tax_rate || 0
    const taxAmount = quote.tax_amount || (subtotal * taxRate / 100)
    const total = quote.total || (subtotal + taxAmount)

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Devis ${quote.number}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
          }
          .company-info h1 {
            font-size: 24px;
            color: #2563eb;
            margin: 0 0 10px 0;
          }
          .company-info p {
            margin: 2px 0;
            color: #666;
          }
          .quote-info h2 {
            font-size: 28px;
            color: #1f2937;
            margin: 0 0 10px 0;
          }
          .quote-info p {
            margin: 2px 0;
          }
          .client-info {
            margin-bottom: 30px;
          }
          .client-info h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #1f2937;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th {
            background-color: #f3f4f6;
            padding: 12px 8px;
            text-align: left;
            border: 1px solid #d1d5db;
            font-weight: bold;
          }
          .items-table td {
            padding: 10px 8px;
            border: 1px solid #d1d5db;
          }
          .items-table tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .totals {
            margin-left: auto;
            width: 300px;
          }
          .totals table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 14px;
            background-color: #f3f4f6;
          }
          .notes {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9fafb;
            border-left: 4px solid #2563eb;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>${companyInfo.name || 'Mon Entreprise'}</h1>
            ${companyInfo.address ? `<p>${companyInfo.address}</p>` : ''}
            ${companyInfo.phone ? `<p>Tél: ${companyInfo.phone}</p>` : ''}
            ${companyInfo.email ? `<p>Email: ${companyInfo.email}</p>` : ''}
          </div>
          <div class="quote-info">
            <h2>DEVIS</h2>
            <p><strong>N° ${quote.number}</strong></p>
            <p>Date: ${new Date(quote.date).toLocaleDateString('fr-FR')}</p>
            ${quote.valid_until ? `<p>Valide jusqu'au: ${new Date(quote.valid_until).toLocaleDateString('fr-FR')}</p>` : ''}
          </div>
        </div>

        <div class="client-info">
          <h3>Devis pour:</h3>
          <p><strong>${client.name || 'Client'}</strong></p>
          ${client.company ? `<p>${client.company}</p>` : ''}
          ${client.address ? `<p>${client.address}</p>` : ''}
          ${client.email ? `<p>${client.email}</p>` : ''}
          ${client.phone ? `<p>${client.phone}</p>` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="width: 80px;">Quantité</th>
              <th style="width: 120px;">Prix unitaire</th>
              <th style="width: 120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.description || 'Article'}</td>
                <td style="text-align: center;">${item.quantity || 1}</td>
                <td style="text-align: right;">${(item.price || 0).toLocaleString('fr-FR')} XOF</td>
                <td style="text-align: right;">${((item.quantity || 1) * (item.price || 0)).toLocaleString('fr-FR')} XOF</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Sous-total:</td>
              <td style="text-align: right;">${subtotal.toLocaleString('fr-FR')} XOF</td>
            </tr>
            <tr>
              <td>TVA (${taxRate}%):</td>
              <td style="text-align: right;">${taxAmount.toLocaleString('fr-FR')} XOF</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL:</td>
              <td style="text-align: right;">${total.toLocaleString('fr-FR')} XOF</td>
            </tr>
          </table>
        </div>

        ${quote.notes ? `
          <div class="notes">
            <h4>Notes:</h4>
            <p>${quote.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Ce devis est valable 30 jours à compter de la date d'émission.</p>
        </div>
      </body>
      </html>
    `
  }
}
