import express from 'express'
import Leaderboard from '../models/Leaderboard.js'

const router = express.Router()

/**
 * GET /api/leaderboard
 * Get leaderboard rankings
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const game = req.query.game || 'global'

    const leaderboard = await Leaderboard.getLeaderboard(game, limit)

    const rankedLeaderboard = leaderboard.map((player, idx) => ({
      ...player.toObject(),
      rank: idx + 1
    }))

    if (game === 'global') {
      console.log('Global leaderboard fetched')
    } else if (game === 'ticTacToe') {
      console.log('Tic Tac Toe leaderboard fetched')
    } else if (game === 'targetArena') {
      console.log('Target Arena leaderboard fetched')
    }

    res.json({
      success: true,
      leaderboard: rankedLeaderboard
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ message: 'Failed to fetch leaderboard' })
  }
})

/**
 * GET /api/leaderboard/user/:username
 * Get specific user stats
 */
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params

    const user = await Leaderboard.findOne({ username })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get rank
    const usersAhead = await Leaderboard.countDocuments({ rating: { $gt: user.rating } })
    const rank = usersAhead + 1

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        rank
      }
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    res.status(500).json({ message: 'Failed to fetch user stats' })
  }
})

/**
 * POST /api/leaderboard/record-game
 * Record game result and update stats
 */
router.post('/record-game', async (req, res) => {
  try {
    const { game, resultType, winner, loser, drawPlayers, extraData } = req.body

    if (drawPlayers && drawPlayers.length === 2) {
      await Leaderboard.updateUserStats(drawPlayers[0], 'draw', game || 'global', extraData)
      await Leaderboard.updateUserStats(drawPlayers[1], 'draw', game || 'global', extraData)
      console.log(`📊 Saved match result via API: ${drawPlayers[0]} and ${drawPlayers[1]} (both draw updated) for game=${game || 'global'}`)
    } else if (winner && loser && resultType) {
      await Leaderboard.updateUserStats(winner, resultType, game || 'global', extraData)
      await Leaderboard.updateUserStats(loser, resultType === 'win' ? 'loss' : resultType, game || 'global', extraData)
      console.log(`📊 Saved match result via API: ${winner} vs ${loser} for game=${game || 'global'} result=${resultType}`)
    }

    res.json({
      success: true,
      message: 'Game recorded successfully'
    })
  } catch (error) {
    console.error('❌ Error recording game:', error)
    res.status(500).json({ message: 'Failed to record game' })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { username } = req.body

    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      })
    }

    const trimmedUsername = username.trim()

    if (!trimmedUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      })
    }

    const user = await Leaderboard.getOrCreateUser(trimmedUsername)

    res.json({
      success: true,
      user: user.toObject()
    })
  } catch (error) {
    console.error('Error registering player:', error)
    res.status(500).json({ message: 'Failed to register player' })
  }
})

export default router
