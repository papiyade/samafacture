/**
 * Logger utility for debugging admin operations
 */
export class Logger {
  static isEnabled = true
  static logs = []

  static log(level, message, data = null) {
    if (!this.isEnabled) return

    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      data
    }

    this.logs.push(logEntry)
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100)
    }

    // Console output with colors
    const colors = {
      ERROR: 'color: red; font-weight: bold;',
      WARN: 'color: orange; font-weight: bold;',
      INFO: 'color: blue;',
      DEBUG: 'color: gray;',
      SUCCESS: 'color: green; font-weight: bold;'
    }

    console.log(
      `%c[${level}] ${timestamp} - ${message}`,
      colors[level] || '',
      data || ''
    )
  }

  static error(message, data = null) {
    this.log('ERROR', message, data)
  }

  static warn(message, data = null) {
    this.log('WARN', message, data)
  }

  static info(message, data = null) {
    this.log('INFO', message, data)
  }

  static debug(message, data = null) {
    this.log('DEBUG', message, data)
  }

  static success(message, data = null) {
    this.log('SUCCESS', message, data)
  }

  static getLogs() {
    return this.logs
  }

  static clearLogs() {
    this.logs = []
  }

  static exportLogs() {
    const logsText = this.logs
      .map(log => `[${log.level}] ${log.timestamp} - ${log.message}${log.data ? ' | Data: ' + JSON.stringify(log.data) : ''}`)
      .join('\n')
    
    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `samafacture-admin-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  }
}
