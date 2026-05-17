import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

/**
 * Header Component
 * Navigation header shown on all authenticated pages
 */
export default function Header({ username, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [schoolName, setSchoolName] = useState('')

  useEffect(() => {
    if (!username) return
    fetchProfile()
  }, [username])

  async function fetchProfile() {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${apiUrl}/api/users/${username}`)
      if (res.ok) {
        const data = await res.json()
        setSchoolName(data.user?.schoolName || '')
      }
    } catch (err) {
      // ignore
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      onLogout()
      navigate('/')
    }
  }

  const isActive = (path) => location.pathname === path ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'

  return (
    <header className="bg-white/90 backdrop-blur sticky top-0 z-30 shadow-sm shadow-slate-200">
      <div className="container-custom mx-auto flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <button
          onClick={() => navigate('/lobby')}
          className="inline-flex items-center gap-3 text-xl font-bold text-slate-900 hover:text-indigo-600 transition"
        >
          <span className="text-indigo-600">🎮</span>
          <span>BOPC Games Arena</span>
        </button>

        {username && (
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <button onClick={() => navigate('/lobby')} className={isActive('/lobby')}>Lobby</button>
            <button onClick={() => navigate('/leaderboard')} className={isActive('/leaderboard')}>Leaderboard</button>
            <button onClick={() => navigate('/contest')} className={isActive('/contest')}>Prize Zone</button>
            <button onClick={() => navigate('/profile')} className={isActive('/profile')}>Profile</button>
          </nav>
        )}

        {username ? (
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold">{username.charAt(0).toUpperCase()}</div>
              <div className="flex flex-col text-left">
                <span>{username}</span>
                {schoolName && <span className="text-xs text-slate-500">{schoolName}</span>}
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary py-2 px-4 text-sm">
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
