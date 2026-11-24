import { api, unwrapList } from './api'

export async function fetchFees(classeId, anneeId) {
  const { data } = await api.get('/fees/', {
    params: { classe: classeId, annee: anneeId },
  })
  return unwrapList(data)
}

export async function generateClassFees(payload) {
  const { data } = await api.post('/fees/generate-class/', payload)
  return data
}

export async function recordFeePayment(invoiceId, payload) {
  const { data } = await api.post(`/fees/${invoiceId}/payments/`, payload)
  return data
}

export async function cancelFeeInvoice(id) {
  const { data } = await api.patch(`/fees/${id}/`, { status: 'CANCELLED' })
  return data
}
