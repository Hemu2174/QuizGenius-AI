import { useState } from 'react'
import {
  X,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Lightbulb,
  BookOpen,
  Calendar,
  Layers,
  HelpCircle,
  Award,
} from 'lucide-react'
import Button from './Button'
import { formatDate } from '../utils/formatters'

export default function QuizDetailModal({ quiz, isOpen, onClose }) {
  const [filterType, setFilterType] = useState('all') // 'all', 'mcq', 'short_answer'

  if (!isOpen || !quiz) return null

  const questions = quiz.questions || []
  const filteredQuestions = questions.filter((q) => {
    if (filterType === 'all') return true
    return q.question_type === filterType
  })

  const mcqCount = questions.filter((q) => q.question_type === 'mcq').length
  const shortCount = questions.filter((q) => q.question_type === 'short_answer').length

  const difficultyColors = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    hard: 'bg-rose-50 text-rose-700 border-rose-200',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  difficultyColors[quiz.difficulty] || difficultyColors.medium
                }`}
              >
                {quiz.difficulty}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                {quiz.question_type === 'mixed'
                  ? 'Mixed Set'
                  : quiz.question_type === 'short_answer'
                  ? 'Short Answer'
                  : 'Multiple Choice'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {quiz.document_title || 'Source Document'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(quiz.created_at)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{quiz.title}</h2>
            {quiz.description && (
              <p className="text-xs text-slate-500">{quiz.description}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar if mixed set */}
        {quiz.question_type === 'mixed' && (
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-600">Filter:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilterType('mcq')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'mcq'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              MCQs ({mcqCount})
            </button>
            <button
              onClick={() => setFilterType('short_answer')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterType === 'short_answer'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Short Answer ({shortCount})
            </button>
          </div>
        )}

        {/* Question Review Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 divide-y divide-slate-100">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No questions found for this filter.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const isMCQ = q.question_type === 'mcq'
              const optionLetters = isMCQ && q.options ? Object.keys(q.options).sort() : []

              return (
                <div key={q.id || idx} className={`pt-6 first:pt-0 space-y-4`}>
                  {/* Question header info */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {q.topic || 'General'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 uppercase">
                        {isMCQ ? 'Multiple Choice' : 'Short Answer'}
                      </span>
                    </div>

                    {q.source_pages && q.source_pages.length > 0 && (
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        Page {q.source_pages.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Question Text */}
                  <h3 className="text-sm md:text-base font-semibold text-slate-800 leading-snug">
                    {q.question_text}
                  </h3>

                  {/* MCQ Options Display */}
                  {isMCQ && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {optionLetters.map((letter) => {
                        const isCorrect = letter === q.correct_answer
                        const optText = q.options[letter]

                        return (
                          <div
                            key={letter}
                            className={`p-3 rounded-xl border transition-colors flex items-start gap-3 ${
                              isCorrect
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {letter}
                            </span>
                            <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                              {optText}
                            </div>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Short Answer Display */}
                  {!isMCQ && (
                    <div className="space-y-3 pt-1">
                      {q.expected_answer && (
                        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                          <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                            Model Answer
                          </p>
                          <p className="text-xs sm:text-sm text-blue-950 leading-relaxed">
                            {q.expected_answer}
                          </p>
                        </div>
                      )}

                      {q.key_points && q.key_points.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-slate-600">Key Concepts for Grading:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {q.key_points.map((pt, pIdx) => (
                              <span
                                key={pIdx}
                                className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 border border-slate-200 text-slate-700"
                              >
                                {pt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation Card */}
                  {q.explanation && (
                    <div className="p-3.5 bg-amber-50/50 border border-amber-200/70 rounded-xl flex items-start gap-3">
                      <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-amber-900">Explanation & Rationale</p>
                        <p className="text-xs text-amber-900/90 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Previewing {questions.length} questions. Interactive practice mode with scoring is scheduled for Phase 4.
          </p>
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  )
}

