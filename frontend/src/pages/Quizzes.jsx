import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BrainCircuit,
  Search,
  Sparkles,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'

export default function Quizzes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const navigate = useNavigate()

  // Real zero state for Phase 1
  const quizzes = []

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Quizzes"
        description="Review past quizzes, practice active recall, and test your knowledge retention."
        badge="Phase 1 Ready"
        actions={
          <Link to="/">
            <Button variant="primary" icon={Sparkles}>
              Generate New Quiz
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search quizzes by title or topic..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Status:</span>
            {['all', 'completed', 'draft'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md capitalize text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-violet-50 text-violet-700 font-semibold border border-violet-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quizzes List or Zero State */}
      {quizzes.length === 0 ? (
        <EmptyState
          icon={BrainCircuit}
          title="No quizzes generated yet"
          description="Your generated quizzes with MCQs, short answers, and question explanations will be organized here. Start by selecting your document on the Dashboard."
          actionLabel="Go to Upload & Generate"
          actionIcon={Sparkles}
          onAction={() => navigate('/')}
          className="py-14"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Quiz cards will render here */}
        </div>
      )}
    </div>
  )
}
