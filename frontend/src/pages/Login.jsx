import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const validate = () => {
    const errs = {}
    if (!email.trim()) {
      errs.email = 'Email address is required.'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address.'
    }

    if (!password) {
      errs.password = 'Password is required.'
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setNotification(null)

    try {
      await login(email, password)
      setNotification({
        type: 'success',
        message: 'Signed in successfully! Redirecting...',
      })
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 500)
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Login failed. Please verify credentials.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your student credentials to access your study portal.
        </p>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg mb-4 text-xs flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
                if (errors.email) setErrors({ ...errors, email: null })
              }}
              placeholder="student@university.edu"
              className={`w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.email
                  ? 'border-rose-400 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-600 mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors({ ...errors, password: null })
              }}
              placeholder="••••••••"
              className={`w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.password
                  ? 'border-rose-400 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-rose-600 mt-1">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600 select-none">
            Keep me signed in
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full mt-2"
          icon={ArrowRight}
          iconPosition="right"
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Create student account
        </Link>
      </div>
    </div>
  )
}
