import { api, unwrapList } from './api'

export async function fetchIncidents({ classeId, anneeId, status }) {
  const params = {}
  if (classeId) params.classe = classeId
  if (anneeId) params.annee = anneeId
  if (status) params.status = status
  const { data } = await api.get('/incidents/', { params })
  return unwrapList(data)
}

export async function createIncident(payload) {
  const { data } = await api.post('/incidents/', payload)
  return data
}

export async function updateIncident({ id, payload }) {
  const { data } = await api.patch(`/incidents/${id}/`, payload)
  return data
}

export async function deleteIncident(id) {
  await api.delete(`/incidents/${id}/`)
}
