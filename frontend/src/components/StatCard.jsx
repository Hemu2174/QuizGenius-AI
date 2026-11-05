export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-indigo-600',
  iconBg = 'bg-indigo-50',
  isZeroState = false,
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-soft hover:shadow-soft-md transition-shadow duration-200 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p
            className={`mt-1 text-xs ${
              isZeroState ? 'text-slate-400 italic' : 'text-slate-500'
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

