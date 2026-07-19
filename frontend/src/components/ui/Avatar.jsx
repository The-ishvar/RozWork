import { User } from 'lucide-react'

const sizeClasses = {
  xs: 'h-7 w-7 text-xs',
  sm: 'h-9 w-9 text-sm',
  md: 'h-11 w-11 text-base',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-xl',
  '2xl': 'h-28 w-28 text-2xl',
}

const statusColors = {
  available: 'bg-emerald-500',
  busy: 'bg-amber-500',
  offline: 'bg-slate-400',
}

const Avatar = ({
  src,
  alt = 'User',
  size = 'md',
  status,
  className = '',
  onClick,
}) => {
  return (
    <div
      className={`relative inline-flex shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white dark:ring-slate-800`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center ring-2 ring-white dark:ring-slate-800`}
        >
          <User className="h-1/2 w-1/2 text-white" />
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 ${statusColors[status] || statusColors.offline}`}
        />
      )}
    </div>
  )
}

export const AvatarGroup = ({ avatars = [], max = 3, size = 'sm' }) => {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, i) => (
        <Avatar key={i} src={avatar.src} alt={avatar.alt} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-2 ring-white dark:ring-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300`}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}

export default Avatar
