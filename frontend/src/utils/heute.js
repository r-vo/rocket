// Gleiche Datums-Hilfsfunktionen wie in utils/ernaehrung.js (lokale Zeit statt UTC, Rechnen auf
// 12:00 um Zeitzonen-/DST-Kanten zu vermeiden), hier um Wochen/Monats/Jahres-Zeiträume erweitert.

export function heuteDatum() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10)
}

export function datumPlus(datum, tage) {
  const d = new Date(datum + 'T12:00')
  d.setDate(d.getDate() + tage)
  return d.toISOString().slice(0, 10)
}

function monatPlus(datum, monate) {
  const d = new Date(datum + 'T12:00')
  d.setMonth(d.getMonth() + monate)
  return d.toISOString().slice(0, 10)
}

function jahrPlus(datum, jahre) {
  const d = new Date(datum + 'T12:00')
  d.setFullYear(d.getFullYear() + jahre)
  return d.toISOString().slice(0, 10)
}

export function datumVerschieben(datum, periode, richtung) {
  if (periode === 'woche') return datumPlus(datum, richtung * 7)
  if (periode === 'monat') return monatPlus(datum, richtung)
  if (periode === 'jahr') return jahrPlus(datum, richtung)
  return datumPlus(datum, richtung)
}

function wochenstart(datum) {
  const d = new Date(datum + 'T12:00')
  const tagIndex = (d.getDay() + 6) % 7 // 0 = Montag
  d.setDate(d.getDate() - tagIndex)
  return d.toISOString().slice(0, 10)
}

export function formatKurz(datum) {
  return new Date(datum + 'T12:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export function formatLang(datum) {
  return new Date(datum + 'T12:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Berechnet [von, bis] (inklusiv) + ein Label für den gewählten Zeitraum rund um `datum`.
export function zeitraum(datum, periode) {
  if (periode === 'woche') {
    const von = wochenstart(datum)
    const bis = datumPlus(von, 6)
    return { von, bis, label: `${formatKurz(von)} – ${formatLang(bis)}` }
  }
  if (periode === 'monat') {
    const d = new Date(datum + 'T12:00')
    const von = new Date(d.getFullYear(), d.getMonth(), 1, 12).toISOString().slice(0, 10)
    const bis = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12).toISOString().slice(0, 10)
    return { von, bis, label: d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) }
  }
  if (periode === 'jahr') {
    const jahr = new Date(datum + 'T12:00').getFullYear()
    return { von: `${jahr}-01-01`, bis: `${jahr}-12-31`, label: String(jahr) }
  }
  return { von: datum, bis: datum, label: datum === heuteDatum() ? 'Heute' : formatLang(datum) }
}
