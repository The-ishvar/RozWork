import { forwardRef, useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

const Select = forwardRef(({
  label,
  options = [],
  placeholder = 'Select...',
  value,
  onChange,
  error,
  helperText,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(value || null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setSelected(value)
  }, [value])

  const handleSelect = (option) => {
    setSelected(option.value)
    onChange?.(option.value)
    setIsOpen(false)
  }

  const selectedOption = options.find((o) => o.value === selected)

  return (
    <div className={containerClassName} ref={dropdownRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={ref}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`input-field flex items-center justify-between text-left ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        >
          <span className={selectedOption ? '' : 'text-slate-400'}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                  selected === option.value
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="flex-1">{option.label}</span>
                {selected === option.value && <Check className="h-4 w-4 text-brand-500" />}
              </button>
            ))}
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-red-500' : 'text-slate-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Select.displayName = 'Select'
export default Select

export const NativeSelect = forwardRef(({
  label,
  options = [],
  placeholder = 'Select...',
  error,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`input-field appearance-none pr-10 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
})

NativeSelect.displayName = 'NativeSelect'
