import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import GameOverlay from '../components/GameOverlay'
import { useSocket } from '../hooks/useSocket'

function generateMathQuestion() {
  const operations = ['+', '-', '×', '÷']
  const operation = operations[Math.floor(Math.random() * operations.length)]
  let a = 0
  let b = 0
  let answer = 0
  let points = 10

  if (operation === '+') {
    a = Math.floor(Math.random() * 20) + 1
    b = Math.floor(Math.random() * 20) + 1
    answer = a + b
    points = 10
  } else if (operation === '-') {
    a = Math.floor(Math.random() * 20) + 5
    b = Math.floor(Math.random() * 15) + 1
    if (b > a) [a, b] = [b, a]
    answer = a - b
    points = 10
  } else if (operation === '×') {
    a = Math.floor(Math.random() * 12) + 2
    b = Math.floor(Math.random() * 12) + 2
    answer = a * b
    points = 15
  } else {
    b = Math.floor(Math.random() * 11) + 2
    answer = Math.floor(Math.random() * 12) + 2
    a = answer * b
    points = 15
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: `${a} ${operation} ${b}`,
    answer,
    points
  }
}

export default function MathRushPage({ username, onLogout }) {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket(roomCode, username)

  const [room, setRoom] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [scores, setScores] = useState({})
  const [timer, setTimer] = useState(60)
  const [gameStatus, setGameStatus] = useState('waiting')
  const [question, setQuestion] = useState(null)
  const [answerInput, setAnswerInput] = useState('')
  const [messages, setMessages] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [overlay, setOverlay] = useState(null)

  const playerScore = scores[username] ?? 0
  const opponentScore = opponent ? scores[opponent] ?? 0 : 0

  const addMessage = (text, type = 'system') => {
    setMessages(prev => [...prev, { text, type, timestamp: new Date() }])
  }

  const addChatMessage = (chatMessage) => {
    setChatMessages(prev => [...prev, chatMessage])
  }

  useEffect(() => {
    if (!socket) return

    const requestNewQuestion = () => {
      if (socket && room?.status === 'playing') {
        socket.emit('request-math-question', { roomCode, username })
      }
    }

    socket.on('roomUpdated', data => {
      setRoom(data.room)
      const players = data.room?.players || data.players || []
      const other = players.find(p => p.username !== username)
      if (other?.username) {
        setOpponent(other.username)
      }
    })

    socket.on('game-state-update', data => {
      if (data?.gameType !== 'math-rush') return

      setTimer(data.timer ?? 60)
      setScores(data.scores || {})
      setGameStatus(data.gameOver ? 'ended' : 'playing')

      const otherPlayer = (data.players || []).find(p => p.username !== username)
      if (otherPlayer?.username) {
        setOpponent(otherPlayer.username)
      }

      if (!data.gameOver && !question && data.players?.length >= 2) {
        requestNewQuestion()
      }
    })

    socket.on('game-started', () => {
      setGameStatus('playing')
      setOverlay('GET READY')
      setTimeout(() => {
        setOverlay(null)
        requestNewQuestion()
      }, 1200)
    })

    socket.on('game-ended', data => {
      setGameStatus('ended')
      setTimer(0)
      setQuestion(null)
      setAnswerInput('')
      setOverlay('ROUND OVER')

      setTimeout(() => {
        if (!data) return
        if (data.winner === username) {
          setOverlay('YOU WIN')
        } else if (data.winner === opponent) {
          setOverlay('YOU LOSE')
        } else {
          setOverlay('DRAW')
        }
        addMessage(data.message || 'Round ended', 'system')
        setTimeout(() => setOverlay(null), 1400)
      }, 1000)
    })

    socket.on('game-reset', data => {
      setGameStatus('playing')
      setTimer(60)
      setScores({})
      setQuestion(null)
      setAnswerInput('')
      setOverlay(null)
      addMessage(data.message || 'New round started', 'system')
      socket.emit('request-math-question', { roomCode, username })
    })

    socket.on('math-question', data => {
      if (data?.questionId) {
        setQuestion(data)
        setAnswerInput('')
      }
    })

    socket.on('math-answer-result', data => {
      if (!data) return
      const message = data.correct ? `Correct! +${data.points} points.` : 'Incorrect. Try the next one.'
      setOverlay(message)
      setTimeout(() => {
        setOverlay(null)
      }, 1200)
      if (data.correct) {
        addMessage(message, 'game')
      }
      if (room?.status === 'playing') {
        socket.emit('request-math-question', { roomCode, username })
      }
    })

    socket.on('opponent-joined', data => {
      if (data?.opponentUsername) {
        setOpponent(data.opponentUsername)
        addMessage(`${data.opponentUsername} joined the game!`, 'system')
      }
    })

    socket.on('receive-chat-message', data => {
      if (data?.roomCode !== roomCode) return
      addChatMessage(data)
    })

    socket.on('error', data => {
      addMessage(data.message || 'An error occurred', 'system')
    })

    return () => {
      socket.off('roomUpdated')
      socket.off('game-state-update')
      socket.off('game-started')
      socket.off('game-ended')
      socket.off('game-reset')
      socket.off('math-question')
      socket.off('math-answer-result')
      socket.off('opponent-joined')
      socket.off('receive-chat-message')
      socket.off('error')
    }
  }, [socket, room, roomCode, username, question])

  const handleSubmitAnswer = (event) => {
    event.preventDefault()
    if (!socket || !question || gameStatus !== 'playing') return
    const answer = answerInput.trim()
    if (!answer) return

    socket.emit('math-answer', {
      roomCode,
      username,
      questionId: question.questionId || question.id,
      answer
    })
    setAnswerInput('')
  }

  const handleChooseOption = (option) => {
    if (!socket || !question || gameStatus !== 'playing') return
    socket.emit('math-answer', {
      roomCode,
      username,
      questionId: question.questionId || question.id,
      answer: option
    })
    setAnswerInput('')
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

  const handleStartGame = () => {
    if (socket && room?.players?.length >= 2) {
      socket.emit('start-game', { roomCode })
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-700">Connecting to Math Rush...</p>
          <div className="mt-4 animate-spin">⚙️</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header username={username} onLogout={onLogout} />
      <GameOverlay message={overlay} show={Boolean(overlay)} duration={1200} />

      <div className="container-custom mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white shadow-2xl shadow-slate-900/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/80">Math Rush</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">Fast math duel</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80">Answer questions quickly to outscore your opponent.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleLeaveGame}
                className="btn btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Leave Game
              </button>
              <button
                onClick={handleStartGame}
                className="btn btn-primary bg-white text-amber-700 hover:bg-white/90"
              >
                Start Match
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">You</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{username}</p>
                  <p className="mt-3 text-sm text-slate-600">Score: <span className="font-semibold text-amber-600">{playerScore}</span></p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Opponent</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{opponent || 'Waiting...'}</p>
                  <p className="mt-3 text-sm text-slate-600">Score: <span className="font-semibold text-red-600">{opponentScore}</span></p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Round timer</p>
                  <p className="mt-3 text-5xl font-bold text-slate-900">{timer}s</p>
                </div>
                <div className="space-y-3 w-full md:w-auto">
                  <div className="rounded-[1.5rem] bg-amber-50 p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-amber-700">Status</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{gameStatus === 'playing' ? 'Playing' : gameStatus === 'ended' ? 'Ended' : 'Waiting'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <div className="space-y-4">
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Question</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{question?.question || 'Waiting for the next math problem...'}</p>
                  {question?.options?.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {question.options.map((option, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleChooseOption(option)}
                          disabled={gameStatus !== 'playing'}
                          className="btn btn-outline text-left py-4"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-sm text-slate-600">Answer quickly to earn points.</p>
                </div>
                <form onSubmit={handleSubmitAnswer} className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    type="text"
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Type your answer"
                    className="input w-full"
                    disabled={!question || gameStatus !== 'playing'}
                  />
                  <button type="submit" className="btn btn-primary w-full sm:w-auto py-3" disabled={!question || gameStatus !== 'playing'}>
                    Submit
                  </button>
                </form>
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
                      <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{msg.type === 'system' ? 'System' : 'Game'}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="mt-1">{msg.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
              <h3 className="text-xl font-semibold text-slate-900">Room Chat</h3>
              <div className="mt-6 space-y-3 max-h-[280px] overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                {chatMessages.length === 0 ? (
                  <div className="text-sm text-slate-500">Chat with your opponent during the match.</div>
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
                <button onClick={handleSendChatMessage} className="btn btn-primary w-full sm:w-auto py-3">Send</button>
              </div>
              <p className="mt-2 text-xs text-slate-400">Press Enter to send. Max 200 characters.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
