import express from 'express'

const router = express.Router()

// Simple admin login endpoint using env vars
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {}

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.warn('Admin login attempted but ADMIN_USERNAME or ADMIN_PASSWORD not set')
      return res.status(500).json({ success: false, message: 'Server admin not configured' })
    }

    if (String(username) === String(ADMIN_USERNAME) && String(password) === String(ADMIN_PASSWORD)) {
      return res.json({ success: true })
    }

    return res.status(401).json({ success: false, message: 'Invalid admin credentials' })
  } catch (err) {
    next(err)
  }
})

export default router
