import { Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const SearchInput = ({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  onClear,
  icon: Icon = Search,
  autoFocus = false,
  className = '',
  inputClassName = '',
}) => {
  const [query, setQuery] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange?.(val)
  }

  const handleClear = () => {
    setQuery('')
    onChange?.('')
    onClear?.()
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch?.(query)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon className="h-5 w-5" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`input-field pl-10 pr-10 ${inputClassName}`}
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default SearchInput
