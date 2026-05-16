import { useState } from 'react'
import axios from 'axios'

/**
 * Join Room Modal Component
 * Allows user to join an existing game room using room code
 */
export default function JoinRoomModal({ username, onClose, onRoomJoined }) {
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async () => {
    setError('')

    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const response = await axios.post(
        `${apiUrl}/api/rooms/join`,
        {
          roomCode: roomCode.toUpperCase(),
          playerUsername: username
        }
      )

      if (response.data.success) {
        onRoomJoined(roomCode.toUpperCase())
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room')
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin()
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-900/20">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.24em] text-indigo-600">Join room</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Enter your room code</h2>
          <p className="mt-2 text-sm text-slate-500">Join a friend in a private match with one quick code.</p>
        </div>

        <div className="mb-6">
          <label htmlFor="roomCode" className="block text-sm font-medium text-slate-700 mb-2">
            Room Code
          </label>
          <input
            id="roomCode"
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="ABCD1234"
            className="input text-center text-lg font-mono tracking-widest"
            maxLength="8"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={onClose}
            className="btn btn-secondary w-full py-3"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            className="btn btn-primary w-full py-3"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-700">
          <p>📋 Ask the room owner for the code.</p>
          <p>✅ Enter it exactly as shown.</p>
        </div>
      </div>
    </div>
  )
}
