import { api, unwrapList } from './api'

export async function fetchTeachers({ search = '', active } = {}) {
  const params = {}
  if (search) params.search = search
  if (active !== undefined) params.active = active
  const { data } = await api.get('/teachers/', { params })
  return unwrapList(data)
}

export async function createTeacher(payload) {
  const { data } = await api.post('/teachers/', payload)
  return data
}

export async function updateTeacher(id, payload) {
  const { data } = await api.patch(`/teachers/${id}/`, payload)
  return data
}

export async function deleteTeacher(id) {
  await api.delete(`/teachers/${id}/`)
}
