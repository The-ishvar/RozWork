import { useState } from 'react'

const Tabs = ({ tabs, defaultTab, onChange, className = '' }) => {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)

  const handleTabClick = (tabId) => {
    setActive(tabId)
    onChange?.(tabId)
  }

  return (
    <div className={`flex gap-1 overflow-x-auto no-scrollbar rounded-xl bg-slate-100 p-1 dark:bg-slate-800 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            active === tab.id
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {tab.icon && <tab.icon className="h-4 w-4" />}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              active === tab.id
                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default Tabs
