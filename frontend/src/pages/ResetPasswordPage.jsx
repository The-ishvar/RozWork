import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Lock, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import apiClient from '../api/client'
import AuthShell from '../components/AuthShell'
import FormField from '../components/FormField'
import { useLanguage } from '../context/LanguageContext'

const ResetPasswordPage = () => {
  const location = useLocation()
  const { t } = useLanguage()
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' })

  const queryPhone = new URLSearchParams(location.search).get('phone') || ''
  const newPassword = watch('newPassword', '')

  const score = useMemo(() => {
    let scoreValue = 0
    if (newPassword.length >= 8) scoreValue += 1
    if (/[A-Z]/.test(newPassword)) scoreValue += 1
    if (/\d/.test(newPassword)) scoreValue += 1
    if (/[^A-Za-z0-9]/.test(newPassword)) scoreValue += 1
    return scoreValue
  }, [newPassword])

  const strengthLabel = [t('resetPassword.veryWeak', 'Very weak'), t('resetPassword.weak', 'Weak'), t('resetPassword.fair', 'Fair'), t('resetPassword.strong', 'Strong')][score] || t('resetPassword.veryWeak', 'Very weak')

  const onSubmit = async (values) => {
    setMessage('')
    setIsError(false)

    if (!queryPhone) {
      setIsError(true)
      setMessage(t('resetPassword.restartFlow', 'Please start the reset flow again and provide your mobile number.'))
      return
    }

    if (values.newPassword !== values.confirmPassword) {
      setIsError(true)
      setMessage(t('resetPassword.passwordsDoNotMatch', 'Passwords do not match.'))
      return
    }

    if (score < 3) {
      setIsError(true)
      setMessage(t('resetPassword.strongerPassword', 'Use a stronger password with at least 8 characters and a mix of letters, numbers, or symbols.'))
      return
    }

    try {
      await apiClient.post('/auth/verify-otp', { phone: queryPhone, otp: values.otp })
      const { data } = await apiClient.post('/auth/reset-password', { phone: queryPhone, otp: values.otp, password: values.newPassword })
      setMessage(data.message || t('resetPassword.success', 'Your password has been updated successfully. You can sign in with the new credentials now.'))
    } catch (err) {
      setIsError(true)
      const responseMessage = err?.response?.data?.message
      setMessage(typeof responseMessage === 'string' && responseMessage.trim() ? responseMessage : t('resetPassword.failure', 'Unable to reset your password. Please try again.'))
    }
  }

  return (
    <AuthShell
      eyebrow={t('resetPassword.eyebrow')}
      title={t('resetPassword.title')}
      subtitle={t('resetPassword.subtitle')}
      footer
      accent="blue"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">{t('resetPassword.resetTitle')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('resetPassword.resetDescription')} {queryPhone || t('resetPassword.mobileNumberFallback', 'your mobile number')}.</p>
      </div>

      {message ? <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{message}</div> : null}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          label={t('resetPassword.otp')}
          name="otp"
          type="text"
          placeholder="Enter 6-digit code"
          register={register}
          errors={errors}
          icon={<ShieldCheck size={16} />}
          options={{ required: 'OTP is required', minLength: { value: 6, message: 'Enter the full 6-digit OTP' }, maxLength: { value: 6, message: 'Enter the full 6-digit OTP' } }}
        />
        <FormField
          label={t('resetPassword.newPassword')}
          name="newPassword"
          type="password"
          placeholder="Create a strong password"
          register={register}
          errors={errors}
          icon={<Lock size={16} />}
          options={{ required: 'New password is required', minLength: { value: 8, message: 'Minimum 8 characters' } }}
        />
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{t('resetPassword.passwordStrength')}</span>
            <span className="font-semibold text-blue-600">{strengthLabel}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className={`h-2 rounded-full transition-all ${score >= 3 ? 'bg-green-500' : score >= 2 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${(score / 4) * 100}%` }} />
          </div>
        </div>
        <FormField
          label={t('resetPassword.confirmPassword')}
          name="confirmPassword"
          type="password"
          placeholder="Repeat your new password"
          register={register}
          errors={errors}
          icon={<Lock size={16} />}
          options={{ required: 'Please confirm your password', validate: (value) => value === newPassword || 'Passwords do not match' }}
        />

        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? t('resetPassword.updating') : t('resetPassword.resetButton')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t('resetPassword.backToLogin')} <Link to="/login" className="font-semibold text-blue-600">{t('common.login')}</Link>
      </p>
    </AuthShell>
  )
}

export default ResetPasswordPage
