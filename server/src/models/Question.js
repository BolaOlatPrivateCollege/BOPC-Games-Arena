import mongoose from 'mongoose'

const allowedGameTypes = ['mathRush', 'wordBattle', 'scienceQuest', 'codeBreaker', 'general']
const allowedCategories = ['junior', 'senior', 'open']
const allowedDifficulties = ['easy', 'medium', 'hard']

const questionSchema = new mongoose.Schema(
  {
    gameType: {
      type: String,
      enum: allowedGameTypes,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    classLevel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    category: {
      type: String,
      enum: allowedCategories,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: allowedDifficulties,
      required: true,
      trim: true
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    options: {
      type: [String],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 4 && value.every(opt => typeof opt === 'string' && opt.trim().length > 0)
        },
        message: 'Options must be an array of 4 non-empty strings.'
      },
      required: true
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator(value) {
          return Array.isArray(this.options) && this.options.includes(value)
        },
        message: 'Correct answer must match one of the provided options.'
      }
    },
    explanation: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
)

questionSchema.statics.allowedGameTypes = allowedGameTypes
questionSchema.statics.allowedCategories = allowedCategories
questionSchema.statics.allowedDifficulties = allowedDifficulties

const QuestionModel = mongoose.model('Question', questionSchema)

export default QuestionModel
