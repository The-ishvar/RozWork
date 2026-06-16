import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, Camera, Edit3, Mail, MapPin, Phone, ShieldCheck, Sparkles, Wallet, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const initialProfileState = {
  name: '',
  email: '',
  phone: '',
  profession: '',
  location: '',
  bio: '',
  availability: 'Available now',
  newSkill: '',
  newAchievement: '',
}

const serviceCategoryOptions = ['Electrician', 'Plumber', 'Carpenter', 'Painter', 'Driver', 'Delivery Boy', 'Farmer', 'Labour', 'House Helper', 'Cleaner', 'Mechanic', 'AC Repair', 'Mobile Repair', 'Computer Repair', 'Tutor', 'Freelancer', 'Other']

const ProfilePage = () => {
  const { user, updateProfile, token } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [profile, setProfile] = useState(initialProfileState)
  const [stats, setStats] = useState({ totalJobsPosted: 0, totalBookings: 0 })
  const [purchases, setPurchases] = useState([])
  const [myPosts, setMyPosts] = useState([])
  const [bookings, setBookings] = useState([])
  const [serviceCategories, setServiceCategories] = useState([])
  const [skills, setSkills] = useState(['React', 'Tailwind CSS', 'Node.js'])
  const [experience, setExperience] = useState([{ company: '', position: '', startDate: '', endDate: '', description: '' }])
  const [education, setEducation] = useState([{ institution: '', degree: '', year: '' }])
  const [achievements, setAchievements] = useState(['Top Rated Freelancer'])
  const [portfolio, setPortfolio] = useState({ github: '', linkedin: '', website: '' })
  const [notifications, setNotifications] = useState({ email: true, sms: true, app: true })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [photoPreview, setPhotoPreview] = useState('')
  const [resumeDraft, setResumeDraft] = useState('')
  const [message, setMessage] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isPostEditorOpen, setIsPostEditorOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [editingPostForm, setEditingPostForm] = useState({ title: '', category: '', location: '', salary: '', budget: '', description: '', workType: 'Full Time' })
  const [focusMode, setFocusMode] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [loading, setLoading] = useState(false)

  const loadDashboardData = async () => {
    if (!user || !token) return
    try {
      const [purchasesResult, statsResult, jobsResult, bookingsResult] = await Promise.allSettled([
        apiClient.get('/purchases', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/jobs/mine', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/bookings', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      setPurchases(purchasesResult.status === 'fulfilled' ? purchasesResult.value.data.purchases || [] : [])
      setStats(statsResult.status === 'fulfilled' ? statsResult.value.data?.stats || { totalJobsPosted: 0, totalBookings: 0 } : { totalJobsPosted: 0, totalBookings: 0 })
      setMyPosts(jobsResult.status === 'fulfilled' ? jobsResult.value.data.jobs || [] : [])
      setBookings(bookingsResult.status === 'fulfilled' ? bookingsResult.value.data.bookings || [] : [])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (location.state?.successMessage) {
      setMessage(location.state.successMessage)
    }
  }, [location.state])

  useEffect(() => {
    if (!user) return
    loadDashboardData()
    setProfile({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      profession: user.profession || '',
      location: user.location || '',
      bio: user.bio || '',
      availability: user.availability || 'Available now',
      newSkill: '',
      newAchievement: '',
    })
    setPhotoPreview(user.photo || '')
    setServiceCategories(Array.isArray(user.serviceCategories) ? user.serviceCategories : [])
    setSkills(Array.isArray(user.skills) && user.skills.length ? user.skills : skills)
    setExperience(Array.isArray(user.experience) && user.experience.length ? user.experience : [{ company: '', position: '', startDate: '', endDate: '', description: '' }])
    setEducation(Array.isArray(user.education) && user.education.length ? user.education : [{ institution: '', degree: '', year: '' }])
    setAchievements(Array.isArray(user.certificates) && user.certificates.length ? user.certificates : achievements)
    setPortfolio({ github: user.portfolio?.[0] || '', linkedin: user.portfolio?.[1] || '', website: user.portfolio?.[2] || '' })
    setResumeDraft(user.resumeUrl || '')
  }, [user, token])

  const completionScore = useMemo(() => {
    const checks = [Boolean(profile.name), Boolean(profile.email), Boolean(profile.phone), Boolean(profile.profession), Boolean(profile.location), skills.length > 0, experience.some((item) => item.company || item.position), education.some((item) => item.institution || item.degree), Boolean(photoPreview)]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [education, experience, photoPreview, profile.email, profile.location, profile.name, profile.phone, profile.profession, skills])

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    if (!user || !token) return
    try {
      setLoading(true)
      const payload = {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        profession: profile.profession.trim(),
        location: profile.location.trim(),
        bio: profile.bio.trim(),
        availability: profile.availability.trim(),
        photo: photoPreview || user.photo || '',
        serviceCategories,
        skills,
        experience,
        education,
        achievements,
        portfolio: [portfolio.github, portfolio.linkedin, portfolio.website].filter(Boolean),
        socialLinks: [portfolio.github, portfolio.linkedin, portfolio.website].filter(Boolean),
        notificationsEnabled: notifications.email || notifications.sms || notifications.app,
        resumeUrl: resumeDraft,
      }
      await updateProfile(payload)
      setMessage('Profile updated successfully and ready for the next opportunity.')
      await loadDashboardData()
      setIsEditorOpen(false)
    } catch (error) {
      setMessage('The profile could not be saved right now.')
    } finally {
      setLoading(false)
    }
  }

  const openPostEditor = (post) => {
    setEditingPost(post)
    setEditingPostForm({
      title: post.title || '',
      category: post.category || '',
      location: post.location || '',
      salary: post.salary || post.price || '',
      budget: post.budget || post.salary || '',
      description: post.description || '',
      workType: post.workType || 'Full Time',
    })
    setIsPostEditorOpen(true)
  }

  const handleDeletePost = async (postId) => {
    if (!token) return
    try {
      await apiClient.delete(`/jobs/${postId}`, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Post deleted successfully.')
      await loadDashboardData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to delete this post right now.')
    }
  }

  const handleSavePost = async () => {
    if (!token || !editingPost) return
    try {
      await apiClient.put(`/jobs/${editingPost.id}`, {
        title: editingPostForm.title.trim(),
        category: editingPostForm.category.trim(),
        location: editingPostForm.location.trim(),
        salary: editingPostForm.salary.trim(),
        budget: editingPostForm.budget.trim() || editingPostForm.salary.trim(),
        description: editingPostForm.description.trim(),
        workType: editingPostForm.workType.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Post updated successfully.')
      setIsPostEditorOpen(false)
      setEditingPost(null)
      await loadDashboardData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to update this post right now.')
    }
  }

  const handlePasswordUpdate = async () => {
    if (!token) return
    try {
      setLoading(true)
      await apiClient.put('/users/password', passwords, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Password updated successfully.')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to update the password right now.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className="px-4 py-16 text-center text-slate-500">{t('profile.signInPrompt', 'Please sign in to edit your profile.')}</div>

  return (
    <div className={`min-h-screen px-4 py-8 transition-all duration-500 sm:px-6 lg:px-8 ${focusMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className={`rounded-[32px] border border-slate-200 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 ${focusMode ? 'bg-white/10' : 'bg-white'}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-semibold text-white">
                {photoPreview ? <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" /> : user.name?.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold">{user.name}</h1>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Verified</span>
                </div>
                <p className={`mt-1 text-sm ${focusMode ? 'text-slate-300' : 'text-slate-500'}`}>{user.email}</p>
                <p className={`mt-2 text-sm ${focusMode ? 'text-slate-300' : 'text-slate-500'}`}>{user.profession || 'Professional profile'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setFocusMode((value) => !value)} className={`rounded-full border px-4 py-2 text-sm font-medium ${focusMode ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{focusMode ? t('profile.exitFocusMode', 'Exit focus mode') : t('profile.focusMode', 'Focus mode')}</button>
              <button type="button" onClick={() => { setActiveSection('personal'); setIsEditorOpen(true) }} className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                <Edit3 size={16} /> {t('profile.editProfile', 'Edit profile')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className={`rounded-[32px] border border-slate-200 p-6 shadow-sm sm:p-8 ${focusMode ? 'bg-white/10' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">{t('profile.professionalProfile', 'Professional profile')}</p>
                <h2 className="mt-2 text-xl font-semibold">{t('profile.readyForMarketplace', 'Your profile is ready for a premium marketplace experience.')}</h2>
              </div>
              <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">{completionScore}% complete</div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className={`rounded-2xl border border-slate-200 p-4 ${focusMode ? 'bg-white/10' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2"><Briefcase size={16} /> {t('profile.jobs', 'Jobs')}</div>
                <p className="mt-3 text-2xl font-semibold">{stats.totalJobsPosted || 0}</p>
              </div>
              <div className={`rounded-2xl border border-slate-200 p-4 ${focusMode ? 'bg-white/10' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2"><Wallet size={16} /> {t('profile.bookings', 'Bookings')}</div>
                <p className="mt-3 text-2xl font-semibold">{stats.totalBookings || 0}</p>
              </div>
            </div>
          </div>

          <div className={`rounded-[32px] border border-slate-200 p-6 shadow-sm sm:p-8 ${focusMode ? 'bg-white/10' : 'bg-white'}`}>
            <div className="flex items-center gap-2"><ShieldCheck size={16} /> {t('profile.recentActivity', 'Recent activity')}</div>
            <div className="mt-6 space-y-4">
              {purchases.length ? purchases.slice(0, 4).map((purchase) => (
                <div key={purchase.id} className={`rounded-2xl border border-slate-200 p-3 ${focusMode ? 'bg-white/10' : 'bg-slate-50'}`}>
                  <p className="font-semibold">{purchase.workerName || purchase.service || t('profile.serviceBooking', 'Service booking')}</p>
                  <p className="mt-1 text-sm text-slate-500">₹{purchase.amount || 0}</p>
                </div>
              )) : <p className="text-sm text-slate-500">{t('profile.noRecentBookings', 'Your recent bookings will appear here.')}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-6">
        <section className={`rounded-[32px] border border-slate-200 p-6 shadow-sm ${focusMode ? 'bg-white/10' : 'bg-white'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{t('profile.myPosts', 'My posts')}</p>
              <h2 className="mt-2 text-xl font-semibold">{t('profile.managePostedJobs', 'Manage your posted jobs')}</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{myPosts.length} {t('profile.active', 'active')}</span>
          </div>
          <div className="mt-6 space-y-3">
            {myPosts.length ? myPosts.map((post) => (
              <div key={post.id} className={`rounded-2xl border border-slate-200 p-4 ${focusMode ? 'bg-white/10' : 'bg-slate-50'}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{post.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{post.category} • {post.location}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openPostEditor(post)} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">{t('profile.edit', 'Edit')}</button>
                    <button type="button" onClick={() => handleDeletePost(post.id)} className="rounded-full border border-red-200 px-3 py-2 text-sm font-medium text-red-700">{t('profile.delete', 'Delete')}</button>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">You have not posted any jobs yet.</p>}
          </div>
        </section>

        <section className={`rounded-[32px] border border-slate-200 p-6 shadow-sm ${focusMode ? 'bg-white/10' : 'bg-white'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">My bookings</p>
              <h2 className="mt-2 text-xl font-semibold">Track every application and booking</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{bookings.length} total</span>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700">Job title</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700">Employer</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700">Booked</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700">Price</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {bookings.length ? bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-3 py-3 font-medium text-slate-900">{booking.serviceTitle || booking.jobTitle || t('profile.booking', 'Booking')}</td>
                    <td className="px-3 py-3 text-slate-600">{booking.serviceProvider || booking.employerName || t('profile.employer', 'Employer')}</td>
                    <td className="px-3 py-3 text-slate-600">{new Date(booking.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-slate-600">₹{booking.price || booking.amount || 0}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : booking.status === 'accepted' ? 'bg-blue-100 text-blue-700' : booking.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{booking.status || t('profile.pending', 'Pending')}</span>
                    </td>
                  </tr>
                )) : <tr><td className="px-3 py-3 text-sm text-slate-500" colSpan="5">{t('profile.noBookingsYet', 'No bookings yet. Apply to a job and it will show up here.')}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isPostEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className={`w-full max-w-2xl rounded-[28px] border border-slate-200 p-6 shadow-2xl ${focusMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Edit post</p>
                <h3 className="mt-1 text-xl font-semibold">Update your job listing</h3>
              </div>
              <button type="button" onClick={() => { setIsPostEditorOpen(false); setEditingPost(null) }} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium">Close</button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input value={editingPostForm.title} onChange={(event) => setEditingPostForm({ ...editingPostForm, title: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Title" />
              <input value={editingPostForm.category} onChange={(event) => setEditingPostForm({ ...editingPostForm, category: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Category" />
              <input value={editingPostForm.location} onChange={(event) => setEditingPostForm({ ...editingPostForm, location: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Location" />
              <input value={editingPostForm.salary} onChange={(event) => setEditingPostForm({ ...editingPostForm, salary: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Salary" />
              <input value={editingPostForm.budget} onChange={(event) => setEditingPostForm({ ...editingPostForm, budget: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Budget" />
              <input value={editingPostForm.workType} onChange={(event) => setEditingPostForm({ ...editingPostForm, workType: event.target.value })} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Work type" />
              <textarea value={editingPostForm.description} onChange={(event) => setEditingPostForm({ ...editingPostForm, description: event.target.value })} className="md:col-span-2 rounded-2xl border border-slate-200 px-3 py-2" rows="4" placeholder="Description" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setIsPostEditorOpen(false); setEditingPost(null) }} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium">Cancel</button>
              <button type="button" onClick={handleSavePost} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Save changes</button>
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {isEditorOpen ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.25, ease: 'easeOut' }} className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-[32px] bg-slate-50 p-4 shadow-2xl sm:p-6 lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:max-w-2xl lg:rounded-[32px]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Edit profile</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Craft your professional identity</h2>
                </div>
                <button type="button" onClick={() => setIsEditorOpen(false)} className="rounded-full bg-white p-2 shadow-sm">
                  <X size={16} />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">Profile photo</p>
                    <label className="flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                      <Camera size={16} /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-lg font-semibold text-slate-700">
                      {photoPreview ? <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" /> : user.name?.slice(0, 1).toUpperCase()}
                    </div>
                    <p className="text-sm text-slate-500">Upload a polished photo to make your profile feel premium and credible.</p>
                  </div>
                </div>

                {['personal', 'categories', 'skills', 'experience', 'education', 'portfolio', 'resume', 'achievements', 'notifications', 'password'].map((section) => (
                  <div key={section} className="rounded-[24px] border border-slate-200 bg-white p-4">
                    <button type="button" onClick={() => setActiveSection((current) => current === section ? '' : section)} className="flex w-full items-center justify-between text-left">
                      <span className="font-semibold text-slate-900">{section === 'personal' ? 'Personal details' : section === 'categories' ? 'Service categories' : section === 'skills' ? 'Skills' : section === 'experience' ? 'Experience' : section === 'education' ? 'Education' : section === 'portfolio' ? 'Portfolio' : section === 'resume' ? 'Resume' : section === 'achievements' ? 'Achievements' : section === 'notifications' ? 'Notification settings' : 'Password settings'}</span>
                      <span className="text-sm text-slate-500">{activeSection === section ? 'Hide' : 'Show'}</span>
                    </button>
                    {activeSection === section ? (
                      <div className="mt-4 space-y-4">
                        {section === 'personal' ? (
                          <div className="grid gap-4 md:grid-cols-2">
                            <input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" />
                            <input value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" />
                            <input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Phone" />
                            <input value={profile.profession} onChange={(event) => setProfile({ ...profile, profession: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Profession" />
                            <input value={profile.location} onChange={(event) => setProfile({ ...profile, location: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Location" />
                            <input value={profile.availability} onChange={(event) => setProfile({ ...profile, availability: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Availability" />
                            <textarea value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} className="md:col-span-2 rounded-2xl border border-slate-200 px-4 py-3" rows="3" placeholder="Bio" />
                          </div>
                        ) : null}
                        {section === 'categories' ? (
                          <div className="flex flex-wrap gap-2">
                            {serviceCategoryOptions.map((category) => (
                              <button key={category} type="button" onClick={() => setServiceCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category])} className={`rounded-full px-3 py-2 text-sm font-medium ${serviceCategories.includes(category) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                {category}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        {section === 'skills' ? (
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {skills.map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">{skill}</span>)}
                            </div>
                            <div className="flex gap-2">
                              <input value={profile.newSkill} onChange={(event) => setProfile({ ...profile, newSkill: event.target.value })} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Add a skill" />
                              <button type="button" onClick={() => { const value = profile.newSkill.trim(); if (!value) return; setSkills((current) => [...current, value]); setProfile({ ...profile, newSkill: '' }) }} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">Add</button>
                            </div>
                          </div>
                        ) : null}
                        {section === 'experience' ? (
                          <div className="space-y-3">
                            {experience.map((entry, index) => (
                              <div key={index} className="rounded-2xl border border-slate-200 p-3">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <input value={entry.company} onChange={(event) => { const updated = [...experience]; updated[index].company = event.target.value; setExperience(updated) }} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Company" />
                                  <input value={entry.position} onChange={(event) => { const updated = [...experience]; updated[index].position = event.target.value; setExperience(updated) }} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Position" />
                                  <input value={entry.startDate} onChange={(event) => { const updated = [...experience]; updated[index].startDate = event.target.value; setExperience(updated) }} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Start date" />
                                  <input value={entry.endDate} onChange={(event) => { const updated = [...experience]; updated[index].endDate = event.target.value; setExperience(updated) }} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="End date" />
                                  <textarea value={entry.description} onChange={(event) => { const updated = [...experience]; updated[index].description = event.target.value; setExperience(updated) }} className="md:col-span-2 rounded-2xl border border-slate-200 px-3 py-2" rows="2" placeholder="Description" />
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={() => setExperience((current) => [...current, { company: '', position: '', startDate: '', endDate: '', description: '' }])} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Add experience</button>
                          </div>
                        ) : null}
                        {section === 'education' ? (
                          <div className="space-y-3">
                            {education.map((entry, index) => (
                              <div key={index} className="rounded-2xl border border-slate-200 p-3">
                                <div className="grid gap-3 md:grid-cols-3">
                                  <input value={entry.institution} onChange={(event) => { const updated = [...education]; updated[index].institution = event.target.value; setEducation(updated) }} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Institution" />
                                  <input value={entry.degree} onChange={(event) => { const updated = [...education]; updated[index].degree = event.target.value; setEducation(updated) }} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Degree" />
                                  <input value={entry.year} onChange={(event) => { const updated = [...education]; updated[index].year = event.target.value; setEducation(updated) }} className="rounded-2xl border border-slate-200 px-3 py-2" placeholder="Year" />
                                </div>
                              </div>
                            ))}
                            <button type="button" onClick={() => setEducation((current) => [...current, { institution: '', degree: '', year: '' }])} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">Add education</button>
                          </div>
                        ) : null}
                        {section === 'portfolio' ? (
                          <div className="grid gap-3">
                            <input value={portfolio.github} onChange={(event) => setPortfolio({ ...portfolio, github: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="GitHub / portfolio link" />
                            <input value={portfolio.linkedin} onChange={(event) => setPortfolio({ ...portfolio, linkedin: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="LinkedIn profile" />
                            <input value={portfolio.website} onChange={(event) => setPortfolio({ ...portfolio, website: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Website" />
                          </div>
                        ) : null}
                        {section === 'resume' ? <textarea value={resumeDraft} onChange={(event) => setResumeDraft(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3" rows="3" placeholder="Resume link or summary" /> : null}
                        {section === 'achievements' ? (
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {achievements.map((achievement) => <span key={achievement} className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{achievement}</span>)}
                            </div>
                            <div className="flex gap-2">
                              <input value={profile.newAchievement} onChange={(event) => setProfile({ ...profile, newAchievement: event.target.value })} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Add an achievement" />
                              <button type="button" onClick={() => { const value = profile.newAchievement.trim(); if (!value) return; setAchievements((current) => [...current, value]); setProfile({ ...profile, newAchievement: '' }) }} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white">Add</button>
                            </div>
                          </div>
                        ) : null}
                        {section === 'notifications' ? (
                          <div className="space-y-3">
                            {Object.entries(notifications).map(([key, value]) => (
                              <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                                <span className="text-sm font-medium text-slate-700">{key} notifications</span>
                                <input type="checkbox" checked={value} onChange={() => setNotifications((current) => ({ ...current, [key]: !current[key] }))} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                              </label>
                            ))}
                          </div>
                        ) : null}
                        {section === 'password' ? (
                          <div className="grid gap-3">
                            <input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Current password" />
                            <input type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="New password" />
                            <input type="password" value={passwords.confirmPassword} onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Confirm password" />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}

                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" onClick={() => setIsEditorOpen(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">{t('common.cancel', 'Cancel')}</button>
                  <button type="button" onClick={() => { if (activeSection === 'password') { void handlePasswordUpdate() } else { void handleSaveProfile() } }} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{loading ? t('profile.saving', 'Saving...') : t('profile.saveProfile', 'Save profile')}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {message ? <div className="mx-auto mt-4 max-w-6xl rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
    </div>
  )
}

export default ProfilePage
