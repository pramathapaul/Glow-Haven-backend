import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import User from '../models/User.js' // Add this import
import dotenv from 'dotenv'

dotenv.config()

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with googleId
        let user = await User.findOne({ googleId: profile.id })

        if (user) {
          return done(null, user)
        }

        // Check if user exists with email
        user = await User.findOne({ email: profile.emails[0].value })

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id
          user.isGoogleAuth = true
          user.avatar = profile.photos[0]?.value || user.avatar
          await user.save()
          return done(null, user)
        }

        // Create new user
        const nameParts = profile.displayName.split(' ')
        const firstName = nameParts[0] || 'Google'
        const lastName = nameParts.slice(1).join(' ') || 'User'

        user = await User.create({
          firstName: firstName,
          lastName: lastName,
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          isGoogleAuth: true,
          isActive: true
        })

        return done(null, user)
      } catch (error) {
        console.error('Google Strategy Error:', error)
        return done(error, null)
      }
    }
  )
)

export default passport