import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

/**
 * Custom Hook: useSocket
 * Manages Socket.io connection to the server
 * @param {string} roomCode - Optional room code to join
 * @param {string} username - Current player's username
 * @returns {object} - Socket instance and connection status
 */
export function useSocket(roomCode = null, username = null) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    const newSocket = io(apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setIsConnected(true)

      if (roomCode) {
        newSocket.emit('join-room', {
          roomCode,
          username
        })
      }
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [roomCode, username])

  return { socket, isConnected }
}