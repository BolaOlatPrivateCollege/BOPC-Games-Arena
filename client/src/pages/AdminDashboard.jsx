import { useState, useEffect } from 'react'
import Header from '../components/Header'

/**
 * Admin Dashboard Component
 * Temporary admin protection for contest management.
 */
export default function AdminDashboard({ username, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [message, setMessage] = useState(null)
  const [selectedLeaderboard, setSelectedLeaderboard] = useState('global')
const [adminLeaderboard, setAdminLeaderboard] = useState([])
const [adminLeaderboardLoading, setAdminLeaderboardLoading] = useState(false)
const [adminLeaderboardError, setAdminLeaderboardError] = useState(null)

  useEffect(() => {
    const logged = sessionStorage.getItem('bopcAdminLoggedIn') === 'true'
    setAdminLoggedIn(logged)
  }, [])

  const adminLogin = async (e) => {
    e.preventDefault()
    setMessage(null)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const res = await fetch(`${apiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUser, password: adminPass })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setMessage({
          type: 'error',
          text: body.message || 'Invalid admin credentials'
        })
        return
      }

      const data = await res.json()

      if (data.success) {
        sessionStorage.setItem('bopcAdminLoggedIn', 'true')
        sessionStorage.setItem('bopcAdminSecret', adminPass)
        setAdminLoggedIn(true)
        setMessage({ type: 'success', text: 'Admin login successful' })
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Invalid admin credentials'
        })
      }
    } catch (err) {
      console.error('Admin login error', err)
      setMessage({ type: 'error', text: 'Admin login failed' })
    }
  }

  const adminLogout = () => {
    sessionStorage.removeItem('bopcAdminLoggedIn')
    sessionStorage.removeItem('bopcAdminSecret')
    setAdminLoggedIn(false)
    setMessage({ type: 'info', text: 'Admin logged out' })
  }

  const adminFetch = (path, opts = {}) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const secret = sessionStorage.getItem('bopcAdminSecret')

    const headers = {
      ...(opts.headers || {})
    }

    if (secret) {
      headers['x-admin-secret'] = secret
    }

    return fetch(`${apiUrl}${path}`, {
      ...opts,
      headers
    })
  }

  const handleCreateContest = async () => {
    setMessage(null)

    try {
      const res = await adminFetch('/api/contests', {
        method: 'POST'
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setMessage({
          type: 'error',
          text: body.error || 'Failed to create contest'
        })
        return
      }

      await res.json()

      setMessage({
        type: 'success',
        text: 'Contest created successfully'
      })
    } catch (err) {
      console.error('Create contest error', err)
      setMessage({
        type: 'error',
        text: 'Failed to create contest'
      })
    }
  }

  const handleEndContest = async () => {
    setMessage(null)

    try {
      const res = await adminFetch('/api/contests/end-active', {
        method: 'POST'
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setMessage({
          type: 'error',
          text: body.error || 'Failed to end contest'
        })
        return
      }

      await res.json()

      setMessage({
        type: 'success',
        text: 'Contest ended successfully'
      })
    } catch (err) {
      console.error('End contest error', err)
      setMessage({
        type: 'error',
        text: 'Failed to end contest'
      })
    }
  }

  // Admin state for leaderboards and contest/winners
  const [contest, setContest] = useState(null)
  const [globalLeaderboard, setGlobalLeaderboard] = useState([])
  const [ticLeaderboard, setTicLeaderboard] = useState([])
  const [targetLeaderboard, setTargetLeaderboard] = useState([])
  const [mathLeaderboard, setMathLeaderboard] = useState([])
  const [weeklyAllLb, setWeeklyAllLb] = useState([])
  const [weeklyTicLb, setWeeklyTicLb] = useState([])
  const [weeklyTargetLb, setWeeklyTargetLb] = useState([])
  const [weeklyMathLb, setWeeklyMathLb] = useState([])
  const [winners, setWinners] = useState([])
  const [lbLoading, setLbLoading] = useState(false)
  const [lbError, setLbError] = useState(null)

  const fetchActiveContest = async () => {
    try {
      const res = await adminFetch('/api/contests/active')
      if (!res.ok) return
      const data = await res.json().catch(() => ({}))
      const c = data.contest || data.active || data
      setContest(c || null)
      return c
    } catch (err) {
      console.error('fetchActiveContest', err)
    }
  }

  const fetchAllLeaderboards = async () => {
    try {
      setLbError(null)
      setLbLoading(true)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const [gRes, tRes, taRes, mRes] = await Promise.all([
        fetch(`${apiUrl}/api/leaderboard`),
        fetch(`${apiUrl}/api/leaderboard?game=ticTacToe`),
        fetch(`${apiUrl}/api/leaderboard?game=targetArena`),
        fetch(`${apiUrl}/api/leaderboard?game=mathRush`)
      ])

      if (!gRes.ok || !tRes.ok || !taRes.ok) {
        setLbError('Unable to load leaderboard')
      }

      const gJson = gRes.ok ? await gRes.json().catch(() => []) : []
      const tJson = tRes.ok ? await tRes.json().catch(() => []) : []
      const taJson = taRes.ok ? await taRes.json().catch(() => []) : []
      const mJson = mRes.ok ? await mRes.json().catch(() => []) : []

      setGlobalLeaderboard(Array.isArray(gJson) ? gJson : (gJson.leaderboard || []))
      setTicLeaderboard(Array.isArray(tJson) ? tJson : (tJson.leaderboard || []))
      setTargetLeaderboard(Array.isArray(taJson) ? taJson : (taJson.leaderboard || []))
      setMathLeaderboard(Array.isArray(mJson) ? mJson : (mJson.leaderboard || []))
    } catch (err) {
      console.error('fetchAllLeaderboards', err)
      setLbError('Unable to load leaderboard')
    } finally {
      setLbLoading(false)
    }
  }

  const fetchWeeklyLeaderboards = async (contestId) => {
    if (!contestId) return
    try {
      setLbError(null)
      setLbLoading(true)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      // prefer `game=all` alias for all-games
      const [allRes, tRes, taRes, mRes] = await Promise.all([
        fetch(`${apiUrl}/api/contests/${contestId}/leaderboard?game=all`),
        fetch(`${apiUrl}/api/contests/${contestId}/leaderboard?game=ticTacToe`),
        fetch(`${apiUrl}/api/contests/${contestId}/leaderboard?game=targetArena`),
        fetch(`${apiUrl}/api/contests/${contestId}/leaderboard?game=mathRush`)
      ])

      if (!allRes.ok || !tRes.ok || !taRes.ok) {
        setLbError('Unable to load leaderboard')
      }

      const allJson = allRes.ok ? await allRes.json().catch(() => []) : []
      const tJson = tRes.ok ? await tRes.json().catch(() => []) : []
      const taJson = taRes.ok ? await taRes.json().catch(() => []) : []
      const mJson = mRes.ok ? await mRes.json().catch(() => []) : []

      setWeeklyAllLb(Array.isArray(allJson) ? allJson : (allJson.leaderboard || []))
      setWeeklyTicLb(Array.isArray(tJson) ? tJson : (tJson.leaderboard || []))
      setWeeklyTargetLb(Array.isArray(taJson) ? taJson : (taJson.leaderboard || []))
      setWeeklyMathLb(Array.isArray(mJson) ? mJson : (mJson.leaderboard || []))
    } catch (err) {
      console.error('fetchWeeklyLeaderboards', err)
      setLbError('Unable to load leaderboard')
    } finally {
      setLbLoading(false)
    }
  }

  const fetchWinnersAdmin = async () => {
    try {
      const res = await adminFetch('/api/contests/latest/winners')
      if (!res.ok) return setWinners([])
      const data = await res.json().catch(() => [])
      setWinners(data.winners || data || [])
    } catch (err) {
      console.error('fetchWinnersAdmin', err)
    }
  }

  useEffect(() => {
    // initial admin data load
    ;(async () => {
      await fetchAllLeaderboards()
      const c = await fetchActiveContest()
      if (c && c._id) await fetchWeeklyLeaderboards(c._id)
      else await fetchWinnersAdmin()
    })()
  }, [])

  useEffect(() => {
    if (activeTab !== 'leaderboards') return

    if (selectedLeaderboard.startsWith('weekly')) {
      ;(async () => {
        const c = contest || (await fetchActiveContest())
        if (c && c._id) {
          await fetchWeeklyLeaderboards(c._id)
        } else {
          setLbError('Unable to load leaderboard')
        }
      })()
    } else {
      // normal leaderboards
      if (selectedLeaderboard === 'global' && (globalLeaderboard || []).length === 0) fetchAllLeaderboards()
      if (selectedLeaderboard === 'ticTacToe' && (ticLeaderboard || []).length === 0) fetchAllLeaderboards()
      if (selectedLeaderboard === 'targetArena' && (targetLeaderboard || []).length === 0) fetchAllLeaderboards()
    }
  }, [selectedLeaderboard, activeTab])


  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'contest', label: 'Contest', icon: '🏆' },
    { id: 'leaderboards', label: 'Leaderboards', icon: '📈' },
    { id: 'winners', label: 'Winners', icon: '🏅' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={username} onLogout={onLogout} />

      <div className="container-custom py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⚙️ Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Manage BOPC Games Arena
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {!adminLoggedIn ? (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Admin Login</h2>

            <form onSubmit={adminLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Admin Username
                </label>
                <input
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="input w-full"
                  placeholder="Enter admin username"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="input w-full"
                  placeholder="Enter admin password"
                />
              </div>

              <button type="submit" className="btn btn-primary w-full">
                Login
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Admin Control Room
                </h2>

                <button onClick={adminLogout} className="btn btn-secondary">
                  Logout Admin
                </button>
              </div>

              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Dashboard Overview</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-lg">
                      <p className="text-4xl font-bold mb-2">{contest ? 'Active' : 'None'}</p>
                      <p className="text-sm opacity-90">Active Contest</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-lg">
                      <p className="text-4xl font-bold mb-2">{weeklyAllLb.length || 0}</p>
                      <p className="text-sm opacity-90">Total Contest Players</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-6 rounded-lg">
                      <p className="text-4xl font-bold mb-2">{globalLeaderboard.length || 0}</p>
                      <p className="text-sm opacity-90">Global Leaderboard Count</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-400 to-pink-600 text-white p-6 rounded-lg">
                      <p className="text-4xl font-bold mb-2">{globalLeaderboard[0]?.username || 'N/A'}</p>
                      <p className="text-sm opacity-90">Current Top Player</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={handleCreateContest} className="px-4 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Create Weekly Contest</button>
                    <button onClick={handleEndContest} className="px-4 py-4 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600">End Active Contest</button>
                    <button onClick={() => { fetchWinnersAdmin(); setActiveTab('winners') }} className="px-4 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">View Winners</button>
                  </div>
                </div>
              )}

              {activeTab === 'contest' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Active Contest</h3>
                  {contest ? (
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg border p-4">
                        <h4 className="font-bold text-lg">{contest.title}</h4>
                        <p className="text-sm text-gray-600">{contest.description}</p>
                        <div className="mt-3 text-sm text-gray-500">Start: {new Date(contest.startDate).toLocaleString()}</div>
                        <div className="text-sm text-gray-500">End: {new Date(contest.endDate).toLocaleString()}</div>
                        <div className="mt-2 text-sm">Allowed games: {contest.allowedGames?.join(', ')}</div>
                        <div className="mt-2 text-sm font-semibold">Prize: {contest.prizeDescription || 'TBD'}</div>
                      </div>

                      <div className="flex gap-3">
                        <button onClick={handleCreateContest} className="px-4 py-2 bg-green-600 text-white rounded">Create Contest</button>
                        <button onClick={handleEndContest} className="px-4 py-2 bg-yellow-500 text-white rounded">End Contest</button>
                        <button onClick={() => { fetchActiveContest(); if (contest && contest._id) fetchWeeklyLeaderboards(contest._id) }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">Refresh Contest</button>
                        <button onClick={() => { fetchWinnersAdmin(); setActiveTab('winners') }} className="px-4 py-2 bg-indigo-600 text-white rounded">View Winners</button>
                      </div>
                    </div>
                  ) : (
                    <div>No active contest.</div>
                  )}
                </div>
              )}

              {activeTab === 'leaderboards' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Leaderboards</h3>

                  <div className="flex gap-2 flex-wrap mb-4">
                    {['global','ticTacToe','targetArena','mathRush','weeklyAll','weeklyTic','weeklyTarget','weeklyMath'].map(key => (
                      <button key={key} onClick={() => setSelectedLeaderboard(key)} className={`px-4 py-2 rounded ${selectedLeaderboard===key ? 'bg-indigo-600 text-white' : 'bg-white ring-1 ring-gray-200'}`}>
                        {key === 'global' ? 'Global' : key === 'ticTacToe' ? 'Tic Tac Toe' : key === 'targetArena' ? 'Target Arena' : key === 'mathRush' ? 'Math Rush' : key === 'weeklyAll' ? 'Weekly All Games' : key === 'weeklyTic' ? 'Weekly Tic Tac Toe' : key === 'weeklyTarget' ? 'Weekly Target Arena' : 'Weekly Math Rush'}
                      </button>
                    ))}
                  </div>

                  {lbLoading ? (
                    <div className="p-8 text-center text-gray-600">Loading leaderboard...</div>
                  ) : lbError ? (
                    <div className="p-8 text-center text-red-600">Unable to load leaderboard</div>
                  ) : (
                    <div className="overflow-x-auto bg-white rounded-lg p-4">
                      {(() => {
                        const rows = selectedLeaderboard === 'global'
                          ? (globalLeaderboard || [])
                          : selectedLeaderboard === 'ticTacToe'
                          ? (ticLeaderboard || [])
                          : selectedLeaderboard === 'targetArena'
                          ? (targetLeaderboard || [])
                          : selectedLeaderboard === 'mathRush'
                          ? (mathLeaderboard || [])
                          : selectedLeaderboard === 'weeklyAll'
                          ? (weeklyAllLb || [])
                          : selectedLeaderboard === 'weeklyTic'
                          ? (weeklyTicLb || [])
                          : selectedLeaderboard === 'weeklyTarget'
                          ? (weeklyTargetLb || [])
                          : (weeklyMathLb || [])

                        return (
                          <table className="w-full min-w-[720px] text-sm">
                            <thead className="bg-gray-100 border-b">
                              <tr>
                                <th className="px-4 py-2 text-left">Rank</th>
                                <th className="px-4 py-2 text-left">Player</th>
                                {((selectedLeaderboard === 'ticTacToe') || (selectedLeaderboard === 'weeklyTic')) && (
                                  <th className="px-4 py-2 text-center">Points</th>
                                )}
                                <th className="px-4 py-2 text-center">Wins</th>
                                <th className="px-4 py-2 text-center">Losses</th>
                                <th className="px-4 py-2 text-center">Draws</th>
                                <th className="px-4 py-2 text-center">Win Rate</th>
                                {(selectedLeaderboard === 'targetArena' || selectedLeaderboard === 'weeklyTarget') && (
                                  <>
                                    <th className="px-4 py-2 text-center">High Score</th>
                                    <th className="px-4 py-2 text-center">Total Score</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {(rows || []).map((p, idx) => {
                                const wins = p?.wins ?? 0
                                const losses = p?.losses ?? 0
                                const draws = p?.draws ?? 0
                                const winRate = p?.winRate ?? 0
                                const points = p?.points ?? null
                                const highScore = p?.highScore ?? p?.gameStats?.targetArena?.highScore ?? null
                                const totalScore = p?.totalScore ?? p?.gameStats?.targetArena?.totalScore ?? null

                                return (
                                  <tr key={idx} className={`border-b ${p?.username === username ? 'bg-indigo-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <td className="px-4 py-2">#{idx+1}</td>
                                    <td className="px-4 py-2 font-semibold">{p?.username || 'Unknown'}{p?.username===username? ' (You)': ''}<div className="text-xs text-gray-500">{p?.schoolName}</div></td>
                                    {((selectedLeaderboard === 'ticTacToe') || (selectedLeaderboard === 'weeklyTic')) && (
                                      <td className="px-4 py-2 text-center font-semibold text-cyan-600">{points ?? '-'}</td>
                                    )}
                                    <td className="px-4 py-2 text-center font-semibold text-green-600">{wins}</td>
                                    <td className="px-4 py-2 text-center font-semibold text-red-600">{losses}</td>
                                    <td className="px-4 py-2 text-center font-semibold text-orange-600">{draws}</td>
                                    <td className="px-4 py-2 text-center font-semibold text-blue-600">{winRate}%</td>
                                    {(selectedLeaderboard === 'targetArena' || selectedLeaderboard === 'weeklyTarget') && (
                                      <>
                                        <td className="px-4 py-2 text-center font-semibold text-purple-600">{highScore ?? 0}</td>
                                        <td className="px-4 py-2 text-center font-semibold text-teal-600">{totalScore ?? 0}</td>
                                      </>
                                    )}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )
                      })()}
                      {( (selectedLeaderboard === 'global' ? (globalLeaderboard || []) : selectedLeaderboard === 'ticTacToe' ? (ticLeaderboard || []) : selectedLeaderboard === 'targetArena' ? (targetLeaderboard || []) : selectedLeaderboard === 'weeklyAll' ? (weeklyAllLb || []) : selectedLeaderboard === 'weeklyTic' ? (weeklyTicLb || []) : (weeklyTargetLb || []) ).length === 0) && (
                        <div className="p-8 text-center text-gray-500">No players on the leaderboard yet.</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'winners' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Winners</h3>

                  {winners && winners.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {winners.slice(0,3).map((w, i) => (
                        <div key={i} className="bg-white p-4 rounded shadow">
                          <div className="text-sm text-gray-500">#{i+1}</div>
                          <div className="font-bold">{w.username}</div>
                          <div className="text-sm">Points: {w.points || 0}</div>
                          <div className="text-sm">Wins: {w.wins || 0} • Draws: {w.draws || 0} • Losses: {w.losses || 0}</div>
                          <div className="text-sm">Games: {w.gamesPlayed || 0}</div>
                          <div className="text-sm">High Score: {w.highScore || 0} • Total Score: {w.totalScore || 0}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>No winners yet.</div>
                  )}
                </div>
              )}

              {activeTab === 'students' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Student Management</h3>
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                    <p className="text-blue-800">Student listing and management coming soon.</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">System Settings</h3>

                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h4 className="font-bold text-gray-800 mb-2">Game Configuration</h4>
                      <p className="text-gray-600 text-sm">Tic Tac Toe: Max players per room = 2</p>
                      <p className="text-gray-600 text-sm">Target Arena: 60-second challenge rounds</p>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-gray-800 mb-2">Server Status</h4>
                      <p className="text-green-600 text-sm">✅ All systems operational</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Database</h4>
                      <p className="text-gray-600 text-sm">MongoDB: Connected</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                ℹ️ <strong>Note:</strong> This is a temporary admin dashboard.
                Full moderation, reports, student management, and secure role-based admin features will be added later.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}