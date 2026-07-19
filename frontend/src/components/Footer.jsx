import { Link } from 'react-router-dom'
import { Heart, MapPin, Phone, Mail, ExternalLink } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const Footer = () => {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold text-lg shadow-brand">
                R
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Roz<span className="text-brand-500">Work</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {t('footer.tagline', 'हर गाँव के लोगों को रोजगार और काम से जोड़ने वाला प्लेटफ़ॉर्म')}
            </p>
            <div className="mt-4 flex items-center gap-3 text-slate-400">
              <MapPin className="h-4 w-4" />
              <span className="text-xs">India</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t('footer.quickLinks', 'Quick Links')}
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { to: '/jobs', label: t('nav.jobs', 'Jobs') },
                { to: '/workers', label: t('nav.workers', 'Workers') },
                { to: '/gallery', label: t('nav.gallery', 'Gallery') },
                { to: '/dashboard', label: t('nav.dashboard', 'Dashboard') },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t('footer.legal', 'Legal')}
            </h3>
            <ul className="mt-4 space-y-3">
              {[
                { label: t('footer.about', 'About') },
                { label: t('footer.privacy', 'Privacy Policy') },
                { label: t('footer.terms', 'Terms of Service') },
                { label: t('footer.faq', 'FAQ') },
              ].map((item) => (
                <li key={item.label}>
                  <span className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400 cursor-pointer">
                    <ExternalLink className="h-3 w-3" />
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {t('footer.contact', 'Contact')}
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Phone className="h-4 w-4 text-brand-500" />
                <span>+91 XXXXX XXXXX</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Mail className="h-4 w-4 text-brand-500" />
                <span>support@rozwork.in</span>
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {t('footer.support', 'Support')}
              </h4>
              <p className="mt-2 text-xs text-slate-400">
                {t('footer.supportText', 'हमसे संपर्क करें या Help Center पर जाएं')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} RozWork. {t('footer.rights', 'All rights reserved.')}
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              {t('footer.madeWith', 'Made with')} <Heart className="h-3 w-3 fill-red-500 text-red-500" /> {t('footer.forIndia', 'for India')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
