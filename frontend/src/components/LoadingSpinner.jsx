import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 'md', text = 'Loading...', className = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  }

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-slate-500 ${className}`} role="status">
      <Loader2 className={`${sizeMap[size] || sizeMap.md} animate-spin text-indigo-600 mb-2`} />
      {text && <span className="text-xs font-medium tracking-wide text-slate-500">{text}</span>}
      <span className="sr-only">Loading</span>
    </div>
  )
}

