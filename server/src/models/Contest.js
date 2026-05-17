import mongoose from 'mongoose'

const contestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['upcoming', 'active', 'ended'], default: 'upcoming' },
    allowedGames: { type: [String], default: ['ticTacToe', 'targetArena'] },
    prizeDescription: { type: String, default: '' }
  },
  { timestamps: true }
)

contestSchema.statics.getActiveContest = async function() {
  const now = new Date()
  // First try to find a contest explicitly marked active
  let contest = await this.findOne({ status: 'active' }).sort({ startDate: -1 }).exec()

  if (contest) return contest

  // Fallback: find a contest whose date range contains now and not ended
  contest = await this.findOne({ startDate: { $lte: now }, endDate: { $gte: now }, status: { $ne: 'ended' } }).sort({ startDate: -1 }).exec()

  return contest || null
}

const ContestModel = mongoose.model('Contest', contestSchema)

export default ContestModel
