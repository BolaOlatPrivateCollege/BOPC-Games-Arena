import express from 'express'
import mongoose from 'mongoose'
import Question from '../models/Question.js'

const router = express.Router()

function requireAdmin(req, res, next) {
  const providedSecret = String(req.headers['x-admin-secret'] || '').trim()
  const expectedSecret = String(process.env.ADMIN_PASSWORD || '').trim()
  const hasHeader = providedSecret !== ''
  const isValid = expectedSecret !== '' && providedSecret === expectedSecret

  console.log('Question route admin header received:', hasHeader ? 'yes' : 'no')
  console.log('Expected admin password configured:', expectedSecret ? 'yes' : 'no')
  console.log('Admin secret valid:', isValid ? 'yes' : 'no')

  if (!isValid) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1'
  }
  return undefined
}

function parseCsvText(text) {
  const rows = []
  const lines = String(text || '').split(/\r?\n/)

  for (const rawLine of lines) {
    if (rawLine.trim() === '') continue

    const row = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < rawLine.length; i += 1) {
      const char = rawLine[i]

      if (inQuotes) {
        if (char === '"') {
          if (rawLine[i + 1] === '"') {
            current += '"'
            i += 1
          } else {
            inQuotes = false
          }
        } else {
          current += char
        }
      } else if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        row.push(current)
        current = ''
      } else {
        current += char
      }
    }

    row.push(current)
    rows.push(row.map((value) => String(value || '').trim()))
  }

  return rows
}

router.post('/bulk-upload', requireAdmin, async (req, res, next) => {
  try {
    const csv = String(req.body?.csv || '')
    if (!csv.trim()) {
      return res.status(400).json({ error: 'CSV content is required' })
    }

    const rows = parseCsvText(csv)
    if (!rows.length) {
      return res.status(400).json({ error: 'CSV content is empty or invalid' })
    }

    const expectedHeaders = [
      'gameType',
      'subject',
      'classLevel',
      'category',
      'difficulty',
      'questionText',
      'optionA',
      'optionB',
      'optionC',
      'optionD',
      'correctAnswer',
      'explanation'
    ]

    const headers = rows[0].map((header) => String(header || '').trim())
    const headerMismatch = headers.length !== expectedHeaders.length || expectedHeaders.some((header, idx) => header !== headers[idx])
    if (headerMismatch) {
      return res.status(400).json({ error: 'Invalid CSV headers. Expected: ' + expectedHeaders.join(',') })
    }

    const dataRows = rows.slice(1).filter((row) => row.some((cell) => String(cell || '').trim() !== ''))
    const allowedClassLevels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3', 'General']
    let savedCount = 0
    let failedCount = 0
    const errors = []

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
      const rawRow = dataRows[rowIndex]
      const rowNumber = rowIndex + 2
      const rowValues = expectedHeaders.reduce((obj, key, idx) => {
        obj[key] = String(rawRow[idx] || '').trim()
        return obj
      }, {})

      const rowErrors = []
      const { gameType, subject, classLevel, category, difficulty, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation } = rowValues
      const options = [optionA, optionB, optionC, optionD]

      if (!gameType) rowErrors.push('gameType is required')
      else if (!Question.schema.statics.allowedGameTypes.includes(gameType)) rowErrors.push(`Invalid gameType: ${gameType}`)
      if (!subject) rowErrors.push('subject is required')
      if (!classLevel) rowErrors.push('classLevel is required')
      else if (!allowedClassLevels.includes(classLevel)) rowErrors.push(`Invalid classLevel: ${classLevel}`)
      if (!category) rowErrors.push('category is required')
      else if (!Question.schema.statics.allowedCategories.includes(category)) rowErrors.push(`Invalid category: ${category}`)
      if (!difficulty) rowErrors.push('difficulty is required')
      else if (!Question.schema.statics.allowedDifficulties.includes(difficulty)) rowErrors.push(`Invalid difficulty: ${difficulty}`)
      if (!questionText) rowErrors.push('questionText is required')
      if (options.some((opt) => !opt)) rowErrors.push('All four options (optionA, optionB, optionC, optionD) are required')
      if (!correctAnswer) rowErrors.push('correctAnswer is required')
      else if (!options.includes(correctAnswer)) rowErrors.push('correctAnswer must match one of the options')

      if (rowErrors.length) {
        failedCount += 1
        errors.push({ row: rowNumber, errors: rowErrors })
        continue
      }

      try {
        const question = new Question({
          gameType,
          subject,
          classLevel,
          category,
          difficulty,
          questionText,
          options,
          correctAnswer,
          explanation: explanation || '',
          isActive: true
        })

        await question.save()
        savedCount += 1
      } catch (err) {
        failedCount += 1
        errors.push({ row: rowNumber, errors: [err.message || 'Unable to save question'] })
      }
    }

    return res.json({ totalRows: dataRows.length, savedCount, failedCount, errors })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      gameType,
      subject,
      classLevel,
      category,
      difficulty,
      questionText,
      options,
      correctAnswer,
      explanation,
      isActive
    } = req.body || {}

    if (!gameType || !Question.schema.statics.allowedGameTypes.includes(gameType)) {
      return res.status(400).json({ error: 'Valid gameType is required' })
    }
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ error: 'Subject is required' })
    }
    if (!classLevel || !String(classLevel).trim()) {
      return res.status(400).json({ error: 'Class level is required' })
    }
    if (!category || !Question.schema.statics.allowedCategories.includes(category)) {
      return res.status(400).json({ error: 'Valid category is required' })
    }
    if (!difficulty || !Question.schema.statics.allowedDifficulties.includes(difficulty)) {
      return res.status(400).json({ error: 'Valid difficulty is required' })
    }
    if (!questionText || !String(questionText).trim()) {
      return res.status(400).json({ error: 'Question text is required' })
    }
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ error: 'Exactly four options are required' })
    }
    const trimmedOptions = options.map(opt => String(opt || '').trim())
    if (trimmedOptions.some(opt => !opt)) {
      return res.status(400).json({ error: 'All four options must be non-empty strings' })
    }
    if (!correctAnswer || !trimmedOptions.includes(String(correctAnswer).trim())) {
      return res.status(400).json({ error: 'Correct answer must match one of the options' })
    }

    const question = new Question({
      gameType,
      subject: String(subject).trim(),
      classLevel: String(classLevel).trim(),
      category,
      difficulty,
      questionText: String(questionText).trim(),
      options: trimmedOptions,
      correctAnswer: String(correctAnswer).trim(),
      explanation: String(explanation || '').trim(),
      isActive: typeof isActive === 'undefined' ? true : Boolean(isActive),
      createdBy: String(req.body.createdBy || '').trim()
    })

    await question.save()
    res.json(question)
  } catch (err) {
    next(err)
  }
})

