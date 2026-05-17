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
  const [schoolName, setSchoolName] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [category, setCategory] = useState('')
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
      // Infer category if not explicitly set
      let resolvedCategory = category
      if (!resolvedCategory && classLevel) {
        const cl = String(classLevel).toUpperCase()
        if (cl.startsWith('JSS')) resolvedCategory = 'junior'
        else if (cl.startsWith('SS')) resolvedCategory = 'senior'
        else resolvedCategory = 'open'
      }

      const res = await axios.post(`${apiUrl}/api/users`, {
        username: trimmedUsername,
        schoolName: schoolName || undefined,
        classLevel: classLevel || undefined,
        category: resolvedCategory || undefined
      })

      if (res?.data?.user?.username) {
        onUsernameSet(res.data.user.username)
        navigate('/lobby')
        return
      }

      setError('Failed to create or find user')
      return
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register username')
      return
    }
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

          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
            <input id="schoolName" type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Your school (optional)" className="input" />
          </div>

          <div>
            <label htmlFor="classLevel" className="block text-sm font-medium text-gray-700 mb-2">Class Level</label>
            <select id="classLevel" value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className="input">
              <option value="">Select class level (optional)</option>
              <option value="JSS1">JSS1</option>
              <option value="JSS2">JSS2</option>
              <option value="JSS3">JSS3</option>
              <option value="SS1">SS1</option>
              <option value="SS2">SS2</option>
              <option value="SS3">SS3</option>
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              <option value="">Auto-detect from class level or choose</option>
              <option value="junior">Junior</option>
              <option value="senior">Senior</option>
              <option value="open">Open</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">If left blank, category will be inferred from class level.</p>
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
