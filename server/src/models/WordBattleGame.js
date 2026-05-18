// Simple Word Battle game server-side logic
export default class WordBattleGame {
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
    this.correctAnswers = {}

    // simple built-in question bank
    this.questions = [
      { id: 'wb-e-1', difficulty: 'easy', question: 'Which is the correct spelling?', options: ['Recieve','Receive','Receeve','Receve'], correctAnswer: 'Receive' },
      { id: 'wb-e-2', difficulty: 'easy', question: 'Pick the synonym of "happy"', options: ['Joyful','Angry','Tired','Quiet'], correctAnswer: 'Joyful' },
      { id: 'wb-e-3', difficulty: 'easy', question: 'Pick the antonym of "hot"', options: ['Warm','Cold','Boiling','Humid'], correctAnswer: 'Cold' },
      { id: 'wb-m-1', difficulty: 'medium', question: 'What does "reluctant" mean?', options: ['Eager','Unwilling','Delighted','Energetic'], correctAnswer: 'Unwilling' },
      { id: 'wb-h-1', difficulty: 'hard', question: 'What does "ubiquitous" mean?', options: ['Rare','Everywhere','Hidden','Ancient'], correctAnswer: 'Everywhere' }
    ]

    room.players.forEach(player => {
      this.scores[player.username] = 0
      this.currentStreaks[player.username] = 0
      this.bestStreaks[player.username] = 0
      this.questionsAnswered[player.username] = 0
      this.correctAnswers[player.username] = 0
    })

    if (existingState && existingState.gameType === 'word-battle') {
      this.scores = { ...this.scores, ...existingState.scores }
      this.remainingSeconds = typeof existingState.timer === 'number' ? existingState.timer : this.duration
      const elapsed = this.duration - this.remainingSeconds
      this.startTime = Date.now() - elapsed * 1000
      this.gameOver = existingState.gameOver === true
    }

    if (!this.gameOver) this.start()
  }

  pickQuestion(difficulty = 'easy') {
    const pool = this.questions.filter(q => q.difficulty === difficulty || difficulty === 'any')
    if (!pool.length) return this.questions[Math.floor(Math.random() * this.questions.length)]
    return pool[Math.floor(Math.random() * pool.length)]
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

    this.interval = setInterval(() => this.tick(), 1000)
  }

  emitGameStarted() {
    this.io.to(this.room.roomCode).emit('game-started', { gameType: 'word-battle' })
  }

  tick() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
    const next = Math.max(0, this.duration - elapsed)

    if (next !== this.remainingSeconds) {
      this.remainingSeconds = next
      this.broadcastState()
    }

    if (next <= 0) this.end()
  }

  requestQuestion(username, difficulty = 'easy') {
    if (this.gameOver) return
    const player = this.room.players.find(p => p.username === username)
    if (!player) return

    const q = this.pickQuestion(difficulty)
    this.currentQuestions[username] = { ...q, ts: Date.now() }

    if (player.socketId) {
      this.io.to(player.socketId).emit('word-question', {
        questionId: q.id,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty
      })
    }
  }

  submitAnswer(username, questionId, answer) {
    if (this.gameOver) return
    const player = this.room.players.find(p => p.username === username)
    if (!player) return
    const current = this.currentQuestions[username]
    if (!current || current.id !== questionId) {
      if (player.socketId) this.io.to(player.socketId).emit('word-answer-result', { correct: false, points: 0 })
      return
    }

    const isCorrect = answer === current.correctAnswer
    // base points
    let points = isCorrect ? 10 : -2
    // time bonus (faster -> small bonus)
    const dt = Math.max(0, Date.now() - (current.ts || Date.now()))
    if (isCorrect) {
      const bonus = Math.max(1, Math.min(5, Math.floor((5000 - dt) / 1000) + 1))
      points += bonus
    }

    if (isCorrect) {
      this.scores[username] = (this.scores[username] || 0) + points
      this.currentStreaks[username] = (this.currentStreaks[username] || 0) + 1
      this.bestStreaks[username] = Math.max(this.bestStreaks[username] || 0, this.currentStreaks[username])
      this.correctAnswers[username] = (this.correctAnswers[username] || 0) + 1
    } else {
      this.currentStreaks[username] = 0
      // avoid negative total underflow
      this.scores[username] = Math.max(0, (this.scores[username] || 0) + points)
    }

    this.questionsAnswered[username] = (this.questionsAnswered[username] || 0) + 1
    delete this.currentQuestions[username]
    this.broadcastState()

    if (player.socketId) {
      this.io.to(player.socketId).emit('word-answer-result', { correct: isCorrect, points })
    }

    // auto-request next question
    this.requestQuestion(username)
  }

  getState() {
    return {
      gameType: 'word-battle',
      timer: this.remainingSeconds,
      scores: { ...this.scores },
      players: this.room.players.map(p => ({ username: p.username, isOwner: p.isOwner })),
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
    if (this.gameOver) return
    this.gameOver = true
    clearInterval(this.interval)
    this.room.status = 'finished'

    const [p1, p2] = this.room.players
    const s1 = this.scores[p1?.username] || 0
    const s2 = this.scores[p2?.username] || 0

    let winner = null
    let isDraw = false
    if (s1 === s2) isDraw = true
    else winner = s1 > s2 ? p1?.username : p2?.username

    this.room.winner = winner
    this.room.gameState = this.getState()

    this.io.to(this.room.roomCode).emit('game-ended', {
      roomCode: this.room.roomCode,
      gameStatus: isDraw ? 'draw' : 'won',
      winner,
      isDraw,
      scores: {
        [p1?.username]: s1,
        [p2?.username]: s2
      }
    })

    if (this.onGameEnd && p1?.username && p2?.username) {
      const extraData = {
        scores: { [p1.username]: s1, [p2.username]: s2 },
        bestStreaks: { [p1.username]: this.bestStreaks[p1.username] || 0, [p2.username]: this.bestStreaks[p2.username] || 0 },
        questionsAnswered: { [p1.username]: this.questionsAnswered[p1.username] || 0, [p2.username]: this.questionsAnswered[p2.username] || 0 },
        correctAnswers: { [p1.username]: this.correctAnswers[p1.username] || 0, [p2.username]: this.correctAnswers[p2.username] || 0 }
      }

      if (isDraw) this.onGameEnd('wordBattle', 'draw', p1.username, p2.username, extraData)
      else {
        const loser = winner === p1.username ? p2.username : p1.username
        this.onGameEnd('wordBattle', 'win', winner, loser, extraData)
      }
    }
  }

  reset() {
    clearInterval(this.interval)
    this.scores = {}
    this.room.players.forEach(player => { this.scores[player.username] = 0 })
    this.gameOver = false
    this.start()
    this.io.to(this.room.roomCode).emit('game-reset', { roomCode: this.room.roomCode, message: '🔁 Word Battle reset and ready for a new round', gameStatus: 'playing' })
  }

  cleanup() {
    clearInterval(this.interval)
    this.interval = null
  }
}
