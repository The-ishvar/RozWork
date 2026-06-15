import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Briefcase, Home, ImageIcon, LogOut, Menu, Moon, ShieldCheck, SunMedium, UserRound, Users, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { isHindi, toggleLanguage, t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const bottomNavItems = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/jobs', label: t('nav.jobs'), icon: Briefcase },
    { to: '/workers', label: t('nav.workers'), icon: Users },
    { to: '/gallery', label: 'Gallery', icon: ImageIcon },
    { to: user ? '/profile' : '/login', label: user ? 'Profile' : t('common.login'), icon: user ? UserRound : UserRound },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="flex min-w-0 items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100 sm:text-xl">
              <div className="rounded-full bg-blue-600 p-2 text-white">
                <Briefcase size={18} />
              </div>
              <span className="truncate">RozWork</span>
            </Link>
            <nav className="hidden items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
              <NavLink to="/" className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"> <Home size={16} /> {t('nav.home')}</NavLink>
              <NavLink to="/jobs" className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"> <Briefcase size={16} /> {t('nav.jobs')}</NavLink>
              <NavLink to="/workers" className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"> <Users size={16} /> {t('nav.workers')}</NavLink>
              <NavLink to="/gallery" className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"> <ImageIcon size={16} /> Gallery</NavLink>
              {user ? <NavLink to="/dashboard" className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"> <Bell size={16} /> Notifications</NavLink> : null}
              {user ? <NavLink to="/profile" className="flex items-center gap-1 rounded-full px-3 py-2 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"> <UserRound size={16} /> Profile</NavLink> : null}
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
                  <Link to="/profile" className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:inline-flex">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xs font-semibold text-white">
                      {user.photo ? <img src={user.photo} alt={user.name} className="h-full w-full object-cover" /> : user.name?.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="max-w-[120px] truncate">{user.name}</span>
                  </Link>
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
                <NavLink to="/gallery" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white dark:hover:bg-slate-700"> <ImageIcon size={16} /> Gallery</NavLink>
                {user ? <NavLink to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white dark:hover:bg-slate-700"> <Bell size={16} /> Notifications</NavLink> : null}
                {user ? <NavLink to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white dark:hover:bg-slate-700"> <UserRound size={16} /> Profile</NavLink> : null}
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))

            return (
              <NavLink key={item.to} to={item.to} className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold ${isActive ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export default Navbar

