import { useEffect, useMemo, useRef, useState } from 'react'
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

function getBotRange(difficulty) {
  if (difficulty === 'easy') return { min: 10, max: 20, delayMin: 3000, delayMax: 5000 }
  if (difficulty === 'medium') return { min: 10, max: 30, delayMin: 2000, delayMax: 4000 }
  return { min: 20, max: 50, delayMin: 1500, delayMax: 3000 }
}

function getRandomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function TargetArenaBotPage({ username, onLogout }) {
  const navigate = useNavigate()
  const [difficulty, setDifficulty] = useState('easy')
  const [gameStatus, setGameStatus] = useState('setup')
  const [timer, setTimer] = useState(60)
  const [playerScore, setPlayerScore] = useState(0)
  const [botScore, setBotScore] = useState(0)
  const [localTargets, setLocalTargets] = useState([])
  const [resultLabel, setResultLabel] = useState('')
  const [countdown, setCountdown] = useState(null)
  const [countdownOver, setCountdownOver] = useState(false)
  const [overlay, setOverlay] = useState(null)
  const botTimeoutRef = useRef(null)

  const isPlaying = gameStatus === 'playing'

  const scoreLabel = useMemo(() => {
    if (gameStatus === 'setup') return 'Choose your difficulty and start practice round.'
    if (isPlaying) return 'Tap targets to score points before time runs out.'
    return 'Round complete — review your practice score.'
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
        setOverlay(null)
        setCountdownOver(true)
        setGameStatus('playing')
      }, 800)
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
    setBotScore(0)
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
    
    let resultMsg = ''
    if (playerScore > botScore) {
      resultMsg = 'You won against the bot'
    } else if (botScore > playerScore) {
      resultMsg = 'Bot won'
    } else {
      resultMsg = 'Practice round ended in draw'
    }
    setResultLabel(resultMsg)
    
    setTimeout(() => {
      if (playerScore > botScore) {
        setOverlay('YOU WIN')
      } else if (botScore > playerScore) {
        setOverlay('YOU LOSE')
      } else {
        setOverlay('DRAW')
      }
      setTimeout(() => {
        setOverlay(null)
      }, 1500)
    }, 1200)
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
    if (gameStatus !== 'playing' || !countdownOver) {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current)
        botTimeoutRef.current = null
      }
      return
    }

    const { min, max, delayMin, delayMax } = getBotRange(difficulty)
    const delay = getRandomBetween(delayMin, delayMax)

    botTimeoutRef.current = setTimeout(() => {
      setBotScore(prev => prev + getRandomBetween(min, max))
    }, delay)

    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current)
        botTimeoutRef.current = null
      }
    }
  }, [gameStatus, botScore, difficulty, timer, countdownOver])

  useEffect(() => {
    if (gameStatus === 'ended') {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current)
        botTimeoutRef.current = null
      }
    }
  }, [gameStatus])

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
              <p className="text-sm uppercase tracking-[0.24em] text-white/80">Practice Mode</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">Target Arena Vs Bot</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80">Practice Mode — Bot games do not count toward leaderboards.</p>
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
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-600">Difficulty</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">Choose a bot level</h2>
                <p className="mt-3 text-sm text-slate-600">Easy, Medium, or Hard practice scoring.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {['easy', 'medium', 'hard'].map(level => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${difficulty === level ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Your score</p>
                <p className="mt-3 text-4xl font-bold text-slate-900">{playerScore}</p>
                <p className="mt-2 text-sm text-slate-600">Tap targets quickly to earn points.</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Bot score</p>
                <p className="mt-3 text-4xl font-bold text-slate-900">{botScore}</p>
                <p className="mt-2 text-sm text-slate-600">Bot updates automatically during the round.</p>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Time left</p>
                  <p className="mt-3 text-4xl font-bold text-slate-900">{timer}s</p>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Result</p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">{resultLabel || 'Practice only'}</p>
                </div>
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
              <span>Not counted on leaderboards</span>
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
