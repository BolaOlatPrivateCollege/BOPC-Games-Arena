import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 50 },
    displayName: { type: String, default: '' },
    schoolName: { type: String, default: '' },
    classLevel: { type: String, default: '' },
    category: { type: String, enum: ['junior', 'senior', 'open'], default: 'open' },
    state: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  { timestamps: true }
)

userSchema.statics.getOrCreate = async function(username, data = {}) {
  if (!username) return null

  const clean = String(username).trim()
  let user = await this.findOne({ username: clean }).exec()

  if (!user) {
    const candidate = {
      username: clean,
      displayName: data.displayName || clean,
      schoolName: data.schoolName || '',
      classLevel: data.classLevel || '',
      category: data.category || (data.classLevel && String(data.classLevel).toUpperCase().startsWith('JSS') ? 'junior' : data.classLevel && String(data.classLevel).toUpperCase().startsWith('SS') ? 'senior' : 'open'),
      state: data.state || '',
      email: data.email || '',
      phone: data.phone || ''
    }

    user = new this(candidate)
    await user.save()
    console.log(`Student profile created: ${clean}`)
    return user
  }

  // Update fields if provided and missing on existing record
  let modified = false
  const updatable = ['displayName', 'schoolName', 'classLevel', 'category', 'state', 'email', 'phone']
  for (const key of updatable) {
    if (data[key] && (!user[key] || user[key] === '')) {
      user[key] = data[key]
      modified = true
    }
  }

  if (modified) {
    await user.save()
    console.log(`Student profile updated: ${clean}`)
  } else {
    console.log(`Student profile found: ${clean}`)
  }

  return user
}

const UserModel = mongoose.model('User', userSchema)

export default UserModel
