import mongoose from 'mongoose'

const inMemoryLeaderboard = new Map()

function isMongoConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1
}

function getDefaultGameStats() {
  return {
    ticTacToe: {
      wins: 0,
      losses: 0,
      draws: 0,
      totalGamesPlayed: 0,
      winRate: 0
    },
    targetArena: {
      wins: 0,
      losses: 0,
      draws: 0,
      totalGamesPlayed: 0,
      winRate: 0,
      highScore: 0,
      totalScore: 0
    },
    mathRush: {
      wins: 0,
      losses: 0,
      draws: 0,
      totalGamesPlayed: 0,
      winRate: 0,
      highScore: 0,
      totalScore: 0
    }
  }
}

function normalizeGameStats(stats = {}) {
  return {
    ticTacToe: {
      wins: Number(stats?.ticTacToe?.wins ?? 0),
      losses: Number(stats?.ticTacToe?.losses ?? 0),
      draws: Number(stats?.ticTacToe?.draws ?? 0),
      totalGamesPlayed: Number(stats?.ticTacToe?.totalGamesPlayed ?? 0),
      winRate: Number(stats?.ticTacToe?.winRate ?? 0)
    },
    targetArena: {
      wins: Number(stats?.targetArena?.wins ?? 0),
      losses: Number(stats?.targetArena?.losses ?? 0),
      draws: Number(stats?.targetArena?.draws ?? 0),
      totalGamesPlayed: Number(stats?.targetArena?.totalGamesPlayed ?? 0),
      winRate: Number(stats?.targetArena?.winRate ?? 0),
      highScore: Number(stats?.targetArena?.highScore ?? 0),
      totalScore: Number(stats?.targetArena?.totalScore ?? 0)
    },
    mathRush: {
      wins: Number(stats?.mathRush?.wins ?? 0),
      losses: Number(stats?.mathRush?.losses ?? 0),
      draws: Number(stats?.mathRush?.draws ?? 0),
      totalGamesPlayed: Number(stats?.mathRush?.totalGamesPlayed ?? 0),
      winRate: Number(stats?.mathRush?.winRate ?? 0),
      highScore: Number(stats?.mathRush?.highScore ?? 0),
      totalScore: Number(stats?.mathRush?.totalScore ?? 0)
    }
  }
}

function createInMemoryUser(data) {
  const now = new Date()
  const gameStats = normalizeGameStats(data.gameStats)

  const userData = {
    username: data.username,
    wins: Number(data.wins ?? 0),
    losses: Number(data.losses ?? 0),
    draws: Number(data.draws ?? 0),
    rating: Number(data.rating ?? 1000),
    totalGamesPlayed: Number(data.totalGamesPlayed ?? 0),
    winRate: Number(data.winRate ?? 0),
    rank: data.rank ?? null,
    lastGameDate: data.lastGameDate ?? null,
    createdAt: data.createdAt ? new Date(data.createdAt) : now,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : now,
    gameStats
  }

  const user = {
    ...userData,

    toObject() {
      return {
        username: this.username,
        wins: this.wins,
        losses: this.losses,
        draws: this.draws,
        rating: this.rating,
        totalGamesPlayed: this.totalGamesPlayed,
        winRate: this.winRate,
        rank: this.rank,
        lastGameDate: this.lastGameDate,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        gameStats: this.gameStats
      }
    },

    async save() {
      this.updatedAt = new Date()

      if (!this.createdAt) {
        this.createdAt = new Date()
      }

      inMemoryLeaderboard.set(this.username, {
        username: this.username,
        wins: this.wins,
        losses: this.losses,
        draws: this.draws,
        rating: this.rating,
        totalGamesPlayed: this.totalGamesPlayed,
        winRate: this.winRate,
        rank: this.rank,
        lastGameDate: this.lastGameDate,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        gameStats: normalizeGameStats(this.gameStats)
      })

      return this
    },

    async updateStats(result) {
      if (result === 'win') {
        this.wins += 1
      } else if (result === 'loss') {
        this.losses += 1
      } else if (result === 'draw') {
        this.draws += 1
      }

      this.rating = this.rating || 1000

      const total = this.wins + this.losses + this.draws
      this.totalGamesPlayed = total
      this.winRate = total > 0 ? Math.round((this.wins / total) * 100) : 0
      this.lastGameDate = new Date()

      await this.save()
      return this
    }
  }

  return user
}

