import { Outlet, Link, Navigate } from 'react-router-dom'
import { GraduationCap, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  // Redirect authenticated students directly to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand logo header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-soft group-hover:bg-indigo-700 transition-colors">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            QuizGenius <span className="text-indigo-600 font-extrabold">AI</span>
          </span>
        </Link>
        <p className="mt-2 text-xs text-slate-500">
          Transform your notes and PDFs into interactive AI quizzes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-soft-lg rounded-2xl border border-slate-200">
          <Outlet />
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>

        {/* Phase 2 Architecture Notice */}
        <div className="mt-6 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-700 text-center leading-relaxed">
          <span className="font-semibold">Supabase Authentication Active:</span> User accounts, password security, and data isolation are managed by Supabase.
        </div>
      </div>
    </div>
  )
}
