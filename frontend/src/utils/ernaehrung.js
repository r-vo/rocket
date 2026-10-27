// Berechnungslogik 1:1 aus dem ersten Entwurf ("Keto Kompass") übernommen, nur auf die neuen
// Feldnamen (Profil aus der Datenbank statt lokalem JSON-Blob) umgestellt.

export const ZIELDATUM_STANDARD = '2027-03-31'
export const ZIELDATUM_TEMPO = { zuegig: '2027-03-31', mittel: '2027-06-30', ruhig: '2027-09-30' }

export function heuteDatum() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10)
}

export function datumPlus(datum, tage) {
  const d = new Date(datum + 'T12:00')
  d.setDate(d.getDate() + tage)
  return d.toISOString().slice(0, 10)
}

export function tdee(p) {
  return (10 * p.gewichtAktuell + 6.25 * p.groesseCm - 5 * p.alter + (p.geschlecht === 'm' ? 5 : -161)) * (p.alltagFaktor || 1.2)
}

export function kalorienUntergrenze(p) {
  return p.geschlecht === 'm' ? 1500 : 1200
}

export function rampenTempo(p) {
  const schneidetAb = p.gewichtAktuell > p.gewichtZielKg
  if (!schneidetAb) return { zuegig: 0, mittel: 0, ruhig: 0, eigenesDatum: 0, max: 0, gewuenscht: 0 }
  const wochenBis = (d) => (p.gewichtAktuell - p.gewichtZielKg) / Math.max(1, (new Date(d + 'T12:00') - Date.now()) / 6048e5)
  const max = Math.max(0, Math.min(1, (tdee(p) - kalorienUntergrenze(p)) * 7 / 7700))
  const zuegig = Math.min(wochenBis(ZIELDATUM_TEMPO.zuegig), max)
  const mittel = Math.min(wochenBis(ZIELDATUM_TEMPO.mittel), zuegig * .75)
  const ruhig = Math.min(wochenBis(ZIELDATUM_TEMPO.ruhig), mittel * .8)
  return {
    zuegig, mittel, ruhig,
    eigenesDatum: Math.min(wochenBis(p.zieldatum || ZIELDATUM_STANDARD), max),
    max,
    gewuenscht: wochenBis(ZIELDATUM_TEMPO.zuegig),
  }
}

export function tagesziel(p) {
  const t = tdee(p)
  const schneidetAb = p.gewichtAktuell > p.gewichtZielKg
  const tempo = p.tempo || 'zuegig'
  const R = rampenTempo(p)
  let rate = schneidetAb ? (tempo === 'date' ? R.eigenesDatum : R[tempo]) : 0
  if (schneidetAb) rate = Math.min(R.max, rate + (p.extraDefizit || 0) * 7 / 7700)
  let kcal = t - rate * 1100
  const untergrenze = kalorienUntergrenze(p)
  if (kcal < untergrenze) kcal = untergrenze
  kcal = Math.round(kcal / 10) * 10
  const eiweiss = Math.round(1.5 * Math.min(p.gewichtAktuell, p.gewichtZielKg || p.gewichtAktuell))
  const carbs = p.nettoCarbsZielG || 25
  const fett = Math.max(20, Math.round((kcal - eiweiss * 4 - carbs * 4) / 9))
  return { kcal, eiweiss, carbs, fett, schneidetAb, untergrenze, tdee: t, rate, rampe: R }
}

// Projektion "Weg zum Ziel" — wann ist das Zielgewicht bei aktuellem Tempo voraussichtlich
// erreicht, plus Vergleich mit dem tatsächlichen Trend der letzten 6 Wochen.
export function wegZumZiel(p, gewichtsListe) {
  const ziel = tagesziel(p)
  const cur = gewichtsListe.length ? gewichtsListe[gewichtsListe.length - 1].kg : p.gewichtAktuell
  const start = gewichtsListe.length ? gewichtsListe[0] : { datum: heuteDatum(), kg: p.gewichtAktuell }
  const goal = p.gewichtZielKg

  if (!(cur > goal)) return { status: 'erreicht', goal }
  if (ziel.rate < .05) return { status: 'keinDefizit' }

  const wochen = (cur - goal) / ziel.rate
  const ende = datumPlus(heuteDatum(), Math.round(wochen * 7))
  const rec = gewichtsListe.filter((x) => x.datum >= datumPlus(heuteDatum(), -42))
  const spanneTage = rec.length > 1 ? (new Date(rec[rec.length - 1].datum) - new Date(rec[0].datum)) / 864e5 : 0
  const trendProWoche = spanneTage >= 14 ? (rec[0].kg - rec[rec.length - 1].kg) / (spanneTage / 7) : 0

  const meilensteine = [.25, .5, .75, 1].map((q) => ({
    kg: cur - (cur - goal) * q,
    datum: datumPlus(heuteDatum(), Math.round(wochen * 7 * q)),
  }))

  return {
    status: 'aktiv', start, cur, goal, ende, wochen, trendProWoche, spanneTage, meilensteine,
    zuSchnellesTempoBisWunschdatum: (cur - goal) / Math.max(1, (new Date((p.tempo === 'date' ? (p.zieldatum || ZIELDATUM_STANDARD) : ZIELDATUM_TEMPO[p.tempo] || ZIELDATUM_STANDARD) + 'T12:00') - Date.now()) / 6048e5) > 1.05 * ziel.rampe.max,
    trendDatum: trendProWoche > .05 ? datumPlus(heuteDatum(), Math.round((cur - goal) / trendProWoche * 7)) : null,
  }
}

