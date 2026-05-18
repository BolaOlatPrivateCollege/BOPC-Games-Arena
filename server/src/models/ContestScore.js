import mongoose from 'mongoose'

const contestScoreSchema = new mongoose.Schema(
  {
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contest',
      required: true,
      index: true
    },

    username: {
      type: String,
      required: true,
      index: true
    },

    gameType: {
      type: String,
      enum: ['ticTacToe', 'targetArena', 'mathRush'],
      required: true,
      index: true
    },

    wins: {
      type: Number,
      default: 0
    },

    losses: {
      type: Number,
      default: 0
    },

    draws: {
      type: Number,
      default: 0
    },

    points: {
      type: Number,
      default: 0
    },

    totalScore: {
      type: Number,
      default: 0
    },

    highScore: {
      type: Number,
      default: 0
    },

    gamesPlayed: {
      type: Number,
      default: 0
    },

    winRate: {
      type: Number,
      default: 0
    },

    lastPlayedAt: {
      type: Date,
      default: null
    },

    attempts: {
      type: Number,
      default: 0
    }
    ,
    category: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
)

// Update or create score entry for a contest result
contestScoreSchema.statics.updateForResult = async function (
  contest,
  username,
  gameType,
  result,
  extraData = {}
) {
  if (!contest || !username || !gameType) {
    return null
  }

  const validGames = ['ticTacToe', 'targetArena', 'mathRush']
  const validResults = ['win', 'loss', 'draw']

  if (!validGames.includes(gameType)) {
    throw new Error(`Invalid contest game type: ${gameType}`)
  }

  if (!validResults.includes(result)) {
    throw new Error(`Invalid contest result type: ${result}`)
  }

  const cleanUsername = username.trim()

  const filter = {
    contestId: contest._id,
    username: cleanUsername,
    gameType
  }

  let entry = await this.findOne(filter).exec()

  if (!entry) {
    entry = new this({
      contestId: contest._id,
      username: cleanUsername,
      gameType,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
      totalScore: 0,
      highScore: 0,
      gamesPlayed: 0,
      winRate: 0,
      attempts: 0
    })
  }

  if (result === 'win') {
    entry.wins = (entry.wins || 0) + 1
    entry.points = (entry.points || 0) + 3
  } else if (result === 'loss') {
    entry.losses = (entry.losses || 0) + 1
  } else if (result === 'draw') {
    entry.draws = (entry.draws || 0) + 1
    entry.points = (entry.points || 0) + 1
  }

  if ((gameType === 'targetArena' || gameType === 'mathRush') && typeof extraData.score === 'number') {
    const score = Number(extraData.score)

    entry.totalScore = (entry.totalScore || 0) + score
    entry.highScore = Math.max(entry.highScore || 0, score)
  }

  entry.gamesPlayed =
    (entry.wins || 0) +
    (entry.losses || 0) +
    (entry.draws || 0)

  entry.winRate =
    entry.gamesPlayed > 0
      ? Math.round(((entry.wins || 0) / entry.gamesPlayed) * 100)
      : 0

  entry.lastPlayedAt = new Date()
  entry.attempts = (entry.attempts || 0) + 1

  // Attach category from user profile when available (for future filtering)
  try {
    const User = (await import('./User.js')).default
    const profile = await User.findOne({ username: cleanUsername }).lean().exec()
    if (profile && profile.category) {
      entry.category = profile.category
    }
  } catch (e) {
    // ignore if user model not available or DB not connected
  }

  await entry.save()

  console.log(
    `Weekly contest score updated: ${cleanUsername}, game=${gameType}, result=${result}, points=${entry.points}, wins=${entry.wins}, losses=${entry.losses}, draws=${entry.draws}`
  )

  return entry
}

contestScoreSchema.statics.getLeaderboard = async function (
  contestId,
  gameFilter = 'all',
  limit = 100,
  categoryFilter = 'allCategories'
) {
  const normalizedFilter =
    !gameFilter ||
    gameFilter === 'all' ||
    gameFilter === 'allGames' ||
    gameFilter === 'global'
      ? 'all'
      : gameFilter

  const normalizedCategory =
    !categoryFilter ||
    categoryFilter === 'all' ||
    categoryFilter === 'allCategories'
      ? 'all'
      : String(categoryFilter).toLowerCase()

  console.log('Received leaderboard filters:', { contestId, game: normalizedFilter, category: normalizedCategory })

  if (normalizedFilter === 'all') {
    const entries = await this.find({ contestId }).lean().exec()

    console.log('Contest score records found:', entries.length, 'for contest:', contestId)

    // Treat missing category as 'open' so old users do not crash
    const filteredEntries = normalizedCategory === 'all'
      ? entries
      : entries.filter(e => {
        const cat = e.category || 'open'
        return String(cat).toLowerCase() === normalizedCategory
      })

    if (normalizedCategory !== 'all') {
      console.log('Contest score records after category filter:', filteredEntries.length, 'category:', normalizedCategory)
    }

    const grouped = new Map()

    for (const entry of filteredEntries) {
      const username = entry.username

      if (!grouped.has(username)) {
        grouped.set(username, {
          username,
          points: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          gamesPlayed: 0,
          winRate: 0,
          highScore: 0,
          totalScore: 0,
          attempts: 0,
          lastPlayedAt: entry.lastPlayedAt || null
        })
      }

      const row = grouped.get(username)

      row.points += Number(entry.points || 0)
      row.wins += Number(entry.wins || 0)
      row.losses += Number(entry.losses || 0)
      row.draws += Number(entry.draws || 0)
      row.gamesPlayed += Number(entry.gamesPlayed || 0)
      row.totalScore += Number(entry.totalScore || 0)
      row.highScore = Math.max(row.highScore || 0, Number(entry.highScore || 0))
      row.attempts += Number(entry.attempts || 0)

      if (
        entry.lastPlayedAt &&
        (!row.lastPlayedAt || new Date(entry.lastPlayedAt) > new Date(row.lastPlayedAt))
      ) {
        row.lastPlayedAt = entry.lastPlayedAt
      }
    }

    const leaderboard = Array.from(grouped.values()).map(row => ({
      ...row,
      winRate:
        row.gamesPlayed > 0
          ? Math.round((row.wins / row.gamesPlayed) * 100)
          : 0
    }))

    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.highScore !== a.highScore) return b.highScore - a.highScore
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
      return a.username.localeCompare(b.username)
    })

    console.log('Weekly contest All Games leaderboard aggregated')
    console.log('Aggregated All Games leaderboard count:', leaderboard.length)

    return leaderboard.slice(0, limit)
  }

  // Game-specific
  const query = { contestId, gameType: normalizedFilter }
  const entries = await this.find(query)
    .sort({
      points: -1,
      wins: -1,
      highScore: -1,
      totalScore: -1,
      username: 1
    })
    .limit(limit)
    .lean()
    .exec()

  console.log('Weekly contest game-specific leaderboard fetched:', normalizedFilter, 'for contest:', contestId)

  const filtered = normalizedCategory === 'all'
    ? entries
    : entries.filter(e => (e.category || 'open').toLowerCase() === normalizedCategory)

  console.log('Game-specific leaderboard count after category filter:', filtered.length)

  return filtered
}

const ContestScoreModel = mongoose.model('ContestScore', contestScoreSchema)

export default ContestScoreModel