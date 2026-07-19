const badgeVariants = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  accent: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
}

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
}

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon: Icon,
  className = '',
  removable = false,
  onRemove,
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${badgeVariants[variant] || badgeVariants.default} ${badgeSizes[size] || badgeSizes.md} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${
          variant === 'success' ? 'bg-emerald-500' :
          variant === 'danger' ? 'bg-red-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'brand' ? 'bg-brand-500' :
          variant === 'accent' ? 'bg-accent-500' :
          'bg-slate-500'
        }`} />
      )}
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="ml-0.5 -mr-1 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}

export const StatusBadge = ({ status }) => {
  const statusMap = {
    active: { variant: 'success', label: 'Active' },
    pending: { variant: 'warning', label: 'Pending' },
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'danger', label: 'Rejected' },
    completed: { variant: 'accent', label: 'Completed' },
    cancelled: { variant: 'default', label: 'Cancelled' },
    suspended: { variant: 'danger', label: 'Suspended' },
    banned: { variant: 'danger', label: 'Banned' },
    expired: { variant: 'default', label: 'Expired' },
    available: { variant: 'success', label: 'Available' },
    busy: { variant: 'warning', label: 'Busy' },
    offline: { variant: 'default', label: 'Offline' },
  }

  const config = statusMap[status] || { variant: 'default', label: status }

  return (
    <Badge variant={config.variant} dot size="sm">
      {config.label}
    </Badge>
  )
}

export default Badge
