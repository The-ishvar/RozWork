import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const AuthShell = ({ eyebrow, title, subtitle, children, footer, accent = 'blue' }) => {
  const accentClass = accent === 'green' ? 'from-green-500 to-emerald-500' : 'from-blue-600 to-sky-500'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${accentClass} px-3 py-1 text-sm font-semibold text-white shadow-lg`}>
              <Sparkles size={16} /> RozWork
            </div>
            <span className="text-sm font-medium text-slate-500">{eyebrow}</span>
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{subtitle}</p>

          <div className="mt-8">
            {children}
          </div>

          {footer ? (
            <div className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-500">
              <Link to="/" className="inline-flex items-center gap-2 font-semibold text-blue-600">
                Back to home <ArrowRight size={16} />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AuthShell
