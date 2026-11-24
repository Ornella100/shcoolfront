import { api } from './api'

export async function fetchParentPortalSummary() {
  const { data } = await api.get('/parent-portal/summary/')
  return data
}
