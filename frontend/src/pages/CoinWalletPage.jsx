import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'

const defaultPackages = [
  { id: 'starter', label: 'Starter', price: 99, coins: 30 },
  { id: 'growth', label: 'Growth', price: 199, coins: 70 },
  { id: 'business', label: 'Business', price: 499, coins: 200 },
]

const CoinWalletPage = () => {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [wallet, setWallet] = useState({ coinBalance: 0, totalPurchasedCoins: 0, totalUsedCoins: 0, dailyCoinLimit: 0 })
  const [history, setHistory] = useState({ transactions: [], requests: [], history: [] })
  const [settings, setSettings] = useState({ upiId: 'rozwork@paytm', qrCodeUrl: '', mobileNumber: '9660585691', accountHolderName: 'Ishvar Suthar', packages: defaultPackages })
  const [selectedPackage, setSelectedPackage] = useState(defaultPackages[0])
  const [step, setStep] = useState('select')
  const [form, setForm] = useState({ utrNumber: '', screenshotUrl: '', mobileNumberUsed: '', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const loadData = async () => {
    if (!token) return
    try {
      const [walletRes, historyRes, settingsRes] = await Promise.all([
        apiClient.get('/coins/my-wallet', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/coins/my-history', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/coins/settings', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setWallet(walletRes.data?.wallet || walletRes.data || {})
      setHistory(historyRes.data || { transactions: [], requests: [], history: [] })
      setSettings(settingsRes.data?.settings || { upiId: 'rozwork@paytm', qrCodeUrl: '', mobileNumber: '9660585691', accountHolderName: 'Ishvar Suthar', packages: defaultPackages })
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to load coin wallet data.')
    }
  }

  useEffect(() => { void loadData() }, [token])

  const packageOptions = useMemo(() => settings.packages || defaultPackages, [settings.packages])

  const handleSelectPlan = (pkg) => {
    setSelectedPackage(pkg)
    setStep('pay')
  }

  const handleHavePaid = () => {
    setStep('confirm')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.screenshotUrl || !form.screenshotUrl.trim()) {
      setMessage('Payment screenshot is required.')
      return
    }
    if (!form.mobileNumberUsed || !form.mobileNumberUsed.trim()) {
      setMessage('Mobile number used for payment is required.')
      return
    }

    setSubmitting(true)
    try {
      await apiClient.post('/coins/purchase-request', {
        packageId: selectedPackage.id,
        amount: selectedPackage.price,
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        userId: user?.id || user?._id || '',
        utrNumber: form.utrNumber,
        screenshotUrl: form.screenshotUrl,
        mobileNumberUsed: form.mobileNumberUsed,
        note: form.note,
      }, { headers: { Authorization: `Bearer ${token}` } })
      setMessage('Your payment has been submitted successfully. Admin will verify it shortly.')
      setStep('submitted')
      setForm({ utrNumber: '', screenshotUrl: '', mobileNumberUsed: '', note: '' })
      await loadData()
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to submit payment request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Coin Wallet</p>
            <h1 className="mt-2 text-3xl font-semibold">{user?.name || 'Your'} wallet</h1>
            <p className="mt-2 text-sm text-slate-500">Buy coins to post jobs. 1 Job Post = 10 Coins.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Current coins: {wallet.coinBalance || 0}
            </div>
          </div>
        </div>

        {message ? (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${message.includes('successfully') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
            {message}
          </div>
        ) : null}

        {step === 'submitted' ? (
          <div className="mt-8 rounded-[24px] border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-emerald-800 dark:text-emerald-200">Payment Submitted</h2>
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">Your payment request has been submitted. Admin will verify it and coins will be added to your wallet.</p>
            <button onClick={() => { setStep('select'); setMessage('') }} className="mt-6 rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white">Back to Wallet</button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[24px] border border-slate-200 p-5 dark:border-slate-800">
              {step === 'select' && (
                <>
                  <h2 className="text-xl font-semibold">Buy Coins</h2>
                  <p className="mt-1 text-sm text-slate-500">Choose a coin plan that fits your needs.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {packageOptions.map((pkg) => (
                      <button key={pkg.id} type="button" onClick={() => handleSelectPlan(pkg)} className={`rounded-2xl border-2 px-4 py-5 text-left transition ${selectedPackage.id === pkg.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-200 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-700'}`}>
                        <div className="text-sm font-semibold uppercase tracking-wider text-blue-600">{pkg.label}</div>
                        <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">₹{pkg.price}</div>
                        <div className="mt-1 text-sm text-slate-500">{pkg.coins} Coins</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                    1 Job Post costs 10 Coins. Every employer gets 3 FREE Job Posts.
                  </div>
                </>
              )}

              {step === 'pay' && (
                <>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStep('select')} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700">&larr; Back</button>
                    <h2 className="text-xl font-semibold">Make Payment</h2>
                  </div>
                  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                    <p className="font-semibold text-blue-800 dark:text-blue-200">Selected: {selectedPackage.label} &mdash; ₹{selectedPackage.price} for {selectedPackage.coins} Coins</p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">UPI ID</div>
                      <div className="mt-1 text-lg font-mono text-blue-600">{settings.upiId || 'rozwork@paytm'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mobile Number</div>
                      <div className="mt-1 text-lg font-mono text-blue-600">{settings.mobileNumber || '9660585691'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account Holder</div>
                      <div className="mt-1 text-lg text-slate-700 dark:text-slate-300">{settings.accountHolderName || 'Ishvar Suthar'}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">QR Code</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {settings.qrCodeUrl ? <a href={settings.qrCodeUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View QR Code</a> : 'Scan the QR code shared by admin'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                    Make the payment using the above details, then click &quot;I Have Paid&quot; below to submit your payment proof.
                  </div>
                  <div className="mt-6">
                    <button onClick={handleHavePaid} className="rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 transition">I Have Paid</button>
                  </div>
                </>
              )}

              {step === 'confirm' && (
                <>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStep('pay')} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700">&larr; Back</button>
                    <h2 className="text-xl font-semibold">Confirm Payment</h2>
                  </div>
                  <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                    <p className="font-semibold text-blue-800 dark:text-blue-200">Plan: {selectedPackage.label} &mdash; ₹{selectedPackage.price} for {selectedPackage.coins} Coins</p>
                  </div>
                  <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Transaction ID (optional)</label>
                      <input value={form.utrNumber} onChange={(event) => setForm({ ...form, utrNumber: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="UTR / Transaction ID" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Payment Screenshot (required)</label>
                      <input value={form.screenshotUrl} onChange={(event) => setForm({ ...form, screenshotUrl: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Paste screenshot URL (imgur, google drive, etc.)" required />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Number used for payment (required)</label>
                      <input value={form.mobileNumberUsed} onChange={(event) => setForm({ ...form, mobileNumberUsed: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Mobile number used to pay" required />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Note (optional)</label>
                      <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Any additional info" rows={3} />
                    </div>
                    <div className="sm:col-span-2">
                      <button type="submit" disabled={submitting} className="rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition disabled:opacity-50">
                        {submitting ? 'Submitting...' : 'Submit Payment'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            <div className="rounded-[24px] border border-slate-200 p-5 dark:border-slate-800">
              <h2 className="text-xl font-semibold">Wallet Summary</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <div className="text-sm text-slate-500">Current Coins</div>
                  <div className="text-2xl font-semibold">{wallet.coinBalance || 0}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <div className="text-sm text-slate-500">Total Purchased Coins</div>
                  <div className="text-2xl font-semibold">{wallet.totalPurchasedCoins || 0}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <div className="text-sm text-slate-500">Total Used Coins</div>
                  <div className="text-2xl font-semibold">{wallet.totalUsedCoins || 0}</div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Quick Actions</p>
                <button onClick={() => navigate('/jobs')} className="mt-3 w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">Post a Job</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-[24px] border border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-xl font-semibold">Payment History</h2>
          <div className="mt-4 space-y-3">
            {(history.requests || []).slice(0, 10).map((item) => (
              <div key={item._id || item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
                <div>
                  <div className="font-semibold">{item.packageLabel || item.packageId} &mdash; ₹{item.amount}</div>
                  <div className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : item.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </div>
              </div>
            ))}
            {!(history.requests || []).length && <div className="text-sm text-slate-500">No payment history yet.</div>}
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-slate-200 p-5 dark:border-slate-800">
          <h2 className="text-xl font-semibold">Coin History</h2>
          <div className="mt-4 space-y-3">
            {(history.transactions || []).slice(0, 8).map((item) => (
              <div key={item._id || item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
                <div>
                  <div className="font-semibold">{item.reason || item.type}</div>
                  <div className="text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
                </div>
                <div className={`font-semibold ${item.amount >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{item.amount >= 0 ? `+${item.amount}` : item.amount} coins</div>
              </div>
            ))}
            {!history.transactions?.length && <div className="text-sm text-slate-500">No coin history yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoinWalletPage
