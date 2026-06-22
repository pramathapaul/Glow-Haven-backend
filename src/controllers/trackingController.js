import Order from '../models/Order.js'

// Track order by ID
export const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    
    const order = await Order.findOne({ orderId })
      .populate('items.product', 'name img')
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      })
    }
    
    // Build tracking response with full timeline
    const trackingInfo = {
      orderId: order.orderId,
      status: order.orderStatus,
      estimatedDelivery: order.estimatedDelivery,
      carrier: order.carrier || 'Luxury Express',
      trackingNumber: order.trackingNumber || order.orderId,
      timeline: order.timeline.map(t => ({
        status: t.status,
        date: t.date,
        description: t.description
      })),
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        img: item.img
      })),
      shippingAddress: order.shippingAddress,
      total: order.total,
      paymentStatus: order.paymentStatus
    }
    
    res.json({ success: true, data: trackingInfo })
  } catch (error) {
    console.error('Track order error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Admin: Update tracking info
export const updateTracking = async (req, res) => {
  try {
    const { orderId } = req.params
    const { carrier, trackingNumber, estimatedDelivery } = req.body
    
    const order = await Order.findOne({ orderId })
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      })
    }
    
    if (carrier) order.carrier = carrier
    if (trackingNumber) order.trackingNumber = trackingNumber
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery)
    
    await order.save()
    
    res.json({ 
      success: true, 
      message: 'Tracking info updated successfully',
      data: order 
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}