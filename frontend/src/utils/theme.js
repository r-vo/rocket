const SCHLUESSEL = 'rocket:theme'

export const THEMEN = [
  ['standard', 'Standard', '#2f6fed'],
  ['nacht', 'Dunkelblau', '#14224a'],
  ['himmel', 'Hellblau', '#9ccfff'],
  ['flieder', 'Lila', '#7b4fd6'],
  ['rose', 'Rosa', '#ff8fbd'],
]

export function themeAnwenden(name) {
  if (!name || name === 'standard') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = name
  }
  try { localStorage.setItem(SCHLUESSEL, name) } catch (err) { /* Speicher evtl. nicht verfügbar */ }
}

export function gespeichertesThemeLaden() {
  let gespeichert = 'standard'
  try { gespeichert = localStorage.getItem(SCHLUESSEL) || 'standard' } catch (err) { /* Speicher evtl. nicht verfügbar */ }
  themeAnwenden(gespeichert)
  return gespeichert
}
