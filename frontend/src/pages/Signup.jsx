import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  const { signup } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const errs = {}
    if (!name.trim()) {
      errs.name = 'Full name is required.'
    }

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

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }

    if (!agreeTerms) {
      errs.agreeTerms = 'You must accept the terms of service.'
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
      const res = await signup({ name, email, password })
      if (res.session) {
        setNotification({
          type: 'success',
          message: 'Account created and verified! Redirecting to dashboard...',
        })
        setTimeout(() => {
          navigate('/')
        }, 1000)
      } else {
        setNotification({
          type: 'success',
          message: 'Account created! Please check your inbox to confirm your email before signing in.',
        })
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Signup failed. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create your account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Join QuizGenius AI to turn your notes into quizzes instantly.
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

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors({ ...errors, name: null })
              }}
              placeholder="e.g. Alex Johnson"
              className={`w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.name
                  ? 'border-rose-400 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-rose-600 mt-1">{errors.name}</p>
          )}
        </div>

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
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors({ ...errors, password: null })
              }}
              placeholder="At least 6 characters"
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword)
                  setErrors({ ...errors, confirmPassword: null })
              }}
              placeholder="Re-enter password"
              className={`w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.confirmPassword
                  ? 'border-rose-400 focus:ring-rose-500/20'
                  : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-rose-600 mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <div>
          <div className="flex items-start">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked)
                if (errors.agreeTerms)
                  setErrors({ ...errors, agreeTerms: null })
              }}
              className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="agree-terms" className="ml-2 block text-xs text-slate-600 leading-normal select-none">
              I agree to the Terms of Service and acknowledge the QuizGenius AI academic integrity guidelines.
            </label>
          </div>
          {errors.agreeTerms && (
            <p className="text-xs text-rose-600 mt-1">{errors.agreeTerms}</p>
          )}
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
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Sign in
        </Link>
      </div>
    </div>
  )
}
