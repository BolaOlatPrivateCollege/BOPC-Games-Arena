import { useNavigate } from 'react-router-dom'

/**
 * Landing Page Component
 * Displays welcome screen and navigation to username entry
 */
export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.24),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.22),_transparent_18%)]" />
      <div className="relative container-custom mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-10 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-200 ring-1 ring-white/10">
              <span className="font-semibold text-indigo-300">BOPC Games Arena</span>
              <span className="h-1 w-1 rounded-full bg-indigo-300" />
              <span>Modern multiplayer learning games</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight">Play. Compete. Learn. Have Fun.</h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">A polished online game platform built for classrooms, clubs, and friends. Jump into private rooms, challenge your peers, and climb the leaderboard.</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
              <button
                onClick={() => navigate('/enter-username')}
                className="btn btn-primary min-w-[170px]"
              >
                Play as Guest
              </button>
              <button
                onClick={() => navigate('/enter-username')}
                className="btn btn-secondary min-w-[170px]"
              >
                Create Room
              </button>
              <button
                onClick={() => navigate('/enter-username')}
                className="btn btn-outline min-w-[170px]"
              >
                Join Room
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-lg">
            <div className="grid gap-5">
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Featured Arena</p>
                <h2 className="mt-4 text-3xl font-bold text-white">Tic Tac Toe</h2>
                <p className="mt-3 text-slate-300">Fast-paced 2-player matches with instant rematch support and activity status updates.</p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-300">
                  <div className="rounded-2xl bg-white/5 p-4">Multiplayer</div>
                  <div className="rounded-2xl bg-white/5 p-4">Private Rooms</div>
                  <div className="rounded-2xl bg-white/5 p-4">Live Matchmaking</div>
                  <div className="rounded-2xl bg-white/5 p-4">Leaderboard</div>
                </div>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-lg shadow-pink-500/20">
                <p className="text-sm uppercase tracking-[0.24em] opacity-80">Ready to play</p>
                <h3 className="mt-4 text-2xl font-semibold">A friendly arena for every student.</h3>
                <p className="mt-3 text-slate-100/90">Join private rooms, learn strategic thinking, and have fun competing with classmates.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="card bg-white/10 border border-white/10 p-6">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-white mb-2">Multiplayer Games</h3>
              <p className="text-slate-300">Play with friends in real-time using private rooms and live match updates.</p>
            </div>
            <div className="card bg-white/10 border border-white/10 p-6">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold text-white mb-2">Private Game Rooms</h3>
              <p className="text-slate-300">Invite friends with a room code and keep matches organized for classroom play.</p>
            </div>
            <div className="card bg-white/10 border border-white/10 p-6">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-white mb-2">Leaderboards</h3>
              <p className="text-slate-300">Track wins, draw streaks, and player rankings across sessions.</p>
            </div>
            <div className="card bg-white/10 border border-white/10 p-6">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">Tournaments Coming Soon</h3>
              <p className="text-slate-300">Team up for competitions and earn arena glory in future updates.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative border-t border-white/10 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} BOPC Games Arena. All rights reserved.
      </footer>
    </div>
  )
}
