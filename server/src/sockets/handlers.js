import { getRoom, setRoomWinner, removePlayerFromRoom } from '../models/Room.js'
import Leaderboard from '../models/Leaderboard.js'
import TargetArenaGame from '../models/TargetArenaGame.js'
import MathRushGame from '../models/MathRushGame.js'
import WordBattleGame from '../models/WordBattleGame.js'
import Contest from '../models/Contest.js'
import ContestScore from '../models/ContestScore.js'
import User from '../models/User.js'

/**
 * Tic Tac Toe Game Logic
 */
class TicTacToeGame {
  constructor(room) {
    this.room = room
    this.board = Array(9).fill(null)
    this.currentPlayer = 'X'
    this.gameOver = false
    this.winner = null
    this.winningLine = null
    this.isDraw = false
  }

  makeMove(index, playerSymbol) {
    if (this.gameOver) {
      return { success: false, error: 'Game is already over' }
    }

    if (index < 0 || index > 8) {
      return { success: false, error: 'Invalid board position' }
    }

    if (this.board[index] !== null) {
      return { success: false, error: 'Cell already occupied' }
    }

    if (this.currentPlayer !== playerSymbol) {
      return {
        success: false,
        error: `Not ${playerSymbol}'s turn. Current turn is ${this.currentPlayer}`
      }
    }

    this.board[index] = playerSymbol

    const winningLine = this.checkWinner()

    if (winningLine) {
      const winner = this.board[winningLine[0]]
      this.gameOver = true
      this.winner = winner
      this.winningLine = winningLine

      return {
        success: true,
        gameOver: true,
        winner,
        winningLine,
        isDraw: false
      }
    }

    if (this.board.every(cell => cell !== null)) {
      this.gameOver = true
      this.isDraw = true

      return {
        success: true,
        gameOver: true,
        winner: null,
        isDraw: true
      }
    }

    this.currentPlayer = playerSymbol === 'X' ? 'O' : 'X'

    return {
      success: true,
      gameOver: false,
      winner: null,
      isDraw: false
    }
  }

  checkWinner() {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ]

    for (const line of lines) {
      const [a, b, c] = line
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        return line
      }
    }

    return null
  }

  getState() {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      currentTurn: this.currentPlayer,
      gameOver: this.gameOver,
      winner: this.winner,
      draw: this.isDraw,
      winningLine: this.winningLine
    }
  }

  loadState(gameState) {
    if (!gameState) return

    this.board = gameState.board || Array(9).fill(null)
    this.currentPlayer = gameState.currentTurn || gameState.currentPlayer || 'X'
    this.gameOver = gameState.gameOver === true
    this.winner = gameState.winner || null
    this.winningLine = gameState.winningLine || null
    this.isDraw = gameState.draw === true
  }
}

/**
 * Socket.io Event Handlers
 */
