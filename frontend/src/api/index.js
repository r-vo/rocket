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

export const profil = {
  abrufen: () => client.get('/profil'),
  speichern: (daten) => client.put('/profil', daten),
}

export const ernaehrung = {
  tag: (datum) => client.get('/ernaehrung', { params: { datum } }),
  bereich: (von, bis) => client.get('/ernaehrung', { params: { von, bis } }),
  erstellen: (daten) => client.post('/ernaehrung', daten),
  loeschen: (id) => client.delete(`/ernaehrung/${id}`),
  favoriten: (mahlzeit) => client.get('/ernaehrung/favoriten', { params: mahlzeit ? { mahlzeit } : {} }),
}

export const gewicht = {
  liste: () => client.get('/gewicht'),
  eintragen: (datum, kg) => client.put('/gewicht', { datum, kg }),
}

export const fotos = {
  liste: () => client.get('/fotos'),
  datei: (id) => client.get(`/fotos/${id}/datei`, { responseType: 'blob' }),
  hochladen: (formData) => client.post('/fotos', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  loeschen: (id) => client.delete(`/fotos/${id}`),
}

export const plan = {
  liste: () => client.get('/plan'),
  setzen: (wochentag, mahlzeit, text) => client.put(`/plan/${wochentag}/${mahlzeit}`, { text }),
  entfernen: (wochentag, mahlzeit) => client.delete(`/plan/${wochentag}/${mahlzeit}`),
  alleEntfernen: () => client.delete('/plan'),
}

export const einstellungen = {
  module: () => client.get('/einstellungen/module'),
  modulSetzen: (schluessel, aktiv) => client.put(`/einstellungen/module/${schluessel}`, { aktiv }),
}

export const buecher = {
  liste: (status) => client.get('/buecher', { params: status ? { status } : {} }),
  erstellen: (daten) => client.post('/buecher', daten),
  aktualisieren: (id, daten) => client.patch(`/buecher/${id}`, daten),
  loeschen: (id) => client.delete(`/buecher/${id}`),
  notizen: (buchId) => client.get(`/buecher/${buchId}/notizen`),
  notizErstellen: (buchId, daten) => client.post(`/buecher/${buchId}/notizen`, daten),
  notizAktualisieren: (id, daten) => client.put(`/buecher/notizen/${id}`, daten),
  notizLoeschen: (id) => client.delete(`/buecher/notizen/${id}`),
  coverDatei: (id) => client.get(`/buecher/${id}/cover`, { responseType: 'blob' }),
  coverHochladen: (id, formData) => client.post(`/buecher/${id}/cover`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const nutzerAdmin = {
  liste: () => client.get('/admin/nutzer'),
  erstellen: (daten) => client.post('/admin/nutzer', daten),
  aktualisieren: (id, daten) => client.patch(`/admin/nutzer/${id}`, daten),
  passwortZuruecksetzen: (id, passwort) => client.post(`/admin/nutzer/${id}/passwort`, { passwort }),
}

export default client