router.post('/bulk-upload', requireAdmin, async (req, res, next) => {
  try {
    console.log('Question bulk upload endpoint reached')
    res.status(501).json({ error: 'Bulk upload not implemented yet' })
  } catch (err) {
    next(err)
  }
})

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { gameType, subject, classLevel, category, difficulty, isActive } = req.query || {}
    const filter = {}

    if (gameType) filter.gameType = gameType
    if (subject) filter.subject = subject
    if (classLevel) filter.classLevel = classLevel
    if (category) filter.category = category
    if (difficulty) filter.difficulty = difficulty
    if (typeof isActive !== 'undefined') {
      const parsed = parseBoolean(isActive)
      if (typeof parsed === 'boolean') filter.isActive = parsed
    }

    const questions = await Question.find(filter).sort({ createdAt: -1 }).exec()
    res.json({ questions })
  } catch (err) {
    next(err)
  }
})

router.get('/play', async (req, res, next) => {
  try {
    const { gameType, category, difficulty, classLevel, limit } = req.query || {}
    const filter = { isActive: true }

    if (gameType) filter.gameType = gameType
    if (category) filter.category = category
    if (difficulty) filter.difficulty = difficulty
    if (classLevel) filter.classLevel = classLevel

    const maxLimit = Math.min(100, Math.max(1, Number(limit) || 20))
    const questions = await Question.find(filter)
      .select('-correctAnswer -createdBy -__v')
      .sort({ createdAt: -1 })
      .limit(maxLimit)
      .exec()

    res.json({ questions })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid question id' })
    }

    const question = await Question.findById(id).exec()
    if (!question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    const {
      gameType,
      subject,
      classLevel,
      category,
      difficulty,
      questionText,
      options,
      correctAnswer,
      explanation,
      isActive
    } = req.body || {}

    if (gameType) {
      if (!Question.schema.statics.allowedGameTypes.includes(gameType)) {
        return res.status(400).json({ error: 'Valid gameType is required' })
      }
      question.gameType = gameType
    }
    if (subject) question.subject = String(subject).trim()
    if (classLevel) question.classLevel = String(classLevel).trim()
    if (category) {
      if (!Question.schema.statics.allowedCategories.includes(category)) {
        return res.status(400).json({ error: 'Valid category is required' })
      }
      question.category = category
    }
    if (difficulty) {
      if (!Question.schema.statics.allowedDifficulties.includes(difficulty)) {
        return res.status(400).json({ error: 'Valid difficulty is required' })
      }
      question.difficulty = difficulty
    }
    if (questionText) question.questionText = String(questionText).trim()
    if (Array.isArray(options)) {
      if (options.length !== 4) {
        return res.status(400).json({ error: 'Exactly four options are required' })
      }
      const trimmedOptions = options.map(opt => String(opt || '').trim())
      if (trimmedOptions.some(opt => !opt)) {
        return res.status(400).json({ error: 'All four options must be non-empty strings' })
      }
      question.options = trimmedOptions
    }
    if (correctAnswer) {
      if (!question.options.includes(String(correctAnswer).trim())) {
        return res.status(400).json({ error: 'Correct answer must match one of the options' })
      }
      question.correctAnswer = String(correctAnswer).trim()
    }
    if (typeof explanation !== 'undefined') question.explanation = String(explanation || '').trim()
    if (typeof isActive !== 'undefined') question.isActive = Boolean(isActive)

    await question.save()
    res.json(question)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const hard = String(req.query.hard || '').toLowerCase() === 'true'

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid question id' })
    }

    if (hard) {
      const deleted = await Question.findByIdAndDelete(id).exec()
      if (!deleted) {
        return res.status(404).json({ error: 'Question not found' })
      }
      return res.json({ success: true, deleted: true })
    }

    const question = await Question.findById(id).exec()
    if (!question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    question.isActive = false
    await question.save()
    res.json(question)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/toggle', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid question id' })
    }

    const question = await Question.findById(id).exec()
    if (!question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    question.isActive = !question.isActive
    await question.save()
    res.json(question)
  } catch (err) {
    next(err)
  }
})

export default router
