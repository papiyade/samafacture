/**
 * PDF Service - Handles PDF generation and printing for invoices and quotes
 * Supports multiple PDF generation methods and browser printing
 */

export class PDFService {
  static async init() {
    // Load PDF libraries dynamically
    try {
      // Try to load jsPDF
      if (!window.jsPDF) {
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
      }
      
      // Try to load html2canvas
      if (!window.html2canvas) {
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
      }
      
      console.log('✅ PDF libraries loaded successfully')
    } catch (error) {
      console.warn('⚠️ PDF libraries not loaded, using fallback methods:', error)
    }
  }

  static loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // Main PDF generation method
  static async generatePDF(document, client, companyInfo = {}, options = {}) {
    const method = options.method || 'html2canvas' // 'jspdf', 'html2canvas', 'browser'
    
    try {
      switch (method) {
        case 'jspdf':
          return await this.generateWithJsPDF(document, client, companyInfo, options)
        case 'html2canvas':
          return await this.generateWithHtml2Canvas(document, client, companyInfo, options)
        case 'browser':
          return this.generateWithBrowser(document, client, companyInfo, options)
        default:
          // Try methods in order of preference
          try {
            return await this.generateWithHtml2Canvas(document, client, companyInfo, options)
          } catch (e1) {
            try {
              return await this.generateWithJsPDF(document, client, companyInfo, options)
            } catch (e2) {
              return this.generateWithBrowser(document, client, companyInfo, options)
            }
          }
      }
    } catch (error) {
      console.error('PDF generation failed:', error)
      throw new Error('Erreur lors de la génération du PDF')
    }
  }

  // Method 1: Using html2canvas + jsPDF (most reliable)
  static async generateWithHtml2Canvas(document, client, companyInfo = {}, options = {}) {
    if (!window.html2canvas || !window.jsPDF) {
      throw new Error('html2canvas or jsPDF not available')
    }

    // Create HTML content
    const htmlContent = this.generateDocumentHTML(document, client, companyInfo, options)
    
    // Create temporary container
    const container = document.createElement('div')
    container.innerHTML = htmlContent
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '800px'
    document.body.appendChild(container)

    try {
      // Generate canvas from HTML
      const canvas = await window.html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      // Create PDF
      const { jsPDF } = window.jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Download or return PDF
      const filename = `${options.type || 'document'}_${document.number}.pdf`
      
      if (options.download !== false) {
        pdf.save(filename)
      }

      return {
        pdf,
        filename,
        method: 'html2canvas'
      }

    } finally {
      // Cleanup
      document.body.removeChild(container)
    }
  }

