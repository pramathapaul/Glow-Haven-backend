import express from 'express'
import {
  createOrder,
  getUserOrders,
  getOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  uploadInvoice,
  getInvoice,
  deleteInvoice,
  getAllInvoices
} from '../controllers/orderController.js'
import { protect, admin } from '../middleware/auth.js'
import upload from '../middleware/upload.js'

const router = express.Router()

// User routes
router.post('/', protect, createOrder)
router.get('/my-orders', protect, getUserOrders)
router.get('/:id', protect, getOrder)

// Invoice routes (user and admin)
router.get('/:orderId/invoice', protect, getInvoice)

// Admin routes
router.get('/admin/all', protect, admin, getAllOrders)
router.get('/admin/:id', protect, admin, getOrderById)
router.put('/:id/status', protect, admin, updateOrderStatus)
router.put('/:id/payment', protect, admin, updatePaymentStatus)
router.post('/:orderId/invoice', protect, admin, upload.single('invoiceFile'), uploadInvoice)
router.delete('/:orderId/invoice', protect, admin, deleteInvoice)
router.get('/admin/invoices/all', protect, admin, getAllInvoices)

export default router