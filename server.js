import dotenv from 'dotenv'
import app from './src/app.js'

dotenv.config()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Glow Haven Server running on port ${PORT}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 http://localhost:${PORT}`)
})