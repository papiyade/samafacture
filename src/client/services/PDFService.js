/**
 * PDF Service - Handles PDF generation for invoices and quotes
 * Uses jsPDF library for client-side PDF generation
 */

export class PDFService {
  static async loadJsPDF() {
    // Check if jsPDF is already loaded
    if (window.jsPDF) {
      return window.jsPDF
    }
    
    // Load jsPDF from CDN
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      script.onload = () => {
        if (window.jsPDF) {
          resolve(window.jsPDF)
        } else {
          reject(new Error('jsPDF failed to load'))
        }
      }
      script.onerror = () => reject(new Error('Failed to load jsPDF script'))
      document.head.appendChild(script)
    })
  }

  static async generateInvoicePDF(invoice, client, companyInfo = {}) {
    try {
      console.log('Starting PDF generation for invoice:', invoice.number)
      // Load jsPDF
      const jsPDF = await this.loadJsPDF()
      console.log('jsPDF loaded successfully:', !!jsPDF)
      
      const doc = new jsPDF()
      
      // Company header
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text(companyInfo.name || 'Mon Entreprise', 20, 30)
      
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      if (companyInfo.address) doc.text(companyInfo.address, 20, 40)
      if (companyInfo.phone) doc.text(`Tél: ${companyInfo.phone}`, 20, 45)
      if (companyInfo.email) doc.text(`Email: ${companyInfo.email}`, 20, 50)
      
      // Invoice title and number
      doc.setFontSize(24)
      doc.setTextColor(40, 40, 40)
      doc.text('FACTURE', 120, 30)
      
      doc.setFontSize(12)
      doc.text(`N° ${invoice.number}`, 120, 40)
      doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, 120, 50)
      if (invoice.due_date) {
        doc.text(`Échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}`, 120, 60)
      }
      
      // Client information
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text('Facturé à:', 20, 80)
      
      doc.setFontSize(11)
      doc.text(client.name || 'Client', 20, 90)
      if (client.company) doc.text(client.company, 20, 95)
      if (client.address) doc.text(client.address, 20, 100)
      if (client.email) doc.text(client.email, 20, 105)
      if (client.phone) doc.text(client.phone, 20, 110)
      
      // Items table header
      let yPos = 130
      doc.setFillColor(240, 240, 240)
      doc.rect(20, yPos, 170, 10, 'F')
      
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      doc.text('Description', 25, yPos + 7)
      doc.text('Qté', 120, yPos + 7)
      doc.text('Prix unit.', 140, yPos + 7)
      doc.text('Total', 170, yPos + 7)
      
      yPos += 15
      
      // Items
      const items = invoice.items || []
      items.forEach(item => {
        doc.text(item.description || 'Article', 25, yPos)
        doc.text((item.quantity || 1).toString(), 120, yPos)
        doc.text(`${(item.price || 0).toLocaleString('fr-FR')} XOF`, 140, yPos)
        doc.text(`${((item.quantity || 1) * (item.price || 0)).toLocaleString('fr-FR')} XOF`, 170, yPos)
        yPos += 8
      })
      
      // Totals
      yPos += 10
      const subtotal = invoice.subtotal || 0
      const taxRate = invoice.tax_rate || 0
      const taxAmount = invoice.tax_amount || (subtotal * taxRate / 100)
      const total = invoice.total || (subtotal + taxAmount)
      
      doc.setDrawColor(200, 200, 200)
      doc.line(120, yPos, 190, yPos)
      yPos += 10
      
      doc.text('Sous-total:', 120, yPos)
      doc.text(`${subtotal.toLocaleString('fr-FR')} XOF`, 170, yPos)
      yPos += 8
      
      doc.text(`TVA (${taxRate}%):`, 120, yPos)
      doc.text(`${taxAmount.toLocaleString('fr-FR')} XOF`, 170, yPos)
      yPos += 8
      
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('TOTAL:', 120, yPos)
      doc.text(`${total.toLocaleString('fr-FR')} XOF`, 170, yPos)
      
      // Notes
      if (invoice.notes) {
        yPos += 20
        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        doc.text('Notes:', 20, yPos)
        yPos += 8
        const splitNotes = doc.splitTextToSize(invoice.notes, 170)
        doc.text(splitNotes, 20, yPos)
      }
      
      // Footer
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Merci pour votre confiance !', 20, 280)
      
      return doc
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Erreur lors de la génération du PDF')
    }
  }
  
  static async generateQuotePDF(quote, client, companyInfo = {}) {
    try {
      console.log('Starting PDF generation for quote:', quote.number)
      // Load jsPDF
      const jsPDF = await this.loadJsPDF()
      console.log('jsPDF loaded successfully:', !!jsPDF)
      
      const doc = new jsPDF()
      
      // Company header
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text(companyInfo.name || 'Mon Entreprise', 20, 30)
      
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      if (companyInfo.address) doc.text(companyInfo.address, 20, 40)
      if (companyInfo.phone) doc.text(`Tél: ${companyInfo.phone}`, 20, 45)
      if (companyInfo.email) doc.text(`Email: ${companyInfo.email}`, 20, 50)
      
      // Quote title and number
      doc.setFontSize(24)
      doc.setTextColor(40, 40, 40)
      doc.text('DEVIS', 120, 30)
      
      doc.setFontSize(12)
      doc.text(`N° ${quote.number}`, 120, 40)
      doc.text(`Date: ${new Date(quote.date).toLocaleDateString('fr-FR')}`, 120, 50)
      if (quote.valid_until) {
        doc.text(`Valide jusqu'au: ${new Date(quote.valid_until).toLocaleDateString('fr-FR')}`, 120, 60)
      }
      
      // Client information
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text('Devis pour:', 20, 80)
      
      doc.setFontSize(11)
      doc.text(client.name || 'Client', 20, 90)
      if (client.company) doc.text(client.company, 20, 95)
      if (client.address) doc.text(client.address, 20, 100)
      if (client.email) doc.text(client.email, 20, 105)
      if (client.phone) doc.text(client.phone, 20, 110)
      
      // Items table header
      let yPos = 130
      doc.setFillColor(240, 240, 240)
      doc.rect(20, yPos, 170, 10, 'F')
      
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      doc.text('Description', 25, yPos + 7)
      doc.text('Qté', 120, yPos + 7)
      doc.text('Prix unit.', 140, yPos + 7)
      doc.text('Total', 170, yPos + 7)
      
      yPos += 15
      
      // Items
      const items = quote.items || []
      items.forEach(item => {
        doc.text(item.description || 'Article', 25, yPos)
        doc.text((item.quantity || 1).toString(), 120, yPos)
        doc.text(`${(item.price || 0).toLocaleString('fr-FR')} XOF`, 140, yPos)
        doc.text(`${((item.quantity || 1) * (item.price || 0)).toLocaleString('fr-FR')} XOF`, 170, yPos)
        yPos += 8
      })
      
      // Totals
      yPos += 10
      const subtotal = quote.subtotal || 0
      const taxRate = quote.tax_rate || 0
      const taxAmount = quote.tax_amount || (subtotal * taxRate / 100)
      const total = quote.total || (subtotal + taxAmount)
      
      doc.setDrawColor(200, 200, 200)
      doc.line(120, yPos, 190, yPos)
      yPos += 10
      
      doc.text('Sous-total:', 120, yPos)
      doc.text(`${subtotal.toLocaleString('fr-FR')} XOF`, 170, yPos)
      yPos += 8
      
      doc.text(`TVA (${taxRate}%):`, 120, yPos)
      doc.text(`${taxAmount.toLocaleString('fr-FR')} XOF`, 170, yPos)
      yPos += 8
      
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('TOTAL:', 120, yPos)
      doc.text(`${total.toLocaleString('fr-FR')} XOF`, 170, yPos)
      
      // Notes
      if (quote.notes) {
        yPos += 20
        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        doc.text('Notes:', 20, yPos)
        yPos += 8
        const splitNotes = doc.splitTextToSize(quote.notes, 170)
        doc.text(splitNotes, 20, yPos)
      }
      
      // Footer
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('Ce devis est valable 30 jours à compter de la date d\'émission.', 20, 280)
      
      return doc
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Erreur lors de la génération du PDF')
    }
  }
  
  static async downloadPDF(doc, filename) {
    try {
      doc.save(filename)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      throw new Error('Erreur lors du téléchargement du PDF')
    }
  }
}
