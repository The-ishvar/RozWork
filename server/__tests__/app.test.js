import request from 'supertest'
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { app, resetState } from '../src/app.js'

jest.setTimeout(60000)

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

  it('allows a registered user to log in with their username after registration', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Nisha Rao',
      email: 'nisha@example.com',
      username: 'nisharao',
      phone: '9876543211',
      password: 'secret123',
      role: 'worker',
    })

    const response = await request(app).post('/api/auth/login').send({
      identifier: 'nisharao',
      password: 'secret123',
    })

    expect(registerResponse.status).toBe(201)
    expect(response.status).toBe(200)
    expect(response.body.user.username).toBe('nisharao')
    expect(response.body.user.email).toBe('nisha@example.com')
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

  it('supports goal-based job filtering for posted jobs', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Kiran',
      email: 'kiran@example.com',
      password: 'secret123',
      role: 'employer',
    })

    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${registerResponse.body.token}`)
      .send({
        title: 'Driver for local deliveries',
        category: 'Drivers',
        location: 'Mumbai',
        salary: '₹900/day',
        description: 'Reliable driver for local deliveries and airport pickups.',
        goalTags: ['quick-income'],
      })

    const response = await request(app).get('/api/jobs?goal=quick-income')

    expect(response.status).toBe(200)
    expect(response.body.jobs.some((job) => job.title.includes('Driver'))).toBe(true)
  })

  it('persists profile updates and service categories in MongoDB', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Sara',
      email: 'sara@example.com',
      phone: '9876543212',
      password: 'secret123',
      role: 'worker',
    })

    const updateResponse = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${registerResponse.body.token}`)
      .send({
        name: 'Sara Khan',
        profession: 'Electrician',
        location: 'Delhi',
        bio: 'Certified electrician with 4 years of experience.',
        serviceCategories: ['Electrician', 'AC Repair'],
        photo: 'https://example.com/sara.jpg',
      })

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${registerResponse.body.token}`)

    expect(updateResponse.status).toBe(200)
    expect(meResponse.status).toBe(200)
    expect(meResponse.body.user.name).toBe('Sara Khan')
    expect(meResponse.body.user.location).toBe('Delhi')
    expect(meResponse.body.user.serviceCategories).toEqual(['Electrician', 'AC Repair'])
    expect(meResponse.body.user.photo).toBe('https://example.com/sara.jpg')
  })

  it('supports the booking lifecycle from pending to completed verification', async () => {
    const employerResponse = await request(app).post('/api/auth/register').send({
      name: 'Rina',
      email: 'rina@example.com',
      password: 'secret123',
      role: 'employer',
    })

    const workerResponse = await request(app).post('/api/auth/register').send({
      name: 'Aman',
      email: 'aman@example.com',
      password: 'secret123',
      role: 'worker',
    })

    const bookingResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${employerResponse.body.token}`)
      .send({
        workerId: workerResponse.body.user.id,
        jobId: 'job_123',
        price: 2500,
        category: 'Electrician',
        serviceTitle: 'Fan installation',
      })

    expect(bookingResponse.status).toBe(201)
    expect(bookingResponse.body.booking.status).toBe('pending')

    const acceptResponse = await request(app)
      .patch(`/api/bookings/${bookingResponse.body.booking.id}/accept`)
      .set('Authorization', `Bearer ${workerResponse.body.token}`)

    expect(acceptResponse.status).toBe(200)
    expect(acceptResponse.body.booking.status).toBe('accepted')

    const completeResponse = await request(app)
      .patch(`/api/bookings/${bookingResponse.body.booking.id}/complete`)
      .set('Authorization', `Bearer ${workerResponse.body.token}`)

    expect(completeResponse.status).toBe(200)
    expect(completeResponse.body.booking.status).toBe('waiting_for_verification')

    const verifyResponse = await request(app)
      .patch(`/api/bookings/${bookingResponse.body.booking.id}/verify`)
      .set('Authorization', `Bearer ${employerResponse.body.token}`)

    expect(verifyResponse.status).toBe(200)
    expect(verifyResponse.body.booking.status).toBe('completed')
    expect(verifyResponse.body.payment).toBeTruthy()
  })

  it('returns gallery items through the public API', async () => {
    const response = await request(app).get('/api/gallery')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.gallery)).toBe(true)
    expect(response.body.gallery.length).toBeGreaterThan(0)
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

  it('registers and logs in a phone-only user without an email', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Mehul Singh',
      phone: '5550001111',
      username: 'mehulsingh',
      password: 'strongPassword123',
      role: 'worker',
      location: 'Ahmedabad',
      serviceCategories: ['Electrician', 'AC Repair'],
    })

    const loginResponse = await request(app).post('/api/auth/login').send({
      identifier: '5550001111',
      password: 'strongPassword123',
    })

    expect(registerResponse.status).toBe(201)
    expect(registerResponse.body.user.phone).toBe('5550001111')
    expect(registerResponse.body.user.serviceCategories).toEqual(['Electrician', 'AC Repair'])
    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.user.phone).toBe('5550001111')
  })

  it('creates an admin notification when a new user registers', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Mira',
      email: 'mira@example.com',
      password: 'secret123',
      role: 'employer',
    })

    const adminLoginResponse = await request(app).post('/api/auth/login').send({
      identifier: 'ishvar',
      password: '1234567890',
    })

    const notificationsResponse = await request(app)
      .get('/api/admin/notifications')
      .set('Authorization', `Bearer ${adminLoginResponse.body.token}`)

    expect(registerResponse.status).toBe(201)
    expect(notificationsResponse.status).toBe(200)
    expect(notificationsResponse.body.notifications.some((notification) => notification.message.includes('Mira'))).toBe(true)
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

  it('allows an existing user to log in with their phone number', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Aditi',
      email: 'aditi@example.com',
      phone: '7778889990',
      password: 'secret123',
      role: 'worker',
    })

    const response = await request(app).post('/api/auth/login').send({
      identifier: '7778889990',
      password: 'secret123',
    })

    expect(registerResponse.status).toBe(201)
    expect(response.status).toBe(200)
    expect(response.body.user.phone).toBe('7778889990')
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
