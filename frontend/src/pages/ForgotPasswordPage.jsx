import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Phone } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import AuthShell from '../components/AuthShell'
import FormField from '../components/FormField'
import { useLanguage } from '../context/LanguageContext'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' })

  const getErrorMessage = (err) => {
    const message = err?.response?.data?.message
    return typeof message === 'string' && message.trim() ? message : t('forgotPassword.genericError', 'We could not start the reset process. Please try again.')
  }

  const onSubmit = async (values) => {
    setError('')
    setMessage('')

    try {
      const { data } = await apiClient.post('/auth/forgot-password', { phone: values.phone })
      setMessage(data.message || t('forgotPassword.otpSent', 'A one-time code has been sent to your mobile number.'))
      navigate(`/reset-password?phone=${encodeURIComponent(values.phone)}`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <AuthShell
      eyebrow={t('forgotPassword.eyebrow')}
      title={t('forgotPassword.title')}
      subtitle={t('forgotPassword.subtitle')}
      footer
      accent="green"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">{t('forgotPassword.sendOtpTitle')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('forgotPassword.sendOtpDescription')}</p>
      </div>

      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div> : null}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          label={t('forgotPassword.mobileNumber')}
          name="phone"
          type="tel"
          placeholder="+91 98765 43210"
          register={register}
          errors={errors}
          icon={<Phone size={16} />}
          options={{ required: 'Mobile number is required', minLength: { value: 8, message: 'Enter a valid mobile number' } }}
        />
        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? t('forgotPassword.sending') : t('forgotPassword.sendOtp')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t('forgotPassword.rememberPassword')}{' '}
        <Link to="/login" className="font-semibold text-blue-600">{t('forgotPassword.signIn')}</Link>
      </p>
    </AuthShell>
  )
}

export default ForgotPasswordPage
