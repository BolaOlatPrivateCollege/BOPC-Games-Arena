import { useEffect, useState } from 'react'
import questions from '../data/wordBattleQuestions'

export default function WordBattleBoard({ onAnswer, difficulty = 'easy', showFeedback = true, questionData = null, onRequestNextQuestion = null }) {
  const [current, setCurrent] = useState(null)
  const [shuffledOptions, setShuffledOptions] = useState([])
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (questionData) {
      setCurrent({ ...questionData, id: questionData.questionId || questionData.id })
      setShuffledOptions(shuffle(questionData.options || []))
      setFeedback(null)
      return
    }
    nextQuestion()
  }, [difficulty, questionData])

  function pickQuestion() {
    const pool = questions.filter(q => {
      if (!difficulty) return true
      if (difficulty === 'junior') return q.difficulty === 'easy' || q.difficulty === 'medium'
      if (difficulty === 'senior') return q.difficulty === 'medium' || q.difficulty === 'hard'
      return q.difficulty === difficulty
    })

    if (!pool.length) return null
    return pool[Math.floor(Math.random() * pool.length)]
  }

  function shuffle(arr) {
    const copy = arr.slice()
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  function nextQuestion() {
    if (questionData && onRequestNextQuestion) {
      onRequestNextQuestion()
      return
    }

    const q = pickQuestion()
    if (!q) return
    setCurrent(q)
    setShuffledOptions(shuffle(q.options || []))
    setFeedback(null)
  }

  function handleAnswer(option) {
    if (!current) return
    const correct = current.correctAnswer ? option === current.correctAnswer : null
    if (showFeedback && correct !== null) {
      setFeedback(correct ? 'correct' : 'wrong')
    }
    if (onAnswer) onAnswer({ questionId: current.id, answer: option, correct, question: current })

    // show feedback briefly then next question
    setTimeout(() => nextQuestion(), 450)
  }

  if (!current) return null

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600">Difficulty: <strong className="text-slate-800">{current.difficulty || 'mixed'}</strong></div>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">{current.question}</div>
        {current.prompt && <div className="mt-2 text-sm text-slate-600">{current.prompt}</div>}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {shuffledOptions.map(opt => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              className="btn btn-outline py-4 text-left"
            >
              {opt}
            </button>
          ))}
        </div>
        {feedback && (
          <div className={`mt-4 text-sm font-semibold ${feedback === 'correct' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {feedback === 'correct' ? 'CORRECT' : 'WRONG'}
          </div>
        )}
      </div>
    </div>
  )
}
