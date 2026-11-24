import { api, unwrapList } from './api'

export async function fetchAssignments(classeId, anneeId) {
  const { data } = await api.get('/assignments/', {
    params: { classe: classeId, annee: anneeId },
  })
  return unwrapList(data)
}

export async function createAssignment(payload) {
  const { data } = await api.post('/assignments/', payload)
  return data
}

export async function deleteAssignment(id) {
  await api.delete(`/assignments/${id}/`)
}

export async function fetchAssignmentSubmissions(id) {
  const { data } = await api.get(`/assignments/${id}/submissions/`)
  return data
}

export async function saveAssignmentSubmissions(id, students) {
  const { data } = await api.put(`/assignments/${id}/submissions/`, { students })
  return data
}
