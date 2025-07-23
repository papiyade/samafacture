import { Form } from '../../../shared/components/Form.js'

export class ClientForm {
  constructor(client = null) {
    this.client = client
    this.element = null
    this.form = null
    this.onSave = () => {}
    this.onCancel = () => {}
  }

  async render() {
    const fields = [
      {
        name: 'name',
        label: 'Nom complet',
        type: 'text',
        required: true,
        placeholder: 'Ex: Jean Dupont',
        value: this.client?.name || ''
      },
      {
        name: 'email',
        label: 'Adresse email',
        type: 'email',
        placeholder: 'Ex: jean.dupont@email.com',
        value: this.client?.email || '',
        validate: (value) => {
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Format email invalide'
          }
          return true
        }
      },
      {
        name: 'phone',
        label: 'Numéro de téléphone',
        type: 'tel',
        placeholder: 'Ex: +221 77 123 45 67',
        value: this.client?.phone || '',
        validate: (value) => {
          if (value && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(value)) {
            return 'Format de téléphone invalide'
          }
          return true
        }
      },
      {
        name: 'company',
        label: 'Entreprise',
        type: 'text',
        placeholder: 'Ex: SARL Dupont & Associés',
        value: this.client?.company || ''
      },
      {
        name: 'address',
        label: 'Adresse complète',
        type: 'textarea',
        rows: 3,
        placeholder: 'Ex: 123 Avenue de la République, Dakar, Sénégal',
        value: this.client?.address || ''
      },
      {
        name: 'notes',
        label: 'Notes (optionnel)',
        type: 'textarea',
        rows: 2,
        placeholder: 'Notes internes sur ce client...',
        value: this.client?.notes || ''
      }
    ]

    this.form = new Form({
      fields,
      onSubmit: (data) => this.handleSubmit(data),
      onCancel: () => this.onCancel(),
      submitText: this.client ? 'Mettre à jour' : 'Créer le client',
      cancelText: 'Annuler'
    })

    this.element = document.createElement('div')
    this.element.className = 'max-w-2xl mx-auto'
    
    const formElement = this.form.create()
    this.element.appendChild(formElement)

    return this.element
  }

  handleSubmit(data) {
    // Validation supplémentaire
    if (!data.name.trim()) {
      alert('Le nom du client est obligatoire')
      return
    }

    // Clean data
    const clientData = {
      name: data.name.trim(),
      email: data.email.trim() || null,
      phone: data.phone.trim() || null,
      company: data.company.trim() || null,
      address: data.address.trim() || null,
      notes: data.notes.trim() || null
    }

    this.onSave(clientData)
  }

  setData(data) {
    if (this.form) {
      this.form.setData(data)
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove()
      this.element = null
    }
  }
}

