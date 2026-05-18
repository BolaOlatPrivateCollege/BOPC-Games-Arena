import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

// Pages
import LandingPage from './pages/LandingPage'
import UsernameEntryPage from './pages/UsernameEntryPage'
import GameLobby from './pages/GameLobby'
import GamePageWrapper from './pages/GamePageWrapper'
import RoomPage from './pages/RoomPage'
import TicTacToeBotPage from './pages/TicTacToeBotPage'
import TargetArenaBotPage from './pages/TargetArenaBotPage'
import MathRushSoloPracticePage from './pages/MathRushSoloPracticePage'
import MathRushPage from './pages/MathRushPage'
import LeaderboardPage from './pages/LeaderboardPage'
import WeeklyContest from './pages/WeeklyContest'
import AdminDashboard from './pages/AdminDashboard'
import ProfilePage from './pages/ProfilePage'

/**
 * Main App Component
 * Handles routing and user session management
 */
function App() {
  const [username, setUsername] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user has a saved username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('bopc_username')
    if (savedUsername) {
      setUsername(savedUsername)
    }
    setLoading(false)
  }, [])

  const handleUsernameSet = (name) => {
    setUsername(name)
    localStorage.setItem('bopc_username', name)
  }

  const handleLogout = () => {
    setUsername(null)
    localStorage.removeItem('bopc_username')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Landing and entry pages */}
        <Route 
          path="/" 
          element={!username ? <LandingPage /> : <Navigate to="/lobby" />} 
        />
        <Route 
          path="/enter-username" 
          element={!username ? <UsernameEntryPage onUsernameSet={handleUsernameSet} /> : <Navigate to="/lobby" />} 
        />

        {/* Protected routes - require username */}
        <Route 
          path="/lobby" 
          element={username ? <GameLobby username={username} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/room/:roomCode" 
          element={username ? <RoomPage username={username} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/game/:roomCode" 
          element={username ? <GamePageWrapper username={username} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/leaderboard" 
          element={username ? <LeaderboardPage username={username} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        <Route
          path="/contest"
          element={username ? <WeeklyContest username={username} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/games/tic-tac-toe/bot"
          element={username ? <TicTacToeBotPage username={username} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/games/target-arena/solo"
          element={username ? <TargetArenaBotPage username={username} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/games/math-rush/solo"
          element={username ? <MathRushSoloPracticePage username={username} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={username ? <ProfilePage username={username} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route 
          path="/admin" 
          element={<AdminDashboard username={username} onLogout={handleLogout} />} 
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
