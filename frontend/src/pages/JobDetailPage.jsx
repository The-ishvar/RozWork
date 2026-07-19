import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Briefcase, Clock, IndianRupee, GraduationCap, Building2,
  Share2, Heart, Phone, MessageCircle, Flag, CheckCircle, Users,
  Calendar, Award, ChevronLeft, ExternalLink
} from 'lucide-react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useToast } from '../components/ui/Toast'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { JobCardSkeleton } from '../components/ui/Skeleton'

const JobDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const toast = useToast()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchJob()
  }, [id])

  const fetchJob = async () => {
    try {
      const res = await client.get(`/jobs/${id}`)
      setJob(res.data.job || res.data)
    } catch (err) {
      toast.error('Error', 'Job नहीं मिली')
      navigate('/jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setApplying(true)
    try {
      await client.post(`/jobs/${id}/apply`)
      toast.success('Applied!', 'आपने इस Job के लिए Apply कर दिया है')
      fetchJob()
    } catch (err) {
      toast.error('Error', err.response?.data?.message || 'Apply करने में समस्या')
    } finally {
      setApplying(false)
    }
  }

  const handleSave = () => {
    if (!user) {
      navigate('/login')
      return
    }
    setSaved(!saved)
    toast.info(saved ? 'Unsaved' : 'Saved', saved ? 'Job saved हटाई गई' : 'Job save की गई')
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Copied!', 'Link copy हो गया')
    }
  }

  const handleCall = () => {
    if (job?.contactNumber) {
      window.open(`tel:${job.contactNumber}`)
    }
  }

  const handleWhatsApp = () => {
    if (job?.contactNumber) {
      window.open(`https://wa.me/91${job.contactNumber}?text=${encodeURIComponent(`Hi, I'm interested in the ${job?.title} position.`)}`)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <JobCardSkeleton />
      </div>
    )
  }

  if (!job) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-6">
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
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand">
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
                      {job.title}
                    </h1>
                    {job.companyName && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                        <Building2 className="h-4 w-4" />
                        {job.companyName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className={`rounded-xl p-2.5 transition-all ${
                      saved
                        ? 'bg-red-50 text-red-500 dark:bg-red-900/20'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="rounded-xl bg-slate-100 p-2.5 text-slate-400 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {job.location && (
                  <Badge variant="brand" icon={MapPin}>{job.location}</Badge>
                )}
                {job.workType && (
                  <Badge variant="accent" icon={Clock}>{job.workType}</Badge>
                )}
                {job.category && (
                  <Badge variant="info" icon={Briefcase}>{job.category}</Badge>
                )}
                {job.status && (
                  <StatusBadge status={job.status} />
                )}
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <InfoCard
                  icon={IndianRupee}
                  label={t('job.salary', 'Salary')}
                  value={job.salary || job.price || job.budget || 'Not specified'}
                  color="text-emerald-500"
                />
                <InfoCard
                  icon={GraduationCap}
                  label={t('job.education', 'Education')}
                  value={job.educationRequired || 'Not specified'}
                  color="text-accent-500"
                />
                <InfoCard
                  icon={Award}
                  label={t('job.experience', 'Experience')}
                  value={job.experienceRequired || 'Not specified'}
                  color="text-brand-500"
                />
                <InfoCard
                  icon={Clock}
                  label={t('job.workingTime', 'Working Time')}
                  value={job.duration || job.workType || 'Not specified'}
                  color="text-amber-500"
                />
                <InfoCard
                  icon={Calendar}
                  label={t('job.postedOn', 'Posted On')}
                  value={job.createdAt ? new Date(job.createdAt).toLocaleDateString('hi-IN') : 'N/A'}
                  color="text-sky-500"
                />
                <InfoCard
                  icon={Users}
                  label={t('job.applicants', 'Applicants')}
                  value={`${job.applicants?.length || 0} ${t('job.applied', 'applied')}`}
                  color="text-purple-500"
                />
              </div>

              {job.description && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {t('job.description', 'Description')}
                  </h3>
                  <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                    {job.description}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-6 dark:border-slate-800 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleApply}
                  loading={applying}
                  icon={CheckCircle}
                  fullWidth
                  className="sm:flex-1"
                >
                  {t('job.applyNow', 'अभी Apply करें')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCall}
                  icon={Phone}
                  fullWidth
                  className="sm:flex-1"
                >
                  {t('job.call', 'Call करें')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleWhatsApp}
                  icon={MessageCircle}
                  fullWidth
                  className="sm:flex-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                >
                  WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => toast.info('Reported', 'Job report की गई')}
                  icon={Flag}
                  size="md"
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

const InfoCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
    <div className={`rounded-lg bg-white p-2 shadow-sm dark:bg-slate-700 ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  </div>
)

const StatusBadge = ({ status }) => {
  const map = {
    approved: { variant: 'success', label: 'Approved' },
    pending: { variant: 'warning', label: 'Pending' },
    rejected: { variant: 'danger', label: 'Rejected' },
    completed: { variant: 'accent', label: 'Completed' },
  }
  const c = map[status] || { variant: 'default', label: status }
  return <Badge variant={c.variant} dot>{c.label}</Badge>
}

export default JobDetailPage
