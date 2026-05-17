import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDatabase } from './config/database.js'
import { setupSocketHandlers } from './sockets/handlers.js'
import roomRoutes from './routes/rooms.js'
import leaderboardRoutes from './routes/leaderboard.js'
import contestRoutes from './routes/contests.js'
import usersRoutes from './routes/users.js'
import adminRoutes from './routes/admin.js'

// Load environment variables
dotenv.config()

// Initialize Express app
const app = express()
const httpServer = createServer(app)

// Socket.io Configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date() })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BOPC Games Arena API running', timestamp: new Date() })
})

// API Routes
app.use('/api/rooms', roomRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/contests', contestRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/admin', adminRoutes)

// Socket.io event handlers
setupSocketHandlers(io)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

/**
 * Start Server
 * Connects to database and starts HTTP/Socket server
 */
async function startServer() {
  let mongoConnected = false

  try {
    mongoConnected = await connectDatabase()
    if (mongoConnected) {
      console.log('✅ Connected to MongoDB')
    } else {
      console.warn('⚠️ MongoDB unavailable. Running with in-memory fallback for leaderboard and rooms.')
    }
  } catch (error) {
    console.warn('⚠️ MongoDB startup warning:', error.message)
    console.warn('⚠️ Running with in-memory fallback for leaderboard and rooms.')
  }

  const PORT = process.env.PORT || 3000
  httpServer.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`)
    console.log(`📡 Socket.io is ready for connections`)
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
    if (!mongoConnected) {
      console.warn('⚠️ MongoDB is not connected. Leaderboard and room persistence are running in-memory only.')
    }
  })
}

startServer()

export { app, httpServer, io }
