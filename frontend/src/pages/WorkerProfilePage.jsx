import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Briefcase, Star, Phone, MessageCircle, UserCheck,
  ChevronLeft, Globe, Award, Clock, Calendar
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

const WorkerProfilePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { createConversation } = useChat()
  const toast = useToast()
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hiring, setHiring] = useState(false)

  useEffect(() => {
    fetchWorker()
  }, [id])

  const fetchWorker = async () => {
    try {
      const res = await client.get(`/users/${id}`)
      setWorker(res.data.user || res.data.worker || res.data)
    } catch (err) {
      toast.error('Error', 'Worker profile नहीं मिला')
      navigate('/workers')
    } finally {
      setLoading(false)
    }
  }

  const handleHire = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setHiring(true)
    try {
      await client.post('/bookings', { workerId: id })
      toast.success('Request Sent!', 'Hire request भेज दी गई है')
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Request भेजने में समस्या')
    } finally {
      setHiring(false)
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
                  onClick={handleHire}
                  loading={hiring}
                  icon={UserCheck}
                  fullWidth
                  className="sm:flex-1"
                >
                  {t('worker.hire', 'Hire करें')}
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

export default WorkerProfilePage
