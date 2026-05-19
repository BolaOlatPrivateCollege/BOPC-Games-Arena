import { useState, useEffect } from 'react'
import Header from '../components/Header'

/**
 * Admin Dashboard Component
 * Temporary admin protection for contest management.
 */
export default function AdminDashboard({ username, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [message, setMessage] = useState(null)
  const [selectedLeaderboard, setSelectedLeaderboard] = useState('global')
const [adminLeaderboard, setAdminLeaderboard] = useState([])
  const [adminLeaderboardLoading, setAdminLeaderboardLoading] = useState(false)
  const [adminLeaderboardError, setAdminLeaderboardError] = useState(null)
  const [questions, setQuestions] = useState([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionsError, setQuestionsError] = useState(null)
  const [questionFilters, setQuestionFilters] = useState({
    gameType: '',
    subject: '',
    classLevel: '',
    category: '',
    difficulty: '',
    isActive: ''
  })
  const [questionForm, setQuestionForm] = useState({
    gameType: '',
    subject: '',
    classLevel: '',
    category: '',
    difficulty: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: '',
    explanation: '',
    isActive: true
  })
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [questionSaveLoading, setQuestionSaveLoading] = useState(false)
  const [questionFormError, setQuestionFormError] = useState(null)
  const [bulkCsvFile, setBulkCsvFile] = useState(null)
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false)
  const [bulkUploadResult, setBulkUploadResult] = useState(null)
  const [bulkUploadError, setBulkUploadError] = useState(null)

  useEffect(() => {
    const logged = sessionStorage.getItem('bopcAdminLoggedIn') === 'true'
    setAdminLoggedIn(logged)
  }, [])

  const adminLogin = async (e) => {
    e.preventDefault()
    setMessage(null)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

      const res = await fetch(`${apiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUser, password: adminPass })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setMessage({
          type: 'error',
          text: body.message || 'Invalid admin credentials'
        })
        return
      }

      const data = await res.json()

      if (data.success) {
        sessionStorage.setItem('bopcAdminLoggedIn', 'true')
        sessionStorage.setItem('bopcAdminSecret', adminPass)
        setAdminLoggedIn(true)
        setMessage({ type: 'success', text: 'Admin login successful' })
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Invalid admin credentials'
        })
      }
    } catch (err) {
      console.error('Admin login error', err)
      setMessage({ type: 'error', text: 'Admin login failed' })
    }
  }

  const adminLogout = () => {
    sessionStorage.removeItem('bopcAdminLoggedIn')
    sessionStorage.removeItem('bopcAdminSecret')
    setAdminLoggedIn(false)
    setMessage({ type: 'info', text: 'Admin logged out' })
  }

  const adminFetch = async (path, opts = {}) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const secret = sessionStorage.getItem('bopcAdminSecret')

    if (!secret) {
      setMessage({ type: 'error', text: 'Please login as admin again.' })
      throw new Error('Admin secret missing')
    }

    const headers = {
      ...(opts.headers || {}),
      'x-admin-secret': secret
    }

    if (opts.body instanceof FormData) {
      delete headers['Content-Type']
    }

    return fetch(`${apiUrl}${path}`, {
      ...opts,
      headers
    })
  }

  const handleCreateContest = async () => {
    setMessage(null)

    try {
      const res = await adminFetch('/api/contests', {
        method: 'POST'
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setMessage({
          type: 'error',
          text: body.error || 'Failed to create contest'
        })
        return
      }

      await res.json()

      setMessage({
        type: 'success',
        text: 'Contest created successfully'
      })
    } catch (err) {
      console.error('Create contest error', err)
      setMessage({
        type: 'error',
        text: 'Failed to create contest'
      })
    }
  }

  const resetQuestionForm = () => {
    setEditingQuestionId(null)
    setQuestionForm({
      gameType: '',
      subject: '',
      classLevel: '',
      category: '',
      difficulty: '',
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: '',
      explanation: '',
      isActive: true
    })
    setQuestionFormError(null)
  }

  const quoteCsvCell = (value) => {
    const text = String(value || '')
    if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
      return `"${text.replace(/"/g, '""')}"`
    }
    return text
  }

  const downloadCsvTemplate = () => {
    const headers = [
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

    const rows = [
      [
        'mathRush',
        'Mathematics',
        'JSS1',
        'junior',
        'easy',
        'What is 2 + 2?',
        '3',
        '4',
        '5',
        '6',
        '4',
        'Simple addition question.'
      ],
      [
        'wordBattle',
        'English',
        'SS1',
        'senior',
        'medium',
        'Choose the correct synonym for rapid.',
        'fast',
        'slow',
        'quiet',
        'angry',
        'fast',
        'Common synonym question.'
      ]
    ]

    const csvContent = [headers.join(','), ...rows.map((row) => row.map(quoteCsvCell).join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'question-bank-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleBulkFileChange = (event) => {
    setBulkCsvFile(event.target.files?.[0] || null)
    setBulkUploadResult(null)
    setBulkUploadError(null)
  }

  const handleBulkUpload = async () => {
    if (!bulkCsvFile) {
      setBulkUploadError('Please choose a CSV file to upload.')
      return
    }

    setBulkUploadLoading(true)
    setBulkUploadError(null)
    setBulkUploadResult(null)

    try {
      const csvText = await bulkCsvFile.text()
      const res = await adminFetch('/api/questions/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Bulk upload failed')
      }

      const result = await res.json()
      setBulkUploadResult(result)
      setMessage({ type: 'success', text: `Bulk upload complete: ${result.savedCount} saved, ${result.failedCount} failed.` })
      if (result.savedCount > 0) {
        await fetchQuestions()
      }
    } catch (err) {
      console.error('Bulk upload error', err)
      setBulkUploadError(err.message || 'Bulk upload failed')
    } finally {
      setBulkUploadLoading(false)
    }
  }

  const buildQuestionQuery = () => {
    const query = new URLSearchParams()
    Object.entries(questionFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        query.set(key, value)
      }
    })
    return query.toString() ? `?${query.toString()}` : ''
  }

  const fetchQuestions = async () => {
    setQuestionsLoading(true)
    setQuestionsError(null)

    try {
      const res = await adminFetch(`/api/questions${buildQuestionQuery()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Unable to load questions')
      }
      const data = await res.json()
      setQuestions(Array.isArray(data.questions) ? data.questions : [])
    } catch (err) {
      console.error('fetchQuestions', err)
      setQuestionsError(err.message || 'Failed to load questions')
      setQuestions([])
    } finally {
      setQuestionsLoading(false)
    }
  }

  const setQuestionField = (field, value) => {
    setQuestionForm(prev => ({ ...prev, [field]: value }))
  }

  const handleEditQuestion = (question) => {
    setEditingQuestionId(question._id)
    setQuestionForm({
      gameType: question.gameType || '',
      subject: question.subject || '',
      classLevel: question.classLevel || '',
      category: question.category || '',
      difficulty: question.difficulty || '',
      questionText: question.questionText || '',
      optionA: question.options?.[0] || '',
      optionB: question.options?.[1] || '',
      optionC: question.options?.[2] || '',
      optionD: question.options?.[3] || '',
      correctAnswer: question.correctAnswer || '',
      explanation: question.explanation || '',
      isActive: question.isActive !== false
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleQuestionFormSubmit = async (event) => {
    event.preventDefault()
    setQuestionSaveLoading(true)
    setQuestionFormError(null)
    setMessage(null)

    const {
      gameType,
      subject,
      classLevel,
      category,
      difficulty,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      isActive
    } = questionForm

    if (!gameType) {
      setQuestionFormError('Game type is required.')
      setQuestionSaveLoading(false)
      return
    }
    if (!subject.trim()) {
      setQuestionFormError('Subject is required.')
      setQuestionSaveLoading(false)
      return
    }
    if (!classLevel.trim()) {
      setQuestionFormError('Class level is required.')
      setQuestionSaveLoading(false)
      return
    }
    if (!category) {
      setQuestionFormError('Category is required.')
      setQuestionSaveLoading(false)
      return
    }
    if (!difficulty) {
      setQuestionFormError('Difficulty is required.')
      setQuestionSaveLoading(false)
      return
    }
    if (!questionText.trim()) {
      setQuestionFormError('Question text is required.')
      setQuestionSaveLoading(false)
      return
    }
    const options = [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()]
    if (options.some(opt => !opt)) {
      setQuestionFormError('All four options are required.')
      setQuestionSaveLoading(false)
      return
    }
    if (!correctAnswer || !options.includes(correctAnswer.trim())) {
      setQuestionFormError('Correct answer must match one of the options.')
      setQuestionSaveLoading(false)
      return
    }

    const payload = {
      gameType,
      subject: subject.trim(),
      classLevel: classLevel.trim(),
      category,
      difficulty,
      questionText: questionText.trim(),
      options,
      correctAnswer: correctAnswer.trim(),
      explanation: explanation.trim(),
      isActive
    }

    try {
      const url = editingQuestionId ? `/api/questions/${editingQuestionId}` : '/api/questions'
      const method = editingQuestionId ? 'PUT' : 'POST'
      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Unable to save question')
      }
      await res.json()
      resetQuestionForm()
      await fetchQuestions()
      setMessage({ type: 'success', text: `Question ${editingQuestionId ? 'updated' : 'created'} successfully.` })
    } catch (err) {
      console.error('saveQuestion', err)
      setQuestionFormError(err.message || 'Failed to save question')
    } finally {
      setQuestionSaveLoading(false)
    }
  }

  const handleQuestionDelete = async (questionId) => {
    if (!window.confirm('Deactivate this question?')) return
    try {
      const res = await adminFetch(`/api/questions/${questionId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Unable to deactivate question')
      }
      await res.json()
      await fetchQuestions()
      setMessage({ type: 'success', text: 'Question deactivated successfully.' })
    } catch (err) {
      console.error('deleteQuestion', err)
      setMessage({ type: 'error', text: err.message || 'Failed to deactivate question' })
    }
  }

  const handleQuestionToggle = async (questionId) => {
    try {
      const res = await adminFetch(`/api/questions/${questionId}/toggle`, {
        method: 'PATCH'
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Unable to toggle question')
      }
      await res.json()
      await fetchQuestions()
      setMessage({ type: 'success', text: 'Question status updated successfully.' })
    } catch (err) {
      console.error('toggleQuestion', err)
      setMessage({ type: 'error', text: err.message || 'Failed to update question status' })
    }
  }

  const handleQuestionFilterChange = (field, value) => {
    setQuestionFilters(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (activeTab === 'questionBank' && adminLoggedIn) {
      fetchQuestions()
    }
  }, [activeTab, adminLoggedIn])

  const handleClearQuestionFilters = () => {
    setQuestionFilters({
      gameType: '',
      subject: '',
      classLevel: '',
      category: '',
      difficulty: '',
      isActive: ''
    })
  }

  const getStatusBadge = (isActiveFlag) => (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isActiveFlag ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
      {isActiveFlag ? 'Active' : 'Inactive'}
    </span>
  )

  const questionCategories = ['junior', 'senior', 'open']
  const questionDifficulties = ['easy', 'medium', 'hard']
  const questionGameTypes = ['mathRush', 'wordBattle', 'scienceQuest', 'codeBreaker', 'general']

  const handleEndContest = async () => {
    setMessage(null)

    try {
      const res = await adminFetch('/api/contests/end-active', {
        method: 'POST'
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setMessage({
          type: 'error',
          text: body.error || 'Failed to end contest'
        })
        return
      }

      await res.json()

      setMessage({
        type: 'success',
        text: 'Contest ended successfully'
      })
    } catch (err) {
      console.error('End contest error', err)
      setMessage({
        type: 'error',
        text: 'Failed to end contest'
      })
    }
  }

  // Admin state for leaderboards and contest/winners
  const [contest, setContest] = useState(null)
  const [globalLeaderboard, setGlobalLeaderboard] = useState([])
  const [ticLeaderboard, setTicLeaderboard] = useState([])
  const [targetLeaderboard, setTargetLeaderboard] = useState([])
  const [mathLeaderboard, setMathLeaderboard] = useState([])
  const [weeklyAllLb, setWeeklyAllLb] = useState([])
  const [weeklyTicLb, setWeeklyTicLb] = useState([])
  const [weeklyTargetLb, setWeeklyTargetLb] = useState([])
  const [weeklyMathLb, setWeeklyMathLb] = useState([])
  const [winners, setWinners] = useState([])
  const [lbLoading, setLbLoading] = useState(false)
  const [lbError, setLbError] = useState(null)

  const fetchActiveContest = async () => {
    try {
      const res = await adminFetch('/api/contests/active')
      if (!res.ok) return
      const data = await res.json().catch(() => ({}))
      const c = data.contest || data.active || data
      setContest(c || null)
      return c
    } catch (err) {
      console.error('fetchActiveContest', err)
    }
  }

  const fetchAllLeaderboards = async () => {
    try {
      setLbError(null)
      setLbLoading(true)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const [gRes, tRes, taRes, mRes] = await Promise.all([
        fetch(`${apiUrl}/api/leaderboard`),
        fetch(`${apiUrl}/api/leaderboard?game=ticTacToe`),
        fetch(`${apiUrl}/api/leaderboard?game=targetArena`),
        fetch(`${apiUrl}/api/leaderboard?game=mathRush`)
      ])

      if (!gRes.ok || !tRes.ok || !taRes.ok) {
        setLbError('Unable to load leaderboard')
      }

      const gJson = gRes.ok ? await gRes.json().catch(() => []) : []
      const tJson = tRes.ok ? await tRes.json().catch(() => []) : []
      const taJson = taRes.ok ? await taRes.json().catch(() => []) : []
      const mJson = mRes.ok ? await mRes.json().catch(() => []) : []

      setGlobalLeaderboard(Array.isArray(gJson) ? gJson : (gJson.leaderboard || []))
      setTicLeaderboard(Array.isArray(tJson) ? tJson : (tJson.leaderboard || []))
      setTargetLeaderboard(Array.isArray(taJson) ? taJson : (taJson.leaderboard || []))
      setMathLeaderboard(Array.isArray(mJson) ? mJson : (mJson.leaderboard || []))
    } catch (err) {
      console.error('fetchAllLeaderboards', err)
      setLbError('Unable to load leaderboard')
    } finally {
      setLbLoading(false)
    }
  }

  const fetchWeeklyLeaderboards = async (contestId) => {
    if (!contestId) return
    try {
      setLbError(null)
      setLbLoading(true)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      // prefer `game=all` alias for all-games
      const [allRes, tRes, taRes, mRes] = await Promise.all([
        fetch(`${apiUrl}/api/contests/${contestId}/leaderboard?game=all`),
        fetch(`${apiUrl}/api/contests/${contestId}/leaderboard?game=ticTacToe`),
        fetch(`${apiUrl}/api/contests/${contestId}/leaderboard?game=targetArena`),
        fetch(`${apiUrl}/api/contests/${contestId}/leaderboard?game=mathRush`)
      ])

      if (!allRes.ok || !tRes.ok || !taRes.ok) {
        setLbError('Unable to load leaderboard')
      }

      const allJson = allRes.ok ? await allRes.json().catch(() => []) : []
      const tJson = tRes.ok ? await tRes.json().catch(() => []) : []
      const taJson = taRes.ok ? await taRes.json().catch(() => []) : []
      const mJson = mRes.ok ? await mRes.json().catch(() => []) : []

      setWeeklyAllLb(Array.isArray(allJson) ? allJson : (allJson.leaderboard || []))
      setWeeklyTicLb(Array.isArray(tJson) ? tJson : (tJson.leaderboard || []))
      setWeeklyTargetLb(Array.isArray(taJson) ? taJson : (taJson.leaderboard || []))
      setWeeklyMathLb(Array.isArray(mJson) ? mJson : (mJson.leaderboard || []))
    } catch (err) {
      console.error('fetchWeeklyLeaderboards', err)
      setLbError('Unable to load leaderboard')
    } finally {
      setLbLoading(false)
    }
  }

  const fetchWinnersAdmin = async () => {
    try {
      const res = await adminFetch('/api/contests/latest/winners')
      if (!res.ok) return setWinners([])
      const data = await res.json().catch(() => [])
      setWinners(data.winners || data || [])
    } catch (err) {
      console.error('fetchWinnersAdmin', err)
    }
  }

  useEffect(() => {
    // initial admin data load
    ;(async () => {
      await fetchAllLeaderboards()
      const c = await fetchActiveContest()
      if (c && c._id) await fetchWeeklyLeaderboards(c._id)
      else await fetchWinnersAdmin()
    })()
  }, [])

  useEffect(() => {
    if (activeTab !== 'leaderboards') return

    if (selectedLeaderboard.startsWith('weekly')) {
      ;(async () => {
        const c = contest || (await fetchActiveContest())
        if (c && c._id) {
          await fetchWeeklyLeaderboards(c._id)
        } else {
          setLbError('Unable to load leaderboard')
        }
      })()
    } else {
      // normal leaderboards
      if (selectedLeaderboard === 'global' && (globalLeaderboard || []).length === 0) fetchAllLeaderboards()
      if (selectedLeaderboard === 'ticTacToe' && (ticLeaderboard || []).length === 0) fetchAllLeaderboards()
      if (selectedLeaderboard === 'targetArena' && (targetLeaderboard || []).length === 0) fetchAllLeaderboards()
    }
  }, [selectedLeaderboard, activeTab])


  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'contest', label: 'Contest', icon: '🏆' },
    { id: 'leaderboards', label: 'Leaderboards', icon: '📈' },
    { id: 'winners', label: 'Winners', icon: '🏅' },
    { id: 'questionBank', label: 'Question Bank', icon: '🧠' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header username={username} onLogout={onLogout} />

      <div className="container-custom py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ⚙️ Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Manage BOPC Games Arena
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {!adminLoggedIn ? (
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Admin Login</h2>

            <form onSubmit={adminLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Admin Username
                </label>
                <input
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="input w-full"
                  placeholder="Enter admin username"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="input w-full"
                  placeholder="Enter admin password"
                />
              </div>

              <button type="submit" className="btn btn-primary w-full">
                Login
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Admin Control Room
                </h2>

                <button onClick={adminLogout} className="btn btn-secondary">
                  Logout Admin
                </button>
              </div>

              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Dashboard Overview</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-lg">
                      <p className="text-4xl font-bold mb-2">{contest ? 'Active' : 'None'}</p>
                      <p className="text-sm opacity-90">Active Contest</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-lg">
                      <p className="text-4xl font-bold mb-2">{weeklyAllLb.length || 0}</p>
                      <p className="text-sm opacity-90">Total Contest Players</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-6 rounded-lg">
                      <p className="text-4xl font-bold mb-2">{globalLeaderboard.length || 0}</p>
                      <p className="text-sm opacity-90">Global Leaderboard Count</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-400 to-pink-600 text-white p-6 rounded-lg">
                      <p className="text-4xl font-bold mb-2">{globalLeaderboard[0]?.username || 'N/A'}</p>
                      <p className="text-sm opacity-90">Current Top Player</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={handleCreateContest} className="px-4 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Create Weekly Contest</button>
                    <button onClick={handleEndContest} className="px-4 py-4 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600">End Active Contest</button>
                    <button onClick={() => { fetchWinnersAdmin(); setActiveTab('winners') }} className="px-4 py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">View Winners</button>
                  </div>
                </div>
              )}

              {activeTab === 'contest' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Active Contest</h3>
                  {contest ? (
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg border p-4">
                        <h4 className="font-bold text-lg">{contest.title}</h4>
                        <p className="text-sm text-gray-600">{contest.description}</p>
                        <div className="mt-3 text-sm text-gray-500">Start: {new Date(contest.startDate).toLocaleString()}</div>
                        <div className="text-sm text-gray-500">End: {new Date(contest.endDate).toLocaleString()}</div>
                        <div className="mt-2 text-sm">Allowed games: {contest.allowedGames?.join(', ')}</div>
                        <div className="mt-2 text-sm font-semibold">Prize: {contest.prizeDescription || 'TBD'}</div>
                      </div>

                      <div className="flex gap-3">
                        <button onClick={handleCreateContest} className="px-4 py-2 bg-green-600 text-white rounded">Create Contest</button>
                        <button onClick={handleEndContest} className="px-4 py-2 bg-yellow-500 text-white rounded">End Contest</button>
                        <button onClick={() => { fetchActiveContest(); if (contest && contest._id) fetchWeeklyLeaderboards(contest._id) }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded">Refresh Contest</button>
                        <button onClick={() => { fetchWinnersAdmin(); setActiveTab('winners') }} className="px-4 py-2 bg-indigo-600 text-white rounded">View Winners</button>
                      </div>
                    </div>
                  ) : (
                    <div>No active contest.</div>
                  )}
                </div>
              )}

              {activeTab === 'leaderboards' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Leaderboards</h3>

                  <div className="flex gap-2 flex-wrap mb-4">
                    {['global','ticTacToe','targetArena','mathRush','weeklyAll','weeklyTic','weeklyTarget','weeklyMath'].map(key => (
                      <button key={key} onClick={() => setSelectedLeaderboard(key)} className={`px-4 py-2 rounded ${selectedLeaderboard===key ? 'bg-indigo-600 text-white' : 'bg-white ring-1 ring-gray-200'}`}>
                        {key === 'global' ? 'Global' : key === 'ticTacToe' ? 'Tic Tac Toe' : key === 'targetArena' ? 'Target Arena' : key === 'mathRush' ? 'Math Rush' : key === 'weeklyAll' ? 'Weekly All Games' : key === 'weeklyTic' ? 'Weekly Tic Tac Toe' : key === 'weeklyTarget' ? 'Weekly Target Arena' : 'Weekly Math Rush'}
                      </button>
                    ))}
                  </div>

                  {lbLoading ? (
                    <div className="p-8 text-center text-gray-600">Loading leaderboard...</div>
                  ) : lbError ? (
                    <div className="p-8 text-center text-red-600">Unable to load leaderboard</div>
                  ) : (
                    <div className="overflow-x-auto bg-white rounded-lg p-4">
                      {(() => {
                        const rows = selectedLeaderboard === 'global'
                          ? (globalLeaderboard || [])
                          : selectedLeaderboard === 'ticTacToe'
                          ? (ticLeaderboard || [])
                          : selectedLeaderboard === 'targetArena'
                          ? (targetLeaderboard || [])
                          : selectedLeaderboard === 'mathRush'
                          ? (mathLeaderboard || [])
                          : selectedLeaderboard === 'weeklyAll'
                          ? (weeklyAllLb || [])
                          : selectedLeaderboard === 'weeklyTic'
                          ? (weeklyTicLb || [])
                          : selectedLeaderboard === 'weeklyTarget'
                          ? (weeklyTargetLb || [])
                          : (weeklyMathLb || [])

                        return (
                          <table className="w-full min-w-[720px] text-sm">
                            <thead className="bg-gray-100 border-b">
                              <tr>
                                <th className="px-4 py-2 text-left">Rank</th>
                                <th className="px-4 py-2 text-left">Player</th>
                                {((selectedLeaderboard === 'ticTacToe') || (selectedLeaderboard === 'weeklyTic')) && (
                                  <th className="px-4 py-2 text-center">Points</th>
                                )}
                                <th className="px-4 py-2 text-center">Wins</th>
                                <th className="px-4 py-2 text-center">Losses</th>
                                <th className="px-4 py-2 text-center">Draws</th>
                                <th className="px-4 py-2 text-center">Win Rate</th>
                                {(selectedLeaderboard === 'targetArena' || selectedLeaderboard === 'weeklyTarget') && (
                                  <>
                                    <th className="px-4 py-2 text-center">High Score</th>
                                    <th className="px-4 py-2 text-center">Total Score</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {(rows || []).map((p, idx) => {
                                const wins = p?.wins ?? 0
                                const losses = p?.losses ?? 0
                                const draws = p?.draws ?? 0
                                const winRate = p?.winRate ?? 0
                                const points = p?.points ?? null
                                const highScore = p?.highScore ?? p?.gameStats?.targetArena?.highScore ?? null
                                const totalScore = p?.totalScore ?? p?.gameStats?.targetArena?.totalScore ?? null

                                return (
                                  <tr key={idx} className={`border-b ${p?.username === username ? 'bg-indigo-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <td className="px-4 py-2">#{idx+1}</td>
                                    <td className="px-4 py-2 font-semibold">{p?.username || 'Unknown'}{p?.username===username? ' (You)': ''}<div className="text-xs text-gray-500">{p?.schoolName}</div></td>
                                    {((selectedLeaderboard === 'ticTacToe') || (selectedLeaderboard === 'weeklyTic')) && (
                                      <td className="px-4 py-2 text-center font-semibold text-cyan-600">{points ?? '-'}</td>
                                    )}
                                    <td className="px-4 py-2 text-center font-semibold text-green-600">{wins}</td>
                                    <td className="px-4 py-2 text-center font-semibold text-red-600">{losses}</td>
                                    <td className="px-4 py-2 text-center font-semibold text-orange-600">{draws}</td>
                                    <td className="px-4 py-2 text-center font-semibold text-blue-600">{winRate}%</td>
                                    {(selectedLeaderboard === 'targetArena' || selectedLeaderboard === 'weeklyTarget') && (
                                      <>
                                        <td className="px-4 py-2 text-center font-semibold text-purple-600">{highScore ?? 0}</td>
                                        <td className="px-4 py-2 text-center font-semibold text-teal-600">{totalScore ?? 0}</td>
                                      </>
                                    )}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )
                      })()}
                      {( (selectedLeaderboard === 'global' ? (globalLeaderboard || []) : selectedLeaderboard === 'ticTacToe' ? (ticLeaderboard || []) : selectedLeaderboard === 'targetArena' ? (targetLeaderboard || []) : selectedLeaderboard === 'weeklyAll' ? (weeklyAllLb || []) : selectedLeaderboard === 'weeklyTic' ? (weeklyTicLb || []) : (weeklyTargetLb || []) ).length === 0) && (
                        <div className="p-8 text-center text-gray-500">No players on the leaderboard yet.</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'winners' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Winners</h3>

                  {winners && winners.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {winners.slice(0,3).map((w, i) => (
                        <div key={i} className="bg-white p-4 rounded shadow">
                          <div className="text-sm text-gray-500">#{i+1}</div>
                          <div className="font-bold">{w.username}</div>
                          <div className="text-sm">Points: {w.points || 0}</div>
                          <div className="text-sm">Wins: {w.wins || 0} • Draws: {w.draws || 0} • Losses: {w.losses || 0}</div>
                          <div className="text-sm">Games: {w.gamesPlayed || 0}</div>
                          <div className="text-sm">High Score: {w.highScore || 0} • Total Score: {w.totalScore || 0}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>No winners yet.</div>
                  )}
                </div>
              )}

              {activeTab === 'questionBank' && (
                <div>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Question Bank</h3>
                      <p className="text-sm text-gray-600">Add, filter, and manage questions for Math Rush, Word Battle, and future learning games.</p>
                    </div>
                    <button onClick={resetQuestionForm} className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">New Question</button>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
                    <div className="space-y-6">
                      <div className="rounded-3xl bg-slate-50 p-6 shadow-sm">
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">Add / Edit Question</h4>
                        <form onSubmit={handleQuestionFormSubmit} className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">Game Type</span>
                              <select
                                value={questionForm.gameType}
                                onChange={(e) => setQuestionField('gameType', e.target.value)}
                                className="input w-full"
                              >
                                <option value="">Select game type</option>
                                {questionGameTypes.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">Subject</span>
                              <input
                                type="text"
                                value={questionForm.subject}
                                onChange={(e) => setQuestionField('subject', e.target.value)}
                                className="input w-full"
                                placeholder="Mathematics"
                              />
                            </label>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">Class Level</span>
                              <input
                                type="text"
                                value={questionForm.classLevel}
                                onChange={(e) => setQuestionField('classLevel', e.target.value)}
                                className="input w-full"
                                placeholder="JSS1"
                              />
                            </label>

                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">Category</span>
                              <select
                                value={questionForm.category}
                                onChange={(e) => setQuestionField('category', e.target.value)}
                                className="input w-full"
                              >
                                <option value="">Select category</option>
                                {questionCategories.map(category => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">Difficulty</span>
                              <select
                                value={questionForm.difficulty}
                                onChange={(e) => setQuestionField('difficulty', e.target.value)}
                                className="input w-full"
                              >
                                <option value="">Select difficulty</option>
                                {questionDifficulties.map(level => (
                                  <option key={level} value={level}>{level}</option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">Status</span>
                              <select
                                value={questionForm.isActive ? 'active' : 'inactive'}
                                onChange={(e) => setQuestionField('isActive', e.target.value === 'active')}
                                className="input w-full"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </label>
                          </div>

                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Question Text</span>
                            <textarea
                              value={questionForm.questionText}
                              onChange={(e) => setQuestionField('questionText', e.target.value)}
                              className="input h-28 w-full"
                              placeholder="Enter the question text"
                            />
                          </label>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">Option A</span>
                              <input
                                type="text"
                                value={questionForm.optionA}
                                onChange={(e) => setQuestionField('optionA', e.target.value)}
                                className="input w-full"
                              />
                            </label>
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">Option B</span>
                              <input
                                type="text"
                                value={questionForm.optionB}
                                onChange={(e) => setQuestionField('optionB', e.target.value)}
                                className="input w-full"
                              />
                            </label>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">Option C</span>
                              <input
                                type="text"
                                value={questionForm.optionC}
                                onChange={(e) => setQuestionField('optionC', e.target.value)}
                                className="input w-full"
                              />
                            </label>
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">Option D</span>
                              <input
                                type="text"
                                value={questionForm.optionD}
                                onChange={(e) => setQuestionField('optionD', e.target.value)}
                                className="input w-full"
                              />
                            </label>
                          </div>

                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Correct Answer</span>
                            <input
                              type="text"
                              value={questionForm.correctAnswer}
                              onChange={(e) => setQuestionField('correctAnswer', e.target.value)}
                              className="input w-full"
                              placeholder="Must match one option"
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Explanation (optional)</span>
                            <textarea
                              value={questionForm.explanation}
                              onChange={(e) => setQuestionField('explanation', e.target.value)}
                              className="input h-24 w-full"
                              placeholder="Optional explanation for the question"
                            />
                          </label>

                          {questionFormError && (
                            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
                              {questionFormError}
                            </div>
                          )}

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={questionSaveLoading}>
                              {editingQuestionId ? 'Update Question' : 'Add Question'}
                            </button>
                            {editingQuestionId && (
                              <button type="button" onClick={resetQuestionForm} className="btn btn-secondary w-full sm:w-auto">
                                Cancel Edit
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      <div className="rounded-3xl bg-yellow-50 border border-yellow-200 p-6 space-y-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-2">Bulk Upload</h4>
                            <p className="text-sm text-slate-700">Upload a CSV file to add multiple questions at once. Invalid rows are skipped and returned in the summary.</p>
                          </div>
                          <button onClick={downloadCsvTemplate} className="btn btn-secondary">Download CSV Template</button>
                        </div>

                        <div className="grid gap-4">
                          <label className="block text-sm text-slate-700">
                            Choose CSV file
                            <input
                              type="file"
                              accept=".csv,text/csv"
                              onChange={handleBulkFileChange}
                              className="mt-2 block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-900"
                            />
                          </label>

                          <div className="flex flex-wrap gap-3">
                            <button onClick={handleBulkUpload} className="btn btn-primary" disabled={bulkUploadLoading}>
                              {bulkUploadLoading ? 'Uploading...' : 'Upload CSV'}
                            </button>
                            {bulkCsvFile && (
                              <span className="self-center text-sm text-slate-600">Selected file: {bulkCsvFile.name}</span>
                            )}
                          </div>

                          {bulkUploadError && (
                            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                              {bulkUploadError}
                            </div>
                          )}

                          {bulkUploadResult && (
                            <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
                              <div className="grid gap-2 sm:grid-cols-3">
                                <div>
                                  <div className="text-xs uppercase tracking-wider text-slate-500">Total rows</div>
                                  <div className="text-lg font-semibold text-slate-900">{bulkUploadResult.totalRows}</div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wider text-slate-500">Saved</div>
                                  <div className="text-lg font-semibold text-emerald-700">{bulkUploadResult.savedCount}</div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wider text-slate-500">Failed</div>
                                  <div className="text-lg font-semibold text-rose-700">{bulkUploadResult.failedCount}</div>
                                </div>
                              </div>

                              {bulkUploadResult.errors && bulkUploadResult.errors.length > 0 && (
                                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                                  <div className="font-semibold text-slate-900 mb-2">Row errors</div>
                                  <ul className="list-disc list-inside space-y-2 text-slate-700">
                                    {bulkUploadResult.errors.map((error) => (
                                      <li key={error.row}>
                                        <span className="font-semibold">Row {error.row}:</span> {error.errors.join(', ')}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                            <div className="font-semibold text-slate-900 mb-2">Expected CSV columns</div>
                            <div className="grid gap-1 sm:grid-cols-2">
                              <span>gameType</span>
                              <span>subject</span>
                              <span>classLevel</span>
                              <span>category</span>
                              <span>difficulty</span>
                              <span>questionText</span>
                              <span>optionA</span>
                              <span>optionB</span>
                              <span>optionC</span>
                              <span>optionD</span>
                              <span>correctAnswer</span>
                              <span>explanation</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-3xl bg-slate-50 p-6 shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900">Question Filters</h4>
                            <p className="text-sm text-slate-600">Filter the question list before managing content.</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={fetchQuestions} className="btn btn-primary">Search</button>
                            <button onClick={handleClearQuestionFilters} className="btn btn-secondary">Clear</button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Game Type</span>
                            <select value={questionFilters.gameType} onChange={(e) => handleQuestionFilterChange('gameType', e.target.value)} className="input w-full">
                              <option value="">All</option>
                              {questionGameTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Category</span>
                            <select value={questionFilters.category} onChange={(e) => handleQuestionFilterChange('category', e.target.value)} className="input w-full">
                              <option value="">All</option>
                              {questionCategories.map(category => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Difficulty</span>
                            <select value={questionFilters.difficulty} onChange={(e) => handleQuestionFilterChange('difficulty', e.target.value)} className="input w-full">
                              <option value="">All</option>
                              {questionDifficulties.map(level => (
                                <option key={level} value={level}>{level}</option>
                              ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Active Status</span>
                            <select value={questionFilters.isActive} onChange={(e) => handleQuestionFilterChange('isActive', e.target.value)} className="input w-full">
                              <option value="">All</option>
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Subject</span>
                            <input value={questionFilters.subject} onChange={(e) => handleQuestionFilterChange('subject', e.target.value)} className="input w-full" placeholder="English Language" />
                          </label>
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">Class Level</span>
                            <input value={questionFilters.classLevel} onChange={(e) => handleQuestionFilterChange('classLevel', e.target.value)} className="input w-full" placeholder="JSS2" />
                          </label>
                        </div>
                      </div>

                      <div className="rounded-3xl bg-white p-6 shadow-sm overflow-x-auto">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <h4 className="text-lg font-semibold text-slate-900">Question List</h4>
                          <span className="text-sm text-slate-500">{questions.length} items</span>
                        </div>

                        {questionsLoading ? (
                          <div className="p-8 text-center text-slate-500">Loading questions...</div>
                        ) : questionsError ? (
                          <div className="p-4 rounded-xl bg-rose-50 text-rose-700">{questionsError}</div>
                        ) : (
                          <table className="w-full min-w-[720px] text-sm">
                            <thead className="bg-slate-100 text-slate-700">
                              <tr>
                                <th className="px-4 py-3 text-left">Game</th>
                                <th className="px-4 py-3 text-left">Category</th>
                                <th className="px-4 py-3 text-left">Level</th>
                                <th className="px-4 py-3 text-left">Difficulty</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {questions.map((question) => (
                                <tr key={question._id} className="border-b last:border-b-0 even:bg-slate-50">
                                  <td className="px-4 py-3 font-medium text-slate-800">{question.gameType}</td>
                                  <td className="px-4 py-3 text-slate-600">{question.category}</td>
                                  <td className="px-4 py-3 text-slate-600">{question.classLevel}</td>
                                  <td className="px-4 py-3 text-slate-600">{question.difficulty}</td>
                                  <td className="px-4 py-3">{getStatusBadge(question.isActive)}</td>
                                  <td className="px-4 py-3 text-right space-x-2">
                                    <button onClick={() => handleEditQuestion(question)} className="btn btn-sm btn-secondary">Edit</button>
                                    <button onClick={() => handleQuestionToggle(question._id)} className="btn btn-sm btn-outline">Toggle</button>
                                    <button onClick={() => handleQuestionDelete(question._id)} className="btn btn-sm btn-danger">Deactivate</button>
                                  </td>
                                </tr>
                              ))}
                              {questions.length === 0 && (
                                <tr>
                                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">No questions found. Use the filters or add a new question.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'students' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Student Management</h3>
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
                    <p className="text-blue-800">Student listing and management coming soon.</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">System Settings</h3>

                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h4 className="font-bold text-gray-800 mb-2">Game Configuration</h4>
                      <p className="text-gray-600 text-sm">Tic Tac Toe: Max players per room = 2</p>
                      <p className="text-gray-600 text-sm">Target Arena: 60-second challenge rounds</p>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="font-bold text-gray-800 mb-2">Server Status</h4>
                      <p className="text-green-600 text-sm">✅ All systems operational</p>
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-2">Database</h4>
                      <p className="text-gray-600 text-sm">MongoDB: Connected</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                ℹ️ <strong>Note:</strong> This is a temporary admin dashboard.
                Full moderation, reports, student management, and secure role-based admin features will be added later.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}