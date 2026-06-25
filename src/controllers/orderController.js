import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Invoice from '../models/Invoice.js'
import fs from 'fs'

// Create order
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, subtotal, shippingCost, tax, total, notes } = req.body
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in order'
      })
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      })
    }
    
    for (const item of items) {
      const product = await Product.findById(item.product)
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product ${item.product} not found` 
        })
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        })
      }
    }
    
    const orderItems = []
    let calculatedSubtotal = 0
    
    for (const item of items) {
      const product = await Product.findById(item.product)
      const price = product.price
      calculatedSubtotal += price * item.quantity
      orderItems.push({
        product: item.product,
        name: product.name,
        price: price,
        quantity: item.quantity,
        img: product.img
      })
    }
    
    const finalSubtotal = subtotal || calculatedSubtotal
    const finalShippingCost = shippingCost !== undefined ? shippingCost : (finalSubtotal > 5000 ? 0 : 90)
    const finalTax = tax || 0
    const finalTotal = total || (finalSubtotal + finalShippingCost + finalTax)
    
    const orderData = {
      user: req.user._id,
      items: orderItems,
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod || 'WhatsApp Order',
      subtotal: finalSubtotal,
      shippingCost: finalShippingCost,
      tax: finalTax,
      total: finalTotal,
      notes: notes || '',
      orderStatus: 'Pending',
      timeline: [
        { status: 'Pending', description: 'Order placed and waiting for confirmation' }
      ]
    }

    console.log('📦 Creating order with data:', orderData)

    const order = new Order(orderData)
    await order.save()

    console.log('✅ Order created:', order)
    
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      })
    }
    
    res.status(201).json({ success: true, data: order })
  } catch (error) {
    console.error('❌ Create order error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name img')
    
    res.json({ success: true, data: orders })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get single order
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ 
      orderId: req.params.id,
      user: req.user._id 
    }).populate('items.product', 'name img')
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }
    
    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get single order by ID (for admin)
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name img')
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }
    
    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get all orders (admin only)
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    
    const filter = {}
    if (status && status !== 'all') {
      filter.orderStatus = status
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'firstName lastName email'),
      Order.countDocuments(filter)
    ])
    
    // Get status counts
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ])
    
    const counts = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      'out for delivery': 0,
      delivered: 0,
      cancelled: 0
    }
    
    statusCounts.forEach(item => {
      counts[item._id.toLowerCase()] = item.count
    })
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      counts: counts
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const order = await Order.findById(req.params.id)
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }
    
    const statusDescriptions = {
      'Pending': 'Order is pending confirmation',
      'Confirmed': 'Order has been confirmed',
      'Processing': 'Order is being processed',
      'Shipped': 'Order has been shipped',
      'Out for Delivery': 'Order is out for delivery',
      'Delivered': 'Order has been delivered successfully',
      'Cancelled': 'Order has been cancelled'
    }
    
    // Update status
    order.orderStatus = status
    
    // Add to timeline
    order.timeline.push({
      status: status,
      description: statusDescriptions[status] || `Order ${status.toLowerCase()}`,
      date: new Date()
    })
    
    // If delivered, set estimated delivery date
    if (status === 'Delivered') {
      order.estimatedDelivery = new Date()
    }
    
    await order.save()
    
    // Return updated order
    const updatedOrder = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('items.product', 'name img')
    
    res.json({ 
      success: true, 
      data: updatedOrder,
      message: `Order status updated to ${status}`
    })
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update order payment status (admin only)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body
    
    const validStatuses = ['Pending', 'Paid', 'Failed']
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Must be one of: Pending, Paid, Failed'
      })
    }
    
    const order = await Order.findById(req.params.id)
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }
    
    order.paymentStatus = paymentStatus
    
    if (paymentStatus === 'Paid') {
      order.timeline.push({
        status: order.orderStatus,
        description: 'Payment has been confirmed',
        date: new Date()
      })
    }
    
    await order.save()
    
    res.json({ 
      success: true, 
      data: order,
      message: `Payment status updated to ${paymentStatus}`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ==================== INVOICE FUNCTIONS ====================

// Upload invoice for order (admin only)
export const uploadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params
    const { notes } = req.body

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    // Check if order exists
    const order = await Order.findById(orderId)
    if (!order) {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ order: orderId })
    if (existingInvoice) {
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this order. Please delete the existing invoice first.'
      })
    }

    // Read file as base64 for storage
    const fileData = fs.readFileSync(req.file.path, { encoding: 'base64' })
    const fileSize = req.file.size

    // Create invoice
    const invoice = new Invoice({
      order: orderId,
      orderId: order.orderId,
      invoiceFile: fileData,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: fileSize,
      uploadedBy: req.user._id,
      notes: notes || ''
    })

    await invoice.save()

    // Delete the temporary file after saving to database
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path)
    }

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice uploaded successfully'
    })
  } catch (error) {
    console.error('Upload invoice error:', error)
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError)
      }
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get invoice for order (user and admin)
export const getInvoice = async (req, res) => {
  try {
    const { orderId } = req.params

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    if (req.user._id.toString() !== order.user.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this invoice'
      })
    }

    const invoice = await Invoice.findOne({ order: orderId })
      .populate('uploadedBy', 'firstName lastName email')

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found for this order'
      })
    }

    res.json({
      success: true,
      data: invoice
    })
  } catch (error) {
    console.error('Get invoice error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Delete invoice (admin only)
export const deleteInvoice = async (req, res) => {
  try {
    const { orderId } = req.params

    const invoice = await Invoice.findOne({ order: orderId })
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      })
    }

    await invoice.deleteOne()

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    })
  } catch (error) {
    console.error('Delete invoice error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get all invoices (admin only)
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('order', 'orderId')
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: invoices
    })
  } catch (error) {
    console.error('Get all invoices error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get all products with filters
export const getProducts = async (req, res) => {
  try {
    const { category, subcategory, search, sort, minPrice, maxPrice, page = 1, limit = 20 } = req.query
    
    const filter = { isActive: true }
    
    if (category && category !== 'All') {
      filter.category = category
    }
    
    if (subcategory) {
      filter.subcategory = subcategory
    }
    
    if (search) {
      filter.$text = { $search: search }
    }
    
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = parseFloat(minPrice)
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice)
    }
    
    let sortOption = {}
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 }
        break
      case 'price_desc':
        sortOption = { price: -1 }
        break
      case 'rating':
        sortOption = { rating: -1 }
        break
      case 'newest':
        sortOption = { createdAt: -1 }
        break
      default:
        sortOption = { createdAt: -1 }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter)
    ])
    
    const productsWithId = products.map(product => ({
      ...product,
      id: product._id
    }))
    
    res.json({
      success: true,
      data: productsWithId,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get single product
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean()
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    
    res.json({ 
      success: true, 
      data: {
        ...product,
        id: product._id
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params
    const products = await Product.find({ category, isActive: true }).lean()
    
    const productsWithId = products.map(product => ({
      ...product,
      id: product._id
    }))
    
    res.json({ success: true, data: productsWithId })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ tag: { $ne: null }, isActive: true })
      .limit(4)
      .lean()
    
    const productsWithId = products.map(product => ({
      ...product,
      id: product._id
    }))
    
    res.json({ success: true, data: productsWithId })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Create product (admin only)
export const createProduct = async (req, res) => {
  try {
    const productData = req.body
    
    // If product has colors, validate color data
    if (productData.hasColors) {
      if (!productData.colors || productData.colors.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please add at least one color variant'
        })
      }
      
      // Ensure each color has required fields
      for (const color of productData.colors) {
        if (!color.name || !color.hex || !color.img) {
          return res.status(400).json({
            success: false,
            message: 'Each color must have name, hex code, and image'
          })
        }
      }
    }
    
    const product = await Product.create(productData)
    const productWithId = {
      ...product.toObject(),
      id: product._id
    }
    
    res.status(201).json({ success: true, data: productWithId })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
}

// Update product (admin only)
export const updateProduct = async (req, res) => {
  try {
    const productData = req.body
    
    // If product has colors, validate color data
    if (productData.hasColors) {
      if (!productData.colors || productData.colors.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please add at least one color variant'
        })
      }
      
      for (const color of productData.colors) {
        if (!color.name || !color.hex || !color.img) {
          return res.status(400).json({
            success: false,
            message: 'Each color must have name, hex code, and image'
          })
        }
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    ).lean()
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    
    res.json({ 
      success: true, 
      data: {
        ...product,
        id: product._id
      }
    })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
}

// Delete product (admin only)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    
    res.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category')
    const subcategories = await Product.distinct('subcategory')
    
    res.json({
      success: true,
      data: {
        categories: categories.filter(c => c),
        subcategories: subcategories.filter(s => s)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
