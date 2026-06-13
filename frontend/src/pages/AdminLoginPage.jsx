import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import FormField from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const AdminLoginPage = () => {
   const navigate = useNavigate()
   const { login } = useAuth()
   const { t } = useLanguage()
   const [error, setError] = useState('')
   const [success, setSuccess] = useState('')
   const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
   } = useForm({ mode: 'onBlur' })

   const getErrorMessage = (err) => {
      const message = err?.response?.data?.message
      return typeof message === 'string' && message.trim() ? message : t('admin.genericError', 'We could not sign you in. Please check your credentials and try again.')
   }

   const onSubmit = async (values) => {
      setError('')
      setSuccess('')

      try {
         const result = await login(values.identifier, values.password, values.rememberMe || false)
         if (result?.user?.role === 'admin' || result?.user?.role === 'super_admin') {
            setSuccess(t('admin.success', 'Secure admin access granted.'))
            navigate('/admin', { replace: true })
         } else {
            setError(t('admin.notAuthorized', 'This account is not authorized for the admin area.'))
         }
      } catch (err) {
         setError(getErrorMessage(err))
      }
   }

   return (
      <AuthShell
         eyebrow={t('admin.eyebrow')}
         title={t('admin.title')}
         subtitle={t('admin.subtitle')}
         footer
         accent="blue"
      >
         <div className="mb-6">
            <div className="flex items-center justify-between gap-3">
               <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t('admin.secureAdminLogin')}</h2>
                  <p className="mt-2 text-sm text-slate-500">{t('admin.secureAdminSubtitle')}</p>
               </div>
               <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                  <Sparkles size={16} />
               </div>
            </div>
         </div>

         {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
         {success ? <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div> : null}

         <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormField
               label={t('admin.identifier')}
               name="identifier"
               type="text"
               placeholder="966058569x or you@example.com"
               autoComplete="username"
               register={register}
               errors={errors}
               icon={<Mail size={16} />}
               options={{ required: 'Enter your admin email or mobile number' }}
            />
            <FormField
               label={t('admin.password')}
               name="password"
               type="password"
               placeholder="Enter your secure password"
               autoComplete="current-password"
               register={register}
               errors={errors}
               icon={<Lock size={16} />}
               options={{ required: 'Password is required' }}
            />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
               <FormField name="rememberMe" type="checkbox" register={register} errors={errors} options={{}}>
                  {t('admin.rememberMe')}
               </FormField>
            </div>
            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3 font-semibold text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">
               {isSubmitting ? t('admin.checkingAccess') : t('admin.continue')}
            </button>
         </form>

         <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
            <Link to="/forgot-password" className="font-semibold text-blue-600">{t('admin.forgotPassword')}</Link>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
            <Link to="/login" className="flex items-center gap-2 font-semibold text-slate-700">
               <ShieldCheck size={16} /> {t('admin.backToUserLogin')}
            </Link>
         </div>
      </AuthShell>
   )
}

export default AdminLoginPage
