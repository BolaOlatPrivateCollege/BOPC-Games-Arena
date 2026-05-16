import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useSocket } from '../hooks/useSocket'

/**
 * Room Page Component
 * Waiting room where players can see who's in the room and wait for game to start
 */
export default function RoomPage({ username, onLogout }) {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket(roomCode)

  const [players, setPlayers] = useState([])
  const [roomStatus, setRoomStatus] = useState('waiting')
  const [room, setRoom] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!socket) return

    socket.on('room-joined', (data) => {
      setRoom(data.room || { players: data.players, status: data.roomStatus })
      setPlayers(data.players)
      setIsOwner(data.isOwner)
      setRoomStatus(data.roomStatus)
    })

    socket.on('roomUpdated', (data) => {
      setRoom(data.room)
      setPlayers(data.players)
      setRoomStatus(data.roomStatus)

      if (data.roomStatus === 'playing') {
        setTimeout(() => {
          navigate(`/game/${roomCode}`)
        }, 500)
      }
    })

    socket.on('player-joined', (data) => {
      setPlayers(data.players)
    })

    socket.on('player-left', (data) => {
      setPlayers(data.players)
    })

    socket.on('game-starting', () => {
      setRoomStatus('starting')
      setTimeout(() => {
        navigate(`/game/${roomCode}`)
      }, 1500)
    })

    socket.on('error', (data) => {
      setError(data.message)
    })

    return () => {
      socket.off('room-joined')
      socket.off('roomUpdated')
      socket.off('player-joined')
      socket.off('player-left')
      socket.off('game-starting')
      socket.off('error')
    }
  }, [socket, roomCode, navigate])

  const handleStartGame = () => {
    if (socket && players.length >= 2) {
      socket.emit('start-game', { roomCode })
    }
  }

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomCode })
    }
    navigate('/lobby')
  }

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      alert('Room code copied to clipboard!')
    } catch {
      alert('Unable to copy room code')
    }
  }

  const gameLabel = room?.game === 'target-arena' ? 'Target Arena' : 'Tic Tac Toe'
  const gameDescription = room?.game === 'target-arena'
    ? 'Invite a friend with the code and prepare to play Target Arena. Score moving targets before time runs out.'
    : 'Invite a friend with the code and prepare to play Tic Tac Toe with easy rematch support.'

  return (
    <div className="min-h-screen bg-slate-100">
      <Header username={username} onLogout={onLogout} />

      <div className="container-custom mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-white p-8 shadow-2xl shadow-slate-200/60">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-indigo-600">Private Room</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">Room {roomCode}</h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">{gameDescription}</p>
            </div>
            <button onClick={handleCopyRoomCode} className="btn btn-secondary w-full sm:w-auto px-6 py-3">
              Copy Room Code
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-[1.8rem] bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/80">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Players ({players.length}/2)</h2>
                  <p className="mt-2 text-sm text-slate-500">Waiting for the other player to join before the match starts.</p>
                </div>
                <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">{roomStatus === 'waiting' ? 'Waiting' : roomStatus === 'starting' ? 'Starting' : 'Ready'}</div>
              </div>

              <div className="mt-8 space-y-4">
                {players.map((player, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold">{player.username.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="font-semibold text-slate-900">{player.username}</p>
                        <p className="text-sm text-slate-500">{player.isOwner ? '👑 Room Owner' : '👤 Player'}</p>
                      </div>
                    </div>
                    <span className="text-2xl">{player.status === 'ready' ? '✅' : '⏳'}</span>
                  </div>
                ))}

                {players.length < 2 && (
                  <div className="rounded-[1.5rem] bg-indigo-50 border border-indigo-200 p-4 text-center text-sm text-indigo-700">
                    Waiting for an opponent to join the room...
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/80">
              <h3 className="text-xl font-semibold text-slate-900">Game Preview</h3>
              <div className="mt-6 rounded-[1.5rem] border border-indigo-200 bg-indigo-50 p-6">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{room?.game === 'target-arena' ? '🎈' : '⭕'}</div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{gameLabel}</p>
                    <p className="mt-2 text-sm text-slate-600">{room?.game === 'target-arena'
                      ? 'Fast-paced target scoring in a 60-second arcade-style round.'
                      : 'Classic grid-based gameplay with quick rematches and friendly competition.'
                    }</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/80">
              <h3 className="text-xl font-semibold text-slate-900">Actions</h3>
              <div className="mt-6 space-y-4">
                {isOwner && players.length >= 2 && roomStatus === 'waiting' ? (
                  <button onClick={handleStartGame} className="btn btn-primary w-full py-3 text-lg">
                    🚀 Start Game
                  </button>
                ) : null}

                {players.length < 2 && (
                  <div className="rounded-[1.5rem] bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                    ⚠️ Need two players before the game can begin.
                  </div>
                )}

                <button onClick={handleLeaveRoom} className="btn btn-secondary w-full py-3">
                  Leave Room
                </button>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-600 space-y-3">
                <p>🔐 <strong>Status:</strong> {roomStatus}</p>
                <p>👥 <strong>Players:</strong> {players.length}/2</p>
                <p>👑 <strong>Owner:</strong> {players.find(p => p.isOwner)?.username || '...'}</p>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/80">
              <h3 className="text-xl font-semibold text-slate-900">Room Notes</h3>
              <ul className="mt-5 space-y-3 text-sm text-slate-600">
                <li>• Copy the room code and share it with your friend.</li>
                <li>• The game auto-starts once both players are connected.</li>
                <li>• Use the lobby to create or join another room later.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
