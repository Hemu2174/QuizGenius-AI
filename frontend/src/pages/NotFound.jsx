import { Link } from 'react-router-dom'
import { AlertCircle, Home, ArrowLeft } from 'lucide-react'
import Button from '../components/Button'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-soft">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404 - Page Not Found</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
        The requested page does not exist or has been relocated. Check your link or return to the main dashboard.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" icon={Home}>
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}

