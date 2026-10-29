export const ART_NAME = { positiv: 'Positiv', negativ: 'Negativ' }
export const FREQUENZ_NAME = { taeglich: 'Täglich', woechentlich: 'Wöchentlich' }

// Kurzbeschreibung der Häufigkeit für die Liste, z. B. "3× pro Tag" oder "max. 2× pro Woche".
export function frequenzLabel(habit) {
  const praefix = habit.art === 'negativ' ? 'max. ' : ''
  const einheit = habit.frequenz === 'woechentlich' ? 'Woche' : 'Tag'
  if (habit.zielAnzahl === 1 && habit.art !== 'negativ') return habit.frequenz === 'woechentlich' ? '1× pro Woche' : 'Täglich'
  return `${praefix}${habit.zielAnzahl}× pro ${einheit}`
}
