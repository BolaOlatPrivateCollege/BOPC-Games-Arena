import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

/**
 * Username Entry Page Component
 * Allows guest users to enter a username and start playing
 */
export default function UsernameEntryPage({ onUsernameSet }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Handle username submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedUsername = username.trim()

    // Validation
    if (!trimmedUsername) {
      setError('Please enter a username')
      return
    }

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (trimmedUsername.length > 20) {
      setError('Username must be at most 20 characters')
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens')
      return
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      await axios.post(`${apiUrl}/api/leaderboard/register`, {
        username: trimmedUsername
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register username')
      return
    }

    onUsernameSet(trimmedUsername)
    navigate('/lobby')
  }

  return (
    <div className="min-h-screen bg-gradient flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Welcome to BOPC
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Enter a username to get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="input"
              maxLength="20"
            />
            <p className="text-xs text-gray-500 mt-1">
              3-20 characters, letters, numbers, underscore, hyphen
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full text-lg py-3"
          >
            Continue to Lobby
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary w-full py-3"
          >
            Back to Home
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> You're playing as a guest. Your progress will be saved locally.
          </p>
        </div>
      </div>
    </div>
  )
}
