import { useState, useEffect } from 'react'
import {
  BrainCircuit,
  Search,
  Sparkles,
  FileText,
  Calendar,
  Layers,
  Trash2,
  Eye,
  AlertCircle,
  HelpCircle,
  Loader2,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import GenerateQuizModal from '../components/GenerateQuizModal'
import QuizDetailModal from '../components/QuizDetailModal'
import { quizzesService } from '../services/api'
import { formatDate } from '../utils/formatters'

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Modals state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await quizzesService.listQuizzes()
      setQuizzes(data || [])
    } catch (err) {
      console.error('Error fetching quizzes:', err)
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Could not load quizzes. If you recently updated the schema, ensure migration 002 is executed.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = async (quizId) => {
    setLoadingDetail(true)
    try {
      const fullQuiz = await quizzesService.getQuiz(quizId)
      setSelectedQuiz(fullQuiz)
      setIsDetailOpen(true)
    } catch (err) {
      console.error('Failed to load quiz details:', err)
      alert('Could not load quiz questions: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleDelete = async (quizId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its questions?`)) {
      return
    }

    setDeletingId(quizId)
    try {
      await quizzesService.deleteQuiz(quizId)
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId))
      if (selectedQuiz && selectedQuiz.id === quizId) {
        setIsDetailOpen(false)
        setSelectedQuiz(null)
      }
    } catch (err) {
      console.error('Failed to delete quiz:', err)
      alert('Failed to delete quiz: ' + (err.response?.data?.detail || err.message))
    } finally {
      setDeletingId(null)
    }
  }

  const handleQuizGenerated = (newQuiz) => {
    setQuizzes((prev) => [newQuiz, ...prev])
    setSelectedQuiz(newQuiz)
    setIsDetailOpen(true)
  }

  // Filter quizzes
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quiz.document_title && quiz.document_title.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesDiff = difficultyFilter === 'all' || quiz.difficulty === difficultyFilter
    const matchesType = typeFilter === 'all' || quiz.question_type === typeFilter
    return matchesSearch && matchesDiff && matchesType
  })

  const difficultyColors = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    hard: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Quizzes"
        description="Review past AI quizzes, test your knowledge retention with MCQs, and inspect explanations."
        badge="Phase 3 Groq AI"
        actions={
          <Button
            variant="primary"
            icon={Sparkles}
            onClick={() => setIsGenerateOpen(true)}
          >
            Generate New Quiz
          </Button>
        }
      />

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900">Database Notice</p>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search quizzes by title or document..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Difficulty filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Difficulty:</span>
            {['all', 'easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2.5 py-1 rounded-md capitalize text-xs font-medium transition-colors ${
                  difficultyFilter === diff
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Type filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Type:</span>
            {['all', 'mcq', 'short_answer', 'mixed'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-md capitalize text-xs font-medium transition-colors ${
                  typeFilter === type
                    ? 'bg-violet-50 text-violet-700 font-semibold border border-violet-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {type === 'mcq'
                  ? 'MCQ'
                  : type === 'short_answer'
                  ? 'Short Ans'
                  : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quizzes Grid or Loading / Empty State */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-soft">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Loading your AI quizzes...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to Supabase PostgreSQL</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <EmptyState
          icon={BrainCircuit}
          title={searchTerm || difficultyFilter !== 'all' ? 'No matching quizzes found' : 'No quizzes generated yet'}
          description={
            searchTerm || difficultyFilter !== 'all'
              ? 'Try adjusting your search query or difficulty filters to see your quizzes.'
              : 'Synthesize your first quiz from any uploaded study material using Groq AI with instant MCQ and short-answer questions.'
          }
          actionLabel="Generate New Quiz"
          actionIcon={Sparkles}
          onAction={() => setIsGenerateOpen(true)}
          className="py-14"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 shadow-soft hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        difficultyColors[quiz.difficulty] || difficultyColors.medium
                      }`}
                    >
                      {quiz.difficulty}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                      {quiz.question_type === 'mixed'
                        ? 'Mixed'
                        : quiz.question_type === 'short_answer'
                        ? 'Short Ans'
                        : 'MCQ'}
                    </span>
                  </div>

                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {quiz.total_questions} {quiz.total_questions === 1 ? 'Question' : 'Questions'}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {quiz.title}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                    <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{quiz.document_title || 'Source Document'}</span>
                  </p>
                </div>
              </div>

              {/* Footer info & actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formatDate(quiz.created_at)}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    disabled={deletingId === quiz.id}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={Eye}
                    onClick={() => handleOpenDetail(quiz.id)}
                    loading={loadingDetail && selectedQuiz?.id === quiz.id}
                  >
                    Review
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Quiz Modal */}
      <GenerateQuizModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onQuizGenerated={handleQuizGenerated}
      />

      {/* Quiz Detail Preview Modal */}
      <QuizDetailModal
        quiz={selectedQuiz}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  )
}