export function setupSocketHandlers(io) {
  const games = new Map()

  io.on('connection', (socket) => {
    console.log(`👤 User connected: ${socket.id}`)

    /**
     * Join Room Event
     */
    socket.on('join-room', (data) => {
      const { roomCode, username } = data
      const room = getRoom(roomCode)

      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      socket.join(roomCode)

      // Ensure student profile exists for this username
      if (username) {
        try {
          User.getOrCreate(username).catch(err => console.warn('Failed to ensure user profile:', err))
        } catch (err) {
          console.warn('Failed to ensure user profile:', err)
        }
      }

      let playerInRoom = null

      // Important: find player by username first.
      // This fixes refresh/reconnect where the browser gets a new socket ID.
      if (username) {
        playerInRoom = room.players.find(player => player.username === username)
      }

      // If username was not found, assign to any player without socket ID.
      if (!playerInRoom) {
        playerInRoom = room.players.find(player => !player.socketId)
      }

      if (playerInRoom) {
        playerInRoom.socketId = socket.id
        socket.username = playerInRoom.username

        console.log(
          `👥 Player socket assigned: ${playerInRoom.username} (${socket.id}) to room ${roomCode}`
        )
      } else {
        console.warn(
          `⚠️ No matching player found for socket ${socket.id} in room ${roomCode}`
        )
      }

      /**
       * Auto-start game once both players are present.
       */
      if (room.players.length === 2 && room.status === 'waiting') {
        const player1 = room.players[0]
        const player2 = room.players[1]

        if (room.game === 'target-arena') {
          const game = new TargetArenaGame(room, io, recordGameResult, room.gameState)
          games.set(roomCode, game)
          room.status = 'playing'
          room.gameState = game.getState()

          console.log(`🎮 Target Arena auto-started in room: ${roomCode}`)
          console.log(`👤 Player 1: ${player1.username} (${player1.socketId})`)
          console.log(`👤 Player 2: ${player2.username} (${player2.socketId})`)
        } else if (room.game === 'math-rush') {
          const game = new MathRushGame(room, io, recordGameResult, room.gameState)
          games.set(roomCode, game)
          room.status = 'playing'
          room.gameState = game.getState()

          console.log(`🎮 Math Rush auto-started in room: ${roomCode}`)
          console.log(`👤 Player 1: ${player1.username} (${player1.socketId})`)
          console.log(`👤 Player 2: ${player2.username} (${player2.socketId})`)
        } else if (room.game === 'word-battle') {
          const game = new WordBattleGame(room, io, recordGameResult, room.gameState)
          games.set(roomCode, game)
          room.status = 'playing'
          room.gameState = game.getState()

          console.log(`🎮 Word Battle auto-started in room: ${roomCode}`)
          console.log(`👤 Player 1: ${player1.username} (${player1.socketId})`)
          console.log(`👤 Player 2: ${player2.username} (${player2.socketId})`)
        } else {
          console.log(`🎮 Second player joined. Auto-starting game in room: ${roomCode}`)

          player1.symbol = 'X'
          player2.symbol = 'O'

          const game = new TicTacToeGame(room)
          games.set(roomCode, game)

          room.status = 'playing'
          room.gameState = {
            board: Array(9).fill(null),
            currentTurn: 'X',
            currentPlayer: 'X',
            winner: null,
            draw: false,
            gameOver: false,
            players: {
              X: player1.socketId || player1.username,
              O: player2.socketId || player2.username
            }
          }

          console.log(`✅ Game auto-started for room ${roomCode}`)
          console.log(`👤 X Player: ${player1.username} (${player1.socketId})`)
          console.log(`👤 O Player: ${player2.username} (${player2.socketId})`)
        }
      }

      /**
       * If room is already playing but game instance is missing,
       * recreate it from room.gameState.
       */
      if (room.status === 'playing' && !games.has(roomCode)) {
        if (room.game === 'target-arena') {
          const game = new TargetArenaGame(room, io, recordGameResult, room.gameState)
          games.set(roomCode, game)
          console.log(`♻️ Target Arena game instance restored for room ${roomCode}`)
        } else if (room.game === 'math-rush') {
          const game = new MathRushGame(room, io, recordGameResult, room.gameState)
          games.set(roomCode, game)
          console.log(`♻️ Math Rush game instance restored for room ${roomCode}`)
        } else if (room.game === 'word-battle') {
          const game = new WordBattleGame(room, io, recordGameResult, room.gameState)
          games.set(roomCode, game)
          console.log(`♻️ Word Battle game instance restored for room ${roomCode}`)
        } else {
          const game = new TicTacToeGame(room)
          game.loadState(room.gameState)
          games.set(roomCode, game)
          console.log(`♻️ Game instance restored for room ${roomCode}`)
        }
      }

      /**
       * Always send the latest full room state to everyone.
       */
      io.to(roomCode).emit('roomUpdated', {
        roomCode,
        room,
        players: room.players,
        roomStatus: room.status,
        gameState: room.gameState
      })

      /**
       * Always resend player symbol/opponent assignment.
       */
      if (room.players.length === 2 && room.status === 'playing') {
        if (room.game !== 'target-arena') {
          room.players.forEach((player, index) => {
            const opponent = room.players[1 - index]

            if (player.socketId) {
              io.to(player.socketId).emit('opponent-joined', {
                opponentUsername: opponent.username,
                playerSymbol: player.symbol,
                opponentSymbol: opponent.symbol
              })
            }
          })
        }

        if (room.game === 'target-arena') {
          io.to(roomCode).emit('game-state-update', room.gameState)
        } else {
          io.to(roomCode).emit('game-state-update', {
            board: room.gameState?.board || Array(9).fill(null),
            currentPlayer: room.gameState?.currentPlayer || 'X',
            currentTurn: room.gameState?.currentTurn || 'X',
            isXNext: (room.gameState?.currentTurn || 'X') === 'X',
            gameOver: room.gameState?.gameOver === true,
            winner: room.gameState?.winner || null,
            draw: room.gameState?.draw === true,
            gameStatus: room.gameState?.gameOver === true
              ? room.gameState?.draw === true
                ? 'draw'
                : 'won'
              : 'playing'
          })
        }
      }

      io.to(roomCode).emit('room-joined', {
        roomCode,
        room,
        players: room.players,
        isOwner: room.players.find(player => player.socketId === socket.id)?.isOwner || false,
        roomStatus: room.status
      })

      console.log(`📍 Room ${roomCode} now has ${room.players.length} players`)
    })

    socket.on('send-chat-message', (data) => {
      const { roomCode: messageRoom, username: sender, message } = data || {}
      const trimmedMessage = typeof message === 'string' ? message.trim() : ''

      if (!messageRoom || !sender || !trimmedMessage) {
        return
      }

      if (trimmedMessage.length > 200) {
        console.warn(`⚠️ Chat message too long from ${sender} in room ${messageRoom}`)
        return
      }

      const room = getRoom(messageRoom)
      if (!room) {
        console.warn(`⚠️ Chat message received for nonexistent room: ${messageRoom}`)
        return
      }

      const payload = {
        roomCode: messageRoom,
        username: sender,
        message: trimmedMessage,
        timestamp: new Date().toISOString()
      }

      console.log(`💬 Chat message in room ${messageRoom} from ${sender}: ${trimmedMessage}`)
      io.to(messageRoom).emit('receive-chat-message', payload)
    })

    socket.on('target-hit', (data) => {
      const { roomCode, username, targetType } = data || {}
      const room = getRoom(roomCode)

      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      if (room.game !== 'target-arena') {
        return
      }

      const game = games.get(roomCode)
      if (!game) {
        socket.emit('error', { message: 'Target Arena game not found' })
        return
      }

      game.hitTarget(username, targetType)
    })

    socket.on('request-math-question', (data) => {
      const { roomCode, username } = data || {}
      const room = getRoom(roomCode)

      if (!room || room.game !== 'math-rush') {
        return
      }

      const game = games.get(roomCode)
      if (game && typeof game.requestQuestion === 'function') {
        game.requestQuestion(username)
      }
    })

    socket.on('request-word-question', (data) => {
      const { roomCode, username, difficulty } = data || {}
      const room = getRoom(roomCode)

      if (!room || room.game !== 'word-battle') return

      const game = games.get(roomCode)
      if (game && typeof game.requestQuestion === 'function') {
        game.requestQuestion(username, difficulty || 'easy')
      }
    })

    socket.on('word-answer', (data) => {
      const { roomCode, username, questionId, answer } = data || {}
      const room = getRoom(roomCode)

      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      if (room.game !== 'word-battle') return

      const game = games.get(roomCode)
      if (!game) {
        socket.emit('error', { message: 'Word Battle game not found' })
        return
      }

      game.submitAnswer(username, questionId, answer)
    })

    socket.on('math-answer', (data) => {
      const { roomCode, username, questionId, answer } = data || {}
      const room = getRoom(roomCode)

      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      if (room.game !== 'math-rush') {
        return
      }

      const game = games.get(roomCode)
      if (!game) {
        socket.emit('error', { message: 'Math Rush game not found' })
        return
      }

      game.submitAnswer(username, questionId, answer)
    })

    /**
     * Start Game Event
     */
    socket.on('start-game', (data) => {
      const { roomCode } = data
      const room = getRoom(roomCode)

      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      if (room.players.length < 2) {
        socket.emit('error', { message: 'Need 2 players to start game' })
        return
      }

      if (room.game === 'target-arena') {
        const game = new TargetArenaGame(room, io, recordGameResult, room.gameState)
        games.set(roomCode, game)
        room.status = 'playing'
        room.gameState = game.getState()

        console.log(`🎮 Target Arena manually started in room: ${roomCode}`)
      } else if (room.game === 'math-rush') {
        const game = new MathRushGame(room, io, recordGameResult, room.gameState)
        games.set(roomCode, game)
        room.status = 'playing'
        room.gameState = game.getState()

        console.log(`🎮 Math Rush manually started in room: ${roomCode}`)
      } else {
        const player1 = room.players[0]
        const player2 = room.players[1]

        player1.symbol = 'X'
        player2.symbol = 'O'

        const game = new TicTacToeGame(room)
        games.set(roomCode, game)

        room.status = 'playing'
        room.gameState = {
          board: Array(9).fill(null),
          currentTurn: 'X',
          currentPlayer: 'X',
          winner: null,
          draw: false,
          gameOver: false,
          players: {
            X: player1.socketId || player1.username,
            O: player2.socketId || player2.username
          }
        }

        console.log(`🎮 Game manually started in room: ${roomCode}`)

        room.players.forEach((player, index) => {
          const opponent = room.players[1 - index]

          if (player.socketId) {
            io.to(player.socketId).emit('opponent-joined', {
              opponentUsername: opponent.username,
              playerSymbol: player.symbol,
              opponentSymbol: opponent.symbol
            })
          }
        })
      }

      io.to(roomCode).emit('roomUpdated', {
        roomCode,
        room,
        players: room.players,
        roomStatus: room.status,
        gameState: room.gameState
      })

      if (room.game === 'target-arena' || room.game === 'math-rush') {
        io.to(roomCode).emit('game-state-update', room.gameState)
      } else {
        io.to(roomCode).emit('game-state-update', {
          board: room.gameState.board,
          currentPlayer: 'X',
          currentTurn: 'X',
          isXNext: true,
          gameOver: false,
          winner: null,
          draw: false,
          gameStatus: 'playing'
        })
      }
    })

    /**
     * Make Move Event
     */
    socket.on('make-move', async (data) => {
      const { roomCode, index, playerSymbol } = data
      const room = getRoom(roomCode)

      console.log(
        `🎯 Move attempt: room=${roomCode}, index=${index}, symbol=${playerSymbol}, socket=${socket.id}`
      )

      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      let game = games.get(roomCode)

      if (!game) {
        console.warn(`⚠️ Game instance missing for room ${roomCode}. Recreating from room state.`)

        game = new TicTacToeGame(room)
        game.loadState(room.gameState)
        games.set(roomCode, game)
      }

      const movingPlayer = room.players.find(player => player.socketId === socket.id)

      if (!movingPlayer) {
        socket.emit('error', { message: 'Player not found in this room' })
        return
      }

      if (movingPlayer.symbol !== playerSymbol) {
        socket.emit('error', {
          message: `Invalid symbol. You are ${movingPlayer.symbol}, not ${playerSymbol}`
        })
        return
      }

      const stateBeforeMove = game.getState()

      if (stateBeforeMove.gameOver) {
        socket.emit('error', { message: 'Game is already over' })
        return
      }

      if (stateBeforeMove.currentPlayer !== playerSymbol) {
        socket.emit('error', {
          message: `Not your turn. Current turn is ${stateBeforeMove.currentPlayer}`
        })
        return
      }

      const result = game.makeMove(index, playerSymbol)

      if (!result.success) {
        socket.emit('error', { message: result.error })
        return
      }

      const state = game.getState()

      room.gameState = {
        board: state.board,
        currentTurn: state.currentPlayer,
        currentPlayer: state.currentPlayer,
        winner: state.winner,
        winningLine: state.winningLine || null,
        draw: state.draw,
        gameOver: state.gameOver,
        players: {
          X: room.players.find(p => p.symbol === 'X')?.socketId || room.players.find(p => p.symbol === 'X')?.username,
          O: room.players.find(p => p.symbol === 'O')?.socketId || room.players.find(p => p.symbol === 'O')?.username
        }
      }

      console.log(
        `✅ Move made by ${movingPlayer.username} (${playerSymbol}) at index ${index}`
      )

      io.to(roomCode).emit('move-made', {
        playerSymbol,
        index,
        playerUsername: movingPlayer.username
      })

      io.to(roomCode).emit('roomUpdated', {
        roomCode,
        room,
        players: room.players,
        roomStatus: room.status,
        gameState: room.gameState
      })

      io.to(roomCode).emit('game-state-update', {
        board: state.board,
        currentPlayer: state.currentPlayer,
        currentTurn: state.currentPlayer,
        isXNext: state.currentPlayer === 'X',
        gameOver: state.gameOver,
        winner: state.winner,
        winningLine: state.winningLine || null,
        draw: state.draw,
        gameStatus: state.gameOver
          ? state.draw
            ? 'draw'
            : 'won'
          : 'playing'
      })

      if (result.gameOver) {
        if (result.isDraw) {
          const player1 = room.players[0]
          const player2 = room.players[1]

          io.to(roomCode).emit('game-ended', {
            roomCode,
            gameStatus: 'draw',
            message: '🤝 Game ended in a draw!',
            isDraw: true
          })

          console.log(`🤝 Game ended in draw for room: ${roomCode}`)

          // Record draw for both players
          if (player1?.username && player2?.username) {
            await recordGameResult('ticTacToe', 'draw', player1.username, player2.username)
          }
          return
        }

        if (result.winner) {
          const winnerPlayer = room.players.find(player => player.symbol === result.winner)
          const loserPlayer = room.players.find(player => player.symbol !== result.winner)

          io.to(roomCode).emit('game-ended', {
            roomCode,
            gameStatus: 'won',
            winner: winnerPlayer?.username || result.winner,
            winnerSymbol: result.winner,
            message: `🎉 ${winnerPlayer?.username || result.winner} wins!`,
            isDraw: false
          })

          console.log(`🏆 ${winnerPlayer?.username || result.winner} won! Room: ${roomCode}`)

          setRoomWinner(roomCode, result.winner)

          if (winnerPlayer?.username && loserPlayer?.username) {
            await recordGameResult('ticTacToe', 'win', winnerPlayer.username, loserPlayer.username)
          }
        }
      }
    })

    socket.on('request-rematch', (data) => {
      const { roomCode } = data
      const room = getRoom(roomCode)

      if (!room) {
        socket.emit('error', { message: 'Room not found' })
        return
      }

      const requestingPlayer = room.players.find(player => player.socketId === socket.id)
      if (!requestingPlayer) {
        socket.emit('error', { message: 'Player not found in room' })
        return
      }

      if (room.players.length < 2) {
        socket.emit('error', { message: 'Need two players to start a new round' })
        return
      }

      if (room.game === 'target-arena') {
        const game = games.get(roomCode)
        if (game) {
          game.reset()
        } else {
          const newGame = new TargetArenaGame(room, io, recordGameResult, room.gameState)
          games.set(roomCode, newGame)
        }

        room.status = 'playing'
        room.winner = null

        io.to(roomCode).emit('roomUpdated', {
          roomCode,
          room,
          players: room.players,
          roomStatus: room.status,
          gameState: room.gameState
        })

        io.to(roomCode).emit('game-state-update', room.gameState)
      } else if (room.game === 'math-rush') {
        const game = games.get(roomCode)
        if (game) {
          game.reset()
        } else {
          const newGame = new MathRushGame(room, io, recordGameResult, room.gameState)
          games.set(roomCode, newGame)
        }

        room.status = 'playing'
        room.winner = null

        io.to(roomCode).emit('roomUpdated', {
          roomCode,
          room,
          players: room.players,
          roomStatus: room.status,
          gameState: room.gameState
        })

        io.to(roomCode).emit('game-state-update', room.gameState)
      } else {
        room.status = 'playing'
        room.winner = null
        room.gameState = {
          board: Array(9).fill(null),
          currentTurn: 'X',
          currentPlayer: 'X',
          winner: null,
          winningLine: null,
          draw: false,
          gameOver: false,
          players: {
            X: room.players.find(p => p.symbol === 'X')?.socketId || room.players.find(p => p.symbol === 'X')?.username,
            O: room.players.find(p => p.symbol === 'O')?.socketId || room.players.find(p => p.symbol === 'O')?.username
          }
        }

        const game = new TicTacToeGame(room)
        games.set(roomCode, game)

        io.to(roomCode).emit('roomUpdated', {
          roomCode,
          room,
          players: room.players,
          roomStatus: room.status,
          gameState: room.gameState
        })

        io.to(roomCode).emit('game-state-update', {
          board: room.gameState.board,
          currentPlayer: 'X',
          currentTurn: 'X',
          isXNext: true,
          gameOver: false,
          winner: null,
          winningLine: null,
          draw: false,
          gameStatus: 'playing'
        })

        io.to(roomCode).emit('game-reset', {
          roomCode,
          message: '🔁 New round started',
          gameStatus: 'playing'
        })
      }
    })

    /**
     * Leave Room Event
     */
    socket.on('leave-room', (data) => {
      const { roomCode } = data
      const room = getRoom(roomCode)

      if (room) {
        const player = room.players.find(p => p.socketId === socket.id)

        if (player) {
          removePlayerFromRoom(roomCode, player.username)
        }

        socket.leave(roomCode)

        if (room.players.length > 0) {
          io.to(roomCode).emit('player-left', {
            roomCode,
            players: room.players
          })
        } else {
          const game = games.get(roomCode)
          if (game?.cleanup) {
            game.cleanup()
          }
          games.delete(roomCode)
        }
      }

      console.log(`👋 Player left room: ${roomCode}`)
    })

    /**
     * Fetch Leaderboard Event
     */
    socket.on('fetch-leaderboard', async (payload = {}) => {
      try {
        const game = payload.game || 'global'
        const leaderboard = await Leaderboard.getLeaderboard(game, 100)

        const rankedLeaderboard = leaderboard.map((player, index) => ({
          ...player.toObject(),
          rank: index + 1
        }))

        if (game === 'global') {
          console.log('Global leaderboard fetched')
        } else if (game === 'ticTacToe') {
          console.log('Tic Tac Toe leaderboard fetched')
        } else if (game === 'targetArena') {
          console.log('Target Arena leaderboard fetched')
        } else if (game === 'mathRush') {
          console.log('Math Rush leaderboard fetched')
        }

        socket.emit('leaderboard-data', {
          leaderboard: rankedLeaderboard,
          userStats: null
        })
      } catch (error) {
        console.error('Error fetching leaderboard:', error)

        socket.emit('leaderboard-data', {
          leaderboard: [],
          userStats: null
        })
      }
    })

    /**
     * Disconnect Event
     */
    socket.on('disconnect', () => {
      console.log(`👤 User disconnected: ${socket.id}`)
    })
  })
}