function sortLeaderboard(users, game = 'global') {
  return users.sort((a, b) => {
    if (game === 'ticTacToe') {
      const aStats = normalizeGameStats(a.gameStats).ticTacToe
      const bStats = normalizeGameStats(b.gameStats).ticTacToe

      if (bStats.wins !== aStats.wins) {
        return bStats.wins - aStats.wins
      }

      if (bStats.winRate !== aStats.winRate) {
        return bStats.winRate - aStats.winRate
      }

      return a.username.localeCompare(b.username)
    }

    if (game === 'targetArena' || game === 'mathRush') {
      const statsKey = game === 'targetArena' ? 'targetArena' : 'mathRush'
      const aStats = normalizeGameStats(a.gameStats)[statsKey]
      const bStats = normalizeGameStats(b.gameStats)[statsKey]

      if (bStats.wins !== aStats.wins) {
        return bStats.wins - aStats.wins
      }

      if (bStats.highScore !== aStats.highScore) {
        return bStats.highScore - aStats.highScore
      }

      if (bStats.totalScore !== aStats.totalScore) {
        return bStats.totalScore - aStats.totalScore
      }

      return a.username.localeCompare(b.username)
    }

    if (b.rating !== a.rating) {
      return b.rating - a.rating
    }

    if (b.wins !== a.wins) {
      return b.wins - a.wins
    }

    return a.username.localeCompare(b.username)
  })
}

const leaderboardSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20
    },

    wins: {
      type: Number,
      default: 0,
      min: 0
    },

    losses: {
      type: Number,
      default: 0,
      min: 0
    },

    draws: {
      type: Number,
      default: 0,
      min: 0
    },

    rating: {
      type: Number,
      default: 1000,
      min: 0
    },

    totalGamesPlayed: {
      type: Number,
      default: 0,
      min: 0
    },

    winRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    rank: {
      type: Number,
      default: null
    },

    lastGameDate: {
      type: Date,
      default: null
    },

    gameStats: {
      type: Object,
      default: getDefaultGameStats
    }
  },
  { timestamps: true }
)

leaderboardSchema.index({ rating: -1 })
leaderboardSchema.index({ wins: -1 })
leaderboardSchema.index({ createdAt: -1 })

leaderboardSchema.pre('save', function(next) {
  const total =
    (this.wins || 0) +
    (this.losses || 0) +
    (this.draws || 0)

  this.totalGamesPlayed = total
  this.winRate = total > 0 ? Math.round(((this.wins || 0) / total) * 100) : 0

  if (!this.rating) {
    this.rating = 1000
  }

  this.gameStats = normalizeGameStats(this.gameStats)

  if (typeof this.markModified === 'function') {
    this.markModified('gameStats')
  }

  next()
})

const LeaderboardModel = mongoose.model('Leaderboard', leaderboardSchema)

