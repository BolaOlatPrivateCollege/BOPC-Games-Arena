export default class MathRushGame {
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
    this.currentQuestions = {}
    this.currentStreaks = {}
    this.bestStreaks = {}
    this.questionsAnswered = {}

    room.players.forEach(player => {
      this.scores[player.username] = 0
      this.currentStreaks[player.username] = 0
      this.bestStreaks[player.username] = 0
      this.questionsAnswered[player.username] = 0
    })

    if (existingState && existingState.gameType === 'math-rush') {
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

  generateQuestion() {
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

  start() {
    this.room.status = 'playing'
    this.gameOver = false
    this.startTime = Date.now()
    this.remainingSeconds = this.duration
    this.room.winner = null
    this.currentQuestions = {}

    this.broadcastState()
    this.emitGameStarted()

    this.interval = setInterval(() => {
      this.tick()
    }, 1000)
  }

  emitGameStarted() {
    this.io.to(this.room.roomCode).emit('game-started', {
      gameType: 'math-rush'
    })
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

  requestQuestion(username) {
    if (this.gameOver) {
      return
    }

    const player = this.room.players.find(p => p.username === username)
    if (!player) {
      return
    }

    const question = this.generateQuestion()
    this.currentQuestions[username] = question

    if (player.socketId) {
      this.io.to(player.socketId).emit('math-question', {
        questionId: question.id,
        question: question.question,
        points: question.points
      })
    }
  }

  submitAnswer(username, questionId, answer) {
    if (this.gameOver) {
      return
    }

    const player = this.room.players.find(p => p.username === username)
    if (!player) {
      return
    }

    const current = this.currentQuestions[username]
    if (!current || current.id !== questionId) {
      if (player.socketId) {
        this.io.to(player.socketId).emit('math-answer-result', {
          correct: false,
          points: 0
        })
      }
      return
    }

    const isCorrect = Number(answer) === current.answer
    if (isCorrect) {
      this.scores[username] = (this.scores[username] || 0) + current.points
      this.currentStreaks[username] = (this.currentStreaks[username] || 0) + 1
      this.bestStreaks[username] = Math.max(this.bestStreaks[username] || 0, this.currentStreaks[username])
    }
    else {
      // reset current streak on incorrect answer
      this.currentStreaks[username] = 0
    }
    // Count answered questions (correct or not)
    this.questionsAnswered[username] = (this.questionsAnswered[username] || 0) + 1
    delete this.currentQuestions[username]
    this.broadcastState()

    if (player.socketId) {
      this.io.to(player.socketId).emit('math-answer-result', {
        correct: isCorrect,
        points: isCorrect ? current.points : 0
      })
    }

    this.requestQuestion(username)
  }

  getState() {
    return {
      gameType: 'math-rush',
      timer: this.remainingSeconds,
      scores: { ...this.scores },
      players: this.room.players.map(player => ({ username: player.username, isOwner: player.isOwner })),
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

    const [player1, player2] = this.room.players
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

    this.io.to(this.room.roomCode).emit('game-ended', {
      roomCode: this.room.roomCode,
      gameStatus: isDraw ? 'draw' : 'won',
      winner,
      message,
      isDraw,
      scores: {
        [player1?.username]: score1,
        [player2?.username]: score2
      }
    })

    console.log('Math Rush round ended', { room: this.room.roomCode, scores: { [player1?.username]: score1, [player2?.username]: score2 } })
    if (this.onGameEnd && player1?.username && player2?.username) {
      const extraData = {
        scores: {
          [player1.username]: score1,
          [player2.username]: score2
        }
      , bestStreaks: {
           [player1.username]: this.bestStreaks[player1.username] || 0,
           [player2.username]: this.bestStreaks[player2.username] || 0
         },
        questionsAnswered: {
           [player1.username]: this.questionsAnswered[player1.username] || 0,
           [player2.username]: this.questionsAnswered[player2.username] || 0
         }
      }

      console.log('Saving result for gameType: mathRush')

      if (isDraw) {
        this.onGameEnd('mathRush', 'draw', player1.username, player2.username, extraData)
      } else {
        const loser = winner === player1.username ? player2.username : player1.username
        this.onGameEnd('mathRush', 'win', winner, loser, extraData)
      }

      console.log('Math Rush result recorded')
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
      message: '🔁 Math Rush reset and ready for a new round',
      gameStatus: 'playing'
    })
  }

  cleanup() {
    clearInterval(this.interval)
    this.interval = null
  }
}
