import express from 'express'
import User from '../models/User.js'

const router = express.Router()

// Create or get user profile
router.post('/', async (req, res, next) => {
  try {
    const { username, displayName, schoolName, classLevel, category, state, email, phone } = req.body || {}

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ success: false, message: 'Username is required' })
    }

    // If category not provided, infer from classLevel
    let resolvedCategory = category
    if (!resolvedCategory && classLevel) {
      const cl = String(classLevel).toUpperCase()
      if (cl.startsWith('JSS')) resolvedCategory = 'junior'
      else if (cl.startsWith('SS')) resolvedCategory = 'senior'
      else resolvedCategory = 'open'
    }

    const user = await User.getOrCreate(username, {
      displayName,
      schoolName,
      classLevel,
      category: resolvedCategory,
      state,
      email,
      phone
    })

    res.json({ success: true, user: user.toObject() })
  } catch (err) {
    next(err)
  }
})

// Get user profile
router.get('/:username', async (req, res, next) => {
  try {
    const { username } = req.params
    if (!username) return res.status(400).json({ success: false, message: 'Username required' })

    const user = await User.findOne({ username }).lean().exec()
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    res.json({ success: true, user })
  } catch (err) {
    next(err)
  }
})

export default router
