import { useState } from 'react'
import Header from '../components/Header'
import WordBattleBoard from '../components/WordBattleBoard'

export default function WordBattlePracticePage({ username, onLogout }) {
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [running, setRunning] = useState(false)

  function handleAnswer({ correct }) {
    if (correct) {
      setScore(s => s + 10)
      setStreak(s => {
        const ns = s + 1
        setBestStreak(b => Math.max(b, ns))
        return ns
      })
    } else {
      setStreak(0)
      setScore(s => Math.max(0, s - 2))
    }
  }

  function start() {
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setTimeLeft(60)
    setRunning(true)

    const startTs = Date.now()
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTs) / 1000)
      const left = Math.max(0, 60 - elapsed)
      setTimeLeft(left)
      if (left <= 0) {
        clearInterval(timer)
        setRunning(false)
      }
    }, 250)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header username={username} onLogout={onLogout} />

      <div className="container-custom mx-auto py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Word Battle — Practice Mode</h1>
            <div className="text-sm text-slate-600">{running ? `Time: ${timeLeft}s` : 'Practice Mode — scores do not count toward leaderboards.'}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Score</div>
                <div className="text-3xl font-bold">{score}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Streak</div>
                <div className="text-2xl font-semibold">{streak}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Best Streak</div>
                <div className="text-2xl font-semibold">{bestStreak}</div>
              </div>
            </div>

            <WordBattleBoard onAnswer={handleAnswer} />

            <div className="mt-6 flex gap-3">
              <button onClick={start} className="btn btn-primary">Play</button>
              <button onClick={() => window.history.back()} className="btn btn-secondary">Leave</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
