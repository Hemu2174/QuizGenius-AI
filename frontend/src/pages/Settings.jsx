import { useState, useEffect } from 'react'
import {
  User,
  Sliders,
  Shield,
  Save,
  CheckCircle2,
  Lock,
  AlertCircle,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [institution, setInstitution] = useState('Stanford University')
  const [studyField, setStudyField] = useState('Computer Science')

  // Preferences
  const [defaultDifficulty, setDefaultDifficulty] = useState('medium')
  const [defaultQuestionCount, setDefaultQuestionCount] = useState('5')
  const [enableExplanations, setEnableExplanations] = useState(true)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [errorFeedback, setErrorFeedback] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.name || '')
      setEmail(user.email || '')
      if (user.institution) setInstitution(user.institution)
    }
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorFeedback(null)
    setSavedFeedback(false)

    try {
      if (updateProfile) {
        await updateProfile({
          full_name: fullName,
          institution,
          study_field: studyField,
        })
      }
      setSavedFeedback(true)
      setTimeout(() => setSavedFeedback(false), 3000)
    } catch (err) {
      setErrorFeedback(err.message || 'Failed to update profile settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Settings & Preferences"
        description="Manage your student profile, study preferences, and application defaults."
      />

      {savedFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 transition-opacity duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Profile preferences updated successfully!</span>
        </div>
      )}

      {errorFeedback && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2 transition-opacity duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Student Profile</h3>
            <p className="text-xs text-slate-500">Your personal details and academic affiliation.</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                title="Email updates are managed via Supabase Auth"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                School / Institution
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Field of Study
              </label>
              <input
                type="text"
                value={studyField}
                onChange={(e) => setStudyField(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" icon={Save} isLoading={isSaving}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      {/* Application Preferences */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-6">
          <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Quiz Defaults & Learning Preferences</h3>
            <p className="text-xs text-slate-500">Configure default parameters for future AI quiz generation.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-semibold text-slate-800">Default Quiz Difficulty</h4>
              <p className="text-[11px] text-slate-500">Preset complexity for generated questions.</p>
            </div>
            <select
              value={defaultDifficulty}
              onChange={(e) => setDefaultDifficulty(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="easy">Easy (Foundational Recall)</option>
              <option value="medium">Medium (Analytical & Conceptual)</option>
              <option value="hard">Hard (Advanced Problem Solving)</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-semibold text-slate-800">Default Questions Per Quiz</h4>
              <p className="text-[11px] text-slate-500">Target batch size synthesized from uploaded documents.</p>
            </div>
            <select
              value={defaultQuestionCount}
              onChange={(e) => setDefaultQuestionCount(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="5">5 Questions (Quick Review)</option>
              <option value="10">10 Questions (Standard Practice)</option>
              <option value="15">15 Questions (Deep Evaluation)</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-800">Auto-Generate Explanations</h4>
              <p className="text-[11px] text-slate-500">
                Include comprehensive rationale and textbook references for each question.
              </p>
            </div>
            <input
              type="checkbox"
              checked={enableExplanations}
              onChange={(e) => setEnableExplanations(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Account & Security Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Account & Security</h3>
            <p className="text-xs text-slate-500">Authentication credentials and account management.</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <p className="font-medium text-slate-700 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            Supabase Security Layer Active
          </p>
          <p className="text-slate-500 leading-relaxed">
            Your session is secured with Supabase JWT encryption and Row Level Security policies. All study documents, extracted chunks, and user data are strictly accessible only by your authenticated user ID.
          </p>
        </div>
      </div>
    </div>
  )
}
