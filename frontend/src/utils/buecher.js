export const STATUS_NAME = { wunschliste: 'Leseliste', am_lesen: 'Lese gerade', gelesen: 'Gelesen' }

export function heuteDatum() {
  return new Date().toISOString().slice(0, 10)
}

export function formatDatum(d) {
  if (!d) return ''
  return new Date(d + 'T12:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Vor dem Hochladen clientseitig verkleinern (wie bei den Fortschrittsfotos im
// Ernährungs-Modul) — max. 900 px, JPEG, spart Speicher und Übertragungszeit.
export function buchfotoVerkleinern(datei) {
  return new Promise((resolve) => {
    const bild = new Image()
    bild.onload = () => {
      const faktor = Math.min(1, 900 / Math.max(bild.width, bild.height))
      const canvas = document.createElement('canvas')
      canvas.width = bild.width * faktor
      canvas.height = bild.height * faktor
      canvas.getContext('2d').drawImage(bild, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', .8)
    }
    bild.src = URL.createObjectURL(datei)
  })
}

// Online-Buchsuche über Open Library — wie die Lebensmittel-Suche (Open Food Facts) im
// Ernährungs-Modul direkt vom Client aufgerufen, kein eigener Backend-Proxy nötig.
export async function buchsucheOpenLibrary(q) {
  if (!q?.trim()) return []
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=title,author_name,cover_i,number_of_pages_median`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Suche fehlgeschlagen')
  const daten = await res.json()
  return (daten.docs || []).map((d) => ({
    titel: d.title,
    autor: d.author_name?.[0] || '',
    coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
    seitenzahl: d.number_of_pages_median || null,
  }))
}
