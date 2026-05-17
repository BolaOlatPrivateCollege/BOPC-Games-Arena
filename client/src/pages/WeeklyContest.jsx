import { useEffect, useState } from 'react'
import Header from '../components/Header'

const gameFilters = [
  { key: 'allGames', label: 'All Games' },
  { key: 'ticTacToe', label: 'Tic Tac Toe' },
  { key: 'targetArena', label: 'Target Arena' }
]

const categoryFilters = [
  { key: 'allCategories', label: 'All Categories' },
  { key: 'junior', label: 'Junior' },
  { key: 'senior', label: 'Senior' },
  { key: 'open', label: 'Open' }
]

export default function WeeklyContest({ username, onLogout }) {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const [contest, setContest] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [filter, setFilter] = useState('allGames')
  const [category, setCategory] = useState('allCategories')
  const [loading, setLoading] = useState(true)
  const [winners, setWinners] = useState([])
  const [statusMessage, setStatusMessage] = useState(null)

  useEffect(() => {
    fetchActiveContest()
  }, [])

  useEffect(() => {
    if (contest) fetchLeaderboard()
  }, [contest, filter, category])

  async function fetchActiveContest() {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/contests/active`)
      const data = await res.json()
      setContest(data.contest)
      if (data.contest) console.log('Active contest found:', data.contest.title)
      else console.log('No active contest found')
    } catch (err) {
      console.error('Error fetching active contest', err)
    }
    setLoading(false)
  }

  async function fetchLeaderboard() {
    if (!contest) return
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/contests/${contest._id}/leaderboard?game=${filter}&category=${category}`)
      const data = await res.json()
      setLeaderboard(data.leaderboard || [])
      console.log('Weekly contest leaderboard fetched', { game: filter, category })
    } catch (err) {
      console.error('Error fetching contest leaderboard', err)
    }
    setLoading(false)
  }

  async function createContest() {
    setLoading(true)
    try {
      const adminSecret = sessionStorage.getItem('bopcAdminSecret')
      if (!adminSecret) {
        setStatusMessage({ type: 'error', text: 'Admin access required' })
        setLoading(false)
        return
      }

      const res = await fetch(`${apiUrl}/api/contests`, { method: 'POST', headers: { 'x-admin-secret': adminSecret } })
      if (!res.ok) {
        setStatusMessage({ type: 'error', text: 'Failed to create contest' })
        setLoading(false)
        return
      }
      const data = await res.json()
      setStatusMessage({ type: 'success', text: 'Contest created successfully' })
      // refresh active contest from server
      await fetchActiveContest()
      setTimeout(fetchLeaderboard, 200)
    } catch (err) {
      console.error('Error creating contest', err)
    }
    setLoading(false)
  }

  async function endContest() {
    setLoading(true)
    try {
      const adminSecret = sessionStorage.getItem('bopcAdminSecret')
      if (!adminSecret) {
        setStatusMessage({ type: 'error', text: 'Admin access required' })
        setLoading(false)
        return
      }

      const res = await fetch(`${apiUrl}/api/contests/end-active`, { method: 'POST', headers: { 'x-admin-secret': adminSecret } })
      if (!res.ok) {
        const body = await res.json()
        console.warn('End contest response:', body)
        setStatusMessage({ type: 'error', text: 'Failed to end contest' })
        setLoading(false)
        return
      }
      const data = await res.json()
      setContest(data.contest)
      setStatusMessage({ type: 'success', text: 'Contest ended successfully' })
      // fetch winners and leaderboard
      await fetchWinners()
      setTimeout(fetchLeaderboard, 200)
    } catch (err) {
      console.error('Error ending contest', err)
    }
    setLoading(false)
  }

  async function fetchWinners() {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/contests/latest/winners?category=${category}`)
      if (!res.ok) {
        setWinners([])
        setStatusMessage({ type: 'info', text: 'No winners yet' })
        setLoading(false)
        return
      }
      const data = await res.json()
      setWinners(data.winners || [])
      if (data.winners && data.winners.length > 0) setStatusMessage({ type: 'success', text: 'Winners fetched' })
      else setStatusMessage({ type: 'info', text: 'No winners yet' })
    } catch (err) {
      console.error('Error fetching winners', err)
    }
    setLoading(false)
  }

  const getStatus = () => {
    if (!contest) return 'No active contest'
    const now = new Date()
    const start = new Date(contest.startDate)
    const end = new Date(contest.endDate)
    if (now < start) return `Upcoming — starts ${start.toLocaleString()}`
    if (now > end) return 'Ended'
    return `Active — ends ${end.toLocaleString()}`
  }

  const isAdminLoggedIn = sessionStorage.getItem('bopcAdminLoggedIn') === 'true'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={username} onLogout={onLogout} />

      <div className="container-custom py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏆 Prize Zone</h1>
          <p className="text-gray-600">Compete in weekly contests and win prizes</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {statusMessage && (
            <div className={`mb-4 p-3 rounded ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800' : statusMessage.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
              {statusMessage.text}
            </div>
          )}

          {loading ? (
            <p>Loading contest...</p>
          ) : contest ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <h2 className="text-2xl font-bold">{contest.title}</h2>
                <p className="text-gray-700">{contest.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start: {new Date(contest.startDate).toLocaleString()}</p>
                <p className="text-sm text-gray-500">End: {new Date(contest.endDate).toLocaleString()}</p>
                <p className="mt-2 font-semibold">{getStatus()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Allowed games: {contest.allowedGames.join(', ')}</p>
                <p className="mt-2 text-indigo-700 font-semibold">Prize: {contest.prizeDescription || 'TBD'}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No active contest right now. Check back soon.</p>
          )}
        </div>

        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div className="flex gap-3 items-center flex-wrap">
            {gameFilters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter===f.key? 'bg-indigo-600 text-white' : 'bg-white ring-1 ring-gray-200'}`}>
                {f.label}
              </button>
            ))}

            <div className="ml-2" />

            {categoryFilters.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)} className={`rounded-full px-3 py-2 text-sm font-semibold ${category===c.key? 'bg-slate-700 text-white' : 'bg-white ring-1 ring-gray-200'}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-500">Showing: {filter === 'allGames' ? 'All Games' : filter === 'ticTacToe' ? 'Tic Tac Toe' : 'Target Arena'} • {category === 'allCategories' ? 'All Categories' : category === 'junior' ? 'Junior' : category === 'senior' ? 'Senior' : 'Open'}</div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-bold">Rank</th>
                <th className="px-4 py-3 text-left font-bold">Player</th>
                <th className="px-4 py-3 text-center font-bold">Points</th>
                <th className="px-4 py-3 text-center font-bold">Wins</th>
                <th className="px-4 py-3 text-center font-bold">Losses</th>
                <th className="px-4 py-3 text-center font-bold">Draws</th>
                <th className="px-4 py-3 text-center font-bold">Games</th>
                <th className="px-4 py-3 text-center font-bold">Win Rate</th>
                {filter !== 'ticTacToe' && (
                  <>
                    <th className="px-4 py-3 text-center font-bold">High Score</th>
                    <th className="px-4 py-3 text-center font-bold">Total Score</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, idx) => (
                <tr key={idx} className={`border-b ${row.username === username ? 'bg-indigo-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-4 py-3">#{idx+1}</td>
                  <td className="px-4 py-3 font-semibold">
                    <div>{row.username}{row.username === username && ' (You)'}</div>
                    {row.schoolName && <div className="text-xs text-gray-500">{row.schoolName}</div>}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{row.points || 0}</td>
                  <td className="px-4 py-3 text-center">{row.wins || 0}</td>
                  <td className="px-4 py-3 text-center">{row.losses || 0}</td>
                  <td className="px-4 py-3 text-center">{row.draws || 0}</td>
                  <td className="px-4 py-3 text-center">{row.gamesPlayed || 0}</td>
                  <td className="px-4 py-3 text-center">{row.winRate || 0}%</td>
                  {filter !== 'ticTacToe' && (
                    <>
                      <td className="px-4 py-3 text-center">{row.highScore || 0}</td>
                      <td className="px-4 py-3 text-center">{row.totalScore || 0}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {leaderboard.length === 0 && (
            <div className="p-6 text-center text-gray-500">No contest scores yet. Play to earn points!</div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Winners</h3>
          {winners && winners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {winners.map((w, i) => (
                <div key={i} className="bg-white p-4 rounded shadow">
                  <div className="text-sm text-gray-500">#{i+1}</div>
                  <div className="font-bold">{w.username}</div>
                  <div className="text-sm text-gray-600">Points: {w.points || 0}</div>
                  <div className="text-sm text-gray-600">Wins: {w.wins || 0} • Draws: {w.draws || 0} • Losses: {w.losses || 0}</div>
                </div>
              ))}
            </div>
          ) : contest && contest.status === 'ended' ? (
            <div>Top players will be shown here. Winners pending verification.</div>
          ) : (
            <div>Contest in progress. Winners will be announced after contest ends.</div>
          )}
        </div>

        {isAdminLoggedIn && (
          <div className="mt-8 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold mb-3">Admin (placeholder)</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={createContest} className="px-4 py-2 bg-green-600 text-white rounded">Create Contest</button>
              <button onClick={endContest} className="px-4 py-2 bg-yellow-500 text-white rounded">End Contest</button>
              <button onClick={fetchWinners} className="px-4 py-2 bg-indigo-600 text-white rounded">View Winners</button>
            </div>
            <p className="mt-3 text-sm text-gray-500">Admin tools are placeholders. Proper admin workflows and security will be implemented later.</p>
          </div>
        )}
      </div>
    </div>
  )
}
