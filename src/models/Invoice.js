import mongoose from 'mongoose'

// Generate invoice number function
const generateInvoiceNumber = () => {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${year}${month}${day}-${random}`
}

const invoiceSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  orderId: {
    type: String,
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    default: generateInvoiceNumber
  },
  invoiceFile: {
    type: String, // Base64 encoded file data
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
})

// Generate invoice number before saving if not provided
invoiceSchema.pre('save', function(next) {
  if (this.isNew && !this.invoiceNumber) {
    this.invoiceNumber = generateInvoiceNumber()
  }
  next()
})

const Invoice = mongoose.model('Invoice', invoiceSchema)

export default Invoice