import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import CreateRoomModal from '../components/CreateRoomModal'
import JoinRoomModal from '../components/JoinRoomModal'

/**
 * Game Lobby Page Component
 * Central hub where users can create rooms, join rooms, view leaderboard, or access admin dashboard
 */
export default function GameLobby({ username, onLogout }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [createGameType, setCreateGameType] = useState('tic-tac-toe')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-100">
      <Header username={username} onLogout={onLogout} />

      <div className="container-custom mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-8 shadow-2xl shadow-slate-900/20 text-white overflow-hidden">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/80">Welcome back</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight">Ready to challenge your next opponent, {username}?</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">Create a private room, join a friend, or explore the leaderboard. BOPC Games Arena makes multiplayer learning fun and easy.</p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  Create Room
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="btn btn-secondary"
                >
                  Join Room
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
                <p className="text-sm uppercase tracking-[0.2em] text-white/80">Featured game</p>
                <h2 className="mt-4 text-2xl font-semibold">Tic Tac Toe</h2>
                <p className="mt-3 text-sm text-white/85">Quick rounds, easy rematch flow, and a clean game board for friendly competition.</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
                <p className="text-sm uppercase tracking-[0.2em] text-white/80">Leaderboard</p>
                <h2 className="mt-4 text-2xl font-semibold">Top learners</h2>
                <p className="mt-3 text-sm text-white/85">Compete for top rank in the arena and watch your progress grow.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-indigo-600">Games</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">Play now or explore upcoming titles</h2>
                </div>
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="btn btn-outline"
                >
                  View Leaderboard
                </button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
                  <div className="text-5xl">⭕</div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Tic Tac Toe</h3>
                  <p className="mt-2 text-sm text-slate-600">Live 2-player matches with rematch support and clear turn tracking.</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700">Available</div>
                  <div className="mt-6 grid gap-3">
                    <button
                      onClick={() => {
                        setCreateGameType('tic-tac-toe')
                        setShowCreateModal(true)
                      }}
                      className="btn btn-primary w-full py-3"
                    >
                      Create Room / Play Online
                    </button>
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="btn btn-secondary w-full py-3"
                    >
                      Join Room
                    </button>
                    <button
                      onClick={() => navigate('/games/tic-tac-toe/bot')}
                      className="btn btn-outline w-full py-3"
                    >
                      Play with Bot
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                  <div className="text-5xl">🎈</div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Target Arena</h3>
                  <p className="mt-2 text-sm text-slate-600">A fun 60-second target challenge with balloons, stars, and fast scoring.</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">Available</div>
                  <div className="mt-6 grid gap-3">
                    <button
                      onClick={() => {
                        setCreateGameType('target-arena')
                        setShowCreateModal(true)
                      }}
                      className="btn btn-primary w-full py-3"
                    >
                      Create Room / Play Online
                    </button>
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="btn btn-secondary w-full py-3"
                    >
                      Join Room
                    </button>
                    <button
                      onClick={() => navigate('/games/target-arena/solo')}
                      className="btn btn-outline w-full py-3"
                    >
                      Solo Practice
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm opacity-90">
                  <div className="text-5xl">♟️</div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Checkers</h3>
                  <p className="mt-2 text-sm text-slate-600">Coming soon — classic board strategy for 2 players.</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Coming soon</div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm opacity-90">
                  <div className="text-5xl">🚢</div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">Battleship</h3>
                  <p className="mt-2 text-sm text-slate-600">Coming soon — hidden ships and tactical strikes.</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Coming soon</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-600">Preview</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">Leaderboard Snapshot</h2>
              <p className="mt-4 text-sm text-slate-600">See who is leading the arena and stay motivated to play more rounds.</p>

              <div className="mt-6 space-y-3">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex justify-between text-sm text-slate-700"><span>1. PlayerOne</span><span>24 wins</span></div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex justify-between text-sm text-slate-700"><span>2. PlayerTwo</span><span>18 wins</span></div>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex justify-between text-sm text-slate-700"><span>3. PlayerThree</span><span>12 wins</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <h3 className="text-xl font-semibold text-slate-900">Admin Dashboard</h3>
              <p className="mt-3 text-sm text-slate-600">Admin access is available by entering the /admin path directly.</p>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateRoomModal 
          username={username}
          defaultGame={createGameType}
          onClose={() => setShowCreateModal(false)}
          onRoomCreated={(roomCode) => {
            setShowCreateModal(false)
            navigate(`/room/${roomCode}`)
          }}
        />
      )}

      {showJoinModal && (
        <JoinRoomModal 
          username={username}
          onClose={() => setShowJoinModal(false)}
          onRoomJoined={(roomCode) => {
            setShowJoinModal(false)
            navigate(`/room/${roomCode}`)
          }}
        />
      )}
    </div>
  )
}
