import Razorpay from 'razorpay'
import crypto from 'node:crypto'
import Setting from '../models/Setting.js'

const loadSetting = async (key, fallback) => {
  const setting = await Setting.findOne({ key }).lean()
  return setting ? setting.value : fallback
}

export const getRazorpayInstance = async () => {
  const keyId = await loadSetting('razorpayKeyId', process.env.RAZORPAY_KEY_ID || '')
  const keySecret = await loadSetting('razorpayKeySecret', process.env.RAZORPAY_KEY_SECRET || '')
  if (!keyId || !keySecret) return null
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export const createRazorpayOrder = async ({ amount, currency = 'INR', receipt }) => {
  const razorpay = await getRazorpayInstance()
  if (!razorpay) {
    return {
      success: false,
      message: 'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
    }
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    })
    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    }
  } catch (error) {
    console.error('Razorpay order creation failed:', error)
    return { success: false, message: error.message || 'Payment order creation failed' }
  }
}

export const verifyRazorpayPayment = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET || ''
  if (!keySecret) return false
  const body = `${razorpayOrderId}|${razorpayPaymentId}`
  const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex')
  return expectedSignature === razorpaySignature
}

export const getPaymentGatewayStatus = async () => {
  const razorpayEnabled = await loadSetting('razorpayEnabled', true)
  const upiEnabled = await loadSetting('upiEnabled', true)
  const phonepeEnabled = await loadSetting('phonepeEnabled', true)
  const gpayEnabled = await loadSetting('gpayEnabled', true)
  const paytmEnabled = await loadSetting('paytmEnabled', true)
  const keyId = await loadSetting('razorpayKeyId', process.env.RAZORPAY_KEY_ID || '')
  return {
    razorpay: { enabled: !!razorpayEnabled, configured: !!keyId },
    upi: { enabled: !!upiEnabled },
    phonepe: { enabled: !!phonepeEnabled },
    gpay: { enabled: !!gpayEnabled },
    paytm: { enabled: !!paytmEnabled },
  }
}
