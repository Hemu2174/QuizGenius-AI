import { useState, useEffect } from 'react'
import {
  Sparkles,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sliders,
  Layers,
  BarChart,
  Loader2,
} from 'lucide-react'
import Button from './Button'
import { documentsService, quizzesService } from '../services/api'

export default function GenerateQuizModal({
  isOpen,
  onClose,
  initialDocumentId = null,
  onQuizGenerated,
}) {
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState(initialDocumentId || '')
  
  // Quiz configuration
  const [questionType, setQuestionType] = useState('mcq') // 'mcq', 'short_answer', 'mixed'
  const [difficulty, setDifficulty] = useState('medium') // 'easy', 'medium', 'hard'
  const [questionCount, setQuestionCount] = useState(5) // 5, 10, 15, 20
  
  // Topic selection
  const [availableTopics, setAvailableTopics] = useState([])
  const [selectedTopics, setSelectedTopics] = useState([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [allTopicsSelected, setAllTopicsSelected] = useState(true)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState('')
  const [error, setError] = useState(null)

  // Load completed documents on open
  useEffect(() => {
    if (isOpen) {
      loadDocuments()
      setError(null)
    }
  }, [isOpen])

  // Set initial document when passed
  useEffect(() => {
    if (initialDocumentId) {
      setSelectedDocId(initialDocumentId)
    }
  }, [initialDocumentId])

  // Load topics whenever selectedDocId changes
  useEffect(() => {
    if (selectedDocId) {
      fetchTopics(selectedDocId)
    } else {
      setAvailableTopics([])
      setSelectedTopics([])
      setAllTopicsSelected(true)
    }
  }, [selectedDocId])

  const loadDocuments = async () => {
    setLoadingDocs(true)
    try {
      const data = await documentsService.listDocuments()
      const completed = data.filter((d) => d.status === 'completed')
      setDocuments(completed)
      if (!selectedDocId && completed.length > 0) {
        setSelectedDocId(completed[0].id)
      }
    } catch (err) {
      console.error('Error fetching documents for quiz generator:', err)
      setError('Could not load completed documents. Please verify your connection.')
    } finally {
      setLoadingDocs(false)
    }
  }

  const fetchTopics = async (docId) => {
    setLoadingTopics(true)
    try {
      const res = await documentsService.getTopics(docId)
      const topics = res.topics || []
      setAvailableTopics(topics)
      setSelectedTopics([])
      setAllTopicsSelected(true)
    } catch (err) {
      console.warn('Could not auto-detect topics:', err)
      setAvailableTopics(['Core Concepts', 'Overview & Definitions'])
    } finally {
      setLoadingTopics(false)
    }
  }

  const toggleTopic = (topic) => {
    if (allTopicsSelected) {
      setAllTopicsSelected(false)
      setSelectedTopics([topic])
      return
    }

    if (selectedTopics.includes(topic)) {
      const filtered = selectedTopics.filter((t) => t !== topic)
      if (filtered.length === 0) {
        setAllTopicsSelected(true)
      } else {
        setSelectedTopics(filtered)
      }
    } else {
      setSelectedTopics([...selectedTopics, topic])
    }
  }

  const handleSelectAllTopics = () => {
    setAllTopicsSelected(true)
    setSelectedTopics([])
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!selectedDocId) {
      setError('Please select a completed study document first.')
      return
    }

    setError(null)
    setIsGenerating(true)
    setGenerationStep('Retrieving document context and analyzing sections...')

    try {
      // Step update timer for feedback
      const stepTimer1 = setTimeout(() => {
        setGenerationStep('Synthesizing grounded questions with Groq AI...')
      }, 1400)

      const stepTimer2 = setTimeout(() => {
        setGenerationStep('Validating questions and source citations...')
      }, 3800)

      const payload = {
        document_id: selectedDocId,
        question_type: questionType,
        difficulty: difficulty,
        number_of_questions: questionCount,
        topics: allTopicsSelected ? null : selectedTopics,
      }

      const generatedQuiz = await quizzesService.generateQuiz(payload)

      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)

      if (onQuizGenerated) {
        onQuizGenerated(generatedQuiz)
      }
      onClose()
    } catch (err) {
      console.error('Quiz generation failed:', err)
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Quiz generation failed. Please check your Groq API configuration.'
      setError(msg)
    } finally {
      setIsGenerating(false)
      setGenerationStep('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Generate Quiz with Groq AI</h3>
              <p className="text-xs text-slate-500">
                Synthesize grounded MCQs and short-answer questions from your study document.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="space-y-1">
                <p className="font-semibold text-red-800">Generation Failed</p>
                <p className="text-red-700 leading-relaxed text-xs">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Select Document */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>1. Select Study Document</span>
              {documents.length > 0 && (
                <span className="text-[11px] font-normal text-slate-500">
                  {documents.length} completed {documents.length === 1 ? 'document' : 'documents'} available
                </span>
              )}
            </label>

            {loadingDocs ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                Loading study documents...
              </div>
            ) : documents.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>
                  No completed documents found. Upload and process a PDF document first before generating a quiz.
                </span>
              </div>
            ) : (
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                disabled={isGenerating}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Step 2: Question Type */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              2. Question Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'mcq', label: 'Multiple Choice', desc: '4 options with 1 correct' },
                { id: 'short_answer', label: 'Short Answer', desc: 'Conceptual definitions & rubrics' },
                { id: 'mixed', label: 'Mixed Set', desc: 'Balanced blend of MCQs & short answer' },
              ].map((type) => (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setQuestionType(type.id)}
                  disabled={isGenerating}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    questionType === type.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold">{type.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Difficulty & Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                3. Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'easy', label: 'Easy', color: 'hover:text-emerald-700 active:bg-emerald-50' },
                  { id: 'medium', label: 'Medium', color: 'hover:text-amber-700 active:bg-amber-50' },
                  { id: 'hard', label: 'Hard', color: 'hover:text-rose-700 active:bg-rose-50' },
                ].map((diff) => (
                  <button
                    type="button"
                    key={diff.id}
                    onClick={() => setDifficulty(diff.id)}
                    disabled={isGenerating}
                    className={`py-2 text-xs font-medium rounded-lg capitalize border text-center transition-all ${
                      difficulty === diff.id
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                4. Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setQuestionCount(num)}
                    disabled={isGenerating}
                    className={`py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                      questionCount === num
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 5: Topic Focus */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>5. Focus Topics (Optional)</span>
              {loadingTopics && (
                <span className="text-[11px] text-indigo-600 flex items-center gap-1 font-normal">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Analyzing document topics...
                </span>
              )}
            </label>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllTopics}
                  disabled={isGenerating}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    allTopicsSelected
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Topics (Balanced)
                </button>

                {availableTopics.map((t) => {
                  const isChecked = !allTopicsSelected && selectedTopics.includes(t)
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => toggleTopic(t)}
                      disabled={isGenerating}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isChecked
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-semibold'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                {allTopicsSelected
                  ? 'All document sections will be sampled uniformly for comprehensive coverage.'
                  : `Focusing on ${selectedTopics.length} selected topic${selectedTopics.length > 1 ? 's' : ''}.`}
              </p>
            </div>
          </div>

          {/* Generation Progress Indicator */}
          {isGenerating && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>{generationStep || 'Generating questions with Groq AI...'}</span>
              </div>
              <div className="w-full bg-indigo-200/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-600 h-1.5 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Sparkles}
              loading={isGenerating}
              disabled={documents.length === 0 || isGenerating}
            >
              Generate {questionCount} Questions
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

