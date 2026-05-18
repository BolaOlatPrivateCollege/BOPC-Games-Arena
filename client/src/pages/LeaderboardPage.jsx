import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { useSocket } from '../hooks/useSocket'

const leaderboardTabs = [
  { key: 'global', label: 'Global' },
  { key: 'ticTacToe', label: 'Tic Tac Toe' },
  { key: 'targetArena', label: 'Target Arena' },
  { key: 'mathRush', label: 'Math Rush' }
]

/**
 * Leaderboard Page Component
 * Displays top players and their stats
 */
export default function LeaderboardPage({ username, onLogout }) {
  const { socket } = useSocket()
  const [selectedGame, setSelectedGame] = useState('global')
  const [leaderboard, setLeaderboard] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!socket) return

    const fetchLeaderboard = () => {
      setLoading(true)
      socket.emit('fetch-leaderboard', { game: selectedGame })
    }

    fetchLeaderboard()

    socket.on('leaderboard-data', (data) => {
      setLeaderboard(data.leaderboard)
      setUserStats(data.userStats)
      setLoading(false)
    })

    return () => {
      socket.off('leaderboard-data')
    }
  }, [socket, selectedGame])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={username} onLogout={onLogout} />

      <div className="container-custom py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏆 Leaderboard</h1>
          <p className="text-xl text-gray-600">Top players in BOPC Games Arena</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {leaderboardTabs.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-full px-5 py-2 font-semibold transition ${
                selectedGame === tab.key
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedGame(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Page Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedGame === 'global'
              ? 'Global Leaderboard'
              : selectedGame === 'ticTacToe'
              ? 'Tic Tac Toe Leaderboard'
              : selectedGame === 'targetArena'
              ? 'Target Arena Leaderboard'
              : 'Math Rush Leaderboard'}
          </h2>
          <p className="text-gray-600">
            {selectedGame === 'global'
              ? 'Combined results across all games.'
              : selectedGame === 'ticTacToe'
              ? 'Ranked by Tic Tac Toe performance.'
              : selectedGame === 'targetArena'
              ? 'Ranked by Target Arena wins, high score, and total score.'
              : 'Ranked by Math Rush wins, high score, total score, and win rate.'}
          </p>
        </div>

        {/* User Stats Card */}
        {userStats && (
          <div className="bg-gradient to br from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg p-8 mb-12 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-20 rounded p-4 text-center">
                <p className="text-3xl mb-2">#{userStats.rank || 'N/A'}</p>
                <p className="text-sm opacity-90">Current Rank</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded p-4 text-center">
                <p className="text-3xl mb-2">{userStats.wins || 0}</p>
                <p className="text-sm opacity-90">Wins</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded p-4 text-center">
                <p className="text-3xl mb-2">{userStats.losses || 0}</p>
                <p className="text-sm opacity-90">Losses</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded p-4 text-center">
                <p className="text-3xl mb-2">{userStats.winRate || '0'}%</p>
                <p className="text-sm opacity-90">Win Rate</p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading leaderboard...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-800">Rank</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-800">Player</th>
                    <th className="px-6 py-4 text-center font-bold text-gray-800">Wins</th>
                    <th className="px-6 py-4 text-center font-bold text-gray-800">Losses</th>
                    <th className="px-6 py-4 text-center font-bold text-gray-800">Draws</th>
                    {selectedGame === 'ticTacToe' && (
                      <>
                        <th className="px-6 py-4 text-center font-bold text-gray-800">Total Games</th>
                        <th className="px-6 py-4 text-center font-bold text-gray-800">Points</th>
                      </>
                    )}
                    <th className="px-6 py-4 text-center font-bold text-gray-800">Win Rate</th>
                    {selectedGame === 'global' && (
                      <th className="px-6 py-4 text-center font-bold text-gray-800">Rating</th>
                    )}
                    {selectedGame === 'targetArena' && (
                      <>
                        <th className="px-6 py-4 text-center font-bold text-gray-800">High Score</th>
                        <th className="px-6 py-4 text-center font-bold text-gray-800">Total Score</th>
                      </>
                    )}
                    {selectedGame === 'mathRush' && (
                      <>
                        <th className="px-6 py-4 text-center font-bold text-gray-800">High Score</th>
                        <th className="px-6 py-4 text-center font-bold text-gray-800">Total Score</th>
                        <th className="px-6 py-4 text-center font-bold text-gray-800">Best Streak</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player, idx) => {
                    const gameStats = player.gameStats || {}
                    const playerGameStats = selectedGame === 'ticTacToe'
                      ? gameStats.ticTacToe || {}
                      : selectedGame === 'targetArena'
                      ? gameStats.targetArena || {}
                      : selectedGame === 'mathRush'
                      ? gameStats.mathRush || {}
                      : {}

                    const wins = selectedGame === 'global'
                      ? player.wins || 0
                      : playerGameStats.wins || 0
                    const losses = selectedGame === 'global'
                      ? player.losses || 0
                      : playerGameStats.losses || 0
                    const draws = selectedGame === 'global'
                      ? player.draws || 0
                      : playerGameStats.draws || 0
                    const totalGames = selectedGame === 'ticTacToe'
                      ? playerGameStats.totalGamesPlayed ?? (wins + losses + draws)
                      : null
                    const points = selectedGame === 'ticTacToe'
                      ? wins * 3 + draws
                      : null

                    return (
                      <tr 
                        key={idx} 
                        className={`border-b ${
                          player.username === username 
                            ? 'bg-indigo-50' 
                            : idx % 2 === 0 
                            ? 'bg-white' 
                            : 'bg-gray-50'
                        } hover:bg-indigo-100 transition`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
                            </span>
                            <span className="font-bold text-gray-800">#{idx + 1}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {player.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800">{player.username}{player.username === username && ' (You)'}</span>
                              {player.schoolName && <span className="text-xs text-gray-500">{player.schoolName}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-green-600">
                          {selectedGame === 'global' ? player.wins || 0 : playerGameStats.wins || 0}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-red-600">
                          {selectedGame === 'global' ? player.losses || 0 : playerGameStats.losses || 0}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-orange-600">
                          {selectedGame === 'global' ? player.draws || 0 : playerGameStats.draws || 0}
                        </td>
                        {selectedGame === 'ticTacToe' && (
                          <>
                            <td className="px-6 py-4 text-center font-semibold text-gray-800">
                              {totalGames}
                            </td>
                            <td className="px-6 py-4 text-center font-semibold text-cyan-600">
                              {points}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 text-center font-semibold text-blue-600">
                          {selectedGame === 'global' ? player.winRate || 0 : playerGameStats.winRate || 0}%
                        </td>
                        {selectedGame === 'global' && (
                          <td className="px-6 py-4 text-center">
                            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold">
                              {player.rating || 1000}
                            </span>
                          </td>
                        )}
                        {selectedGame === 'targetArena' && (
                          <>
                            <td className="px-6 py-4 text-center font-semibold text-purple-600">
                              {playerGameStats.highScore || 0}
                            </td>
                            <td className="px-6 py-4 text-center font-semibold text-teal-600">
                              {playerGameStats.totalScore || 0}
                            </td>
                          </>
                        )}
                        {selectedGame === 'mathRush' && (
                          <>
                            <td className="px-6 py-4 text-center font-semibold text-purple-600">
                              {playerGameStats.highScore || 0}
                            </td>
                            <td className="px-6 py-4 text-center font-semibold text-teal-600">
                              {playerGameStats.totalScore || 0}
                            </td>
                            <td className="px-6 py-4 text-center font-semibold text-indigo-600">
                              {playerGameStats.bestStreak || 0}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {leaderboard.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No players on the leaderboard yet. Start playing to appear here!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
