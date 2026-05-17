import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import GameBoardTicTacToe from '../components/GameBoardTicTacToe'
import GameOverlay from '../components/GameOverlay'
import { useSocket } from '../hooks/useSocket'

/**
 * Tic Tac Toe Game Page Component
 * Handles the actual game board, player turns, and win/draw detection
 */
export default function TicTacToePage({ username, onLogout }) {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket(roomCode, username)

  const [board, setBoard] = useState(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState(true)
  const [gameStatus, setGameStatus] = useState('playing')
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [playerSymbol, setPlayerSymbol] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [countdown, setCountdown] = useState(null)
  const [countdownOver, setCountdownOver] = useState(false)
  const [overlay, setOverlay] = useState(null)
  const [turnTimer, setTurnTimer] = useState(30)
  const [timedOut, setTimedOut] = useState(false)

  const addMessage = (text, type = 'system') => {
    setMessages(prev => [
      ...prev,
      { text, type, timestamp: new Date() }
    ])
  }

  const addChatMessage = (chatMessage) => {
    setChatMessages(prev => [
      ...prev,
      chatMessage
    ])
  }

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      addMessage('Room code copied to clipboard!', 'system')
    } catch {
      addMessage('Unable to copy room code', 'system')
    }
  }

  useEffect(() => {
    if (!socket) return

    console.log('🎮 TicTacToe socket connected:', socket.id)

    socket.on('roomUpdated', data => {
      console.log('📦 Room updated:', data)

      const room = data.room
      const players = room?.players || data.players || []

      const currentPlayer = players.find(
        p => p.username === username || p.socketId === socket.id
      )

      const otherPlayer = players.find(
        p => p.username !== username && p.socketId !== socket.id
      )

      if (currentPlayer?.symbol) {
        setPlayerSymbol(currentPlayer.symbol)
      }

      if (otherPlayer?.username) {
        setOpponent(otherPlayer.username)
      }

      const gameState = data.gameState || room?.gameState

      if (gameState) {
        setBoard(gameState.board || Array(9).fill(null))

        const currentTurn = gameState.currentTurn || gameState.currentPlayer || 'X'
        setIsXNext(currentTurn === 'X')

        setWinner(gameState.winner || null)
        setGameOver(gameState.gameOver === true)

        if (gameState.gameOver === true) {
          if (gameState.draw === true) {
            setGameStatus('draw')
          } else if (gameState.winner) {
            setGameStatus('won')
          } else {
            setGameStatus('finished')
          }
        } else {
          setGameStatus('playing')
        }
      }
    })

    socket.on('game-state-update', data => {
      console.log('🎯 Game state update:', data)

      setBoard(data.board || Array(9).fill(null))

      const nextTurn =
        data.currentTurn ||
        data.currentPlayer ||
        (data.isXNext === false ? 'O' : 'X')

      setIsXNext(nextTurn === 'X')
      setWinner(data.winner || null)
      setGameOver(data.gameOver === true)

      if (data.gameOver === true) {
        if (data.gameStatus === 'draw' || data.draw === true) {
          setGameStatus('draw')
        } else if (data.winner) {
          setGameStatus('won')
        } else {
          setGameStatus('finished')
        }
      } else {
        setGameStatus('playing')
      }
    })

    socket.on('game-started', data => {
      console.log('🎮 Game started:', data)
      setOverlay('GET READY')
      setTimeout(() => {
        setCountdown(3)
        setOverlay(null)
      }, 1200)
    })

    socket.on('countdown-tick', data => {
      if (data.countdown > 0) {
        setOverlay(data.countdown.toString())
      }
    })

    socket.on('countdown-complete', data => {
      setOverlay('START')
      setTimeout(() => {
        setOverlay(null)
        setCountdownOver(true)
      }, 800)
    })

    socket.on('turn-timer-update', data => {
      console.log('⏱️ Timer update:', data)
      setTurnTimer(data.remainingSeconds || 30)
      if (data.remainingSeconds <= 0 && !timedOut) {
        setTimedOut(true)
        setOverlay('TIME OUT')
      }
    })

    socket.on('player-timeout', data => {
      console.log('⏱️ Player timed out:', data)
      setTimedOut(true)
      setOverlay('TIME OUT')
      setTimeout(() => {
        setOverlay(null)
        if (data.winner) {
          if (data.winner === username) {
            setOverlay('YOU WIN')
          } else {
            setOverlay('YOU LOSE')
          }
          setGameStatus('won')
          addMessage(`${data.timedOutPlayer} timed out! ${data.winner} wins.`, 'system')
        }
      }, 1200)
    })

    socket.on('move-made', data => {
      addMessage(`${data.playerUsername} made a move`, 'game')
    })

    socket.on('game-ended', data => {
      console.log('🏁 Game ended:', data)

      setGameOver(true)

      if (data.isDraw) {
        setGameStatus('draw')
      } else {
        setGameStatus('won')
      }

      setWinner(data.winner || data.winnerSymbol || null)
      addMessage(data.message || 'Game ended', 'system')
    })

    socket.on('game-reset', data => {
      console.log('🔁 Game reset:', data)

      setBoard(Array(9).fill(null))
      setIsXNext(true)
      setGameStatus('playing')
      setGameOver(false)
      setWinner(null)

      addMessage(data.message || 'New round started', 'system')
    })

    socket.on('receive-chat-message', data => {
      console.log('💬 Chat message received:', data)

      if (data?.roomCode !== roomCode) {
        return
      }

      addChatMessage({
        username: data.username,
        message: data.message,
        timestamp: data.timestamp,
        roomCode: data.roomCode
      })
    })

    socket.on('error', data => {
      console.warn('⚠️ Socket error:', data)
      addMessage(data.message || 'An error occurred', 'system')
    })

    return () => {
      socket.off('roomUpdated')
      socket.off('game-state-update')
      socket.off('opponent-joined')
      socket.off('game-started')
      socket.off('countdown-tick')
      socket.off('countdown-complete')
      socket.off('turn-timer-update')
      socket.off('player-timeout')
      socket.off('move-made')
      socket.off('game-ended')
      socket.off('game-reset')
      socket.off('receive-chat-message')
      socket.off('error')
    }
  }, [socket, username, roomCode])

  // Countdown effect
  useEffect(() => {
    if (countdown === null || countdownOver) return

    if (countdown === 0) {
      socket?.emit('countdown-complete', { roomCode })
      return
    }

    const timer = setTimeout(() => {
      socket?.emit('countdown-tick', { roomCode, countdown })
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, countdownOver, socket, roomCode])

  // Turn timer effect
  useEffect(() => {
    if (gameStatus !== 'playing' || !countdownOver || timedOut) return
    if (turnTimer <= 0) {
      setTimedOut(true)
      socket?.emit('turn-timeout', { roomCode, timedOutPlayer: username })
      return
    }

    const timer = setTimeout(() => {
      setTurnTimer(turnTimer - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [gameStatus, turnTimer, countdownOver, timedOut, socket, roomCode, username])

  const handleCellClick = index => {
    if (!socket) return
    if (board[index] !== null) return
    if (gameOver) return
    if (gameStatus !== 'playing') return
    if (!playerSymbol) return
    if (timedOut) return
    if (!countdownOver) return

    const currentTurn = isXNext ? 'X' : 'O'
    const isPlayerTurn = playerSymbol === currentTurn

    console.log('🖱️ Cell click:', {
      index,
      playerSymbol,
      currentTurn,
      isPlayerTurn,
      gameOver,
      gameStatus
    })

    if (!isPlayerTurn) {
      addMessage('It is not your turn yet.', 'system')
      return
    }

    setTurnTimer(30)
    socket.emit('make-move', {
      roomCode,
      index,
      playerSymbol
    })
  }

  const handleRematch = () => {
    if (!socket) return

    socket.emit('request-rematch', { roomCode })

    setBoard(Array(9).fill(null))
    setIsXNext(true)
    setGameStatus('playing')
    setGameOver(false)
    setWinner(null)

    addMessage('Requesting a new round...', 'system')
  }

  const handleLeaveGame = () => {
    if (socket) {
      socket.emit('leave-room', { roomCode })
    }

    navigate('/lobby')
  }

  const handleSendChatMessage = () => {
    if (!socket || !chatInput.trim()) {
      return
    }

    const trimmedMessage = chatInput.trim()
    if (trimmedMessage.length === 0) {
      return
    }

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

  const currentTurn = isXNext ? 'X' : 'O'
  const isMyTurn = playerSymbol === currentTurn
  const opponentSymbol =
    playerSymbol === 'X' ? 'O' : playerSymbol === 'O' ? 'X' : '...'

  const boardDisabled =
    gameStatus !== 'playing' ||
    gameOver ||
    !playerSymbol ||
    !isMyTurn ||
    !countdownOver ||
    timedOut

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-700">Connecting to game...</p>
          <div className="mt-4">
            <div className="inline-block animate-spin">⚙️</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header username={username} onLogout={onLogout} />
      <GameOverlay message={overlay} show={overlay !== null} duration={800} />

      <div className="container-custom mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-2xl shadow-slate-900/20">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-white/80">
                    Room Code
                  </p>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight">
                    {roomCode}
                  </h1>
                </div>

                <button
                  onClick={handleCopyRoomCode}
                  className="btn btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  Copy Code
                </button>
              </div>

              <p className="mt-4 max-w-2xl text-sm text-white/80">
                Share this code with your opponent and continue the game without leaving the room.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-white p-5 shadow-lg shadow-slate-200/80">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  You
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {username}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Symbol:{' '}
                  <span className="font-semibold text-indigo-600">
                    {playerSymbol || '...'}
                  </span>
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-white p-5 shadow-lg shadow-slate-200/80">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  Opponent
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {opponent || 'Waiting...'}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Symbol:{' '}
                  <span className="font-semibold text-rose-600">
                    {opponentSymbol}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                    Match Status
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {gameStatus === 'playing'
                      ? `${currentTurn} to move`
                      : gameStatus === 'won'
                        ? `${winner} wins!`
                        : gameStatus === 'draw'
                          ? 'Draw round'
                          : 'Game ended'}
                  </h2>
                </div>

                <div
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    gameStatus === 'playing'
                      ? 'bg-indigo-100 text-indigo-700'
                      : gameStatus === 'won'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {gameStatus === 'playing'
                    ? isMyTurn
                      ? 'Your turn'
                      : 'Opponent turn'
                    : gameStatus === 'won'
                      ? 'Round complete'
                      : 'Game ended'}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <GameBoardTicTacToe
                board={board}
                onCellClick={handleCellClick}
                disabled={boardDisabled}
                gameOver={gameOver}
                statusMessage={
                  !countdownOver ? 'Get ready...' :
                  gameStatus === 'playing'
                    ? isMyTurn
                      ? `Your turn — ${turnTimer}s`
                      : `Opponent's turn — ${turnTimer}s`
                    : ''
                }
              />

              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={handleRematch}
                  className="btn btn-primary flex-1"
                >
                  Play Again
                </button>

                <button
                  onClick={handleLeaveGame}
                  className="btn btn-secondary flex-1"
                >
                  Leave Room
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <h3 className="text-xl font-semibold text-slate-900">
                Game Activity
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Follow the round progress, status updates, and match events.
              </p>

              <div className="mt-6 space-y-3 max-h-[220px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">
                    No activity yet. The first move will start the round.
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`rounded-3xl p-4 text-sm ${
                        msg.type === 'system'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold">
                        {msg.type === 'system' ? 'System' : 'Match update'}
                      </div>
                      <div className="mt-1">{msg.text}</div>
                      <div className="mt-2 text-xs text-slate-400">
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <h3 className="text-xl font-semibold text-slate-900">
                Room Chat
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Chat only with players in this room.
              </p>

              <div className="mt-6 space-y-3 max-h-[260px] overflow-y-auto border border-slate-200 rounded-[1.5rem] bg-slate-50 p-4">
                {chatMessages.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No chat messages yet. Say hello!
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className="space-y-1 rounded-2xl bg-white p-3 shadow-sm shadow-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{msg.username}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-slate-700">{msg.message}</p>
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
                <button
                  onClick={handleSendChatMessage}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  Send
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Press Enter to send. Message limit: 200 characters.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <h3 className="text-xl font-semibold text-slate-900">
                Quick Tips
              </h3>

              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Aim for three in a row before your opponent.</li>
                <li>• Use the rematch button to start a fresh round instantly.</li>
                <li>• Copy the code to invite players quickly.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}