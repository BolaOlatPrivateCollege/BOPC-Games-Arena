import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import TargetArenaBoard from '../components/TargetArenaBoard'
import GameOverlay from '../components/GameOverlay'

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

export default function TargetArenaSoloPracticePage({ username, onLogout }) {
  const navigate = useNavigate()
  const [gameStatus, setGameStatus] = useState('setup')
  const [timer, setTimer] = useState(60)
  const [playerScore, setPlayerScore] = useState(0)
  const [localTargets, setLocalTargets] = useState([])
  const [resultLabel, setResultLabel] = useState('')
  const [countdown, setCountdown] = useState(null)
  const [countdownOver, setCountdownOver] = useState(false)
  const [overlay, setOverlay] = useState(null)

  const isPlaying = gameStatus === 'playing'

  const scoreLabel = useMemo(() => {
    if (gameStatus === 'setup') return 'Click "Start Practice" to begin your solo challenge.'
    if (isPlaying) return 'Tap targets to score points before time runs out.'
    return 'Solo practice round complete — review your score.'
  }, [gameStatus, isPlaying])

  const handleLeaveGame = () => {
    navigate('/lobby')
  }

  // Countdown effect
  useEffect(() => {
    if (gameStatus !== 'countdown' || countdown === null) return

    if (countdown === 0) {
      setOverlay('START')
      setTimeout(() => {
        setOverlay('HIT THE TARGETS')
      }, 1200)
      setTimeout(() => {
        setOverlay(null)
        setCountdownOver(true)
        setGameStatus('playing')
      }, 2400)
      return
    }

    const timer = setTimeout(() => {
      setOverlay(countdown.toString())
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [gameStatus, countdown])

  const resetRound = () => {
    setTimer(60)
    setPlayerScore(0)
    setLocalTargets([])
    setResultLabel('')
    setGameStatus('countdown')
    setCountdown(null)
    setCountdownOver(false)
    setOverlay('GET READY')
    setTimeout(() => {
      setCountdown(3)
      setOverlay(null)
    }, 1200)
  }

  const endRound = () => {
    setGameStatus('ended')
    setLocalTargets([])
    setOverlay('TIME UP')
    setResultLabel(`Your score: ${playerScore}`)
    
    setTimeout(() => {
      setOverlay(null)
    }, 1500)
  }

  const handleStartPractice = () => {
    resetRound()
  }

  const handleTargetClick = (targetId, targetType) => {
    if (gameStatus !== 'playing' || !countdownOver || timer <= 0) return
    setLocalTargets(prev => prev.filter(target => target.id !== targetId))
    setPlayerScore(prev => {
      const value = targetType === 'normal' ? 10 : targetType === 'fast' ? 20 : targetType === 'golden' ? 50 : -5
      return Math.max(0, prev + value)
    })
  }

  useEffect(() => {
    if (gameStatus !== 'playing') return
    if (!countdownOver) return
    if (timer <= 0) {
      endRound()
      return
    }

    const countdown = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(countdown)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdown)
  }, [gameStatus, timer, countdownOver])

  useEffect(() => {
    if (gameStatus !== 'playing' || !countdownOver) return

    const spawnInterval = setInterval(() => {
      setLocalTargets(prev => [...prev, getRandomTarget()])
    }, 900)

    return () => clearInterval(spawnInterval)
  }, [gameStatus, countdownOver])

  useEffect(() => {
    const cleanup = setInterval(() => {
      setLocalTargets(prev => prev.filter(target => Date.now() < target.expireAt))
    }, 200)

    return () => clearInterval(cleanup)
  }, [])

  useEffect(() => {
    if (timer === 0 && isPlaying) {
      endRound()
    }
  }, [timer, isPlaying])

  return (
    <div className="min-h-screen bg-slate-100">
      <Header username={username} onLogout={onLogout} />
      <GameOverlay message={overlay} show={overlay !== null} duration={800} />

      <div className="container-custom mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-600 p-6 text-white shadow-2xl shadow-slate-900/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/80">Solo Practice</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">Target Arena Solo Practice</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80">Practice scores do not count toward leaderboards.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleLeaveGame}
                className="btn btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Leave Game
              </button>
              <button
                onClick={resetRound}
                className="btn btn-primary bg-white text-sky-700 hover:bg-white/90"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-600">Your Performance</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">Solo practice challenge</h2>
                <p className="mt-3 text-sm text-slate-600">Hit targets as fast as you can for 60 seconds.</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Your score</p>
                <p className="mt-3 text-4xl font-bold text-slate-900">{playerScore}</p>
                <p className="mt-2 text-sm text-slate-600">Tap targets quickly to earn points.</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Time left</p>
                <p className="mt-3 text-4xl font-bold text-slate-900">{timer}s</p>
                <p className="mt-2 text-sm text-slate-600">Challenge ends when timer reaches zero.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
            <div className="space-y-4">
              <button
                onClick={handleStartPractice}
                className="btn btn-primary w-full py-4"
              >
                Start Practice Round
              </button>
              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Round status</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{scoreLabel}</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Final score</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{resultLabel || 'Not started'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Target Arena</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">Hit the targets before the clock ends</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
              <span>Practice mode — not counted</span>
            </div>
          </div>

          <div className="mt-8">
            <TargetArenaBoard
              targets={localTargets}
              onTargetClick={handleTargetClick}
              disabled={gameStatus !== 'playing' || !countdownOver || timer <= 0}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={resetRound}
              className="btn btn-secondary w-full py-3"
            >
              Play Again
            </button>
            <button
              onClick={handleLeaveGame}
              className="btn btn-outline w-full py-3"
            >
              Leave Game
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
