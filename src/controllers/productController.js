import Product from '../models/Product.js'

// Improve search function in productController.js
export const getProducts = async (req, res) => {
  try {
    const { category, subcategory, search, sort, minPrice, maxPrice, page = 1, limit = 20 } = req.query
    
    const filter = { isActive: true }
    
    // Category filter
    if (category && category !== 'All') {
      filter.category = category
    }
    
    // Subcategory filter
    if (subcategory) {
      filter.subcategory = subcategory
    }
    
    // Search filter - IMPROVED
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { desc: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = parseFloat(minPrice)
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice)
    }
    
    // Sort options
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
      case 'discount':
        sortOption = { discountPercent: -1 }
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
    
    // Calculate discount for each product
    const productsWithDiscount = products.map(product => {
      const discountPercent = product.mrp && product.price && product.mrp > 0
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : 0
      
      let colorsWithDiscount = null
      if (product.hasColors && product.colors) {
        colorsWithDiscount = product.colors.map(color => {
          const colorDiscount = color.mrp && color.price && color.mrp > 0
            ? Math.round(((color.mrp - color.price) / color.mrp) * 100)
            : 0
          return {
            ...color,
            discountPercent: colorDiscount
          }
        })
      }
      
      return {
        ...product,
        id: product._id,
        discountPercent,
        colors: colorsWithDiscount || product.colors
      }
    })
    
    res.json({
      success: true,
      data: productsWithDiscount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get products error:', error)
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
    
    const discountPercent = product.mrp && product.price && product.mrp > 0
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0
    
    // Calculate discount for colors
    let colorsWithDiscount = null
    if (product.hasColors && product.colors) {
      colorsWithDiscount = product.colors.map(color => {
        const colorDiscount = color.mrp && color.price && color.mrp > 0
          ? Math.round(((color.mrp - color.price) / color.mrp) * 100)
          : 0
        return {
          ...color,
          discountPercent: colorDiscount
        }
      })
    }
    
    res.json({ 
      success: true, 
      data: {
        ...product,
        id: product._id,
        discountPercent,
        colors: colorsWithDiscount || product.colors
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
    
    const productsWithDiscount = products.map(product => {
      const discountPercent = product.mrp && product.price && product.mrp > 0
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : 0
      return {
        ...product,
        id: product._id,
        discountPercent
      }
    })
    
    res.json({ success: true, data: productsWithDiscount })
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
    
    const productsWithDiscount = products.map(product => {
      const discountPercent = product.mrp && product.price && product.mrp > 0
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : 0
      return {
        ...product,
        id: product._id,
        discountPercent
      }
    })
    
    res.json({ success: true, data: productsWithDiscount })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Create product (admin only)
export const createProduct = async (req, res) => {
  try {
    const productData = req.body
    
    // Validate price vs MRP
    if (productData.price > productData.mrp) {
      return res.status(400).json({
        success: false,
        message: 'Selling price cannot be greater than MRP'
      })
    }
    
    // If product has colors, validate color data
    if (productData.hasColors) {
      if (!productData.colors || productData.colors.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please add at least one color variant'
        })
      }
      
      // Validate each color
      for (const color of productData.colors) {
        if (!color.name || !color.hex || !color.img) {
          return res.status(400).json({
            success: false,
            message: 'Each color must have name, hex code, and image'
          })
        }
        if (color.price > color.mrp) {
          return res.status(400).json({
            success: false,
            message: `Selling price for ${color.name} cannot be greater than MRP`
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
    
    // Validate price vs MRP
    if (productData.price > productData.mrp) {
      return res.status(400).json({
        success: false,
        message: 'Selling price cannot be greater than MRP'
      })
    }
    
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
        if (color.price > color.mrp) {
          return res.status(400).json({
            success: false,
            message: `Selling price for ${color.name} cannot be greater than MRP`
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
