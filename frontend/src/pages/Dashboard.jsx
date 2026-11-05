import { useState, useEffect, useCallback } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  FileText,
  BrainCircuit,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  Server,
  Activity,
  RefreshCw,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import UploadCard from '../components/UploadCard'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { documentsService } from '../services/api'
import { formatDate, formatBytes } from '../utils/formatters'

export default function Dashboard() {
  const { user } = useAuth()
  const { health } = useOutletContext()
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  const fetchDocs = useCallback(async () => {
    setLoadingDocs(true)
    try {
      const data = await documentsService.listDocuments()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (e) {
      // Non-blocking for dashboard
      console.debug('Dashboard doc fetch:', e)
    } finally {
      setLoadingDocs(false)
    }
  }, [])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const completedDocsCount = documents.filter((d) => d.status === 'completed').length

  const handleDocumentProcessed = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)])
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Overview Hero */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-2xl p-6 sm:p-8 text-white shadow-soft-lg relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute right-32 -top-12 w-40 h-40 bg-indigo-500/10 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/10 text-indigo-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            AI-Powered Personalized Learning
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-indigo-100/90 leading-relaxed max-w-2xl">
            Upload your lecture notes, textbook chapters, or research papers. QuizGenius AI transforms them into focused MCQs, targeted quizzes, and identifies your weak topics with comprehensive explanations.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/documents">
              <Button
                variant="outline"
                size="md"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-white/40"
              >
                Browse Documents
              </Button>
            </Link>
            <Link to="/analytics">
              <Button
                variant="ghost"
                size="md"
                className="text-indigo-100 hover:text-white hover:bg-white/10"
                icon={ArrowRight}
                iconPosition="right"
              >
                View Analytics
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Backend Health Check Status Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                health.status === 'connected'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : health.status === 'offline'
                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                  : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}
            >
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Backend System Status
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    health.status === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : health.status === 'offline'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      health.status === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : health.status === 'offline'
                        ? 'bg-rose-500'
                        : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  {health.status === 'connected'
                    ? 'Connected (FastAPI Active)'
                    : health.status === 'offline'
                    ? 'Offline'
                    : 'Checking connection...'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {health.status === 'connected' && health.healthData
                  ? `${health.healthData.name} (${health.healthData.version}) • Environment: ${health.healthData.environment} • Target: http://localhost:8000/api/health`
                  : health.status === 'offline'
                  ? `Cannot reach backend (${health.error || 'Connection refused'}). Please run 'uvicorn app.main:app' in the backend directory.`
                  : 'Pinging FastAPI health endpoint at /api/health...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {health.lastChecked && (
              <span className="text-[11px] text-slate-400 hidden md:inline">
                Checked {health.lastChecked.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              isLoading={health.isRefreshing}
              onClick={health.refresh}
            >
              Ping Server
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Study Overview</h2>
          <span className="text-xs text-slate-400 font-medium">Real-Time Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Documents Uploaded"
            value={documents.length.toString()}
            subtitle={
              documents.length === 0
                ? 'No documents uploaded yet'
                : `${completedDocsCount} ready for AI quizzes`
            }
            icon={FileText}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            isZeroState={documents.length === 0}
          />
          <StatCard
            title="Quizzes Generated"
            value="0"
            subtitle="Scheduled for Phase 3"
            icon={BrainCircuit}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            isZeroState={true}
          />
          <StatCard
            title="Average Score"
            value="0%"
            subtitle="Take a quiz to track performance"
            icon={Award}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            isZeroState={true}
          />
          <StatCard
            title="Study Time"
            value="0h"
            subtitle="Study hours track automatically"
            icon={Clock}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            isZeroState={true}
          />
        </div>
      </div>

      {/* Main Content Grid: PDF Upload + Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: PDF Upload Section */}
        <div className="lg:col-span-7 space-y-6">
          <UploadCard onDocumentProcessed={handleDocumentProcessed} />

          {/* How QuizGenius AI Works Guide */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              How QuizGenius AI Works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center mb-2">
                  1
                </span>
                <h4 className="text-xs font-semibold text-slate-800">Upload Notes</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Provide your PDF study guides, lecture summaries, or textbook chapters.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center mb-2">
                  2
                </span>
                <h4 className="text-xs font-semibold text-slate-800">PyMuPDF Extraction</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Extracts digital text page-by-page and segments clean study chunks with page boundaries.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center mb-2">
                  3
                </span>
                <h4 className="text-xs font-semibold text-slate-800">Phase 3 AI Quizzes</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Groq LLM synthesizes MCQs and short answers directly from your extracted chunks.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Quick Actions & Recent Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-soft">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/documents"
                className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group flex flex-col"
              >
                <FileText className="w-4 h-4 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800">My Documents</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Manage study files</span>
              </Link>

              <Link
                to="/quizzes"
                className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group flex flex-col"
              >
                <BrainCircuit className="w-4 h-4 text-violet-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800">My Quizzes</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Practice questions</span>
              </Link>

              <Link
                to="/analytics"
                className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group flex flex-col"
              >
                <TrendingUp className="w-4 h-4 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800">Analytics</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Diagnose mastery</span>
              </Link>

              <Link
                to="/settings"
                className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors group flex flex-col"
              >
                <Clock className="w-4 h-4 text-slate-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800">Preferences</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Difficulty & account</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Recent Documents</h3>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>

            {documents.length > 0 ? (
              <div className="space-y-2.5">
                {documents.slice(0, 4).map((doc) => (
                  <Link
                    key={doc.id}
                    to="/documents"
                    className="p-2.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded bg-indigo-50 text-indigo-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {doc.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatBytes(doc.file_size)} • {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {doc.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                        </span>
                      ) : doc.status === 'processing' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
                          <AlertCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title="No recent activity"
                description="Your uploaded study materials and PyMuPDF extracted chunks will appear here."
                className="border-dashed bg-slate-50/50 p-6 shadow-none"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
