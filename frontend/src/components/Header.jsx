import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  RefreshCw,
  User,
  LogOut,
  ChevronDown,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Header({
  onToggleSidebar,
  healthStatus,
  healthData,
  onRefreshHealth,
  isRefreshingHealth,
}) {
  const { user, isAuthenticated, logout } = useAuth()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const getStatusBadge = () => {
    switch (healthStatus) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          dot: 'bg-emerald-500',
        }
      case 'offline':
        return {
          icon: WifiOff,
          text: 'Offline',
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          dot: 'bg-rose-500',
        }
      case 'checking':
      default:
        return {
          icon: RefreshCw,
          text: 'Checking...',
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          dot: 'bg-amber-500',
        }
    }
  }

  const statusBadge = getStatusBadge()

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-700">QuizGenius AI</span>
          <span>/</span>
          <span className="text-slate-500">Learning Workspace</span>
        </div>
      </div>

      {/* Right: Backend Status Indicator + User Menu */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Backend health pill with refresh button */}
        <div className="flex items-center gap-1.5">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${statusBadge.color}`}
            title={
              healthData
                ? `${healthData.name} (${healthData.version}) - Status: ${healthData.status}`
                : 'FastAPI Backend Health Status'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${statusBadge.dot} ${
                healthStatus === 'connected' ? 'animate-pulse' : ''
              }`}
            />
            <span className="hidden xs:inline">Backend:</span>
            <span className="font-semibold">{statusBadge.text}</span>
          </div>

          <button
            onClick={onRefreshHealth}
            disabled={isRefreshingHealth}
            title="Check backend health now"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshingHealth ? 'animate-spin text-indigo-600' : ''}`}
            />
          </button>
        </div>

        {/* User profile dropdown or login link */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold flex items-center justify-center text-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-none">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  {user.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:inline" />
            </button>

            {userDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-soft-lg border border-slate-200 py-1.5 z-40">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Account Settings
                  </Link>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false)
                      logout()
                      navigate('/login')
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

