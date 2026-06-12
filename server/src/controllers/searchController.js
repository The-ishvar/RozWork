const dataService = require('../services/dataService')

const search = async (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase()
  const type = (req.query.type || 'all').toLowerCase()

  const [jobs, users] = await Promise.all([dataService.getJobs(), dataService.getUsers()])

  const filteredJobs = jobs.filter((job) => !query || [job.title, job.category, job.location, job.description].join(' ').toLowerCase().includes(query))
  const filteredUsers = users.filter((user) => !query || [user.name, user.profession, user.location, user.skills?.join(' ')].join(' ').toLowerCase().includes(query))

  const payload = {
    jobs: type === 'users' ? [] : filteredJobs,
    workers: type === 'jobs' ? [] : filteredUsers.filter((user) => user.role === 'worker'),
    employers: type === 'jobs' ? [] : filteredUsers.filter((user) => user.role === 'employer'),
  }

  return res.json(payload)
}

const listCategories = async (req, res) => {
  const categories = await dataService.listCategories()
  return res.json({ categories })
}

const getSettings = async (req, res) => {
  const settings = await dataService.getSettings()
  return res.json({ settings })
}

const updateSettings = async (req, res) => {
  const settings = await dataService.updateSettings(req.body)
  return res.json({ settings })
}

module.exports = { search, listCategories, getSettings, updateSettings }
