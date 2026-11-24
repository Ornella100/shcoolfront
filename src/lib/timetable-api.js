import { api, unwrapList } from './api'

export async function fetchTimetable(classeId, anneeId) {
  const { data } = await api.get('/timetable/', {
    params: { classe: classeId, annee: anneeId },
  })
  return unwrapList(data)
}

export async function createScheduleSlot(payload) {
  const { data } = await api.post('/timetable/', payload)
  return data
}

export async function deleteScheduleSlot(id) {
  await api.delete(`/timetable/${id}/`)
}
