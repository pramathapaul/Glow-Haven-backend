import express from 'express'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import User from '../models/User.js' 
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

// Google OAuth login
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
)

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`,
    session: true
  }),
  (req, res) => {
    // Generate JWT token for the user
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    // Redirect to frontend with token and user data
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(
      `${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        avatar: req.user.avatar,
        role: req.user.role
      }))}`
    )
  }
)

// Get current user from session (for debugging)
router.get('/session', (req, res) => {
  if (req.user) {
    res.json({ success: true, user: req.user })
  } else {
    res.json({ success: false, message: 'No user in session' })
  }
})

// Logout (clear session)
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' })
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Logout failed' })
      }
      res.clearCookie('connect.sid')
      res.json({ success: true, message: 'Logged out successfully' })
    })
  })
})

export default router