  // Method 2: Using jsPDF directly (faster but limited styling)
  static async generateWithJsPDF(document, client, companyInfo = {}, options = {}) {
    if (!window.jsPDF) {
      throw new Error('jsPDF not available')
    }

    const { jsPDF } = window.jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    let yPosition = 20
    const pageWidth = 210
    const margin = 20

    // Company header
    pdf.setFontSize(20)
    pdf.setTextColor(37, 99, 235) // Blue color
    pdf.text(companyInfo.name || 'Mon Entreprise', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setTextColor(102, 102, 102) // Gray color
    if (companyInfo.address) {
      pdf.text(companyInfo.address, margin, yPosition)
      yPosition += 5
    }
    if (companyInfo.phone) {
      pdf.text(`Tél: ${companyInfo.phone}`, margin, yPosition)
      yPosition += 5
    }
    if (companyInfo.email) {
      pdf.text(`Email: ${companyInfo.email}`, margin, yPosition)
      yPosition += 5
    }

    // Document title and info
    yPosition += 10
    pdf.setFontSize(24)
    pdf.setTextColor(31, 41, 55) // Dark gray
    const docTitle = options.type === 'quote' ? 'DEVIS' : 'FACTURE'
    pdf.text(docTitle, pageWidth - margin - 50, yPosition, { align: 'right' })
    yPosition += 8

    pdf.setFontSize(12)
    pdf.text(`N° ${document.number}`, pageWidth - margin - 50, yPosition, { align: 'right' })
    yPosition += 6
    pdf.text(`Date: ${new Date(document.date).toLocaleDateString('fr-FR')}`, pageWidth - margin - 50, yPosition, { align: 'right' })
    
    if (document.due_date) {
      yPosition += 6
      pdf.text(`Échéance: ${new Date(document.due_date).toLocaleDateString('fr-FR')}`, pageWidth - margin - 50, yPosition, { align: 'right' })
    }

    // Client info
    yPosition += 20
    pdf.setFontSize(14)
    pdf.setTextColor(31, 41, 55)
    const clientTitle = options.type === 'quote' ? 'Devis pour:' : 'Facturé à:'
    pdf.text(clientTitle, margin, yPosition)
    yPosition += 8

    pdf.setFontSize(12)
    pdf.text(client.name || 'Client', margin, yPosition)
    yPosition += 5
    if (client.company) {
      pdf.text(client.company, margin, yPosition)
      yPosition += 5
    }
    if (client.address) {
      pdf.text(client.address, margin, yPosition)
      yPosition += 5
    }
    if (client.email) {
      pdf.text(client.email, margin, yPosition)
      yPosition += 5
    }

    // Items table
    yPosition += 15
    const items = document.items || []
    
    // Table headers
    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F') // Header background
    pdf.setTextColor(255, 255, 255)
    pdf.text('Description', margin + 2, yPosition + 5)
    pdf.text('Qté', margin + 100, yPosition + 5)
    pdf.text('Prix unit.', margin + 120, yPosition + 5)
    pdf.text('Total', margin + 150, yPosition + 5)
    yPosition += 8

    // Table rows
    pdf.setTextColor(0, 0, 0)
    items.forEach((item, index) => {
      if (yPosition > 250) { // New page if needed
        pdf.addPage()
        yPosition = 20
      }

      const total = (item.quantity || 1) * (item.price || 0)
      
      pdf.text(item.description || 'Article', margin + 2, yPosition + 5)
      pdf.text(String(item.quantity || 1), margin + 100, yPosition + 5)
      pdf.text(`${(item.price || 0).toLocaleString('fr-FR')} XOF`, margin + 120, yPosition + 5)
      pdf.text(`${total.toLocaleString('fr-FR')} XOF`, margin + 150, yPosition + 5)
      
      yPosition += 8
    })

    // Totals
    yPosition += 10
    const subtotal = document.subtotal || 0
    const taxRate = document.tax_rate || 0
    const taxAmount = document.tax_amount || (subtotal * taxRate / 100)
    const total = document.total || (subtotal + taxAmount)

    pdf.text(`Sous-total: ${subtotal.toLocaleString('fr-FR')} XOF`, pageWidth - margin - 60, yPosition, { align: 'right' })
    yPosition += 6
    pdf.text(`TVA (${taxRate}%): ${taxAmount.toLocaleString('fr-FR')} XOF`, pageWidth - margin - 60, yPosition, { align: 'right' })
    yPosition += 6
    pdf.setFontSize(12)
    pdf.text(`TOTAL: ${total.toLocaleString('fr-FR')} XOF`, pageWidth - margin - 60, yPosition, { align: 'right' })

    // Notes
    if (document.notes) {
      yPosition += 20
      pdf.setFontSize(10)
      pdf.text('Notes:', margin, yPosition)
      yPosition += 5
      const splitNotes = pdf.splitTextToSize(document.notes, pageWidth - 2 * margin)
      pdf.text(splitNotes, margin, yPosition)
    }

    // Download
    const filename = `${options.type || 'document'}_${document.number}.pdf`
    if (options.download !== false) {
      pdf.save(filename)
    }

    return {
      pdf,
      filename,
      method: 'jspdf'
    }
  }

  // Method 3: Browser print (fallback)
  static generateWithBrowser(document, client, companyInfo = {}, options = {}) {
    const htmlContent = this.generateDocumentHTML(document, client, companyInfo, options)
    const filename = `${options.type || 'document'}_${document.number}`
    
    this.openPrintWindow(htmlContent, filename)
    
    return {
      method: 'browser',
      filename
    }
  }

  // Generate HTML content for documents
  static generateDocumentHTML(document, client, companyInfo = {}, options = {}) {
    const items = document.items || []
    const subtotal = document.subtotal || 0
    const taxRate = document.tax_rate || 0
    const taxAmount = document.tax_amount || (subtotal * taxRate / 100)
    const total = document.total || (subtotal + taxAmount)
    
    const isQuote = options.type === 'quote'
    const docTitle = isQuote ? 'DEVIS' : 'FACTURE'
    const clientTitle = isQuote ? 'Devis pour:' : 'Facturé à:'

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${docTitle} ${document.number}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
            @page { margin: 1cm; }
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .company-info {
            flex: 1;
          }
          .company-info h1 {
            font-size: 24px;
            color: #2563eb;
            margin: 0 0 10px 0;
            font-weight: bold;
          }
          .company-info p {
            margin: 2px 0;
            color: #666;
            font-size: 11px;
          }
          .document-info {
            text-align: right;
            flex: 1;
          }
          .document-info h2 {
            font-size: 28px;
            color: #1f2937;
            margin: 0 0 10px 0;
            font-weight: bold;
          }
          .document-info p {
            margin: 2px 0;
            font-size: 11px;
          }
          .client-info {
            margin-bottom: 30px;
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
          }
          .client-info h3 {
            font-size: 14px;
            margin: 0 0 10px 0;
            color: #1f2937;
            font-weight: bold;
          }
          .client-info p {
            margin: 2px 0;
            font-size: 11px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #d1d5db;
          }
          .items-table th {
            background-color: #f3f4f6;
            padding: 12px 8px;
            text-align: left;
            border: 1px solid #d1d5db;
            font-weight: bold;
            font-size: 11px;
          }
          .items-table td {
            padding: 10px 8px;
            border: 1px solid #d1d5db;
            font-size: 11px;
          }
          .items-table tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .totals {
            margin-left: auto;
            width: 300px;
            margin-top: 20px;
          }
          .totals table {
            width: 100%;
            border-collapse: collapse;
          }
          .totals td {
            padding: 8px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 11px;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 13px;
            background-color: #f3f4f6;
            border-top: 2px solid #d1d5db;
          }
          .notes {
            margin-top: 30px;
            padding: 15px;
            background-color: #f0f9ff;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
          }
          .notes h4 {
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #1f2937;
          }
          .notes p {
            margin: 0;
            font-size: 11px;
            line-height: 1.5;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-style: italic;
            font-size: 10px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .logo {
            max-width: 80px;
            max-height: 80px;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            ${companyInfo.logo ? `<img src="${companyInfo.logo}" alt="Logo" class="logo">` : ''}
            <h1>${companyInfo.name || 'Mon Entreprise'}</h1>
            ${companyInfo.address ? `<p>${companyInfo.address}</p>` : ''}
            ${companyInfo.phone ? `<p>Tél: ${companyInfo.phone}</p>` : ''}
            ${companyInfo.email ? `<p>Email: ${companyInfo.email}</p>` : ''}
            ${companyInfo.website ? `<p>Web: ${companyInfo.website}</p>` : ''}
            ${companyInfo.taxNumber ? `<p>NINEA: ${companyInfo.taxNumber}</p>` : ''}
          </div>
          <div class="document-info">
            <h2>${docTitle}</h2>
            <p><strong>N° ${document.number}</strong></p>
            <p>Date: ${new Date(document.date).toLocaleDateString('fr-FR')}</p>
            ${document.due_date ? `<p>Échéance: ${new Date(document.due_date).toLocaleDateString('fr-FR')}</p>` : ''}
            ${document.valid_until ? `<p>Valide jusqu'au: ${new Date(document.valid_until).toLocaleDateString('fr-FR')}</p>` : ''}
          </div>
        </div>

        <div class="client-info">
          <h3>${clientTitle}</h3>
          <p><strong>${client.name || 'Client'}</strong></p>
          ${client.company ? `<p>${client.company}</p>` : ''}
          ${client.address ? `<p>${client.address}</p>` : ''}
          ${client.email ? `<p>Email: ${client.email}</p>` : ''}
          ${client.phone ? `<p>Tél: ${client.phone}</p>` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%;">Description</th>
              <th style="width: 10%; text-align: center;">Qté</th>
              <th style="width: 20%; text-align: right;">Prix unitaire</th>
              <th style="width: 20%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.description || 'Article'}</td>
                <td style="text-align: center;">${item.quantity || 1}</td>
                <td style="text-align: right;">${(item.price || 0).toLocaleString('fr-FR')} ${companyInfo.currency || 'XOF'}</td>
                <td style="text-align: right;">${((item.quantity || 1) * (item.price || 0)).toLocaleString('fr-FR')} ${companyInfo.currency || 'XOF'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Sous-total:</td>
              <td style="text-align: right;">${subtotal.toLocaleString('fr-FR')} ${companyInfo.currency || 'XOF'}</td>
            </tr>
            <tr>
              <td>TVA (${taxRate}%):</td>
              <td style="text-align: right;">${taxAmount.toLocaleString('fr-FR')} ${companyInfo.currency || 'XOF'}</td>
            </tr>
            <tr class="total-row">
              <td><strong>TOTAL:</strong></td>
              <td style="text-align: right;"><strong>${total.toLocaleString('fr-FR')} ${companyInfo.currency || 'XOF'}</strong></td>
            </tr>
          </table>
        </div>

        ${document.notes ? `
          <div class="notes">
            <h4>Notes:</h4>
            <p>${document.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>${isQuote ? 'Ce devis est valable 30 jours à compter de la date d\'émission.' : 'Merci pour votre confiance !'}</p>
          ${companyInfo.name ? `<p>${companyInfo.name} - Tous droits réservés</p>` : ''}
        </div>
      </body>
      </html>
    `
  }

  // Open print window
  static openPrintWindow(htmlContent, title = 'Document') {
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes')
    
    if (!printWindow) {
      throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les popups ne sont pas bloqués.')
    }

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        
        // Optional: Close window after printing
        printWindow.onafterprint = () => {
          setTimeout(() => {
            printWindow.close()
          }, 1000)
        }
      }, 500)
    }

    return printWindow
  }

  // Convenience methods
  static async generateInvoicePDF(invoice, client, companyInfo = {}, options = {}) {
    return this.generatePDF(invoice, client, companyInfo, { ...options, type: 'invoice' })
  }

  static async generateQuotePDF(quote, client, companyInfo = {}, options = {}) {
    return this.generatePDF(quote, client, companyInfo, { ...options, type: 'quote' })
  }

  static printInvoice(invoice, client, companyInfo = {}) {
    return this.generateWithBrowser(invoice, client, companyInfo, { type: 'invoice' })
  }

  static printQuote(quote, client, companyInfo = {}) {
    return this.generateWithBrowser(quote, client, companyInfo, { type: 'quote' })
  }
}

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  PDFService.init().catch(console.warn)
}

