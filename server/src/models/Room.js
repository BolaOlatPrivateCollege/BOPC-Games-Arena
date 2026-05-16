/**
 * Room Model
 * Stores room data in memory (can be extended to use MongoDB)
 * For Version 1, we use in-memory storage
 */

// In-memory storage for rooms
const rooms = new Map()

/**
 * Create a new room
 */
export function createRoom(roomCode, ownerUsername, game = 'tic-tac-toe') {
  const room = {
    roomCode,
    ownerUsername,
    game,
    players: [
      {
        username: ownerUsername,
        socketId: null,
        isOwner: true,
        status: 'waiting',
        symbol: 'X'
      }
    ],
    status: 'waiting', // 'waiting', 'playing', 'finished'
    createdAt: new Date(),
    gameState: null,
    winner: null
  }
  
  rooms.set(roomCode, room)
  return room
}

/**
 * Get a room by code
 */
export function getRoom(roomCode) {
  return rooms.get(roomCode)
}

/**
 * Add player to room
 */
export function addPlayerToRoom(roomCode, username, socketId) {
  const room = rooms.get(roomCode)
  if (!room) return null

  // Check if player already in room
  const existingPlayer = room.players.find(p => p.username === username)
  if (existingPlayer) {
    existingPlayer.socketId = socketId
    return room
  }

  // Add new player
  if (room.players.length < 2) {
    const symbol = room.players.length === 0 ? 'X' : 'O'
    room.players.push({
      username,
      socketId,
      isOwner: false,
      status: 'ready',
      symbol
    })
    return room
  }

  return null
}

/**
 * Remove player from room
 */
export function removePlayerFromRoom(roomCode, username) {
  const room = rooms.get(roomCode)
  if (!room) return null

  room.players = room.players.filter(p => p.username !== username)

  // If room is empty, delete it
  if (room.players.length === 0) {
    rooms.delete(roomCode)
    return null
  }

  return room
}

/**
 * Update room game state
 */
export function updateRoomGameState(roomCode, gameState) {
  const room = rooms.get(roomCode)
  if (!room) return null

  room.gameState = gameState
  return room
}

/**
 * Update room status
 */
export function updateRoomStatus(roomCode, status) {
  const room = rooms.get(roomCode)
  if (!room) return null

  room.status = status
  return room
}

/**
 * Set winner
 */
export function setRoomWinner(roomCode, winner) {
  const room = rooms.get(roomCode)
  if (!room) return null

  room.winner = winner
  room.status = 'finished'
  return room
}

/**
 * Delete room
 */
export function deleteRoom(roomCode) {
  return rooms.delete(roomCode)
}

/**
 * Get all active rooms (for admin panel)
 */
export function getAllRooms() {
  return Array.from(rooms.values())
}

/**
 * Clean up inactive rooms (timeout > 1 hour)
 */
export function cleanupInactiveRooms() {
  const now = new Date()
  const timeout = 60 * 60 * 1000 // 1 hour

  for (const [roomCode, room] of rooms) {
    if (now - room.createdAt > timeout) {
      rooms.delete(roomCode)
      console.log(`🧹 Cleaned up room: ${roomCode}`)
    }
  }
}

export default {
  createRoom,
  getRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  updateRoomGameState,
  updateRoomStatus,
  setRoomWinner,
  deleteRoom,
  getAllRooms,
  cleanupInactiveRooms
}
