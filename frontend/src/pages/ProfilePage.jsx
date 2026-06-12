import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  BadgeCheck,
  Briefcase,
  Camera,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  UserCircle2,
  Wallet,
  X,
} from 'lucide-react'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'

const initialSkills = ['React', 'Tailwind CSS', 'Node.js']
const initialExperience = [{ company: 'RozWork', position: 'Freelancer', startDate: '2024-01', endDate: 'Present', description: 'Delivered modern web experiences and platform support.' }]
const initialEducation = [{ institution: 'Delhi University', degree: 'B.Tech', year: '2024' }]
const initialAchievements = ['Top Rated Freelancer', 'Completed 50+ projects']

const ProfilePage = () => {
  const { user, updateProfile, token } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [deletingPurchaseId, setDeletingPurchaseId] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [message, setMessage] = useState('')
  const [skills, setSkills] = useState(initialSkills)
  const [newSkill, setNewSkill] = useState('')
  const [experience, setExperience] = useState(initialExperience)
  const [education, setEducation] = useState(initialEducation)
  const [achievements, setAchievements] = useState(initialAchievements)
  const [newAchievement, setNewAchievement] = useState('')
  const [portfolio, setPortfolio] = useState({ github: '', linkedin: '', website: '' })
  const [notifications, setNotifications] = useState({ email: true, sms: true, app: true })
  const [stats, setStats] = useState({ totalJobsApplied: 0, totalJobsPosted: 0, totalBookings: 0, totalReviews: 0, activeJobs: 0, pendingJobs: 0, completedJobs: 0, pendingBookings: 0, confirmedBookings: 0, completedBookings: 0 })
  const [recentJobs, setRecentJobs] = useState([])
  const [recentApplications, setRecentApplications] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [recentReviews, setRecentReviews] = useState([])
  const [timeline, setTimeline] = useState([])
  const [quickAction, setQuickAction] = useState(null)
  const [projectDraft, setProjectDraft] = useState({ title: '', link: '', description: '' })
  const [certificateDraft, setCertificateDraft] = useState({ title: '', issuer: '', year: '' })
  const [resumeDraft, setResumeDraft] = useState('')
  const { register, handleSubmit, reset, setValue } = useForm({ mode: 'onBlur' })

  const loadDashboardData = async () => {
    if (!user || !token) return
    try {
      const [purchasesResponse, statsResponse] = await Promise.all([
        apiClient.get('/purchases', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setPurchases(purchasesResponse.data.purchases || [])
      const payload = statsResponse.data || {}
      setStats(payload.stats || {})
      setRecentJobs(payload.recentJobs || [])
      setRecentApplications(payload.recentApplications || [])
      setRecentBookings(payload.recentBookings || [])
      setRecentReviews(payload.recentReviews || [])
      setTimeline(payload.timeline || [])
    } catch (error) {
      console.error(error)
      setPurchases([])
    }
  }

  useEffect(() => {
    if (!user) return
    loadDashboardData()
    reset({
      name: user.name || '',
      username: user.username || '',
      address: user.address || '',
      phone: user.phone || '',
      email: user.email || '',
      profession: user.profession || '',
      companyName: user.companyName || '',
      businessDetails: user.businessDetails || '',
      availability: user.availability || 'Available now',
      notificationsEnabled: user.notificationsEnabled ?? true,
      privacyMode: user.privacyMode || 'Private profile',
    })
    setPhotoPreview(user.photo || '')
    setSkills(Array.isArray(user.skills) && user.skills.length ? user.skills : initialSkills)
    setExperience(Array.isArray(user.experience) && user.experience.length ? user.experience : initialExperience)
    setEducation(Array.isArray(user.education) && user.education.length ? user.education : initialEducation)
    setPortfolio({
      github: user.portfolio?.[0] || '',
      linkedin: user.portfolio?.[1] || '',
      website: user.portfolio?.[2] || '',
    })
    setResumeDraft(user.resumeUrl || '')
  }, [user, reset, token])

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      setPhotoPreview(result)
      setValue('photo', result)
    }
    reader.readAsDataURL(file)
  }

  const completionScore = useMemo(() => {
    const checks = [
      Boolean(user?.name),
      Boolean(user?.email),
      Boolean(user?.phone),
      Boolean(user?.profession),
      Boolean(user?.location),
      skills.length > 0,
      experience.length > 0,
      education.length > 0,
      Boolean(photoPreview),
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [education.length, experience.length, photoPreview, skills.length, user?.email, user?.location, user?.name, user?.phone, user?.profession])

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      photo: photoPreview || values.photo || '',
      skills,
      experience,
      education,
      certificates: Array.isArray(user?.certificates) ? user.certificates : [],
      portfolio: [portfolio.github, portfolio.linkedin, portfolio.website].filter(Boolean),
      socialLinks: [portfolio.github, portfolio.linkedin, portfolio.website].filter(Boolean),
      resumeUrl: resumeDraft,
    }
    await updateProfile(payload)
    setMessage('Profile updated successfully and ready for the next opportunity.')
    await loadDashboardData()
  }

  const handleDeletePurchase = async (purchaseId) => {
    if (!token) return
    setDeletingPurchaseId(purchaseId)
    try {
      const { data } = await apiClient.delete(`/purchases/${purchaseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setPurchases(data.purchases || [])
      setMessage('Booking removed from your profile.')
    } catch (error) {
      console.error(error)
      setMessage('The booking could not be removed. Please try again.')
    } finally {
      setDeletingPurchaseId(null)
    }
  }

  const saveQuickAction = async () => {
    if (!token) return
    try {
      const payload = {
        resumeUrl: resumeDraft,
        projects: Array.isArray(user?.projects) ? user.projects : [],
        certificates: Array.isArray(user?.certificates) ? user.certificates : [],
      }

      if (quickAction === 'project') {
        payload.projects = [
          ...(Array.isArray(user?.projects) ? user.projects : []),
          { ...projectDraft, title: projectDraft.title.trim(), description: projectDraft.description.trim() },
        ]
      }

      if (quickAction === 'certificate') {
        payload.certificates = [
          ...(Array.isArray(user?.certificates) ? user.certificates : []),
          `${certificateDraft.title.trim()} • ${certificateDraft.issuer.trim()} • ${certificateDraft.year.trim()}`,
        ]
      }

      await updateProfile(payload)
      setMessage(`${quickAction === 'resume' ? 'Resume link' : quickAction === 'project' ? 'Project' : 'Certificate'} saved successfully.`)
      setQuickAction(null)
      setProjectDraft({ title: '', link: '', description: '' })
      setCertificateDraft({ title: '', issuer: '', year: '' })
      await loadDashboardData()
    } catch (error) {
      console.error(error)
      setMessage('The quick action could not be saved. Please try again.')
    }
  }

  const addSkill = () => {
    const value = newSkill.trim()
    if (!value || skills.includes(value)) return
    setSkills([...skills, value])
    setNewSkill('')
  }

  const removeSkill = (skill) => setSkills(skills.filter((entry) => entry !== skill))

  const addExperience = () => {
    setExperience([...experience, { company: '', position: '', startDate: '', endDate: '', description: '' }])
  }

  const updateExperience = (index, field, value) => {
    const updated = [...experience]
    updated[index][field] = value
    setExperience(updated)
  }

  const removeExperience = (index) => setExperience(experience.filter((_, entryIndex) => entryIndex !== index))

  const addEducation = () => {
    setEducation([...education, { institution: '', degree: '', year: '' }])
  }

  const updateEducation = (index, field, value) => {
    const updated = [...education]
    updated[index][field] = value
    setEducation(updated)
  }

  const removeEducation = (index) => setEducation(education.filter((_, entryIndex) => entryIndex !== index))

  const addAchievement = () => {
    const value = newAchievement.trim()
    if (!value || achievements.includes(value)) return
    setAchievements([...achievements, value])
    setNewAchievement('')
  }

  const removeAchievement = (achievement) => setAchievements(achievements.filter((entry) => entry !== achievement))

  if (!user) return <div className="px-4 py-16 text-center text-slate-500">Please sign in to edit your profile.</div>

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.14)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/20 bg-white/10 text-2xl font-semibold shadow-lg">
                  {photoPreview ? <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" /> : user.name?.slice(0, 1).toUpperCase()}
                </div>
                <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-blue-500 text-white shadow-lg">
                  <Camera size={16} />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-200">Professional profile</p>
                <h1 className="mt-2 text-3xl font-semibold">{user.name}</h1>
                <p className="mt-2 text-sm text-slate-300">{user.profession || 'Modern professional'} • {user.location || 'Location not added yet'}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-200">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">{user.role === 'employer' ? 'Employer' : 'Worker'}</span>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-emerald-200"><BadgeCheck size={14} className="mr-1 inline" /> Verified</span>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-sm text-slate-300">Profile completion</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${completionScore}%` }} />
                </div>
                <span className="text-sm font-semibold">{completionScore}%</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-200">
                <button type="button" onClick={() => setQuickAction('edit')} className="rounded-full bg-white/15 px-3 py-2">Edit profile</button>
                <button type="button" onClick={() => setQuickAction('resume')} className="rounded-full bg-white/15 px-3 py-2">Upload resume</button>
                <button type="button" onClick={() => setQuickAction('certificate')} className="rounded-full bg-white/15 px-3 py-2">Add certificate</button>
              </div>
            </div>
          </div>
        </div>

        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Jobs applied', value: stats.totalJobsApplied, icon: Briefcase },
            { label: 'Jobs posted', value: stats.totalJobsPosted, icon: FileText },
            { label: 'Bookings', value: stats.totalBookings, icon: Wallet },
            { label: 'Reviews', value: stats.totalReviews, icon: TrendingUp },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center gap-2 text-blue-600"><Icon size={18} /> {item.label}</div>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Career snapshot</h2>
                <p className="mt-1 text-sm text-slate-500">Your live work activity, bookings, and profile momentum are grouped here.</p>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">Live stats</div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-900"><Briefcase size={16} /> Job posting status</div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Active: {stats.activeJobs}</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Pending: {stats.pendingJobs}</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">Completed: {stats.completedJobs}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-900"><Wallet size={16} /> Booking progress</div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Confirmed: {stats.confirmedBookings}</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Pending: {stats.pendingBookings}</span>
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Completed: {stats.completedBookings}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900"><Clock3 size={16} /> Recent activity</div>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                {timeline.length ? timeline.map((item, index) => (
                  <div key={`${item.type}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <span>{item.title}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.type}</span>
                  </div>
                )) : <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">Your latest activity will appear here as soon as you post a job, apply, or book a service.</div>}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2 text-blue-600"><Sparkles size={18} /> Quick actions</div>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Edit profile', action: 'edit' },
                { label: 'Upload resume', action: 'resume' },
                { label: 'Add project', action: 'project' },
                { label: 'Add certificate', action: 'certificate' },
              ].map((entry) => (
                <button key={entry.action} type="button" onClick={() => setQuickAction(entry.action)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50">
                  <span>{entry.label}</span>
                  <Edit3 size={14} className="text-blue-600" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Booked work</h2>
              <p className="mt-1 text-sm text-slate-500">Your recent bookings and services appear here.</p>
            </div>
            <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{purchases.length} booked</div>
          </div>

          {purchases.length ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {purchases.slice(0, 6).map((purchase) => (
                <div key={purchase.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{purchase.workerName || purchase.service || 'Booked service'}</p>
                      <p className="mt-1 text-sm text-slate-500">{purchase.workerProfession || purchase.service || 'Service booking'}</p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">₹{purchase.amount || 0}</div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{purchase.service || 'Confirmed booking'}</p>
                  <button type="button" onClick={() => handleDeletePurchase(purchase.id)} disabled={deletingPurchaseId === purchase.id} className="mt-4 rounded-full border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                    {deletingPurchaseId === purchase.id ? 'Removing...' : 'Delete booking'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No bookings yet. Browse workers and confirm a service to see it here.</div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Complete your profile</h2>
                <p className="mt-1 text-sm text-slate-500">Add the details that help you stand out professionally.</p>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{user.role}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" {...register('name')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" {...register('email')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" {...register('phone')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Profession / Work Category</label>
                <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" {...register('profession')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Location</label>
                <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" {...register('address')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Availability</label>
                <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" {...register('availability')} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900"><Sparkles size={16} /> Skills</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="text-slate-400"><X size={14} /></button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input value={newSkill} onChange={(event) => setNewSkill(event.target.value)} className="min-w-[180px] rounded-full border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Add a skill" />
                <button type="button" onClick={addSkill} className="rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Add skill</button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900"><Briefcase size={16} /> Experience</div>
                <button type="button" onClick={addExperience} className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">Add experience</button>
              </div>
              <div className="mt-4 space-y-3">
                {experience.map((item, index) => (
                  <div key={`${item.company}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <input value={item.company} onChange={(event) => updateExperience(index, 'company', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Company" />
                      <input value={item.position} onChange={(event) => updateExperience(index, 'position', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Position" />
                      <input value={item.startDate} onChange={(event) => updateExperience(index, 'startDate', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Start date" />
                      <input value={item.endDate} onChange={(event) => updateExperience(index, 'endDate', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="End date" />
                    </div>
                    <textarea value={item.description} onChange={(event) => updateExperience(index, 'description', event.target.value)} className="mt-3 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Description" rows="2" />
                    <button type="button" onClick={() => removeExperience(index)} className="mt-2 rounded-full border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900"><GraduationCap size={16} /> Education</div>
                <button type="button" onClick={addEducation} className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">Add education</button>
              </div>
              <div className="mt-4 space-y-3">
                {education.map((item, index) => (
                  <div key={`${item.institution}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <input value={item.institution} onChange={(event) => updateEducation(index, 'institution', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="School / College" />
                      <input value={item.degree} onChange={(event) => updateEducation(index, 'degree', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Degree" />
                      <input value={item.year} onChange={(event) => updateEducation(index, 'year', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Year" />
                    </div>
                    <button type="button" onClick={() => removeEducation(index)} className="mt-2 rounded-full border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900"><FileText size={16} /> Portfolio & resume</div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input value={portfolio.github} onChange={(event) => setPortfolio({ ...portfolio, github: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="GitHub link" />
                <input value={portfolio.linkedin} onChange={(event) => setPortfolio({ ...portfolio, linkedin: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="LinkedIn link" />
                <input value={portfolio.website} onChange={(event) => setPortfolio({ ...portfolio, website: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Website link" />
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-600">
                <UploadCloud size={16} /> Upload resume (PDF)
                <input type="file" accept="application/pdf" className="hidden" />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900"><CheckCircle2 size={16} /> Achievements</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {achievements.map((achievement) => (
                  <span key={achievement} className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                    {achievement}
                    <button type="button" onClick={() => removeAchievement(achievement)} className="text-slate-400"><X size={14} /></button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <input value={newAchievement} onChange={(event) => setNewAchievement(event.target.value)} className="min-w-[220px] rounded-full border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Add achievement or award" />
                <button type="button" onClick={addAchievement} className="rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Add</button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900"><Clock3 size={16} /> Notification settings</div>
              <div className="mt-3 space-y-2">
                {Object.entries(notifications).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    <span className="capitalize">{key} notifications</span>
                    <input type="checkbox" checked={value} onChange={() => setNotifications({ ...notifications, [key]: !value })} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-3 font-semibold text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl">
                <UploadCloud size={16} /> Save profile
              </button>
              <button type="button" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Change password</button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2 text-blue-600"><ShieldCheck size={18} /> Security & privacy</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Change password</div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Change mobile number</div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">Two-factor authentication</div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2 text-slate-900"><UserCircle2 size={18} /> Profile details</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="text-xs uppercase tracking-[0.2em] text-slate-400">Full name</div><div className="mt-1 font-medium text-slate-900">{user.name}</div></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</div><div className="mt-1 font-medium text-slate-900">{user.email}</div></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="text-xs uppercase tracking-[0.2em] text-slate-400">Mobile</div><div className="mt-1 font-medium text-slate-900">{user.phone || 'Add your phone'}</div></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="text-xs uppercase tracking-[0.2em] text-slate-400">Account status</div><div className="mt-1 font-medium text-emerald-700">Verified • Active</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {quickAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{quickAction === 'resume' ? 'Upload resume' : quickAction === 'project' ? 'Add project' : quickAction === 'certificate' ? 'Add certificate' : 'Edit profile'}</h3>
              <button type="button" onClick={() => setQuickAction(null)} className="rounded-full border border-slate-200 p-2 text-slate-500">
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {quickAction === 'resume' ? (
                <>
                  <label className="text-sm font-medium text-slate-700">Resume link</label>
                  <input value={resumeDraft} onChange={(event) => setResumeDraft(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="https://..." />
                </>
              ) : null}
              {quickAction === 'project' ? (
                <>
                  <input value={projectDraft.title} onChange={(event) => setProjectDraft({ ...projectDraft, title: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Project title" />
                  <input value={projectDraft.link} onChange={(event) => setProjectDraft({ ...projectDraft, link: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Project link" />
                  <textarea value={projectDraft.description} onChange={(event) => setProjectDraft({ ...projectDraft, description: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" rows="3" placeholder="Describe what you delivered" />
                </>
              ) : null}
              {quickAction === 'certificate' ? (
                <>
                  <input value={certificateDraft.title} onChange={(event) => setCertificateDraft({ ...certificateDraft, title: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Certificate title" />
                  <input value={certificateDraft.issuer} onChange={(event) => setCertificateDraft({ ...certificateDraft, issuer: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Issuer" />
                  <input value={certificateDraft.year} onChange={(event) => setCertificateDraft({ ...certificateDraft, year: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Year" />
                </>
              ) : null}
              {quickAction === 'edit' ? (
                <p className="text-sm text-slate-600">You can update your main profile details in the form below, then save to refresh your details instantly.</p>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setQuickAction(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button type="button" onClick={saveQuickAction} className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ProfilePage
