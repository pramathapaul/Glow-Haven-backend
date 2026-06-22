import express from 'express'
import { trackOrder, updateTracking } from '../controllers/trackingController.js'
import { protect, admin } from '../middleware/auth.js'

const router = express.Router()

// Public route - track order (limited info)
router.get('/:orderId', trackOrder)

// Admin route - update tracking
router.put('/:orderId', protect, admin, updateTracking)

export default router