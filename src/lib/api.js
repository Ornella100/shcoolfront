import axios from 'axios'

// En développement, passer par le proxy Vite pour garder les cookies de session
// sur la même origine que le frontend. En déploiement, définir VITE_API_URL.
// En développement, viser explicitement le serveur Django en HTTP. Le proxy
// Vite peut masquer une redirection HTTPS locale et produire ERR_SSL_PROTOCOL_ERROR.
const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8000'
  : (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '')

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = getCookie('csrftoken')
    if (token) {
      config.headers['X-CSRFToken'] = token
    }
  }
  return config
})

export async function ensureCsrfCookie() {
  await api.get('/csrf/')
}

/**
 * Les listes DRF sont paginées (PAGE_SIZE=200) et renvoient
 * {count, next, previous, results}. Cette fonction ne récupère
 * que la première page — suffisant tant qu'une école reste sous
 * ~200 enregistrements par type ; au-delà il faudra une vraie
 * pagination côté UI (page suivante/précédente).
 */
export function unwrapList(data) {
  return Array.isArray(data) ? data : (data?.results ?? [])
}

/** Extrait un message lisible d'une erreur de validation DRF ({champ: [messages]} ou {detail: "..."}). */
export function getApiErrorMessage(error, fallback = 'Une erreur est survenue') {
  const data = error?.response?.data
  if (!data) return fallback
  if (typeof data.detail === 'string') return data.detail
  const firstKey = Object.keys(data)[0]
  const firstValue = firstKey ? data[firstKey] : null
  const message = Array.isArray(firstValue) ? firstValue[0] : firstValue
  return typeof message === 'string' ? message : fallback
}
