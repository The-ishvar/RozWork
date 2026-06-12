import { ArrowRight, Briefcase, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const AuthShell = ({ eyebrow, title, subtitle, children, footer, accent = 'blue' }) => {
  const accentClass = accent === 'green' ? 'from-green-500 to-emerald-500' : 'from-blue-600 to-sky-500'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur sm:p-10">
          <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${accentClass} px-3 py-1 text-sm font-semibold text-white shadow-lg`}>
            <Sparkles size={16} /> {eyebrow}
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{subtitle}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Briefcase size={18} />
              </div>
              <p className="mt-3 font-semibold text-slate-900">Post work</p>
              <p className="mt-1 text-sm text-slate-500">Share local jobs in minutes.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <Users size={18} />
              </div>
              <p className="mt-3 font-semibold text-slate-900">Find talent</p>
              <p className="mt-1 text-sm text-slate-500">Discover trusted workers fast.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ShieldCheck size={18} />
              </div>
              <p className="mt-3 font-semibold text-slate-900">Stay secure</p>
              <p className="mt-1 text-sm text-slate-500">Manage access and profiles safely.</p>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Modern local hiring</p>
                <p className="text-sm text-slate-600">From farm work to skilled gigs, RozWork keeps everything simple and professional.</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Trusted by workers, employers, students and farmers
          </div>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
          {children}
          {footer ? (
            <div className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-500">
              <Link to="/" className="inline-flex items-center gap-2 font-semibold text-blue-600">
                Return home <ArrowRight size={16} />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AuthShell
