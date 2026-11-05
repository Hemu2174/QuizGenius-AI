import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useHealthCheck } from '../hooks/useHealthCheck'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const health = useHealthCheck(30000)

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 overflow-hidden lg:overflow-auto">
      {/* Sidebar navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        healthStatus={health.status}
      />

      {/* Main app body */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          healthStatus={health.status}
          healthData={health.healthData}
          onRefreshHealth={health.refresh}
          isRefreshingHealth={health.isRefreshing}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ health }} />
        </main>

        <footer className="py-4 px-6 border-t border-slate-200 text-center text-xs text-slate-400 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>QuizGenius AI — Phase 1 Educational Platform Architecture</span>
            <span className="text-[11px] text-slate-400">
              FastAPI Backend • Vite React Frontend • Prepared for Supabase & Groq AI
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}

