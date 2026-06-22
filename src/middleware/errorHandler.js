export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  console.error('❌ Error:', err)

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]
    error.message = `Duplicate value for ${field}`
    return res.status(400).json({ success: false, message: error.message })
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    error.message = messages.join(', ')
    return res.status(400).json({ success: false, message: error.message })
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    error.message = `Invalid ${err.path}: ${err.value}`
    return res.status(400).json({ success: false, message: error.message })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token'
    return res.status(401).json({ success: false, message: error.message })
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired'
    return res.status(401).json({ success: false, message: error.message })
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  })
}