import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import Leaderboard from '../models/Leaderboard.js'
import {
  createRoom,
  getRoom,
  addPlayerToRoom,
  deleteRoom
} from '../models/Room.js'

const router = express.Router()

/**
 * POST /api/rooms/create
 * Create a new game room
 */
router.post('/create', async (req, res) => {
  try {
    const { game, ownerUsername } = req.body

    if (!ownerUsername) {
      return res.status(400).json({
        success: false,
        message: 'Owner username is required'
      })
    }

    await Leaderboard.getOrCreateUser(ownerUsername)

    const roomCode = uuidv4().slice(0, 6).toUpperCase()
    const room = createRoom(roomCode, ownerUsername, game || 'tic-tac-toe')

    console.log(`✅ Room created: ${roomCode} by ${ownerUsername}`)
    console.log('📋 Room details:', JSON.stringify(room, null, 2))

    res.json({
      success: true,
      roomCode,
      room,
      message: 'Room created successfully'
    })
  } catch (error) {
    console.error('Error creating room:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to create room'
    })
  }
})

/**
 * POST /api/rooms/join
 * Join an existing game room
 */
router.post('/join', async (req, res) => {
  try {
    const { roomCode, playerUsername } = req.body

    if (!roomCode || !playerUsername) {
      return res.status(400).json({
        success: false,
        message: 'Room code and username are required'
      })
    }

    const room = getRoom(roomCode)

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      })
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Room is not available for joining'
      })
    }

    if (room.players.length >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      })
    }

    await Leaderboard.getOrCreateUser(playerUsername)
    addPlayerToRoom(roomCode, playerUsername, null)

    const updatedRoom = getRoom(roomCode)

    console.log(`✅ Player ${playerUsername} joined room ${roomCode}`)

    res.json({
      success: true,
      message: 'Joined room successfully',
      room: updatedRoom
    })
  } catch (error) {
    console.error('Error joining room:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to join room'
    })
  }
})

/**
 * GET /api/rooms/:roomCode
 * Get room details
 */
router.get('/:roomCode', (req, res) => {
  try {
    const { roomCode } = req.params
    const room = getRoom(roomCode)

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      })
    }

    res.json({
      success: true,
      room
    })
  } catch (error) {
    console.error('Error getting room:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to get room'
    })
  }
})

/**
 * POST /api/rooms/:roomCode/start
 * Manually start a game
 */
router.post('/:roomCode/start', (req, res) => {
  try {
    const { roomCode } = req.params
    const room = getRoom(roomCode)

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      })
    }

    if (room.players.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Need 2 players to start game'
      })
    }

    if (room.status === 'playing') {
      return res.status(400).json({
        success: false,
        message: 'Game already started'
      })
    }

    const player1 = room.players[0]
    const player2 = room.players[1]

    player1.symbol = 'X'
    player2.symbol = 'O'

    room.status = 'playing'

    room.gameState = {
      board: Array(9).fill(null),
      currentTurn: 'X',
      currentPlayer: 'X',
      winner: null,
      draw: false,
      gameOver: false,
      players: {
        X: player1.socketId || player1.username,
        O: player2.socketId || player2.username
      }
    }

    console.log(`🚀 Game manually started for room: ${roomCode}`)
    console.log('📋 Full room object:', JSON.stringify(room, null, 2))

    res.json({
      success: true,
      message: 'Game started successfully',
      room,
      roomStatus: room.status,
      gameState: room.gameState
    })
  } catch (error) {
    console.error('Error starting game:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to start game'
    })
  }
})

/**
 * DELETE /api/rooms/:roomCode
 * Delete a room
 */
router.delete('/:roomCode', (req, res) => {
  try {
    const { roomCode } = req.params

    deleteRoom(roomCode)

    console.log(`✅ Room deleted: ${roomCode}`)

    res.json({
      success: true,
      message: 'Room deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting room:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
    })
  }
})

export default router