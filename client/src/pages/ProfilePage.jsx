import { useEffect, useState } from 'react'

export default function ProfilePage({ username, onLogout }) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [weeklyRank, setWeeklyRank] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) return
    loadProfile()
  }, [username])

  async function loadProfile() {
    setLoading(true)
    try {
      const pRes = await fetch(`${apiUrl}/api/users/${username}`)
      if (pRes.ok) {
        const pd = await pRes.json()
        setProfile(pd.user || null)
      }

      const sRes = await fetch(`${apiUrl}/api/leaderboard/user/${username}`)
      if (sRes.ok) {
        const sd = await sRes.json()
        setStats(sd.user || null)
      }

      // Fetch active contest and try to find weekly rank
      const cRes = await fetch(`${apiUrl}/api/contests/active`)
      if (cRes.ok) {
        const cd = await cRes.json()
        const contest = cd.contest
        if (contest) {
          const lbRes = await fetch(`${apiUrl}/api/contests/${contest._id}/leaderboard?game=allGames`)
          if (lbRes.ok) {
            const lbData = await lbRes.json()
            const idx = (lbData.leaderboard || []).findIndex(r => r.username === username)
            if (idx >= 0) setWeeklyRank(idx + 1)
          }
        }
      }
    } catch (err) {
      console.error('Error loading profile page:', err)
    }
    setLoading(false)
  }

  if (loading) return <div className="p-6">Loading profile...</div>

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
          <h2 className="text-3xl font-bold">Profile</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Username</div>
              <div className="font-semibold">{profile?.username || username}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Display Name</div>
              <div className="font-semibold">{profile?.displayName || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">School</div>
              <div className="font-semibold">{profile?.schoolName || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Class Level</div>
              <div className="font-semibold">{profile?.classLevel || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Category</div>
              <div className="font-semibold">{profile?.category || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">State</div>
              <div className="font-semibold">{profile?.state || 'Not set'}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-bold mb-2">Global Stats</h3>
          {stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Wins</div>
                <div className="font-semibold">{stats.wins || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Losses</div>
                <div className="font-semibold">{stats.losses || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Draws</div>
                <div className="font-semibold">{stats.draws || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Games Played</div>
                <div className="font-semibold">{stats.totalGamesPlayed || 0}</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No global stats available.</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-2">Weekly Contest</h3>
          <div className="text-sm text-gray-600">Current rank: {weeklyRank ? `#${weeklyRank}` : 'Not ranked'}</div>
        </div>
      </div>
    </div>
  )
}
