import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Smartphone, ArrowLeft, CheckCircle2, Shield, Wallet } from 'lucide-react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import Button from '../components/ui/Button'
import Skeleton from '../components/ui/Skeleton'

const paymentMethods = [
  { id: 'razorpay', name: 'Razorpay', description: 'Credit/Debit Card, Net Banking, Wallet', icon: CreditCard },
  { id: 'upi', name: 'UPI', description: 'Google Pay, PhonePe, Paytm or any UPI app', icon: Smartphone },
  { id: 'phonepe', name: 'PhonePe', description: 'Pay directly via PhonePe', icon: Smartphone },
  { id: 'gpay', name: 'Google Pay', description: 'Pay directly via Google Pay', icon: Smartphone },
  { id: 'paytm', name: 'Paytm', description: 'Pay directly via Paytm', icon: Wallet },
]

const PaymentPage = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const toast = useToast()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState('razorpay')
  const [processing, setProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [upiId, setUpiId] = useState('')

  const fetchBooking = async () => {
    try {
      const res = await client.get(`/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBooking(res.data.booking)
    } catch {
      toast.error('Error', 'Booking details not found')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBooking()
  }, [bookingId])

  const handlePayment = async () => {
    if (!booking) return
    setProcessing(true)

    try {
      if (selectedMethod === 'razorpay') {
        const orderRes = await client.post('/payments/create-order', {
          bookingId: booking.id,
          amount: booking.employerPays || booking.amount,
          paymentMethod: 'razorpay',
        }, { headers: { Authorization: `Bearer ${token}` } })

        if (!orderRes.data.orderId) {
          toast.error('Error', orderRes.data.message || 'Could not create payment order')
          setProcessing(false)
          return
        }

        const options = {
          key: orderRes.data.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '',
          amount: orderRes.data.amount || (booking.employerPays || booking.amount) * 100,
          currency: orderRes.data.currency || 'INR',
          name: 'RozWork',
          description: `Payment for ${booking.serviceTitle}`,
          order_id: orderRes.data.orderId,
          handler: async (response) => {
            try {
              await client.post('/payments/verify', {
                bookingId: booking.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentMethod: 'razorpay',
              }, { headers: { Authorization: `Bearer ${token}` } })

              setPaymentComplete(true)
              toast.success('Payment Successful!', 'Your booking has been confirmed.')
            } catch (err) {
              toast.error('Verification Failed', err.response?.data?.message || 'Payment could not be verified')
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: booking.contactPhone || user?.phone || '',
          },
          theme: { color: '#f97316' },
        }

        if (window.Razorpay) {
          const rzp = new window.Razorpay(options)
          rzp.on('payment.failed', () => {
            toast.error('Payment Failed', 'Payment was unsuccessful. Please try again.')
            setProcessing(false)
          })
          rzp.open()
        } else {
          await simulatePayment()
        }
      } else {
        await simulatePayment()
      }
    } catch (err) {
      toast.error('Payment Error', err.response?.data?.message || 'Something went wrong')
    } finally {
      setProcessing(false)
    }
  }

  const simulatePayment = async () => {
    try {
      await client.post('/payments/verify', {
        bookingId: booking.id,
        razorpayPaymentId: `pay_${Date.now()}`,
        paymentMethod: selectedMethod,
      }, { headers: { Authorization: `Bearer ${token}` } })

      setPaymentComplete(true)
      toast.success('Payment Successful!', 'Your booking has been confirmed.')
    } catch (err) {
      toast.error('Payment Failed', err.response?.data?.message || 'Payment failed')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (paymentComplete) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payment Successful!</h1>
          <p className="mt-3 text-slate-500">Your booking for <strong>{booking?.serviceTitle}</strong> has been confirmed.</p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Service</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{booking?.serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">₹{booking?.employerPays || booking?.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Confirmed</span>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => navigate('/dashboard')} fullWidth>Go to Dashboard</Button>
            <Button onClick={() => navigate('/dashboard')} fullWidth>View Booking</Button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-brand-500 transition-colors">
        <ArrowLeft size={16} /> Back to booking
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payment</h1>
        <p className="mt-1 text-sm text-slate-500">Complete payment to confirm your booking</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{booking.serviceTitle}</h3>
          <p className="mt-1 text-sm text-slate-500">{booking.category} • Worker: {booking.workerName || 'Assigned'}</p>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Job Price</span>
              <span className="text-slate-900 dark:text-slate-100">₹{booking.amount || booking.price}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Employer Commission (10%)</span>
              <span className="text-amber-600">+₹{booking.employerCommissionAmount || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Worker Commission (2%)</span>
              <span className="text-amber-600">-₹{booking.workerCommissionAmount || 0}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-slate-900 dark:text-slate-100">You Pay</span>
                <span className="text-brand-600">₹{booking.employerPays || booking.amount}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Worker Receives</span>
                <span>₹{booking.workerReceives || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Select Payment Method</h3>
          <div className="space-y-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                    selectedMethod === method.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <Icon size={20} className={selectedMethod === method.id ? 'text-brand-600' : 'text-slate-400'} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${selectedMethod === method.id ? 'text-brand-700 dark:text-brand-300' : 'text-slate-900 dark:text-slate-100'}`}>{method.name}</p>
                    <p className="text-xs text-slate-500">{method.description}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 ${selectedMethod === method.id ? 'border-brand-500 bg-brand-500' : 'border-slate-300'}`}>
                    {selectedMethod === method.id && <div className="mx-auto mt-0.5 h-2 w-2 rounded-full bg-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {selectedMethod === 'upi' && (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <Shield size={18} className="mt-0.5 text-emerald-600" />
            <div className="text-sm">
              <p className="font-medium text-slate-900 dark:text-slate-100">Secure Payment</p>
              <p className="mt-1 text-slate-500">Your payment is protected by industry-standard encryption. We never store your card details.</p>
            </div>
          </div>
        </div>

        <Button onClick={handlePayment} loading={processing} fullWidth size="lg" className="mt-6">
          Pay ₹{booking.employerPays || booking.amount}
        </Button>

        <p className="mt-3 text-center text-xs text-slate-400">
          By paying, you agree to RozWork's Terms of Service and Payment Policy
        </p>
      </motion.div>
    </div>
  )
}

export default PaymentPage
