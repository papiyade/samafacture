/**
 * Chart Service - Gestion des graphiques avec Chart.js
 */
export class ChartService {
  static charts = new Map()
  static isLoaded = false
  
  /**
   * Initialiser Chart.js
   */
  static async init() {
    if (this.isLoaded) return
    
    try {
      // Charger Chart.js depuis CDN
      await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js')
      this.isLoaded = true
      console.log('✅ Chart.js loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load Chart.js:', error)
      throw error
    }
  }
  
  /**
   * Charger un script externe
   */
  static loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  
  /**
   * Créer un graphique en ligne (évolution temporelle)
   */
  static createLineChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.error(`Canvas with id "${canvasId}" not found`)
      return null
    }
    
    // Détruire le graphique existant s'il y en a un
    this.destroyChart(canvasId)
    
    const ctx = canvas.getContext('2d')
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: data.datasets.map(dataset => ({
          ...dataset,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: dataset.borderColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              callback: function(value) {
                return value.toLocaleString('fr-FR')
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        ...options
      }
    })
    
    this.charts.set(canvasId, chart)
    return chart
  }
  
  /**
   * Créer un graphique en barres
   */
  static createBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.error(`Canvas with id "${canvasId}" not found`)
      return null
    }
    
    this.destroyChart(canvasId)
    
    const ctx = canvas.getContext('2d')
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: data.datasets.map(dataset => ({
          ...dataset,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: data.datasets.length > 1,
            position: 'top'
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              callback: function(value) {
                return value.toLocaleString('fr-FR')
              }
            }
          }
        },
        ...options
      }
    })
    
    this.charts.set(canvasId, chart)
    return chart
  }
  
  /**
   * Créer un graphique en camembert
   */
  static createDoughnutChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.error(`Canvas with id "${canvasId}" not found`)
      return null
    }
    
    this.destroyChart(canvasId)
    
    const ctx = canvas.getContext('2d')
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: data.colors || this.getDefaultColors(data.values.length),
          borderWidth: 2,
          borderColor: '#fff',
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0)
                const percentage = ((context.parsed / total) * 100).toFixed(1)
                return `${context.label}: ${context.parsed.toLocaleString('fr-FR')} (${percentage}%)`
              }
            }
          }
        },
        cutout: '60%',
        ...options
      }
    })
    
    this.charts.set(canvasId, chart)
    return chart
  }
  
  /**
   * Mettre à jour les données d'un graphique
   */
  static updateChart(canvasId, newData) {
    const chart = this.charts.get(canvasId)
    if (!chart) {
      console.error(`Chart with id "${canvasId}" not found`)
      return
    }
    
    // Mettre à jour les labels
    if (newData.labels) {
      chart.data.labels = newData.labels
    }
    
    // Mettre à jour les datasets
    if (newData.datasets) {
      chart.data.datasets = newData.datasets
    } else if (newData.values) {
      // Pour les graphiques en camembert
      chart.data.datasets[0].data = newData.values
    }
    
    chart.update('active')
  }
  
  /**
   * Détruire un graphique
   */
  static destroyChart(canvasId) {
    const chart = this.charts.get(canvasId)
    if (chart) {
      chart.destroy()
      this.charts.delete(canvasId)
    }
  }
  
  /**
   * Détruire tous les graphiques
   */
  static destroyAllCharts() {
    this.charts.forEach(chart => chart.destroy())
    this.charts.clear()
  }
  
  /**
   * Obtenir les couleurs par défaut
   */
  static getDefaultColors(count) {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#F97316', // Orange
      '#84CC16', // Lime
      '#EC4899', // Pink
      '#6B7280'  // Gray
    ]
    
    const result = []
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length])
    }
    return result
  }
  
  /**
   * Obtenir les couleurs avec transparence
   */
  static getTransparentColors(colors, alpha = 0.2) {
    return colors.map(color => {
      // Convertir hex en rgba
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    })
  }
  
  /**
   * Créer un graphique de KPI simple
   */
  static createKPIChart(canvasId, value, maxValue, color = '#3B82F6') {
    const canvas = document.getElementById(canvasId)
    if (!canvas) return null
    
    this.destroyChart(canvasId)
    
    const ctx = canvas.getContext('2d')
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
    
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [percentage, 100 - percentage],
          backgroundColor: [color, 'rgba(0, 0, 0, 0.1)'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        },
        cutout: '80%'
      }
    })
    
    this.charts.set(canvasId, chart)
    return chart
  }
}

