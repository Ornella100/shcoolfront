import { api, unwrapList } from './api'

export async function fetchSubjects() {
  const { data } = await api.get('/subjects/')
  return unwrapList(data)
}

export async function createSubject(payload) {
  const { data } = await api.post('/subjects/', payload)
  return data
}

export async function fetchAssessments(classeId, anneeId) {
  const { data } = await api.get('/assessments/', {
    params: { classe: classeId, annee: anneeId },
  })
  return unwrapList(data)
}

export async function createAssessment(payload) {
  const { data } = await api.post('/assessments/', payload)
  return data
}

export async function fetchAssessmentGrades(assessmentId) {
  const { data } = await api.get(`/assessments/${assessmentId}/grades/`)
  return data
}

export async function saveAssessmentGrades(assessmentId, students) {
  const { data } = await api.put(`/assessments/${assessmentId}/grades/`, { students })
  return data
}

export async function fetchBulletins(classeId, anneeId) {
  const { data } = await api.get('/bulletins/', {
    params: { classe: classeId, annee: anneeId },
  })
  return data
}
