import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, Briefcase, Globe, Home, ImageIcon, LogOut, Menu, Moon,
  MessageCircle, ShieldCheck, SunMedium, Settings, UserRound, Users, X,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { language, supportedLanguages, setLanguage, t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const bottomNavItems = [
    { to: '/', label: t('nav.home', 'Home'), icon: Home },
    { to: '/jobs', label: t('nav.jobs', 'Jobs'), icon: Briefcase },
    { to: user ? '/chat' : '/workers', label: user ? t('nav.chat', 'Chat') : t('nav.workers', 'Workers'), icon: user ? MessageCircle : Users },
    { to: '/workers', label: t('nav.workers', 'Workers'), icon: Users },
    { to: user ? '/profile' : '/login', label: user ? t('nav.profile', 'Profile') : t('common.login', 'Login'), icon: UserRound },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    setIsMenuOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/90">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <Link to="/" className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold text-lg shadow-brand">
                R
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white hidden sm:block">
                Roz<span className="text-brand-500">Work</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
              {[
                { to: '/', icon: Home, label: t('nav.home', 'Home') },
                { to: '/jobs', icon: Briefcase, label: t('nav.jobs', 'Jobs') },
                { to: '/workers', icon: Users, label: t('nav.workers', 'Workers') },
                { to: '/gallery', icon: ImageIcon, label: t('nav.gallery', 'Gallery') },
                ...(user ? [{ to: '/chat', icon: MessageCircle, label: t('nav.chat', 'Chat') }] : []),
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                        : 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <div className="hidden items-center gap-1 sm:flex">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                      language === lang.code
                        ? 'bg-brand-500 text-white shadow-brand'
                        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    {lang.code.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="rounded-xl p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {theme === 'dark' ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* User Actions */}
              {user ? (
                <>
                  <NavLink
                    to="/notifications"
                    className={({ isActive }) =>
                      `relative rounded-xl p-2 transition-all ${
                        isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                      3
                    </span>
                  </NavLink>

                  <Link
                    to="/profile"
                    className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:flex"
                  >
                    {user.photo ? (
                      <img src={user.photo} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white">
                        {user.name?.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-[100px] truncate">{user.name}</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="hidden items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400 sm:flex"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn-brand !px-4 !py-2 !text-sm">
                  {t('common.login', 'Login')}
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-xl p-2 text-slate-500 md:hidden dark:text-slate-400"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl md:hidden dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-1">
                {[
                  { to: '/', icon: Home, label: t('nav.home', 'Home') },
                  { to: '/jobs', icon: Briefcase, label: t('nav.jobs', 'Jobs') },
                  { to: '/workers', icon: Users, label: t('nav.workers', 'Workers') },
                  { to: '/gallery', icon: ImageIcon, label: t('nav.gallery', 'Gallery') },
                  ...(user ? [
                    { to: '/chat', icon: MessageCircle, label: t('nav.chat', 'Chat') },
                    { to: '/dashboard', icon: Bell, label: t('nav.dashboard', 'Dashboard') },
                    { to: '/profile', icon: UserRound, label: t('nav.profile', 'Profile') },
                    { to: '/settings', icon: Settings, label: t('nav.settings', 'Settings') },
                  ] : []),
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
                {/* Mobile Language */}
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <div className="flex gap-1">
                    {supportedLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setIsMenuOpen(false) }}
                        className={`rounded-lg px-3 py-1 text-xs font-bold ${
                          language === lang.code
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {lang.code.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="btn-brand mx-4 justify-center !text-sm"
                  >
                    {t('common.login', 'Login')}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl safe-bottom md:hidden dark:border-slate-800/80 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold transition-all ${
                  isActive
                    ? 'text-brand-500'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-brand-500' : ''}`} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="h-1 w-1 rounded-full bg-brand-500" />
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export default Navbar
