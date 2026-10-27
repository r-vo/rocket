import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(err)
  }
)

export const auth = {
  login: (email, passwort) => client.post('/auth/login', { email, passwort }),
  logout: () => client.post('/auth/logout'),
  me: () => client.get('/auth/me'),
}

export const nutzerAdmin = {
  liste: () => client.get('/admin/nutzer'),
  erstellen: (daten) => client.post('/admin/nutzer', daten),
  aktualisieren: (id, daten) => client.patch(`/admin/nutzer/${id}`, daten),
  passwortZuruecksetzen: (id, passwort) => client.post(`/admin/nutzer/${id}/passwort`, { passwort }),
}

export default client
