import { DatabaseService } from './DatabaseService.js'

/**
 * Analytics Service - Calculs des KPIs et métriques de performance
 */
export class AnalyticsService {
  
  /**
   * Obtenir les KPIs principaux pour une période donnée
   */
  static getKPIs(startDate = null, endDate = null) {
    const invoices = this.getFilteredInvoices(startDate, endDate)
    const expenses = this.getFilteredExpenses(startDate, endDate)
    const quotes = this.getFilteredQuotes(startDate, endDate)
    
    // Calcul des revenus (factures payées uniquement)
    const totalRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + (invoice.total || 0), 0)
    
    // Calcul des dépenses
    const totalExpenses = expenses
      .reduce((sum, expense) => sum + (expense.amount || 0), 0)
    
    // Bénéfice net
    const netProfit = totalRevenue - totalExpenses
    
    // Nombre de factures
    const invoiceCount = invoices.length
    const paidInvoiceCount = invoices.filter(i => i.status === 'paid').length
    const pendingInvoiceCount = invoices.filter(i => i.status === 'pending').length
    const overdueInvoiceCount = invoices.filter(i => i.status === 'overdue').length
    
    // Nombre de devis
    const quoteCount = quotes.length
    const acceptedQuoteCount = quotes.filter(q => q.status === 'accepted').length
    const conversionRate = quoteCount > 0 ? (acceptedQuoteCount / quoteCount) * 100 : 0
    
    // Ticket moyen
    const averageInvoiceAmount = paidInvoiceCount > 0 ? totalRevenue / paidInvoiceCount : 0
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      invoiceCount,
      paidInvoiceCount,
      pendingInvoiceCount,
      overdueInvoiceCount,
      quoteCount,
      acceptedQuoteCount,
      conversionRate,
      averageInvoiceAmount,
      expenseCount: expenses.length
    }
  }
  
  /**
   * Obtenir l'évolution mensuelle des revenus et dépenses
   */
  static getMonthlyEvolution(months = 12) {
    const data = []
    const now = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const monthKPIs = this.getKPIs(startDate, endDate)
      
      data.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenue: monthKPIs.totalRevenue,
        expenses: monthKPIs.totalExpenses,
        profit: monthKPIs.netProfit,
        invoiceCount: monthKPIs.invoiceCount
      })
    }
    
    return data
  }
  
  /**
   * Obtenir la répartition des dépenses par catégorie
   */
  static getExpensesByCategory(startDate = null, endDate = null) {
    const expenses = this.getFilteredExpenses(startDate, endDate)
    const categories = {}
    
    expenses.forEach(expense => {
      const category = expense.category || 'Autres'
      categories[category] = (categories[category] || 0) + expense.amount
    })
    
    return Object.entries(categories).map(([category, amount]) => ({
      category,
      amount,
      percentage: expenses.length > 0 ? (amount / expenses.reduce((sum, e) => sum + e.amount, 0)) * 100 : 0
    })).sort((a, b) => b.amount - a.amount)
  }
  
  /**
   * Obtenir le top des clients par chiffre d'affaires
   */
  static getTopClients(limit = 10, startDate = null, endDate = null) {
    const invoices = this.getFilteredInvoices(startDate, endDate)
      .filter(invoice => invoice.status === 'paid')
    
    const clients = DatabaseService.getClients()
    const clientRevenue = {}
    
    invoices.forEach(invoice => {
      const clientId = invoice.client_id
      clientRevenue[clientId] = (clientRevenue[clientId] || 0) + invoice.total
    })
    
    return Object.entries(clientRevenue)
      .map(([clientId, revenue]) => {
        const client = clients.find(c => c.id == clientId)
        return {
          client: client || { name: 'Client supprimé', email: '' },
          revenue,
          invoiceCount: invoices.filter(i => i.client_id == clientId).length
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
  }
  
  /**
   * Obtenir les statistiques de paiement
   */
  static getPaymentStats(startDate = null, endDate = null) {
    const invoices = this.getFilteredInvoices(startDate, endDate)
    
    const stats = {
      paid: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 }
    }
    
    invoices.forEach(invoice => {
      const status = invoice.status || 'pending'
      if (stats[status]) {
        stats[status].count++
        stats[status].amount += invoice.total || 0
      }
    })
    
    return stats
  }
  
  /**
   * Obtenir les tendances (comparaison avec la période précédente)
   */
  static getTrends(startDate = null, endDate = null) {
    const currentKPIs = this.getKPIs(startDate, endDate)
    
    // Calculer la période précédente
    let previousStartDate, previousEndDate
    if (startDate && endDate) {
      const periodLength = endDate.getTime() - startDate.getTime()
      previousEndDate = new Date(startDate.getTime() - 1)
      previousStartDate = new Date(previousEndDate.getTime() - periodLength)
    } else {
      // Par défaut, comparer avec le mois précédent
      const now = new Date()
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      previousEndDate = new Date(currentMonth.getTime() - 1)
    }
    
    const previousKPIs = this.getKPIs(previousStartDate, previousEndDate)
    
    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }
    
    return {
      revenue: {
        current: currentKPIs.totalRevenue,
        previous: previousKPIs.totalRevenue,
        trend: calculateTrend(currentKPIs.totalRevenue, previousKPIs.totalRevenue)
      },
      expenses: {
        current: currentKPIs.totalExpenses,
        previous: previousKPIs.totalExpenses,
        trend: calculateTrend(currentKPIs.totalExpenses, previousKPIs.totalExpenses)
      },
      profit: {
        current: currentKPIs.netProfit,
        previous: previousKPIs.netProfit,
        trend: calculateTrend(currentKPIs.netProfit, previousKPIs.netProfit)
      },
      invoices: {
        current: currentKPIs.invoiceCount,
        previous: previousKPIs.invoiceCount,
        trend: calculateTrend(currentKPIs.invoiceCount, previousKPIs.invoiceCount)
      }
    }
  }
  
  /**
   * Filtrer les factures par période
   */
  static getFilteredInvoices(startDate = null, endDate = null) {
    const invoices = DatabaseService.getInvoices()
    
    if (!startDate && !endDate) {
      return invoices
    }
    
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date)
      if (startDate && invoiceDate < startDate) return false
      if (endDate && invoiceDate > endDate) return false
      return true
    })
  }
  
  /**
   * Filtrer les dépenses par période
   */
  static getFilteredExpenses(startDate = null, endDate = null) {
    const expenses = DatabaseService.getExpenses()
    
    if (!startDate && !endDate) {
      return expenses
    }
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      if (startDate && expenseDate < startDate) return false
      if (endDate && expenseDate > endDate) return false
      return true
    })
  }
  
  /**
   * Filtrer les devis par période
   */
  static getFilteredQuotes(startDate = null, endDate = null) {
    const quotes = DatabaseService.getQuotes()
    
    if (!startDate && !endDate) {
      return quotes
    }
    
    return quotes.filter(quote => {
      const quoteDate = new Date(quote.date)
      if (startDate && quoteDate < startDate) return false
      if (endDate && quoteDate > endDate) return false
      return true
    })
  }
  
  /**
   * Formater un montant avec la devise
   */
  static formatCurrency(amount) {
    const currency = DatabaseService.getSetting('currency') || 'XOF'
    const currencySymbols = {
      'XOF': 'FCFA',
      'EUR': '€',
      'USD': '$'
    }
    
    return `${amount.toLocaleString('fr-FR')} ${currencySymbols[currency] || currency}`
  }
  
  /**
   * Formater un pourcentage
   */
  static formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`
  }
}

