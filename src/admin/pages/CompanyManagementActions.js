import { RemoteLicenseControl } from '../services/RemoteLicenseControl.js'
import { CompanyService } from '../services/CompanyService.js'
import { NotificationService } from '../../shared/services/NotificationService.js'

/**
 * Company Management Actions - License and company actions
 */
export class CompanyManagementActions {
  
  static async generateLicenseFile(companyId) {
    try {
      const licenseFile = await RemoteLicenseControl.generateLicenseFile(companyId)
      
      // Create download link
      const blob = new Blob([licenseFile.content], { type: licenseFile.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = licenseFile.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      NotificationService.success(`Fichier de licence généré pour ${licenseFile.company.name}`)
    } catch (error) {
      console.error('Error generating license file:', error)
      NotificationService.error('Erreur lors de la génération du fichier de licence')
    }
  }

  static async suspendLicense(companyId) {
    if (!confirm('Êtes-vous sûr de vouloir suspendre cette licence ?')) return
    
    try {
      await RemoteLicenseControl.suspendLicense(companyId, 'Suspendu par l\'administrateur')
      NotificationService.success('Licence suspendue avec succès')
      return true
    } catch (error) {
      console.error('Error suspending license:', error)
      NotificationService.error('Erreur lors de la suspension de la licence')
      return false
    }
  }

  static async reactivateLicense(companyId) {
    try {
      await RemoteLicenseControl.reactivateLicense(companyId)
      NotificationService.success('Licence réactivée avec succès')
      return true
    } catch (error) {
      console.error('Error reactivating license:', error)
      NotificationService.error('Erreur lors de la réactivation de la licence')
      return false
    }
  }

  static async extendLicense(companyId, days) {
    try {
      if (!days || days < 1) {
        NotificationService.error('Veuillez saisir un nombre de jours valide')
        return false
      }
      
      const result = await RemoteLicenseControl.extendLicense(companyId, days)
      
      NotificationService.success(`Licence prolongée de ${days} jours jusqu'au ${new Date(result.newExpiry).toLocaleDateString('fr-FR')}`)
      return true
      
    } catch (error) {
      console.error('Error extending license:', error)
      NotificationService.error('Erreur lors de la prolongation de la licence')
      return false
    }
  }

  static async changeLicenseType(companyId, newLicenseType) {
    try {
      if (!newLicenseType) {
        NotificationService.error('Veuillez sélectionner un type de licence')
        return false
      }
      
      const result = await RemoteLicenseControl.changeLicenseType(companyId, newLicenseType)
      
      NotificationService.success(`Type de licence changé vers ${result.newType}`)
      return true
      
    } catch (error) {
      console.error('Error changing license type:', error)
      NotificationService.error('Erreur lors du changement de type de licence')
      return false
    }
  }

  static async deleteCompany(companyId, companyName) {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer l'entreprise "${companyName}" ?\n\n` +
      `Cette action est irréversible et supprimera :\n` +
      `- Toutes les données de l'entreprise\n` +
      `- La licence associée\n` +
      `- L'historique des factures\n\n` +
      `Tapez "SUPPRIMER" pour confirmer.`
    )
    
    if (!confirmed) return false
    
    const confirmation = prompt('Tapez "SUPPRIMER" pour confirmer la suppression :')
    if (confirmation !== 'SUPPRIMER') {
      NotificationService.error('Suppression annulée')
      return false
    }
    
    try {
      await CompanyService.deleteCompany(companyId)
      NotificationService.success(`Entreprise "${companyName}" supprimée avec succès`)
      return true
    } catch (error) {
      console.error('Error deleting company:', error)
      NotificationService.error('Erreur lors de la suppression de l\'entreprise')
      return false
    }
  }
}

