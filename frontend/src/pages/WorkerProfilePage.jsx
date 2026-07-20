import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Briefcase, Phone, MessageCircle, UserCheck,
  ChevronLeft, Award, Clock, Calendar, X, Info
} from 'lucide-react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useChat } from '../context/ChatContext'
import { useToast } from '../components/ui/Toast'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import StarRating from '../components/ui/StarRating'
import Skeleton from '../components/ui/Skeleton'

const defaultBookingForm = {
  contactName: '',
  contactPhone: '',
  address: '',
  village: '',
  bookingDate: '',
  bookingTime: '',
  category: '',
  description: '',
  estimatedBudget: '',
}

const WorkerProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { createConversation } = useChat()
  const toast = useToast()
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingForm, setBookingForm] = useState(defaultBookingForm)
  const [bookingErrors, setBookingErrors] = useState({})

  const commissionPreview = useMemo(() => {
    const budget = Number(bookingForm.estimatedBudget)
    if (budget > 0) {
      const employerComm = Number(((budget * 10) / 100).toFixed(2))
      const workerComm = Number(((budget * 2) / 100).toFixed(2))
      return {
        jobPrice: budget,
        employerPays: Number((budget + employerComm).toFixed(2)),
        workerReceives: Number((budget - workerComm).toFixed(2)),
        totalCommission: Number((employerComm + workerComm).toFixed(2)),
        employerCommission: employerComm,
        workerCommission: workerComm,
      }
    }
    return null
  }, [bookingForm.estimatedBudget])

  const fetchWorker = async () => {
    try {
      const res = await client.get(`/users/${id}`)
      setWorker(res.data.user || res.data.worker || res.data)
    } catch {
      toast.error('Error', 'Worker profile नहीं मिला')
      navigate('/workers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorker()
  }, [id])

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBookingForm((prev) => ({
        ...prev,
        contactName: prev.contactName || user.name || '',
        contactPhone: prev.contactPhone || user.phone || '',
      }))
    }
  }, [user])

  const openBookingForm = () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.id === id || user._id === id) {
      toast.error('Error', 'आप अपनी खुद की profile book नहीं कर सकते')
      return
    }
    setShowBookingForm(true)
  }

  const validateBookingForm = () => {
    const errors = {}
    if (!bookingForm.contactName.trim()) errors.contactName = 'Name is required'
    if (!bookingForm.contactPhone.trim()) errors.contactPhone = 'Phone number is required'
    if (bookingForm.contactPhone.trim().length < 10) errors.contactPhone = 'Enter a valid 10-digit phone number'
    if (!bookingForm.bookingDate) errors.bookingDate = 'Date is required'
    if (!bookingForm.bookingTime) errors.bookingTime = 'Time is required'
    if (!bookingForm.category.trim()) errors.category = 'Work category is required'
    if (!bookingForm.estimatedBudget || Number(bookingForm.estimatedBudget) <= 0) errors.estimatedBudget = 'Please enter a valid budget'
    if (Number(bookingForm.estimatedBudget) < 100) errors.estimatedBudget = 'Minimum budget is ₹100'
    setBookingErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleBookingSubmit = async () => {
    if (!validateBookingForm()) return

    setBookingSubmitting(true)
    try {
      const payload = {
        workerId: id,
        employerId: user.id || user._id,
        serviceTitle: `${bookingForm.category} - ${worker.profession || worker.name}`,
        serviceProvider: worker.name,
        category: bookingForm.category,
        contactName: bookingForm.contactName,
        contactPhone: bookingForm.contactPhone,
        address: bookingForm.address,
        village: bookingForm.village,
        bookingDate: bookingForm.bookingDate,
        bookingTime: bookingForm.bookingTime,
        description: bookingForm.description,
        estimatedBudget: Number(bookingForm.estimatedBudget),
        price: Number(bookingForm.estimatedBudget),
        amount: Number(bookingForm.estimatedBudget),
      }

      const res = await client.post('/bookings', payload)

      toast.success('Booking Created!', `आपकी booking successfully create हो गई है।`)

      const bookingId = res.data.booking?.id
      setShowBookingForm(false)
      setBookingForm(defaultBookingForm)

      if (bookingId) {
        navigate(`/payment/${bookingId}`)
      }
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Booking create करने में समस्या')
    } finally {
      setBookingSubmitting(false)
    }
  }

  const handleChat = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const conv = await createConversation(id)
      if (conv) navigate('/chat')
    } catch {
      toast.error('Error', 'Chat शुरू नहीं हो सकी')
    }
  }

  const handleCall = () => {
    if (worker?.phone) window.open(`tel:${worker.phone}`)
  }

  const handleWhatsApp = () => {
    if (worker?.phone) {
      window.open(`https://wa.me/91${worker.phone}?text=${encodeURIComponent(`Hi ${worker.name}, I found your profile on RozWork.`)}`)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="card-standard p-6 text-center">
          <Skeleton variant="circular" className="mx-auto h-24 w-24" />
          <Skeleton variant="text" className="mx-auto mt-4 h-6 w-1/2" />
          <Skeleton variant="text" className="mx-auto mt-2 h-4 w-1/3" />
        </div>
      </div>
    )
  }

  if (!worker) return null

  const rating = worker.ratings?.average || worker.rating || 0
  const reviewCount = worker.ratings?.count || 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-brand-500 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card glass padding={false}>
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-brand-500 to-accent-500" />
              <div className="px-6 sm:px-8">
                <div className="-mt-12 flex items-end gap-4">
                  <Avatar src={worker.photo} alt={worker.name} size="2xl" />
                  <div className="mb-2">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                      {worker.name}
                    </h1>
                    {worker.profession && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {worker.profession}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={worker.availability === 'available' || worker.availability !== 'busy' ? 'success' : 'warning'} dot>
                  {worker.availability === 'available' || worker.availability !== 'busy' ? 'Available' : 'Busy'}
                </Badge>
                <StarRating rating={rating} showValue />
                {reviewCount > 0 && (
                  <span className="text-xs text-slate-400">({reviewCount} reviews)</span>
                )}
                {worker.isVerified && (
                  <Badge variant="info" icon={UserCheck}>Verified</Badge>
                )}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {worker.location && (
                  <InfoItem icon={MapPin} label={t('worker.location', 'Location')} value={worker.location} />
                )}
                {worker.experience?.length > 0 && (
                  <InfoItem icon={Briefcase} label={t('worker.experience', 'Experience')} value={`${worker.experience.length} years`} />
                )}
                {worker.completedJobs > 0 && (
                  <InfoItem icon={Award} label={t('worker.completedJobs', 'Completed Jobs')} value={worker.completedJobs} />
                )}
                {worker.lastActiveAt && (
                  <InfoItem icon={Clock} label={t('worker.lastActive', 'Last Active')} value={new Date(worker.lastActiveAt).toLocaleDateString('hi-IN')} />
                )}
              </div>

              {worker.skills?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t('worker.skills', 'Skills')}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {worker.skills.map((skill, i) => (
                      <Badge key={i} variant="brand" size="sm">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {worker.serviceCategories?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t('worker.categories', 'Categories')}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {worker.serviceCategories.map((cat, i) => (
                      <Badge key={i} variant="accent" size="sm">{cat}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {worker.bio && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t('worker.about', 'About')}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {worker.bio}
                  </p>
                </div>
              )}

              {worker.education?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t('worker.education', 'Education')}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {worker.education.map((edu, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {typeof edu === 'string' ? edu : edu.degree || edu.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-6 dark:border-slate-800 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={openBookingForm}
                  icon={UserCheck}
                  fullWidth
                  className="sm:flex-1"
                >
                  {t('worker.bookNow', 'Book Now')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleChat}
                  icon={MessageCircle}
                  fullWidth
                  className="sm:flex-1"
                >
                  {t('worker.chat', 'Chat करें')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCall}
                  icon={Phone}
                  size="icon"
                />
                <Button
                  variant="ghost"
                  onClick={handleWhatsApp}
                  icon={({ className }) => (
                    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  )}
                  size="icon"
                  className="text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {showBookingForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBookingForm(false)} />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Book {worker.name}</h2>
                <p className="mt-1 text-sm text-slate-500">Fill in the details to create a booking</p>
              </div>
              <button onClick={() => setShowBookingForm(false)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <BookingField
                label="Your Name"
                value={bookingForm.contactName}
                onChange={(v) => setBookingForm({ ...bookingForm, contactName: v })}
                error={bookingErrors.contactName}
                placeholder="Enter your full name"
              />
              <BookingField
                label="Mobile Number"
                value={bookingForm.contactPhone}
                onChange={(v) => setBookingForm({ ...bookingForm, contactPhone: v })}
                error={bookingErrors.contactPhone}
                placeholder="10-digit mobile number"
                type="tel"
              />
              <BookingField
                label="Address"
                value={bookingForm.address}
                onChange={(v) => setBookingForm({ ...bookingForm, address: v })}
                placeholder="Full address for service"
              />
              <BookingField
                label="Village / Area"
                value={bookingForm.village}
                onChange={(v) => setBookingForm({ ...bookingForm, village: v })}
                placeholder="Village or area name"
              />
              <div className="grid grid-cols-2 gap-3">
                <BookingField
                  label="Date"
                  value={bookingForm.bookingDate}
                  onChange={(v) => setBookingForm({ ...bookingForm, bookingDate: v })}
                  error={bookingErrors.bookingDate}
                  type="date"
                />
                <BookingField
                  label="Time"
                  value={bookingForm.bookingTime}
                  onChange={(v) => setBookingForm({ ...bookingForm, bookingTime: v })}
                  error={bookingErrors.bookingTime}
                  type="time"
                />
              </div>
              <BookingField
                label="Work Category"
                value={bookingForm.category}
                onChange={(v) => setBookingForm({ ...bookingForm, category: v })}
                error={bookingErrors.category}
                placeholder="e.g., Plumbing, Electrical, etc."
                options={worker.serviceCategories?.length ? worker.serviceCategories : []}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={bookingForm.description}
                  onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                  placeholder="Describe the work you need done"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <BookingField
                label="Estimated Budget (₹)"
                value={bookingForm.estimatedBudget}
                onChange={(v) => setBookingForm({ ...bookingForm, estimatedBudget: v })}
                error={bookingErrors.estimatedBudget}
                placeholder="Enter your budget"
                type="number"
              />

              {commissionPreview && (
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-950/30">
                  <div className="flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-300">
                    <Info size={16} />
                    Payment Breakdown
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>Job Price</span>
                      <span className="font-medium">₹{commissionPreview.jobPrice}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>Employer Commission (10%)</span>
                      <span className="font-medium text-amber-600">+₹{commissionPreview.employerCommission}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>Worker Commission (2%)</span>
                      <span className="font-medium text-amber-600">-₹{commissionPreview.workerCommission}</span>
                    </div>
                    <div className="border-t border-brand-200 pt-2 dark:border-brand-800">
                      <div className="flex justify-between font-bold text-brand-700 dark:text-brand-300">
                        <span>You Pay</span>
                        <span>₹{commissionPreview.employerPays}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                        <span>Worker Receives</span>
                        <span className="font-medium">₹{commissionPreview.workerReceives}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setShowBookingForm(false)} fullWidth>
                Cancel
              </Button>
              <Button onClick={handleBookingSubmit} loading={bookingSubmitting} fullWidth>
                Create Booking
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
    <Icon className="h-5 w-5 text-brand-500" />
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  </div>
)

const BookingField = ({ label, value, onChange, error, type = 'text', placeholder, options }) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    {options?.length > 0 && type === 'text' ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="">Select category</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>{opt}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    )}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
)

export default WorkerProfilePage
