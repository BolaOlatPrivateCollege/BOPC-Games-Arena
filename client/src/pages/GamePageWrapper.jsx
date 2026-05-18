import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TicTacToePage from './TicTacToePage'
import TargetArenaPage from './TargetArenaPage'
import MathRushPage from './MathRushPage'
import WordBattlePage from './WordBattlePage'

export default function GamePageWrapper({ username, onLogout }) {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const [gameType, setGameType] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadRoom() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/rooms/${roomCode}`)
        const data = await response.json()

        if (!response.ok || !data?.room) {
          setError(data?.message || 'Room not found')
          return
        }

        setGameType(data.room.game || 'tic-tac-toe')
      } catch (err) {
        setError('Unable to load room details')
      }
    }

    loadRoom()
  }, [roomCode])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/80 text-center">
          <p className="text-lg font-semibold text-slate-900">{error}</p>
          <button onClick={() => navigate('/lobby')} className="btn btn-secondary mt-6">Back to Lobby</button>
        </div>
      </div>
    )
  }

  if (!gameType) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-slate-700">Loading game...</div>
      </div>
    )
  }

  if (gameType === 'target-arena') {
    return <TargetArenaPage username={username} onLogout={onLogout} />
  }

  if (gameType === 'math-rush') {
    return <MathRushPage username={username} onLogout={onLogout} />
  }

  if (gameType === 'word-battle') {
    return <WordBattlePage username={username} onLogout={onLogout} />
  }

  return <TicTacToePage username={username} onLogout={onLogout} />
}
