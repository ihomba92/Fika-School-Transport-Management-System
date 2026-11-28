import { ApiError, api, segment } from '@/lib/api-client'

// The parent app's requests (api/openapi.yaml, Parent).

export async function getFamily() {
  return api.get('/parent/family')
}

export async function getChild(childId) {
  return api.get(`/parent/children/${segment(childId)}`)
}

export async function getCurrentTerm() {
  return api.get('/parent/term')
}

// null when there is no pickup today (204).
export async function getMorningTrip() {
  return api.get('/parent/trip')
}

export async function getTripStatus() {
  return api.get('/parent/trip/status')
}

export async function getPayments() {
  return api.get('/parent/payments')
}

// A child's details go as multipart, because of the photo. The pickup and
// drop-off places are JSON parts. Leaving out the photo keeps the saved one.
export async function saveChild(values, childId) {
  const form = new FormData()
  if (values.photo instanceof File) form.append('photo', values.photo)
  form.append('fullName', values.fullName)
  form.append('grade', values.grade)
  form.append('plan', values.plan)
  if (values.pickup) form.append('pickup', JSON.stringify(values.pickup))
  if (values.dropoff) form.append('dropoff', JSON.stringify(values.dropoff))
  return childId
    ? api.put(`/parent/children/${segment(childId)}`, form)
    : api.post('/parent/children', form)
}

// How often to ask whether the parent has entered their PIN, and when to
// give up (Safaricom's prompt times out after about a minute).
export const MPESA_POLL_MS = 3000
const MPESA_GIVE_UP_MS = 90_000

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// M-Pesa STK push: the server sends the prompt to the phone; then we ask
// every few seconds until Safaricom has answered. Resolves with the
// receipt, or throws with the reason the payment didn't go through.
export async function payWithMpesa({ childId, amount, phone }) {
  const started = await api.post('/parent/payments/mpesa', {
    childId,
    amount,
    phone,
  })
  const giveUpAt = Date.now() + MPESA_GIVE_UP_MS
  let payment = started
  while (payment.status === 'pending') {
    if (Date.now() > giveUpAt) {
      throw new ApiError({
        status: 0,
        code: 'MPESA_TIMEOUT',
        message: 'M-Pesa didn’t answer in time. Nothing was taken; try again.',
      })
    }
    await wait(MPESA_POLL_MS)
    payment = await api.get(
      `/parent/payments/mpesa/${segment(started.checkoutRequestId)}`,
    )
  }
  if (payment.status !== 'paid') {
    throw new ApiError({
      status: 0,
      code: `MPESA_${payment.status.toUpperCase()}`,
      message: payment.failureReason ?? 'The payment did not go through',
    })
  }
  return { receipt: payment.receipt, amount: payment.amount }
}

export async function getNotifications() {
  return api.get('/parent/notifications')
}

export async function markAllNotificationsRead() {
  return api.post('/parent/notifications/read')
}
