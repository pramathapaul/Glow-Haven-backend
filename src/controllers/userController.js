import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import validator from 'validator'

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

// Register user
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      })
    }
    
    if (!validator.isEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email' 
      })
    }
    
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters' 
      })
    }
    
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      })
    }
    
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    })
    
    const token = generateToken(user._id)
    
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Login user (regular users and admin)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      })
    }
    
    const user = await User.findOne({ email }).select('+password')
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      })
    }
    
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      })
    }
    
    // Update last login
    user.lastLogin = new Date()
    await user.save()
    
    const token = generateToken(user._id)
    
    res.json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin Login (separate endpoint for admin)
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      })
    }
    
    const user = await User.findOne({ email }).select('+password')
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      })
    }
    
    // Check if user is admin
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      })
    }
    
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      })
    }
    
    user.lastLogin = new Date()
    await user.save()
    
    const token = generateToken(user._id)
    
    res.json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body
    
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    if (firstName) user.firstName = firstName
    if (lastName) user.lastName = lastName
    if (phone) user.phone = phone
    if (address) user.address = address
    
    await user.save()
    
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide current and new password' 
      })
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 8 characters' 
      })
    }
    
    const user = await User.findById(req.user._id).select('+password')
    
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      })
    }
    
    user.password = newPassword
    await user.save()
    
    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password')
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// Create admin user (for setup)
export const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body
    
    // Check if admin already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      })
    }
    
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'admin'
    })
    
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}