import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import GameOverlay from '../components/GameOverlay'

const OPERATIONS = ['+', '-', '×', '÷']

function generateQuestion() {
  const operation = OPERATIONS[Math.floor(Math.random() * OPERATIONS.length)]
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

export default function MathRushSoloPracticePage({ username, onLogout }) {
  const navigate = useNavigate()
  const [timer, setTimer] = useState(60)
  const [score, setScore] = useState(0)
  const [question, setQuestion] = useState(null)
  const [answerInput, setAnswerInput] = useState('')
  const [gameStatus, setGameStatus] = useState('setup')
  const [overlay, setOverlay] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [countdownOver, setCountdownOver] = useState(false)
  const [resultLabel, setResultLabel] = useState('')

  const statusText = useMemo(() => {
    if (gameStatus === 'setup') return 'Click Start Practice to begin the timed challenge.'
    if (gameStatus === 'playing') return 'Answer as many questions as you can before the clock ends.'
    return `Round complete — your score is ${score}`
  }, [gameStatus, score])

  const startRound = () => {
    setScore(0)
    setTimer(60)
    setQuestion(null)
    setAnswerInput('')
    setResultLabel('')
    setGameStatus('countdown')
    setCountdown(3)
    setCountdownOver(false)
    setOverlay('GET READY')
  }

  useEffect(() => {
    if (gameStatus !== 'countdown' || countdown === null) return

    if (countdown <= 0) {
      setOverlay('START')
      setTimeout(() => {
        setOverlay(null)
        setGameStatus('playing')
        setCountdownOver(true)
        setQuestion(generateQuestion())
      }, 1200)
      return
    }

    const timerId = setTimeout(() => {
      setOverlay(String(countdown))
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timerId)
  }, [countdown, gameStatus])

  useEffect(() => {
    if (gameStatus !== 'playing' || !countdownOver) return
    if (timer <= 0) {
      setGameStatus('ended')
      setOverlay('TIME UP')
      setResultLabel(`Your score: ${score}`)
      setQuestion(null)
      setTimeout(() => setOverlay(null), 1300)
      return
    }

    const interval = setInterval(() => {
      setTimer(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStatus, countdownOver, timer, score])

  const handleSubmitAnswer = (event) => {
    event.preventDefault()
    if (gameStatus !== 'playing' || !question) return
    const answerValue = answerInput.trim()
    if (!answerValue) return

    const isCorrect = Number(answerValue) === question.answer
    if (isCorrect) {
      setScore(prev => prev + question.points)
      setOverlay(`Correct! +${question.points}`)
    } else {
      setOverlay('Incorrect — next one')
    }

    setQuestion(generateQuestion())
    setAnswerInput('')
    setTimeout(() => setOverlay(null), 1200)
  }

  const handleLeaveGame = () => {
    navigate('/lobby')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header username={username} onLogout={onLogout} />
      <GameOverlay message={overlay} show={Boolean(overlay)} duration={1200} />

      <div className="container-custom mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-600 p-6 text-white shadow-2xl shadow-slate-900/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/80">Solo Practice</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">Math Rush Solo Practice</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80">Practice solo rounds without affecting leaderboards.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={handleLeaveGame} className="btn btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20">Leave Game</button>
              <button onClick={startRound} className="btn btn-primary bg-white text-sky-700 hover:bg-white/90">Start Practice</button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Score</p>
                <p className="mt-3 text-5xl font-bold text-slate-900">{score}</p>
                <p className="mt-2 text-sm text-slate-600">Correct answers earn points. Wrong answers move to the next question.</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Time left</p>
                <p className="mt-3 text-5xl font-bold text-slate-900">{timer}s</p>
                <p className="mt-2 text-sm text-slate-600">The timer starts when the round begins.</p>
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] bg-slate-50 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Status</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">{statusText}</p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
            <div className="rounded-[1.5rem] bg-slate-50 p-5 mb-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Current problem</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{question?.question || 'Start the round to receive a question'}</p>
              <p className="mt-2 text-sm text-slate-600">Answer quickly to keep your momentum.</p>
            </div>
            <form onSubmit={handleSubmitAnswer} className="grid gap-4">
              <input
                type="text"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                disabled={gameStatus !== 'playing' || !question}
                placeholder="Type your answer"
                className="input w-full"
              />
              <button type="submit" className="btn btn-primary w-full py-3" disabled={gameStatus !== 'playing' || !question}>
                Submit Answer
              </button>
            </form>
            <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-600">
              <p>Tip: skip quickly on harder problems and move to the next one.</p>
              <p className="mt-2">This is practice mode only — your score will not be tracked on the leaderboard.</p>
            </div>
          </div>
        </div>

        {gameStatus === 'ended' && (
          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
            <h2 className="text-2xl font-semibold text-slate-900">Round Complete</h2>
            <p className="mt-3 text-slate-700">{resultLabel || `You finished with ${score} points.`}</p>
          </div>
        )}
      </div>
    </div>
  )
}
