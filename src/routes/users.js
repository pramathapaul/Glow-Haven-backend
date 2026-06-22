import express from 'express'
import {
  register,
  login,
  adminLogin,
  getCurrentUser,
  updateProfile,
  changePassword,
  getAllUsers,
  createAdmin
} from '../controllers/userController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.post('/register', register)
router.post('/login', login)
router.post('/admin-login', adminLogin)

// Protected routes
router.get('/me', protect, getCurrentUser)
router.put('/me', protect, updateProfile)
router.put('/change-password', protect, changePassword)

// Admin routes
router.get('/', protect, admin, getAllUsers)
router.post('/create-admin', protect, admin, createAdmin)

export default router