const Leaderboard = {
  async getLeaderboard(game = 'global', limit = 100) {
    if (isMongoConnected()) {
      const users = await LeaderboardModel.find().exec()

      const normalized = users.map(user => {
        const data = user.toObject()
        data.gameStats = normalizeGameStats(data.gameStats)
        return data
      })

      const sorted = sortLeaderboard(normalized, game)

      return sorted.slice(0, limit).map(data => createInMemoryUser(data))
    }

    const normalized = Array.from(inMemoryLeaderboard.values()).map(data => ({
      ...data,
      gameStats: normalizeGameStats(data.gameStats)
    }))

    const sorted = sortLeaderboard(normalized, game)

    return sorted.slice(0, limit).map(data => createInMemoryUser(data))
  },

  async findOne(filter) {
    if (isMongoConnected()) {
      return await LeaderboardModel.findOne(filter).exec()
    }

    if (filter && filter.username) {
      const data = inMemoryLeaderboard.get(filter.username)
      return data ? createInMemoryUser(data) : null
    }

    return null
  },

  async countDocuments(filter) {
    if (isMongoConnected()) {
      return await LeaderboardModel.countDocuments(filter).exec()
    }

    const ratingFilter = filter?.rating?.$gt

    if (typeof ratingFilter === 'number') {
      return Array.from(inMemoryLeaderboard.values()).filter(
        user => user.rating > ratingFilter
      ).length
    }

    return inMemoryLeaderboard.size
  },

  async getOrCreateUser(username) {
    if (!username) {
      throw new Error('Username is required')
    }

    const cleanUsername = username.trim()

    if (isMongoConnected()) {
      let user = await LeaderboardModel.findOne({ username: cleanUsername }).exec()

      if (user) {
        console.log(`Existing player found: ${cleanUsername}`)

        user.gameStats = normalizeGameStats(user.gameStats)

        if (typeof user.markModified === 'function') {
          user.markModified('gameStats')
          await user.save()
        }

        return user
      }

      user = new LeaderboardModel({
        username: cleanUsername,
        wins: 0,
        losses: 0,
        draws: 0,
        rating: 1000,
        totalGamesPlayed: 0,
        winRate: 0,
        lastGameDate: null,
        gameStats: getDefaultGameStats()
      })

      await user.save()

      console.log(`Player registered: ${cleanUsername}`)
      return user
    }

    const existingData = inMemoryLeaderboard.get(cleanUsername)

    if (existingData) {
      console.log(`Existing player found: ${cleanUsername}`)
      return createInMemoryUser(existingData)
    }

    const user = createInMemoryUser({
      username: cleanUsername,
      wins: 0,
      losses: 0,
      draws: 0,
      rating: 1000,
      totalGamesPlayed: 0,
      winRate: 0,
      gameStats: getDefaultGameStats()
    })

    await user.save()

    console.log(`Player registered: ${cleanUsername}`)
    return user
  },

  async updateUserStats(username, result, gameType = 'global', extraData = {}) {
    if (!username) {
      throw new Error('Username is required for stats update')
    }

    const cleanUsername = username.trim()

    const validResults = ['win', 'loss', 'draw']

    if (!validResults.includes(result)) {
      throw new Error(`Invalid result type: ${result}`)
    }

    if (!['global', 'ticTacToe', 'targetArena', 'mathRush'].includes(gameType)) {
      throw new Error(`Invalid game type: ${gameType}`)
    }

    const user = await this.getOrCreateUser(cleanUsername)

    user.gameStats = normalizeGameStats(user.gameStats)

    if (result === 'win') {
      user.wins = (user.wins || 0) + 1

      if (gameType !== 'global') {
        user.gameStats[gameType].wins += 1
      }
    } else if (result === 'loss') {
      user.losses = (user.losses || 0) + 1

      if (gameType !== 'global') {
        user.gameStats[gameType].losses += 1
      }
    } else if (result === 'draw') {
      user.draws = (user.draws || 0) + 1

      if (gameType !== 'global') {
        user.gameStats[gameType].draws += 1
      }
    }

    if (gameType === 'ticTacToe') {
      const stats = user.gameStats.ticTacToe
      const totalGameCount =
        (stats.wins || 0) +
        (stats.losses || 0) +
        (stats.draws || 0)

      stats.totalGamesPlayed = totalGameCount
      stats.winRate =
        totalGameCount > 0
          ? Math.round(((stats.wins || 0) / totalGameCount) * 100)
          : 0
    }

    if (gameType === 'targetArena' || gameType === 'mathRush') {
      const stats = user.gameStats[gameType]
      const totalGameCount =
        (stats.wins || 0) +
        (stats.losses || 0) +
        (stats.draws || 0)

      stats.totalGamesPlayed = totalGameCount
      stats.winRate =
        totalGameCount > 0
          ? Math.round(((stats.wins || 0) / totalGameCount) * 100)
          : 0

      if (typeof extraData.score === 'number') {
        const score = Number(extraData.score)
        stats.totalScore = (stats.totalScore || 0) + score
        stats.highScore = Math.max(stats.highScore || 0, score)
      }
    }

    user.rating = user.rating || 1000
    user.lastGameDate = new Date()

    const total =
      (user.wins || 0) +
      (user.losses || 0) +
      (user.draws || 0)

    user.totalGamesPlayed = total
    user.winRate = total > 0 ? Math.round(((user.wins || 0) / total) * 100) : 0

    if (isMongoConnected() && typeof user.markModified === 'function') {
      user.markModified('gameStats')
    }

    await user.save()

    console.log(
      `✅ Game-specific stats updated for ${cleanUsername}: game=${gameType}, result=${result}, globalWins=${user.wins}, globalLosses=${user.losses}, globalDraws=${user.draws}, globalTotal=${user.totalGamesPlayed}, globalWinRate=${user.winRate}%, gameStats=${JSON.stringify(user.gameStats[gameType] || {})}`
    )

    return user
  }
}

export default Leaderboard