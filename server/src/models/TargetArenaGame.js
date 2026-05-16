const SCORE_VALUES = {
  normal: 10,
  fast: 20,
  golden: 50,
  wrong: -5
}

export default class TargetArenaGame {
  constructor(room, io, onGameEnd, existingState = null) {
    this.room = room
    this.io = io
    this.onGameEnd = onGameEnd
    this.duration = 60
    this.gameOver = false
    this.interval = null
    this.startTime = Date.now()
    this.remainingSeconds = this.duration
    this.scores = {}

    room.players.forEach(player => {
      this.scores[player.username] = 0
    })

    if (existingState && existingState.gameType === 'target-arena') {
      this.scores = {
        ...this.scores,
        ...existingState.scores
      }
      this.remainingSeconds = typeof existingState.timer === 'number' ? existingState.timer : this.duration
      const elapsed = this.duration - this.remainingSeconds
      this.startTime = Date.now() - elapsed * 1000
      this.gameOver = existingState.gameOver === true
    }

    if (!this.gameOver) {
      this.start()
    }
  }

  start() {
    this.room.status = 'playing'
    this.gameOver = false
    this.startTime = Date.now()
    this.remainingSeconds = this.duration
    this.room.winner = null

    this.broadcastState()

    this.interval = setInterval(() => {
      this.tick()
    }, 1000)

    console.log(`🎮 Target Arena started in room ${this.room.roomCode}`)
  }

  tick() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
    const next = Math.max(0, this.duration - elapsed)

    if (next !== this.remainingSeconds) {
      this.remainingSeconds = next
      this.broadcastState()
    }

    if (next <= 0) {
      this.end()
    }
  }

  hitTarget(username, targetType) {
    if (this.gameOver) {
      return false
    }

    const value = SCORE_VALUES[targetType]
    if (typeof value !== 'number') {
      return false
    }

    if (!Object.prototype.hasOwnProperty.call(this.scores, username)) {
      this.scores[username] = 0
    }

    this.scores[username] += value
    if (this.scores[username] < 0) {
      this.scores[username] = 0
    }

    console.log(`🎯 Target hit in room ${this.room.roomCode}: ${username} hit ${targetType} (${value} pts). Total: ${this.scores[username]}`)
    this.broadcastState()
    return true
  }

  getState() {
    return {
      gameType: 'target-arena',
      timer: this.remainingSeconds,
      scores: { ...this.scores },
      players: this.room.players.map(player => ({
        username: player.username,
        isOwner: player.isOwner
      })),
      gameOver: this.gameOver,
      roomCode: this.room.roomCode
    }
  }

  broadcastState() {
    const state = this.getState()
    this.room.gameState = state
    this.io.to(this.room.roomCode).emit('game-state-update', state)
  }

  end() {
    if (this.gameOver) {
      return
    }

    this.gameOver = true
    clearInterval(this.interval)
    this.room.status = 'finished'

    const players = this.room.players
    const [player1, player2] = players
    const score1 = this.scores[player1?.username] || 0
    const score2 = this.scores[player2?.username] || 0

    let winner = null
    let isDraw = false
    let message = ''

    if (score1 === score2) {
      isDraw = true
      message = '🤝 Round ended in a draw!'
    } else if (score1 > score2) {
      winner = player1?.username || null
      message = `🏆 ${winner} wins the round!`
    } else {
      winner = player2?.username || null
      message = `🏆 ${winner} wins the round!`
    }

    this.room.winner = winner
    this.room.gameState = this.getState()

    console.log(`⏱️ Target Arena timer ended in room ${this.room.roomCode}. ${message}`)
    this.io.to(this.room.roomCode).emit('game-ended', {
      roomCode: this.room.roomCode,
      gameStatus: isDraw ? 'draw' : 'won',
      winner,
      message,
      isDraw
    })

    if (this.onGameEnd && player1?.username && player2?.username) {
      const extraData = {
        scores: {
    [player1.username]: score1,
    [player2.username]: score2
  }
      }

      if (isDraw) {
        this.onGameEnd('targetArena', 'draw', player1.username, player2.username, extraData)
      } else {
        const loser = winner === player1.username ? player2.username : player1.username
        this.onGameEnd('targetArena', 'win', winner, loser, extraData)
      }
    }
  }

  reset() {
    clearInterval(this.interval)
    this.scores = {}
    this.room.players.forEach(player => {
      this.scores[player.username] = 0
    })
    this.gameOver = false
    this.start()
    this.io.to(this.room.roomCode).emit('game-reset', {
      roomCode: this.room.roomCode,
      message: '🔁 Target Arena reset and ready for a new round',
      gameStatus: 'playing'
    })
  }

  cleanup() {
    clearInterval(this.interval)
    this.interval = null
  }
}
