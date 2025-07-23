import { Form } from '../../../shared/components/Form.js'

export class ProductForm {
  constructor(product = null) {
    this.product = product
    this.element = null
    this.form = null
    this.onSave = () => {}
    this.onCancel = () => {}
  }

  async render() {
    const fields = [
      {
        name: 'name',
        label: 'Nom du produit/service',
        type: 'text',
        required: true,
        placeholder: 'Ex: Consultation juridique, Ordinateur portable...',
        value: this.product?.name || ''
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        rows: 3,
        placeholder: 'Description détaillée du produit ou service...',
        value: this.product?.description || ''
      },
      {
        name: 'category',
        label: 'Catégorie',
        type: 'select',
        required: true,
        value: this.product?.category || '',
        options: [
          { value: 'produit', label: 'Produit' },
          { value: 'service', label: 'Service' },
          { value: 'consultation', label: 'Consultation' },
          { value: 'formation', label: 'Formation' },
          { value: 'maintenance', label: 'Maintenance' },
          { value: 'autre', label: 'Autre' }
        ]
      },
      {
        name: 'price',
        label: 'Prix unitaire (XOF)',
        type: 'number',
        required: true,
        placeholder: '0',
        value: this.product?.price || '',
        validate: (value) => {
          const price = parseFloat(value)
          if (isNaN(price) || price < 0) {
            return 'Le prix doit être un nombre positif'
          }
          return true
        }
      },
      {
        name: 'unit',
        label: 'Unité de mesure',
        type: 'select',
        value: this.product?.unit || 'pièce',
        options: [
          { value: 'pièce', label: 'Pièce' },
          { value: 'heure', label: 'Heure' },
          { value: 'jour', label: 'Jour' },
          { value: 'mois', label: 'Mois' },
          { value: 'kg', label: 'Kilogramme' },
          { value: 'litre', label: 'Litre' },
          { value: 'mètre', label: 'Mètre' },
          { value: 'm²', label: 'Mètre carré' },
          { value: 'forfait', label: 'Forfait' }
        ]
      },
      {
        name: 'stock',
        label: 'Stock initial',
        type: 'number',
        placeholder: '0',
        value: this.product?.stock || '0',
        validate: (value) => {
          const stock = parseInt(value)
          if (isNaN(stock) || stock < 0) {
            return 'Le stock doit être un nombre entier positif'
          }
          return true
        }
      }
    ]

    this.form = new Form({
      fields,
      onSubmit: (data) => this.handleSubmit(data),
      onCancel: () => this.onCancel(),
      submitText: this.product ? 'Mettre à jour' : 'Créer le produit',
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
      alert('Le nom du produit est obligatoire')
      return
    }

    if (!data.category) {
      alert('La catégorie est obligatoire')
      return
    }

    const price = parseFloat(data.price)
    if (isNaN(price) || price < 0) {
      alert('Le prix doit être un nombre positif')
      return
    }

    const stock = parseInt(data.stock) || 0
    if (stock < 0) {
      alert('Le stock ne peut pas être négatif')
      return
    }

    // Clean data
    const productData = {
      name: data.name.trim(),
      description: data.description.trim() || null,
      category: data.category,
      price: price,
      unit: data.unit || 'pièce',
      stock: stock
    }

    this.onSave(productData)
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