// Trainings-/Essensplan — identisch zum ersten Entwurf übernommen.
export const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
export const MAHLZEIT_NAME = { B: 'Frühstück', L: 'Mittagessen', D: 'Abendessen' }
export const MAHLZEIT_KURZ = { B: 'Frühstück', L: 'Mittag', D: 'Abend' }

const TRAININGSPLAN = {
  gym: { A: ['Beinpresse 3×10', 'Brustpresse 3×10', 'Latzug 3×10', 'Plank 3×40 s'], B: ['Kniebeuge 3×8', 'Rudern 3×10', 'Schulterdrücken 3×10', 'Hip Thrust 3×12'] },
  home: { A: ['Kniebeugen 3×15', 'Liegestütze (auf den Knien ok) 3×8–12', 'Ausfallschritte 3×10 je Seite', 'Plank 3×30 s'], B: ['Glute Bridge 3×15', 'Rudern mit Rucksack 3×12', 'Pike-Liegestütze 3×8', 'Dead Bug 3×10'] },
  C: ['Zügiges Gehen, Radfahren oder Ellipsentrainer 40 Min in gesprächsfähigem Tempo', '10 Min Dehnen'],
}

export function trainingsplan(p) {
  const tageIndizes = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 5], 5: [0, 1, 2, 4, 5] }[p.trainingstage] || [0, 2, 4]
  const typen = ['A', 'B', 'C', 'A', 'B']
  const ausruestung = TRAININGSPLAN[p.equipment] || TRAININGSPLAN.home
  return tageIndizes.map((tag, i) => {
    const typ = typen[i]
    return { tag, typ, bezeichnung: typ === 'C' ? 'Ausdauer' : `Kraft ${typ}`, uebungen: typ === 'C' ? TRAININGSPLAN.C : ausruestung[typ] }
  })
}

const GEN_EIER = ['2 Spiegeleier', 'Rührei aus 2 Eiern', 'Omelett aus 2 Eiern', '3 gekochte Eier', 'Frittata aus 2 Eiern']
const GEN_GEMUESE_B = ['Spinat', 'Tomaten', 'Paprika', 'Champignons', 'Gurke', 'Zucchini', 'Avocado']
const GEN_MILCH = ['Naturjoghurt mit Nüssen', 'Griechischer Joghurt 10 %', 'Magerquark mit Beeren', 'Skyr mit Chiasamen', 'Hüttenkäse']
const GEN_FLEISCH = ['Hähnchenbrust', 'Rinderhack', 'Lachs', 'Steak', 'Schweinefilet', 'Hähnchenschenkel', 'Garnelen']
const GEN_GEMUESE_L = ['Brokkoli', 'Zucchini', 'Blumenkohl', 'Paprika', 'Spinat', 'grüner Salat', 'Champignons']
const GEN_GEMUESE_D = ['Ofengemüse', 'Zucchini-Pfanne', 'Blumenkohl-Püree', 'Salat mit Olivenöl', 'Spinat mit Feta', 'Brokkoli-Pfanne', 'Gurken-Tomaten-Salat']
const GEN_PROTEIN_D = ['Lachs', 'Hähnchenbrust', 'Garnelen', 'Rinderhack', 'Thunfisch', 'Putenbrust']
const GEN_PROTEIN_D_KLEIN = ['Feta', 'Thunfisch', 'Kochschinken', 'Hüttenkäse']

// Deterministischer Vorschlag für Tag i (Wochentag-Index) und Mahlzeit k ('B'/'L'/'D') — bei
// Abendessen wird je nach noch fehlendem Eiweiß-Ziel automatisch eine Proteinquelle ergänzt.
export function planVorschlag(i, k, eiweissZiel) {
  i = Math.abs(i)
  if (k === 'B') return `${GEN_EIER[i % 5]} + ${GEN_GEMUESE_B[(i * 2 + 1) % 7]} + ${GEN_MILCH[(i + 2) % 5]}`
  if (k === 'L') return `${GEN_FLEISCH[(i + 1) % 7]} + ${GEN_GEMUESE_L[(i * 3 + 2) % 7]} (in Butter oder Olivenöl)`
  const need = Math.round((eiweissZiel || 0) - 70)
  const basis = GEN_GEMUESE_D[(i + 3) % 7]
  if (need >= 30) return `${basis} + ${GEN_PROTEIN_D[i % 6]} (ca. ${need} g Eiweiß)`
  if (need >= 10) return `${basis} + etwas Eiweiß, z. B. ${GEN_PROTEIN_D_KLEIN[i % 4]}`
  return basis
}
