import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const FormField = ({
  label,
  name,
  type = 'text',
  register,
  errors,
  placeholder,
  autoComplete,
  options = {},
  rows = 4,
  as = 'input',
  icon,
  className = '',
  children,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const error = errors?.[name]
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="space-y-2">
      {label ? <label className="text-sm font-medium text-slate-700">{label}</label> : null}
      <div className="relative">
        {as === 'textarea' ? (
          <textarea
            id={name}
            rows={rows}
            placeholder={placeholder}
            className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`}
            {...register(name, options)}
          />
        ) : type === 'checkbox' ? (
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" {...register(name, options)} />
            <span>{children}</span>
          </label>
        ) : (
          <>
            {icon ? <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div> : null}
            <input
              id={name}
              type={inputType}
              autoComplete={autoComplete}
              placeholder={placeholder}
              className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${icon ? 'pl-11' : ''} ${className}`}
              {...register(name, options)}
            />
            {type === 'password' ? (
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            ) : null}
          </>
        )}
      </div>
      {error ? <p className="text-sm text-red-500">{error.message}</p> : null}
    </div>
  )
}

export default FormField
