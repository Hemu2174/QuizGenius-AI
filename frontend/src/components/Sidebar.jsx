import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  BrainCircuit,
  BarChart3,
  Settings,
  Sparkles,
  X,
  GraduationCap
} from 'lucide-react'

export default function Sidebar({ isOpen, onClose, healthStatus }) {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Documents', path: '/documents', icon: FileText },
    { name: 'My Quizzes', path: '/quizzes', icon: BrainCircuit },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  const getStatusBadge = () => {
    switch (healthStatus) {
      case 'connected':
        return {
          label: 'Backend Connected',
          dotClass: 'bg-emerald-500 animate-pulse',
          bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }
      case 'offline':
        return {
          label: 'Backend Offline',
          dotClass: 'bg-rose-500',
          bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
        }
      case 'checking':
      default:
        return {
          label: 'Checking Backend...',
          dotClass: 'bg-amber-500 animate-pulse',
          bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
        }
    }
  }

  const badge = getStatusBadge()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container — fixed on mobile, static (in-flow) on desktop */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5 font-bold text-slate-900 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-soft group-hover:bg-indigo-700 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base tracking-tight font-bold text-slate-900 leading-tight">
                QuizGenius <span className="text-indigo-600 font-extrabold">AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Phase 1 MVP
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Study Portal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose()
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-soft-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Phase 1 Status & Backend Indicator */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${badge.bgClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${badge.dotClass}`} />
            <span className="truncate">{badge.label}</span>
          </div>

          <div className="mt-3 px-1 text-[11px] text-slate-400 leading-normal flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>FastAPI & Vite Foundation</span>
          </div>
        </div>
      </aside>
    </>
  )
}

