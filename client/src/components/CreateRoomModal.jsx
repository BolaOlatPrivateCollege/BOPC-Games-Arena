import { useState } from 'react'
import axios from 'axios'

/**
 * Create Room Modal Component
 * Allows user to create a new game room
 */
export default function CreateRoomModal({ username, onClose, onRoomCreated }) {
  const [gameName, setGameName] = useState('tic-tac-toe')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    setError('')

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const response = await axios.post(
        `${apiUrl}/api/rooms/create`,
        {
          game: gameName,
          ownerUsername: username
        }
      )

      if (response.data.roomCode) {
        onRoomCreated(response.data.roomCode)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-900/20">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.24em] text-indigo-600">Create room</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Start a new game</h2>
          <p className="mt-2 text-sm text-slate-500">Create a private room and invite others with a room code.</p>
        </div>

        <div className="rounded-[1.5rem] bg-slate-50 p-6 mb-6 border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-3">Select game</label>
          <select
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            className="input"
          >
            <option value="tic-tac-toe">Tic Tac Toe</option>
            <option value="target-arena">Target Arena</option>
          </select>
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
            onClick={handleCreate}
            className="btn btn-primary w-full py-3"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-700">
          <p>✅ You will be the room owner</p>
          <p>📋 A room code will be generated</p>
          <p>👥 Share the code to invite players</p>
        </div>
      </div>
    </div>
  )
}
