import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import GameBoardTicTacToe from '../components/GameBoardTicTacToe'
import GameOverlay from '../components/GameOverlay'

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
]

function calculateWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }
  return null
}

function getEmptyIndexes(board) {
  return board.map((cell, index) => (cell === null ? index : null)).filter(index => index !== null)
}

function findWinningMove(board, symbol) {
  for (const [a, b, c] of WIN_LINES) {
    const values = [board[a], board[b], board[c]]
    const countSymbol = values.filter(value => value === symbol).length
    const countEmpty = values.filter(value => value === null).length
    if (countSymbol === 2 && countEmpty === 1) {
      const emptyIndex = [a, b, c].find(index => board[index] === null)
      if (typeof emptyIndex === 'number') {
        return emptyIndex
      }
    }
  }
  return null
}

function getBotMove(board, difficulty) {
  const emptyIndexes = getEmptyIndexes(board)
  if (emptyIndexes.length === 0) return null

  if (difficulty === 'easy') {
    return emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)]
  }

  // Smart bot strategy
  const winMove = findWinningMove(board, 'O')
  if (winMove !== null) {
    return winMove
  }

  const blockMove = findWinningMove(board, 'X')
  if (blockMove !== null) {
    return blockMove
  }

  if (board[4] === null) {
    return 4
  }

  return emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)]
}

