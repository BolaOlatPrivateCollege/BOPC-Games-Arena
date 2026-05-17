import express from 'express'
import Contest from '../models/Contest.js'
import ContestScore from '../models/ContestScore.js'

const router = express.Router()

function normalizeGameFilter(game) {
  if (!game || game === 'allGames' || game === 'all' || game === 'global') {
    return 'all'
  }

  return game
}

function normalizeCategoryFilter(category) {
  if (!category) return 'all'
  const c = String(category).toLowerCase()
  if (c === 'all' || c === 'allcategories') return 'all'
  if (['junior', 'senior', 'open'].includes(c)) return c
  return 'all'
}

// Get active contest
router.get('/active', async (req, res, next) => {
  try {
    const contest = await Contest.getActiveContest()

    if (!contest) {
      console.log('No active contest found')
      return res.json({ contest: null })
    }

    console.log('Active contest found:', contest.title)

    res.json({ contest })
  } catch (err) {
    next(err)
  }
})

// Create default active contest
router.post('/', async (req, res, next) => {
  try {
    const adminSecret = req.headers['x-admin-secret']
    if (!process.env.ADMIN_PASSWORD || String(adminSecret) !== String(process.env.ADMIN_PASSWORD)) {
      console.warn('Unauthorized attempt to create contest')
      return res.status(403).json({ error: 'Admin access required' })
    }
  } catch (err) {
    // ignore
  }
  try {
    const activeContests = await Contest.find({ status: 'active' }).exec()

    if (activeContests && activeContests.length > 0) {
      for (const activeContest of activeContests) {
        activeContest.status = 'ended'
        await activeContest.save()

        console.log(
          `Weekly contest ended due to new creation: ${activeContest.title}`
        )
      }
    }

    const now = new Date()
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const contest = new Contest({
      title: 'Weekly BOPC Games Challenge',
      description:
        'Compete in Tic Tac Toe and Target Arena to climb the weekly leaderboard.',
      startDate: now,
      endDate: end,
      status: 'active',
      allowedGames: ['ticTacToe', 'targetArena'],
      prizeDescription: 'Weekly prize for the top student'
    })

    await contest.save()

    console.log('Weekly contest created:', contest.title)

    res.json({ contest })
  } catch (err) {
    next(err)
  }
})

// End active contest
router.post('/end-active', async (req, res, next) => {
  try {
    const adminSecret = req.headers['x-admin-secret']
    if (!process.env.ADMIN_PASSWORD || String(adminSecret) !== String(process.env.ADMIN_PASSWORD)) {
      console.warn('Unauthorized attempt to end active contest')
      return res.status(403).json({ error: 'Admin access required' })
    }
  } catch (err) {
    // ignore
  }
  try {
    const contest = await Contest.getActiveContest()

    if (!contest) {
      console.log('No active contest found to end')

      return res.status(404).json({
        error: 'No active contest found'
      })
    }

    contest.status = 'ended'
    await contest.save()

    console.log('Weekly contest ended:', contest.title)

    res.json({ contest })
  } catch (err) {
    next(err)
  }
})

// Get contest leaderboard
router.get('/:id/leaderboard', async (req, res, next) => {
  try {
    const { id } = req.params
    const { game, category } = req.query

    const contest = await Contest.findById(id).exec()

    if (!contest) {
      return res.status(404).json({
        error: 'Contest not found'
      })
    }

    const requestedGame = game || 'all'
    const normalizedGame = normalizeGameFilter(requestedGame)
    const normalizedCategory = normalizeCategoryFilter(category)

    console.log('Received weekly leaderboard filter:', requestedGame, 'category:', category)
    console.log('Normalized weekly leaderboard filter:', normalizedGame, 'category:', normalizedCategory)

    const entries = await ContestScore.getLeaderboard(
      contest._id,
      normalizedGame,
      200,
      normalizedCategory
    )

    console.log('Weekly contest leaderboard fetched for:', contest.title)
    console.log('Weekly contest leaderboard count:', entries.length)

    res.json({
      contest,
      leaderboard: entries
    })
  } catch (err) {
    next(err)
  }
})

// Get winners for a contest
router.get('/:id?/winners', async (req, res, next) => {
  try {
    const { id } = req.params
    let contest = null

    if (id && id !== 'latest') {
      contest = await Contest.findById(id).exec()
    } else {
      contest = await Contest.getActiveContest()

      if (!contest) {
        contest = await Contest.findOne({ status: 'ended' })
          .sort({ endDate: -1 })
          .exec()
      }
    }

    if (!contest) {
      console.log('No contest found when fetching winners')

      return res.status(404).json({
        error: 'No contest found'
      })
    }

    console.log('Contest winners fetched for:', contest.title)

    const category = normalizeCategoryFilter(req.query.category)
    console.log('Winners category filter:', category)

    const entries = await ContestScore.getLeaderboard(contest._id, 'all', 50, category)

    res.json({
      contest,
      winners: entries.slice(0, 3)
    })
  } catch (err) {
    next(err)
  }
})

export default router