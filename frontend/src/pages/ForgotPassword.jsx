import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, Send } from 'lucide-react'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Email address is required.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid email address.')
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(email)
      setIsSubmitted(true)
    } catch (err) {
      setError(err.message || 'Failed to send recovery email. Please check the address.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reset password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your registered email address and we&apos;ll send recovery instructions.
        </p>
      </div>

      {isSubmitted ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Check your inbox</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
            A password recovery link has been dispatched to{' '}
            <strong className="text-slate-700">{email}</strong>.
          </p>
          <div className="mt-6">
            <Link to="/login">
              <Button variant="outline" size="sm" icon={ArrowLeft}>
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="student@university.edu"
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full mt-2"
            icon={Send}
            iconPosition="right"
          >
            Send Reset Link
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
