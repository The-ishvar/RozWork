import request from 'supertest'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { app, resetState } from '../src/app.js'

jest.setTimeout(30000)

describe('RozWork API', () => {
  beforeEach(async () => {
    await resetState()
  })

  it('returns health status', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
  })

  it('creates and retrieves jobs through the CRUD API', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Asha',
      email: 'job-creator@example.com',
      password: 'secret123',
      role: 'employer',
    })

    const createResponse = await request(app)
      .post('/api/jobs/create')
      .set('Authorization', `Bearer ${registerResponse.body.token}`)
      .send({
        title: 'Weekend Garden Support',
        category: 'Farm Labour',
        location: 'Lahore',
        salary: '₹800/day',
        description: 'Help with watering, harvesting, and basic garden maintenance.',
      })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.job.title).toBe('Weekend Garden Support')

    const listResponse = await request(app).get('/api/jobs')
    expect(listResponse.status).toBe(200)
    expect(listResponse.body.jobs.some((job) => job.title === 'Weekend Garden Support')).toBe(true)

    const detailResponse = await request(app).get(`/api/jobs/${createResponse.body.job.id}`)
    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.job.title).toBe('Weekend Garden Support')
  })

  it('seeds demo credentials for a fresh app instance', async () => {
    jest.resetModules()
    const { app: freshApp } = await import('../src/app.js')

    const response = await request(freshApp).post('/api/auth/login').send({
      identifier: 'demo@rozwork.com',
      password: 'demo123456',
    })

    expect(response.status).toBe(200)
    expect(response.body.user.email).toBe('demo@rozwork.com')
  })

  it('allows the frontend dev server origin to access the API', async () => {
    const response = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:5175')
      .set('Access-Control-Request-Method', 'POST')

    expect(response.status).toBe(204)
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5175')
  })

  it('supports search and category discovery endpoints', async () => {
    const categoriesResponse = await request(app).get('/api/search/categories')
    const searchResponse = await request(app).get('/api/search?q=plumbing')

    expect(categoriesResponse.status).toBe(200)
    expect(categoriesResponse.body.categories.length).toBeGreaterThan(0)
    expect(searchResponse.status).toBe(200)
    expect(searchResponse.body.jobs.length).toBeGreaterThan(0)
  })

  it('supports goal-based job filtering for the demo experience', async () => {
    const response = await request(app).get('/api/jobs?goal=quick-income')

    expect(response.status).toBe(200)
    expect(response.body.jobs.length).toBeGreaterThan(0)
    expect(response.body.jobs.every((job) => (job.goalTags || []).includes('quick-income'))).toBe(true)
  })

  it('seeds ten worker profiles for the marketplace', async () => {
    const response = await request(app).get('/api/workers')

    expect(response.status).toBe(200)
    expect(response.body.workers.length).toBeGreaterThanOrEqual(10)
  })

  it('seeds category-based jobs for the homepage cards', async () => {
    const response = await request(app).get('/api/jobs')

    expect(response.status).toBe(200)
    expect(response.body.jobs.length).toBeGreaterThanOrEqual(5)
    expect(response.body.jobs.map((job) => job.category)).toEqual(
      expect.arrayContaining(['Farm Labour', 'Skilled Trades', 'Drivers', 'House Helpers', 'Students']),
    )
  })

  it('registers a new user', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Asha',
      email: 'asha@example.com',
      password: 'secret123',
      role: 'worker',
    })

    expect(response.status).toBe(201)
    expect(response.body.user.email).toBe('asha@example.com')
    expect(response.body.token).toBeTruthy()
  })

  it('logs in a user with a phone number', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Ravi',
      email: 'ravi@example.com',
      phone: '9876543210',
      password: 'secret123',
      role: 'worker',
    })

    const response = await request(app).post('/api/auth/login').send({
      identifier: '9876543210',
      password: 'secret123',
    })

    expect(response.status).toBe(200)
    expect(response.body.user.phone).toBe('9876543210')
    expect(response.body.token).toBeTruthy()
  })

  it('allows login with the seeded demo account', async () => {
    const response = await request(app).post('/api/auth/login').send({
      identifier: 'demo@rozwork.com',
      password: 'demo123456',
    })

    expect(response.status).toBe(200)
    expect(response.body.user.email).toBe('demo@rozwork.com')
    expect(response.body.token).toBeTruthy()
  })

  it('sends an OTP and resets a password after OTP verification', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Mina',
      email: 'mina@example.com',
      phone: '9998887776',
      password: 'secret123',
      role: 'worker',
    })

    const otpResponse = await request(app).post('/api/auth/forgot-password').send({
      phone: '9998887776',
    })

    expect(otpResponse.status).toBe(200)
    expect(otpResponse.body.message).toContain('OTP')

    const verifyResponse = await request(app).post('/api/auth/verify-otp').send({
      phone: '9998887776',
      otp: otpResponse.body.otp,
    })

    expect(verifyResponse.status).toBe(200)
    expect(verifyResponse.body.message).toContain('verified')

    const resetResponse = await request(app).post('/api/auth/reset-password').send({
      phone: '9998887776',
      otp: otpResponse.body.otp,
      password: 'newSecret456',
    })

    expect(resetResponse.status).toBe(200)

    const loginResponse = await request(app).post('/api/auth/login').send({
      identifier: '9998887776',
      password: 'newSecret456',
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.user.phone).toBe('9998887776')
  })

  it('allows the requested admin account to log in with a username', async () => {
    const response = await request(app).post('/api/auth/login').send({
      identifier: 'ishvar',
      password: '1234567890',
    })

    expect(response.status).toBe(200)
    expect(response.body.user.role).toBe('admin')
    expect(response.body.user.username).toBe('ishvar')
    expect(response.body.token).toBeTruthy()
  })

  it('allows the requested super admin account to log in with a phone number', async () => {
    const response = await request(app).post('/api/auth/login').send({
      identifier: '9660585691',
      password: '123456789',
    })

    expect(response.status).toBe(200)
    expect(response.body.user.role).toBe('super_admin')
    expect(response.body.user.phone).toBe('9660585691')
    expect(response.body.token).toBeTruthy()
  })

  it('records a purchase and adds it to the user profile', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Naina',
      email: 'naina@example.com',
      password: 'secret123',
      role: 'worker',
    })

    const response = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${registerResponse.body.token}`)
      .send({
        workerName: 'Asha Patel',
        workerProfession: 'Home Helper',
        amount: 500,
        service: 'Cleaning and home support',
      })

    expect(response.status).toBe(201)
    expect(response.body.purchase).toBeTruthy()
    expect(response.body.user.purchases).toEqual(expect.arrayContaining([expect.objectContaining({ workerName: 'Asha Patel' })]))
  })

  it('returns purchases for the authenticated user', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Karan',
      email: 'karan@example.com',
      password: 'secret123',
      role: 'worker',
    })

    await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${registerResponse.body.token}`)
      .send({
        workerName: 'Ravi Kumar',
        workerProfession: 'Driver',
        amount: 700,
        service: 'Driver booking',
      })

    const response = await request(app)
      .get('/api/purchases')
      .set('Authorization', `Bearer ${registerResponse.body.token}`)

    expect(response.status).toBe(200)
    expect(response.body.purchases).toEqual(expect.arrayContaining([expect.objectContaining({ workerName: 'Ravi Kumar' })]))
  })

  it('allows a user to delete a booked service from their profile', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Meera',
      email: 'meera@example.com',
      password: 'secret123',
      role: 'worker',
    })

    const purchaseResponse = await request(app)
      .post('/api/purchases')
      .set('Authorization', `Bearer ${registerResponse.body.token}`)
      .send({
        workerName: 'Asha Patel',
        workerProfession: 'Home Helper',
        amount: 500,
        service: 'Cleaning service',
      })

    const deleteResponse = await request(app)
      .delete(`/api/purchases/${purchaseResponse.body.purchase.id}`)
      .set('Authorization', `Bearer ${registerResponse.body.token}`)

    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body.purchases.some((purchase) => purchase.id === purchaseResponse.body.purchase.id)).toBe(false)
  })

  it('tracks login and registration history for super admins', async () => {
    const loginResponse = await request(app).post('/api/auth/login').send({
      identifier: 'superadmin',
      password: '123456789',
    })

    const response = await request(app)
      .get('/api/admin/audit')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.logs)).toBe(true)
    expect(response.body.logs.length).toBeGreaterThan(0)
  })

  it('returns a detailed super admin overview to admins', async () => {
    const loginResponse = await request(app).post('/api/auth/login').send({
      identifier: 'admin@rozwork.com',
      password: 'admin123456',
    })

    const response = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)

    expect(response.status).toBe(200)
    expect(response.body.stats).toBeTruthy()
    expect(response.body.users).toBeTruthy()
    expect(response.body.jobs).toBeTruthy()
    expect(response.body.recentPurchases).toBeTruthy()
  })

  it('allows an admin to view the user list', async () => {
    const loginResponse = await request(app).post('/api/auth/login').send({
      identifier: 'admin@rozwork.com',
      password: 'admin123456',
    })

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.users)).toBe(true)
    expect(response.body.users.length).toBeGreaterThan(0)
  })
})
