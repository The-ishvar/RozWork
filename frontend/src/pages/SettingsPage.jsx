import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Globe, Moon, Sun, Bell, Shield, HelpCircle, MessageSquare,
  ChevronRight, ToggleLeft, ToggleRight, Smartphone, Lock,
  Eye, EyeOff, Trash2, LogOut
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../components/ui/Toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const SettingsPage = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const toast = useToast()
  const [notifications, setNotifications] = useState({
    newJob: true,
    applicationAccepted: true,
    applicationRejected: true,
    messages: true,
    systemUpdates: false,
  })

  const handleNotificationToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
    toast.success('Updated', 'Notification setting updated')
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    toast.success('Updated', lang === 'hi' ? 'भाषा Hindi में बदली गई' : 'Language changed to English')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            अपनी पसंद के अनुसार Settings बदलें
          </p>

          <div className="mt-6 space-y-6">
            <Card>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
                Appearance
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="h-5 w-5 text-brand-500" /> : <Sun className="h-5 w-5 text-amber-500" />}
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </p>
                    <p className="text-xs text-slate-400">Theme बदलें</p>
                  </div>
                </div>
                <button onClick={toggleTheme} className="text-slate-400 hover:text-brand-500 transition-colors">
                  {theme === 'dark' ? <ToggleRight className="h-8 w-8 text-brand-500" /> : <ToggleLeft className="h-8 w-8" />}
                </button>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language / भाषा
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'hi', label: 'हिन्दी', desc: 'Hindi' },
                  { value: 'en', label: 'English', desc: 'English' },
                ].map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => handleLanguageChange(lang.value)}
                    className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition-all ${
                      language === lang.value
                        ? 'bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-900/20'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {lang.label}
                      </p>
                      <p className="text-xs text-slate-400">{lang.desc}</p>
                    </div>
                    {language === lang.value && (
                      <div className="h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'newJob', label: 'New Job Alerts', desc: 'नई Job की सूचना' },
                  { key: 'applicationAccepted', label: 'Application Accepted', desc: 'Application स्वीकार होने पर' },
                  { key: 'applicationRejected', label: 'Application Rejected', desc: 'Application अस्वीकार होने पर' },
                  { key: 'messages', label: 'Messages', desc: 'नए Message की सूचना' },
                  { key: 'systemUpdates', label: 'System Updates', desc: 'System Update की सूचना' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                    <button onClick={() => handleNotificationToggle(item.key)}>
                      {notifications[item.key] ? (
                        <ToggleRight className="h-8 w-8 text-brand-500" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-slate-300" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy & Security
              </h3>
              <div className="space-y-3">
                <SettingItem icon={Lock} label="Change Password" desc="पासवर्ड बदलें" />
                <SettingItem icon={Eye} label="Profile Visibility" desc="Profile कौन देख सकता है" />
                <SettingItem icon={Smartphone} label="Two-Factor Auth" desc="Extra security जोड़ें" />
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Help & Support
              </h3>
              <div className="space-y-3">
                <SettingItem icon={HelpCircle} label="FAQ" desc="सामान्य प्रश्न" />
                <SettingItem icon={MessageSquare} label="Feedback" desc="अपनी राय दें" />
                <SettingItem icon={Smartphone} label="Contact Support" desc="सहायता से संपर्क करें" />
              </div>
            </Card>

            <Card>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    logout()
                    toast.info('Logged Out', 'आप successfully logout हो गए')
                  }}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
                <button
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Delete Account</span>
                </button>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const SettingItem = ({ icon: Icon, label, desc }) => (
  <button className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-slate-400" />
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </div>
    <ChevronRight className="h-4 w-4 text-slate-300" />
  </button>
)

export default SettingsPage
