import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Briefcase, Home, LogOut, Menu, Moon, ShieldCheck, SunMedium, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

const Navbar = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { isHindi, toggleLanguage, t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="flex min-w-0 items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
            <div className="rounded-full bg-blue-600 p-2 text-white">
              <Briefcase size={18} />
            </div>
            <span className="truncate">RozWork</span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <NavLink to="/" className="flex items-center gap-1 hover:text-blue-600"> <Home size={16} /> {t('nav.home')}</NavLink>
            <NavLink to="/jobs" className="flex items-center gap-1 hover:text-blue-600"> <Briefcase size={16} /> {t('nav.jobs')}</NavLink>
            <NavLink to="/workers" className="flex items-center gap-1 hover:text-blue-600"> <Users size={16} /> {t('nav.workers')}</NavLink>
            {user ? <NavLink to="/dashboard" className="flex items-center gap-1 hover:text-blue-600"> <ShieldCheck size={16} /> {t('nav.dashboard')}</NavLink> : null}
            {user?.role === 'super_admin' ? <NavLink to="/admin" className="flex items-center gap-1 hover:text-blue-600"> <ShieldCheck size={16} /> {t('nav.admin')}</NavLink> : null}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={toggleLanguage} className="rounded-full border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 sm:px-3">
              {isHindi ? 'EN' : 'HI'}
            </button>
            <button onClick={toggleTheme} className="rounded-full border border-slate-200 p-2 text-slate-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200">
              {theme === 'dark' ? <SunMedium size={16} /> : <Moon size={16} />}
            </button>
            {user ? (
              <>
                <Link to="/profile" className="hidden rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:inline-flex">{user.name}</Link>
                <button onClick={handleLogout} className="hidden items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200 sm:flex">
                  <LogOut size={16} /> {t('common.logout')}
                </button>
              </>
            ) : (
              <Link to="/login" className="rounded-full bg-blue-600 px-3 py-2 text-sm font-medium text-white">{t('common.login')}</Link>
            )}
            <button type="button" onClick={() => setIsMenuOpen((open) => !open)} className="rounded-full border border-slate-200 p-2 text-slate-700 md:hidden dark:border-slate-700 dark:text-slate-200">
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {isMenuOpen ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm md:hidden dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <NavLink to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white dark:hover:bg-slate-700"> <Home size={16} /> {t('nav.home')}</NavLink>
              <NavLink to="/jobs" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white dark:hover:bg-slate-700"> <Briefcase size={16} /> {t('nav.jobs')}</NavLink>
              <NavLink to="/workers" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white dark:hover:bg-slate-700"> <Users size={16} /> {t('nav.workers')}</NavLink>
              {user ? <NavLink to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white dark:hover:bg-slate-700"> <ShieldCheck size={16} /> {t('nav.dashboard')}</NavLink> : null}
              {user?.role === 'super_admin' ? <NavLink to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white dark:hover:bg-slate-700"> <ShieldCheck size={16} /> {t('nav.admin')}</NavLink> : null}
              {user ? (
                <button type="button" onClick={() => { setIsMenuOpen(false); handleLogout() }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-white dark:hover:bg-slate-700">
                  <LogOut size={16} /> Logout
                </button>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-white">{t('common.login')}</Link>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}

export default Navbar
