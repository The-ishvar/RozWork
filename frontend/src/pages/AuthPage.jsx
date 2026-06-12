import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Globe, Lock, Mail, Phone, ShieldCheck, Sparkles, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import FormField from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const AuthPage = ({ mode = 'login' }) => {
  const navigate = useNavigate()
  const { login, register: registerUser } = useAuth()
  const { t } = useLanguage()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isRegister = mode === 'register'
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' })
  const password = watch('password', '')

  const getErrorMessage = (err) => {
    const message = err?.response?.data?.message
    const errors = err?.response?.data?.errors

    if (typeof message === 'string' && message.trim()) return message
    if (Array.isArray(errors) && errors.length) return errors.join(' ')
    if (typeof errors === 'string' && errors.trim()) return errors
    return t('auth.genericError', 'We could not complete that action. Please check your details and try again.')
  }

  const onSubmit = async (values) => {
    setError('')
    setSuccess('')

    try {
      if (isRegister) {
        const normalizedEmail = values.email?.trim().toLowerCase() || `${String(values.phone || '').replace(/\D/g, '')}@rozwork.local`
        const result = await registerUser({ ...values, email: normalizedEmail }, values.rememberMe || false)
        const destination = result?.user?.role === 'admin' || result?.user?.role === 'super_admin' ? '/admin' : '/dashboard'
        setSuccess(result?.user?.name ? `Welcome, ${result.user.name}. Your account is ready.` : t('auth.accountCreated', 'Account created successfully.'))
        navigate(destination, { replace: true })
      } else {
        const result = await login(values.identifier, values.password, values.rememberMe || false)
        const destination = result?.user?.role === 'admin' || result?.user?.role === 'super_admin' ? '/admin' : '/dashboard'
        setSuccess(result?.user?.name ? `Welcome back, ${result.user.name}.` : t('auth.signedIn', 'Signed in successfully.'))
        navigate(destination, { replace: true })
      }
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setSuccess('')
    setError(t('auth.googleComingSoonMessage', 'Google sign-in is not enabled in this build yet. Please use your mobile number or email and password instead.'))
  }

  return (
    <AuthShell
      eyebrow={isRegister ? t('auth.joinRozWork') : t('auth.welcomeBack')}
      title={isRegister ? t('auth.registerTitle') : t('auth.signInTitle')}
      subtitle={isRegister ? t('auth.registerSubtitle') : t('auth.signInSubtitle')}
      footer
      accent={isRegister ? 'blue' : 'green'}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{isRegister ? t('auth.register') : t('auth.login')}</h2>
            <p className="mt-2 text-sm text-slate-500">{isRegister ? t('auth.registerHint', 'Build a polished profile and start connecting today.') : t('auth.loginHint', 'Use your mobile number or email with a secure password to continue.')}</p>
          </div>
          <div className="rounded-full bg-blue-50 p-2 text-blue-600">
            <Sparkles size={16} />
          </div>
        </div>
      </div>

      {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div> : null}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {isRegister ? (
          <>
            <FormField
              label={t('auth.fullName', 'Full Name')}
              name="name"
              placeholder="Asha Patel"
              register={register}
              errors={errors}
              icon={<User size={16} />}
              options={{ required: 'Name is required' }}
            />
            <FormField
              label={t('auth.mobileNumber', 'Mobile Number')}
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
              register={register}
              errors={errors}
              icon={<Phone size={16} />}
              options={{ required: 'Phone number is required', minLength: { value: 8, message: 'Phone number is too short' } }}
            />
            <FormField
              label={t('auth.emailOptional', 'Email address (optional)')}
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              register={register}
              errors={errors}
              icon={<Mail size={16} />}
              options={{ pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } }}
            />
          </>
        ) : null}

        {!isRegister ? (
          <FormField
            label={t('auth.identifier', 'Mobile Number or Email')}
            name="identifier"
            type="text"
            placeholder="9876543210 or you@example.com"
            autoComplete="username"
            register={register}
            errors={errors}
            icon={<Mail size={16} />}
            options={{ required: 'Mobile number or email is required' }}
          />
        ) : null}

        <FormField
          label={t('auth.password', 'Password')}
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          register={register}
          errors={errors}
          icon={<Lock size={16} />}
          options={{ required: 'Password is required', minLength: isRegister ? { value: 8, message: 'Minimum 8 characters' } : undefined }}
        />

        {isRegister ? (
          <FormField
            label={t('auth.confirmPassword', 'Confirm Password')}
            name="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            register={register}
            errors={errors}
            icon={<Lock size={16} />}
            options={{ required: 'Please confirm your password', validate: (value) => value === password || 'Passwords do not match' }}
          />
        ) : null}

        {isRegister ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-sm font-medium text-slate-700">{t('auth.role', 'Role')}</label>
              <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" {...register('role', { required: 'Role is required' })}>
                <option value="worker">{t('auth.worker', 'Worker')}</option>
                <option value="employer">{t('auth.employer', 'Employer')}</option>
              </select>
              {errors.role ? <p className="mt-2 text-sm text-red-500">{errors.role.message}</p> : null}
            </div>
            <FormField
              label={t('auth.location', 'Location')}
              name="location"
              placeholder="Mumbai, India"
              register={register}
              errors={errors}
              options={{ required: 'Location is required' }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <FormField name="rememberMe" type="checkbox" register={register} errors={errors} options={{}}>
              {t('auth.rememberMe')}
            </FormField>
            <Link to="/forgot-password" className="font-semibold text-blue-600">{t('auth.forgotPassword')}</Link>
          </div>
        )}

        {isRegister ? (
          <FormField name="terms" type="checkbox" register={register} errors={errors} options={{ required: 'You must accept the terms' }}>
            {t('auth.terms', 'I agree to the Terms & Conditions and Privacy Policy.')}
          </FormField>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-3 font-semibold text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? t('auth.pleaseWait', 'Please wait...') : isRegister ? t('auth.createAccount', 'Create Account') : t('auth.logIn', 'Log In')}
        </button>

        <button type="button" onClick={handleGoogleLogin} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 hover:shadow-md">
          <Globe size={18} /> {t('auth.googleComingSoon')}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 text-center text-sm text-slate-500 sm:flex-row sm:justify-center">
        <Link to="/admin/login" className="flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 font-semibold text-amber-700">
          <ShieldCheck size={16} /> {t('auth.adminLogin')}
        </Link>
        <p>
          {isRegister ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}{' '}
          <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-blue-600">
            {isRegister ? t('auth.login') : t('auth.register')}
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

export default AuthPage
