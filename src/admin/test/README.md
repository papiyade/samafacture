# 🧪 Tests et Diagnostic - Module Admin SamaFacture

Ce dossier contient les outils de test et de diagnostic pour le module d'administration de SamaFacture.

## 📋 Fichiers de test

### `test-company-creation.html`
Interface de test interactive pour diagnostiquer les problèmes de création d'entreprise.

**Fonctionnalités :**
- ✅ Test d'initialisation de la base de données
- ✅ Test de génération d'identifiants
- ✅ Test de création d'entreprise complète
- ✅ Test de récupération de la liste des entreprises
- 📝 Logs détaillés en temps réel
- 📥 Export des logs pour analyse

**Comment utiliser :**
1. Ouvrir le fichier dans un navigateur web
2. Cliquer sur les boutons de test dans l'ordre
3. Observer les résultats et les logs
4. Exporter les logs si nécessaire pour analyse

## 🔧 Système de Logging

Le système de logging a été intégré dans tous les services critiques :

### Logger.js
Utilitaire de logging centralisé avec :
- **Niveaux de log :** ERROR, WARN, INFO, DEBUG, SUCCESS
- **Sortie console colorée** pour faciliter le debug
- **Historique des logs** (100 derniers)
- **Export des logs** en fichier texte

### Services avec logging
- `AdminDatabaseService.js` - Opérations base de données
- `CompanyService.js` - Gestion des entreprises
- `CredentialGenerator.js` - Génération d'identifiants

## 🐛 Diagnostic des problèmes courants

### Problème : "Database not initialized"
**Cause :** La base de données n'a pas été initialisée
**Solution :** 
```javascript
await AdminDatabaseService.init()
```

### Problème : "Company creation failed"
**Diagnostic :**
1. Vérifier les logs de validation des données
2. Contrôler l'unicité de l'email
3. Vérifier la génération des identifiants
4. Contrôler l'insertion en base

### Problème : "Credentials generation failed"
**Diagnostic :**
1. Vérifier la disponibilité de crypto.subtle
2. Contrôler les noms d'utilisateur existants
3. Vérifier le hachage des mots de passe

## 📊 Utilisation des logs

### Dans le code
```javascript
import { Logger } from '../utils/Logger.js'

// Différents niveaux
Logger.error('Erreur critique', { error: error.message })
Logger.warn('Attention', { data: someData })
Logger.info('Information', { status: 'processing' })
Logger.debug('Debug détaillé', { params: parameters })
Logger.success('Opération réussie', { result: result })
```

### Récupération des logs
```javascript
// Obtenir tous les logs
const logs = Logger.getLogs()

// Vider les logs
Logger.clearLogs()

// Exporter en fichier
Logger.exportLogs()
```

## 🔍 Analyse des performances

Les logs incluent des informations de timing pour :
- Initialisation de la base de données
- Exécution des requêtes SQL
- Génération des identifiants
- Opérations CRUD sur les entreprises

## 🚀 Prochaines améliorations

- [ ] Tests automatisés avec assertions
- [ ] Métriques de performance
- [ ] Tests de charge
- [ ] Validation des schémas de données
- [ ] Tests d'intégration avec l'interface utilisateur

## 📞 Support

En cas de problème persistant :
1. Exécuter tous les tests de diagnostic
2. Exporter les logs
3. Vérifier la console du navigateur
4. Analyser les erreurs SQL dans les logs détaillés
