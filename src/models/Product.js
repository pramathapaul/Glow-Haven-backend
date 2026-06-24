import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Serums', 'Moisturizers', 'Cleansers', 'Masks', 'Toners', 'Eye Care', 'Sun Care', 'Lipsticks', 'Nail Polish', 'Makeup', 'Accessories', 'Fragrance', 'Body Wash'],
    trim: true
  },
  subcategory: {
    type: String,
    trim: true,
    default: ''
  },
  mrp: {
    type: Number,
    required: [true, 'MRP is required'],
    min: [0, 'MRP cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.mrp
      },
      message: 'Selling price cannot be greater than MRP'
    }
  },
  desc: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [200, 'Description cannot exceed 200 characters'],
    trim: true
  },
  details: {
    type: String,
    required: [true, 'Product details are required'],
    trim: true
  },
  // Main image (primary)
  img: {
    type: String,
    required: [true, 'Product image is required']
  },
  // Additional images (gallery)
  images: {
    type: [String],
    default: []
  },
  hasColors: {
    type: Boolean,
    default: false
  },
  colors: [{
    name: {
      type: String,
      required: function() { return this.hasColors }
    },
    hex: {
      type: String,
      required: function() { return this.hasColors },
      match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color code']
    },
    img: {
      type: String,
      required: function() { return this.hasColors }
    },
    mrp: {
      type: Number,
      required: function() { return this.hasColors },
      min: [0, 'MRP cannot be negative']
    },
    price: {
      type: Number,
      required: function() { return this.hasColors },
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function(value) {
          return value <= this.mrp
        },
        message: 'Selling price cannot be greater than MRP'
      }
    },
    stock: {
      type: Number,
      required: function() { return this.hasColors },
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    sku: {
      type: String,
      default: ''
    }
  }],
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  tag: {
    type: String,
    enum: ['NEW IN', 'BEST SELLER', 'VEGAN', 'LIMITED EDITION', 'SALE', null],
    default: null
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be below 0'],
    max: [5, 'Rating cannot exceed 5']
  },
  reviews: {
    type: Number,
    default: 0,
    min: [0, 'Reviews cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Virtual field for discount percentage
productSchema.virtual('discountPercent').get(function() {
  if (!this.mrp || !this.price || this.mrp === 0) return 0
  return Math.round(((this.mrp - this.price) / this.mrp) * 100)
})

// Index for search
productSchema.index({ name: 'text', desc: 'text', category: 'text' })

const Product = mongoose.model('Product', productSchema)

export default Product
