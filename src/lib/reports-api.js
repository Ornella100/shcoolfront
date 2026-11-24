import { api } from './api'

export async function fetchSchoolReport(anneeId) {
  const { data } = await api.get('/reports/school/', { params: { annee: anneeId } })
  return data
}

export async function downloadSchoolReport(anneeId) {
  const { data } = await api.get('/reports/school/export/', {
    params: { annee: anneeId },
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'rapport_scolaire.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