/**
 * Record Game Result in Leaderboard
 * @param {string} gameType - 'ticTacToe' or 'targetArena'
 * @param {string} resultType - 'win' or 'draw'
 * @param {string} player1Username - Winner username for wins, or player 1 username for draws
 * @param {string} player2Username - Loser username for wins, or player 2 username for draws
 * @param {object} extraData - Extra game data, such as player scores
 */
async function recordGameResult(gameType, resultType, player1Username, player2Username, extraData = {}) {
  try {
    console.log(`💾 Saving result: gameType=${gameType}, resultType=${resultType}`)

    if (!player1Username || !player2Username) {
      console.warn('⚠️ Cannot record result because one or both usernames are missing.')
      return
    }

    if (gameType === 'ticTacToe') {
      if (resultType === 'win') {
        await Leaderboard.updateUserStats(player1Username, 'win', 'ticTacToe')
        await Leaderboard.updateUserStats(player2Username, 'loss', 'ticTacToe')

        console.log(
          `📊 Tic Tac Toe result recorded: ${player1Username} won vs ${player2Username}`
        )
        // Update active weekly contest scores (if any)
        try {
          const activeContest = await Contest.getActiveContest()
          if (activeContest) {
            console.log('Active contest found:', activeContest.title)
            await ContestScore.updateForResult(activeContest, player1Username, 'ticTacToe', 'win')
            await ContestScore.updateForResult(activeContest, player2Username, 'ticTacToe', 'loss')
            console.log('Weekly contest score updated for ticTacToe result')
          } else {
            console.log('No active contest found')
          }
        } catch (err) {
          console.error('❌ Error updating contest scores for ticTacToe win:', err)
        }
      } else if (resultType === 'draw') {
        await Leaderboard.updateUserStats(player1Username, 'draw', 'ticTacToe')
        await Leaderboard.updateUserStats(player2Username, 'draw', 'ticTacToe')

        console.log(
          `📊 Tic Tac Toe draw recorded: ${player1Username} and ${player2Username}`
        )
        // Update active weekly contest scores (if any)
        try {
          const activeContest = await Contest.getActiveContest()
          if (activeContest) {
            console.log('Active contest found:', activeContest.title)
            await ContestScore.updateForResult(activeContest, player1Username, 'ticTacToe', 'draw')
            await ContestScore.updateForResult(activeContest, player2Username, 'ticTacToe', 'draw')
            console.log('Weekly contest score updated for ticTacToe draw')
          } else {
            console.log('No active contest found')
          }
        } catch (err) {
          console.error('❌ Error updating contest scores for ticTacToe draw:', err)
        }
      }

      return
    }

    if (gameType === 'targetArena' || gameType === 'mathRush' || gameType === 'wordBattle') {
      const scores = extraData.scores || {}
      const bestStreaks = extraData.bestStreaks || {}
      const questionsAnswered = extraData.questionsAnswered || {}

      const player1Score = Number(scores[player1Username] ?? 0)
      const player2Score = Number(scores[player2Username] ?? 0)
      const player1Best = Number(bestStreaks[player1Username] ?? 0)
      const player2Best = Number(bestStreaks[player2Username] ?? 0)
      const player1Questions = Number(questionsAnswered[player1Username] ?? 0)
      const player2Questions = Number(questionsAnswered[player2Username] ?? 0)

      const leaderboardType = gameType === 'mathRush' ? 'mathRush' : gameType === 'targetArena' ? 'targetArena' : 'wordBattle'
      const gameLabel = gameType === 'mathRush' ? 'Math Rush' : gameType === 'targetArena' ? 'Target Arena' : 'Word Battle'

      const p1Extra = { score: player1Score, bestStreak: player1Best, questionsAnswered: player1Questions }
      const p2Extra = { score: player2Score, bestStreak: player2Best, questionsAnswered: player2Questions }

      if (resultType === 'win') {
        await Leaderboard.updateUserStats(player1Username, 'win', leaderboardType, p1Extra)
        console.log(`Game-specific stats updated for ${player1Username}: game=${leaderboardType}`)

        await Leaderboard.updateUserStats(player2Username, 'loss', leaderboardType, p2Extra)
        console.log(`Game-specific stats updated for ${player2Username}: game=${leaderboardType}`)

        console.log(`📊 ${gameLabel} result recorded: ${player1Username} won with ${player1Score} vs ${player2Username} with ${player2Score}`)

        // Update active weekly contest scores (if any)
        try {
          const activeContest = await Contest.getActiveContest()
          if (activeContest) {
            console.log('Active contest found:', activeContest.title)
            await ContestScore.updateForResult(activeContest, player1Username, leaderboardType, 'win', p1Extra)
            await ContestScore.updateForResult(activeContest, player2Username, leaderboardType, 'loss', p2Extra)
            console.log(`Weekly contest score updated: game=${leaderboardType}`)
          } else {
            console.log('No active contest found')
          }
        } catch (err) {
          console.error(`❌ Error updating contest scores for ${gameLabel} win:`, err)
        }
      } else if (resultType === 'draw') {
        await Leaderboard.updateUserStats(player1Username, 'draw', leaderboardType, p1Extra)
        console.log(`Game-specific stats updated for ${player1Username}: game=${leaderboardType}`)

        await Leaderboard.updateUserStats(player2Username, 'draw', leaderboardType, p2Extra)
        console.log(`Game-specific stats updated for ${player2Username}: game=${leaderboardType}`)

        console.log(`📊 ${gameLabel} draw recorded: ${player1Username} (${player1Score}) and ${player2Username} (${player2Score})`)
        // Update active weekly contest scores (if any)
        try {
          const activeContest = await Contest.getActiveContest()
          if (activeContest) {
            console.log('Active contest found:', activeContest.title)
            await ContestScore.updateForResult(activeContest, player1Username, leaderboardType, 'draw', p1Extra)
            await ContestScore.updateForResult(activeContest, player2Username, leaderboardType, 'draw', p2Extra)
            console.log(`Weekly contest score updated: game=${leaderboardType}`)
          } else {
            console.log('No active contest found')
          }
        } catch (err) {
          console.error(`❌ Error updating contest scores for ${gameLabel} draw:`, err)
        }
      }

      return
    }

    console.warn(`⚠️ Unknown game type received in recordGameResult: ${gameType}`)
  } catch (error) {
    console.error('❌ Error recording game result:', error)
  }
}