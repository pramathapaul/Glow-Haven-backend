import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import connectDB from './database.js'

dotenv.config()

const createAdmin = async () => {
  try {
    await connectDB()
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@glowhaven.com' })
    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      process.exit(0)
    }
    
    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'Glow Haven',
      email: 'admin@glowhaven.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1 (555) 000-0000'
    })
    
    console.log('✅ Admin user created successfully!')
    console.log('📧 Email: admin@glowhaven.com')
    console.log('🔑 Password: admin123')
    console.log('👤 Role: Admin')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to create admin:', error.message)
    process.exit(1)
  }
}

createAdmin()