import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import TargetArenaBoard from '../components/TargetArenaBoard'
import GameOverlay from '../components/GameOverlay'
import { useSocket } from '../hooks/useSocket'

const TARGET_TYPES = ['normal', 'fast', 'golden', 'wrong']
const TARGET_SCORE_LABELS = {
  normal: '+10',
  fast: '+20',
  golden: '+50',
  wrong: '-5'
}

function getRandomTarget() {
  const type = TARGET_TYPES[Math.floor(Math.random() * TARGET_TYPES.length)]
  const size = type === 'golden' ? 60 : type === 'fast' ? 46 : type === 'wrong' ? 50 : 52
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    x: Math.random() * 90 + 5,
    y: Math.random() * 80 + 10,
    size,
    expireAt: Date.now() + (type === 'fast' ? 1100 : 1800)
  }
}

export default function TargetArenaPage({ username, onLogout }) {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket(roomCode, username)

  const [room, setRoom] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [timer, setTimer] = useState(60)
  const [scores, setScores] = useState({})
  const [gameStatus, setGameStatus] = useState('waiting')
  const [localTargets, setLocalTargets] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])
  const [countdown, setCountdown] = useState(null)
  const [countdownOver, setCountdownOver] = useState(false)
  const [overlay, setOverlay] = useState(null)

  const playerScore = scores[username] ?? 0
  const opponentScore = opponent ? scores[opponent] ?? 0 : 0

  const addMessage = (text, type = 'system') => {
    setMessages(prev => [
      ...prev,
      { text, type, timestamp: new Date() }
    ])
  }

  const addChatMessage = (chatMessage) => {
    setChatMessages(prev => [...prev, chatMessage])
  }

  useEffect(() => {
    if (!socket) return

    socket.on('roomUpdated', data => {
      setRoom(data.room || { players: data.players, status: data.roomStatus })
      setGameStatus(data.roomStatus)

      const players = data.room?.players || data.players || []
      const otherPlayer = players.find(p => p.username !== username)
      if (otherPlayer?.username) {
        setOpponent(otherPlayer.username)
      }
    })

    socket.on('game-state-update', data => {
      if (data?.gameType !== 'target-arena') return

      setTimer(data.timer ?? 60)
      setScores(data.scores || {})
      setGameStatus(data.gameOver ? 'ended' : 'playing')

      const otherPlayer = (data.players || []).find(p => p.username !== username)
      if (otherPlayer?.username) {
        setOpponent(otherPlayer.username)
      }
    })

    socket.on('game-started', data => {
      console.log('🎮 Target Arena game started')
      setOverlay('GET READY')
      setTimeout(() => {
        setCountdown(3)
        setOverlay(null)
      }, 1200)
    })

    socket.on('game-ended', data => {
      if (!data) return
      setGameStatus('ended')
      setTimer(0)
      setOverlay('TIME UP')
      
      setTimeout(() => {
        if (scores[username] > opponentScore) {
          setOverlay('YOU WIN')
        } else if (scores[username] < opponentScore) {
          setOverlay('YOU LOSE')
        } else {
          setOverlay('DRAW')
        }
        addMessage(data.message || 'Round ended', 'system')
        setTimeout(() => {
          setOverlay(null)
        }, 1500)
      }, 1200)
    })

    socket.on('countdown-complete', data => {
      console.log('✓ Countdown complete')
      setOverlay('START')
      setOverlay('HIT THE TARGETS')
      setTimeout(() => {
        setOverlay(null)
        setCountdownOver(true)
      }, 1200)
    })

    socket.on('game-reset', data => {
      setLocalTargets([])
      setGameStatus('playing')
      setTimer(60)
      setScores({})
      addMessage(data.message || 'New round started', 'system')
    })

    socket.on('opponent-joined', data => {
      if (data?.opponentUsername) {
        setOpponent(data.opponentUsername)
        addMessage(`${data.opponentUsername} joined the game!`, 'system')
      }
    })

    socket.on('receive-chat-message', data => {
      if (!data || data.roomCode !== roomCode) return
      addChatMessage(data)
    })

    socket.on('error', data => {
      addMessage(data.message || 'An error occurred', 'system')
    })

    return () => {
      socket.off('roomUpdated')
      socket.off('game-state-update')
      socket.off('game-ended')
      socket.off('game-reset')
      socket.off('opponent-joined')
      socket.off('receive-chat-message')
      socket.off('error')
    }
  }, [socket, roomCode, username])

  useEffect(() => {
    if (gameStatus !== 'playing' || timer <= 0) {
      return
    }

    const spawnInterval = setInterval(() => {
      setLocalTargets(prev => [...prev, getRandomTarget()])
    }, 900)

    return () => clearInterval(spawnInterval)
  }, [gameStatus, timer])

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setLocalTargets(prev => prev.filter(target => Date.now() < target.expireAt))
    }, 200)

    return () => clearInterval(cleanupInterval)
  }, [])

  const handleTargetClick = (targetId, targetType) => {
    if (!socket || gameStatus !== 'playing' || timer <= 0) return

    setLocalTargets(prev => prev.filter(target => target.id !== targetId))
    socket.emit('target-hit', {
      roomCode,
      username,
      targetType
    })
  }

  const handleSendChatMessage = () => {
    if (!socket || !chatInput.trim()) return

    const trimmedMessage = chatInput.trim()
    if (trimmedMessage.length > 200) {
      addMessage('Chat messages can be at most 200 characters.', 'system')
      return
    }

    socket.emit('send-chat-message', {
      roomCode,
      username,
      message: trimmedMessage
    })
    setChatInput('')
  }

  const handleChatKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendChatMessage()
    }
  }

  const handleLeaveGame = () => {
    if (socket) {
      socket.emit('leave-room', { roomCode })
    }
    navigate('/lobby')
  }

  const handleRequestRematch = () => {
    if (socket && room?.players?.length >= 2) {
      socket.emit('request-rematch', { roomCode })
    }
  }

  const handleStartGame = () => {
    if (socket && room?.players?.length >= 2) {
      socket.emit('start-game', { roomCode })
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-700">Connecting to Target Arena...</p>
          <div className="mt-4 animate-spin">⚙️</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header username={username} onLogout={onLogout} />
      <div className="container-custom mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 p-6 text-white shadow-2xl shadow-slate-900/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-white/80">Target Arena</p>
                  <h1 className="mt-3 text-4xl font-bold tracking-tight">Hit the fun targets before time runs out</h1>
                </div>
                <button
                  onClick={handleLeaveGame}
                  className="btn btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  Leave Room
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-white/10 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">Room Code</p>
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-[1.5rem] bg-slate-950/25 px-4 py-3 text-lg font-semibold">
                    <span>{roomCode}</span>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(roomCode)
                          addMessage('Room code copied to clipboard!', 'system')
                        } catch {
                          addMessage('Unable to copy room code', 'system')
                        }
                      }}
                      className="text-sm text-white/90 underline"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="rounded-[1.5rem] bg-white/10 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-white/70">Round Status</p>
                  <p className="mt-3 text-3xl font-bold text-white">{gameStatus === 'playing' ? 'Playing' : gameStatus === 'ended' ? 'Ended' : 'Waiting'}</p>
                  <p className="mt-2 text-sm text-white/80">{gameStatus === 'playing' ? '60 second challenge' : gameStatus === 'ended' ? 'Round complete' : 'Waiting for players'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">You</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{username}</p>
                  <p className="mt-3 text-sm text-slate-500">Score: <span className="font-semibold text-indigo-600">{playerScore}</span></p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Opponent</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{opponent || 'Waiting...'}</p>
                  <p className="mt-3 text-sm text-slate-500">Score: <span className="font-semibold text-rose-600">{opponentScore}</span></p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Timer</p>
                  <p className="mt-3 text-5xl font-bold text-slate-900">{timer}s</p>
                </div>
                <div className="space-y-3 w-full md:w-auto">
                  {gameStatus === 'waiting' && room?.players?.length >= 2 ? (
                    <button onClick={handleStartGame} className="btn btn-primary w-full py-3">Start Arena</button>
                  ) : null}
                  <button onClick={handleRequestRematch} className="btn btn-secondary w-full py-3">Play Again</button>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <TargetArenaBoard
                targets={localTargets}
                onTargetClick={handleTargetClick}
                disabled={gameStatus !== 'playing' || timer <= 0}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {TARGET_TYPES.map(type => (
                  <div key={type} className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="font-semibold capitalize">{type.replace('-', ' ')}</div>
                    <div className="mt-2 text-slate-500">{TARGET_SCORE_LABELS[type]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <h3 className="text-xl font-semibold text-slate-900">Game Activity</h3>
              <div className="mt-6 space-y-3 max-h-[330px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">Game updates will appear here.</div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">{msg.type === 'system' ? 'System' : 'Game'}</div>
                      <div className="mt-1">{msg.text}</div>
                      <div className="mt-2 text-xs text-slate-400">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <h3 className="text-xl font-semibold text-slate-900">Room Chat</h3>
              <div className="mt-6 space-y-3 max-h-[280px] overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                {chatMessages.length === 0 ? (
                  <div className="text-sm text-slate-500">Chat with your opponent while you play.</div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className="rounded-3xl bg-white p-3 shadow-sm shadow-slate-100">
                      <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{msg.username}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  maxLength={200}
                  placeholder="Type a message..."
                  className="input flex-1"
                />
                <button onClick={handleSendChatMessage} className="btn btn-primary w-full sm:w-auto">Send</button>
              </div>
              <p className="mt-2 text-xs text-slate-400">Press Enter to send. Max 200 characters.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
