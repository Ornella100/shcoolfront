import { api } from './api'

export async function fetchAttendance(classeId, date) {
  const { data } = await api.get('/attendance/', {
    params: { classe: classeId, date },
  })
  return data
}

export async function saveAttendance(classeId, date, students) {
  const { data } = await api.post('/attendance/', {
    classe: Number(classeId),
    date,
    students: students.map(({ id, status, note }) => ({ id, status, note })),
  })
  return data
}
