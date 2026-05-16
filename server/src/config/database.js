import mongoose from 'mongoose'

/**
 * Database Configuration and Connection
 * Handles MongoDB connection with error handling
 */
export async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bopc-games-arena'

    await mongoose.connect(mongoUri)

    console.log('✅ MongoDB connected successfully')
    return true
  } catch (error) {
    console.warn('⚠️ MongoDB connection warning:', error.message)
    return false
  }
}

/**
 * Disconnect from database (useful for cleanup/testing)
 */
export async function disconnectDatabase() {
  try {
    await mongoose.disconnect()
    console.log('✅ MongoDB disconnected successfully')
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error.message)
    throw error
  }
}

export default mongoose
