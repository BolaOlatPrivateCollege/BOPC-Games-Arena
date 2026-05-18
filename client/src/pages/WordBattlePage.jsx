import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/Header'
import { useSocket } from '../hooks/useSocket'
import WordBattleBoard from '../components/WordBattleBoard'

export default function WordBattlePage({ username, onLogout }) {
  const { roomCode } = useParams()
  const { socket } = useSocket(roomCode, username)

  const [score, setScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [gameStatus, setGameStatus] = useState('waiting')
  const [opponent, setOpponent] = useState('Opponent')
  const [questionData, setQuestionData] = useState(null)

  useEffect(() => {
    if (!socket) return

    socket.on('game-state-update', (state) => {
      if (!state) return
      if (typeof state.timer === 'number') setTimeLeft(state.timer)
      if (state.scores) {
        setScore(state.scores[username] || 0)
        const otherUsername = Object.keys(state.scores).find(u => u !== username)
        setOpponentScore(state.scores[otherUsername] || 0)
        if (otherUsername) setOpponent(otherUsername)
      }

      if (state.gameType === 'word-battle' && !state.gameOver && !questionData) {
        socket.emit('request-word-question', { roomCode, username, difficulty: 'easy' })
      }
    })

    socket.on('game-started', () => {
      setGameStatus('playing')
      setQuestionData(null)
      socket.emit('request-word-question', { roomCode, username, difficulty: 'easy' })
    })

    socket.on('word-question', (question) => {
      if (!question) return
      setQuestionData(question)
    })

    socket.on('word-answer-result', () => {
      // Word answer results are handled through game-state updates.
    })

    socket.on('game-ended', (data) => {
      setGameStatus('finished')
      if (data?.scores) {
        setScore(data.scores[username] || 0)
        const other = Object.keys(data.scores).find(u => u !== username)
        setOpponentScore(data.scores[other] || 0)
      }
    })

    return () => {
      socket.off('game-state-update')
      socket.off('game-started')
      socket.off('word-question')
      socket.off('word-answer-result')
      socket.off('game-ended')
    }
  }, [socket, username, roomCode, questionData])

  function handleAnswer({ questionId, answer }) {
    if (!socket) return
    socket.emit('word-answer', { roomCode, username, questionId, answer })
  }

  function requestNextQuestion() {
    if (!socket) return
    socket.emit('request-word-question', { roomCode, username, difficulty: 'easy' })
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header username={username} onLogout={onLogout} />
      <div className="container-custom mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Word Battle — Room {roomCode}</h1>
            <div className="text-sm text-slate-600">Time: {timeLeft}s</div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-slate-500">You</div>
              <div className="text-2xl font-bold">{username}</div>
              <div className="text-3xl font-extrabold text-indigo-600">{score}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Opponent</div>
              <div className="text-2xl font-bold">{opponent}</div>
              <div className="text-3xl font-extrabold text-rose-600">{opponentScore}</div>
            </div>
          </div>

          <div className="mt-6">
            <WordBattleBoard
              onAnswer={handleAnswer}
              questionData={questionData}
              onRequestNextQuestion={requestNextQuestion}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