export default function TicTacToeBotPage({ username, onLogout }) {
  const navigate = useNavigate()
  const [board, setBoard] = useState(Array(9).fill(null))
  const [gameStatus, setGameStatus] = useState('setup')
  const [difficulty, setDifficulty] = useState('easy')
  const [isThinking, setIsThinking] = useState(false)
  const [winner, setWinner] = useState(null)
  const [resultLabel, setResultLabel] = useState('')
  const [lastMove, setLastMove] = useState('X')
  const [countdown, setCountdown] = useState(null)
  const [countdownOver, setCountdownOver] = useState(false)
  const [overlay, setOverlay] = useState(null)
  const [turnTimer, setTurnTimer] = useState(30)
  const [timedOut, setTimedOut] = useState(false)

  const statusMessage = useMemo(() => {
    if (gameStatus === 'setup') return 'Select difficulty and start your practice round.'
    if (gameStatus === 'countdown') return `Starting in ${countdown}...`
    if (gameStatus === 'playing' && timedOut) return 'Time out!'
    if (gameStatus === 'playing' && isThinking) return `Bot is thinking... ${turnTimer}s`
    if (gameStatus === 'playing') return `Your turn — ${turnTimer}s`
    return ''
  }, [gameStatus, isThinking, countdown, turnTimer, timedOut])

  useEffect(() => {
    return () => {
      setIsThinking(false)
    }
  }, [])

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

  // Turn timer effect
  useEffect(() => {
    if (gameStatus !== 'playing' || countdownOver === false || timedOut) return
    if (turnTimer <= 0) {
      setTimedOut(true)
      setOverlay('TIME OUT')
      setTimeout(() => {
        setOverlay(null)
        endGame('lost', 'O')
      }, 1200)
      return
    }

    const timer = setTimeout(() => {
      setTurnTimer(turnTimer - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [gameStatus, turnTimer, countdownOver, timedOut])

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setGameStatus('countdown')
    setCountdown(null)
    setCountdownOver(false)
    setOverlay('GET READY')
    setWinner(null)
    setResultLabel('')
    setIsThinking(false)
    setLastMove('X')
    setTurnTimer(30)
    setTimedOut(false)
    setTimeout(() => {
      setCountdown(3)
      setOverlay(null)
    }, 1200)
  }

  const handleStartPractice = () => {
    resetGame()
  }

  const handleLeaveGame = () => {
    navigate('/lobby')
  }

  const endGame = (finalStatus, finalWinner = null) => {
    setGameStatus(finalStatus)
    setWinner(finalWinner)
    setIsThinking(false)
    
    let overlayMsg = ''
    let resultMsg = ''
    
    if (finalStatus === 'won') {
      overlayMsg = 'YOU WIN'
      resultMsg = 'You won against the bot'
    } else if (finalStatus === 'lost') {
      overlayMsg = 'YOU LOSE'
      resultMsg = 'Bot won'
    } else if (finalStatus === 'draw') {
      overlayMsg = 'DRAW'
      resultMsg = 'Practice round ended in draw'
    }
    
    setOverlay(overlayMsg)
    setResultLabel(resultMsg)
    
    setTimeout(() => {
      setOverlay(null)
    }, 1500)
  }

  const runBotTurn = (currentBoard) => {
    const nextBoard = [...currentBoard]
    const moveIndex = getBotMove(nextBoard, difficulty)
    if (moveIndex === null) {
      endGame('draw')
      return
    }

    nextBoard[moveIndex] = 'O'
    const winnerSymbol = calculateWinner(nextBoard)
    if (winnerSymbol) {
      setBoard(nextBoard)
      endGame(winnerSymbol === 'X' ? 'won' : 'lost', winnerSymbol)
      return
    }

    if (nextBoard.every(cell => cell !== null)) {
      setBoard(nextBoard)
      endGame('draw')
      return
    }

    setBoard(nextBoard)
    setLastMove('O')
    setIsThinking(false)
  }

  const handleCellClick = (index) => {
    if (gameStatus !== 'playing') return
    if (isThinking) return
    if (board[index] !== null) return
    if (timedOut) return

    const nextBoard = [...board]
    nextBoard[index] = 'X'
    const winnerSymbol = calculateWinner(nextBoard)

    if (winnerSymbol) {
      setBoard(nextBoard)
      endGame('won', 'X')
      return
    }

    if (nextBoard.every(cell => cell !== null)) {
      setBoard(nextBoard)
      endGame('draw')
      return
    }

    setBoard(nextBoard)
    setLastMove('X')
    setIsThinking(true)
    setTurnTimer(30)
    setOverlay('BOT IS THINKING')

    const delay = 500 + Math.floor(Math.random() * 501)
    const boardAfterPlayer = nextBoard

    setTimeout(() => {
      setOverlay(null)
      runBotTurn(boardAfterPlayer)
    }, delay)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Header username={username} onLogout={onLogout} />
      <GameOverlay message={overlay} show={overlay !== null} duration={800} />

      <div className="container-custom mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 p-6 text-white shadow-2xl shadow-slate-900/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/80">Practice Mode</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight">Tic Tac Toe Vs Bot</h1>
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
                onClick={resetGame}
                className="btn btn-primary bg-white text-violet-700 hover:bg-white/90"
              >
                Reset Board
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-indigo-600">Difficulty</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">Choose a bot level</h2>
                <p className="mt-3 text-sm text-slate-600">Easy for casual practice or Smart for a more competitive round.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setDifficulty('easy')}
                  className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${difficulty === 'easy' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Easy
                </button>
                <button
                  onClick={() => setDifficulty('smart')}
                  className={`rounded-3xl px-5 py-3 text-sm font-semibold transition ${difficulty === 'smart' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Smart
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="rounded-[1.5rem] bg-slate-50 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Player</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">You</p>
                <p className="mt-2 text-sm text-slate-600">X, goes first</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Bot</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">O</p>
                <p className="mt-2 text-sm text-slate-600">Automatic response after you move</p>
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
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Board status</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">{statusMessage}</p>
              </div>
              {(gameStatus === 'won' || gameStatus === 'lost' || gameStatus === 'draw') && (
                <div className="rounded-[1.5rem] bg-emerald-50 border border-emerald-200 p-5 text-slate-900">
                  <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">Result</p>
                  <h3 className="mt-3 text-2xl font-bold">{resultLabel}</h3>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80">
          <div className="text-center mb-8">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Practice board</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Play against the bot</h2>
          </div>
          <div className="flex flex-col items-center gap-6">
            <GameBoardTicTacToe
              board={board}
              onCellClick={handleCellClick}
              disabled={gameStatus !== 'playing' || isThinking || timedOut || !countdownOver}
              gameOver={gameStatus !== 'playing' && gameStatus !== 'setup' && gameStatus !== 'countdown'}
              statusMessage={statusMessage}
            />
            <div className="w-full grid gap-3 sm:grid-cols-2">
              <button
                onClick={resetGame}
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
    </div>
  )
}
