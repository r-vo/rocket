const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function heuteDatum() {
  return new Date().toISOString().slice(0, 10);
}

function alleTage(von, bis) {
  const tage = [];
  const d = new Date(`${von}T00:00:00Z`);
  const ende = new Date(`${bis}T00:00:00Z`);
  while (d <= ende) {
    tage.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return tage;
}

// Montag der Kalenderwoche, die `datum` enthält — gleiche Logik wie in habitController.js.
function wochenSchluessel(datum) {
  const d = new Date(`${datum}T00:00:00Z`);
  const tagIndex = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - tagIndex);
  return d.toISOString().slice(0, 10);
}

// Eine Abfrage über alle Module hinweg (statt vier Einzel-Requests) — genau der Vorteil der
// „eine App, eine DB"-Architektur-Entscheidung: modulübergreifende Auswertungen sind damit
// trivial.
//
// `von`/`bis` (yyyy-mm-dd, inklusiv) grenzen den Zeitraum ein — ohne Angabe nur der heutige Tag.
// Pro Modul bedeutet „im Zeitraum":
//  - Ernährung: Summe aller Einträge mit Datum im Zeitraum.
//  - Bücher: alle Leserunden, die sich mit dem Zeitraum überschneiden (offene Leserunden zählen
//    immer mit) — zeigt die aktuelle Seite als bestverfügbaren Fortschritts-Snapshot, da es keine
//    tagesgenaue Seiten-Historie gibt.
//  - Habits: pro aktivem Habit wird der Zeitraum in Einheiten zerlegt (Tage bei „täglich",
//    Kalenderwochen bei „wöchentlich") und je Einheit „Erfolg" nach Art bewertet — positiv:
//    Anzahl ≥ Ziel, negativ: Anzahl ≤ Ziel (Anzahl zählt bei negativ die Ausrutscher). erledigt/
//    gesamt zählen die erfolgreichen bzw. alle Einheiten über alle aktiven Habits.
//  - Aufgaben: fällig = Fälligkeitsdatum ≤ Ende des Zeitraums (gleiche „überfällige zählen mit"-
//    Logik wie bisher, nur verallgemeinert von „heute" auf „Zeitraum-Ende").
async function uebersicht(req, res) {
  const nutzerId = req.user.id;
  const heute = heuteDatum();
  const von = req.query.von || heute;
  const bis = req.query.bis || heute;

  const [ernaehrungEintraege, leserunden, habits, habitEintraege, aufgabenFaellig] = await Promise.all([
    prisma.ernaehrungseintrag.findMany({ where: { nutzerId, datum: { gte: von, lte: bis } } }),
    prisma.leserunde.findMany({
      where: {
        buch: { nutzerId },
        AND: [
          { OR: [{ begonnenAm: null }, { begonnenAm: { lte: bis } }] },
          { OR: [{ beendetAm: null }, { beendetAm: { gte: von } }] },
        ],
      },
      include: { buch: true },
      orderBy: { id: 'desc' },
    }),
    prisma.habit.findMany({ where: { nutzerId, aktiv: true } }),
    prisma.habitEintrag.findMany({ where: { datum: { gte: von, lte: bis }, habit: { nutzerId, aktiv: true } } }),
    prisma.aufgabe.findMany({ where: { nutzerId, faelligAm: { not: null, lte: bis } } }),
  ]);

  const ernaehrung = ernaehrungEintraege.reduce(
    (summe, e) => ({ kcal: summe.kcal + e.kcal, nettoCarbs: summe.nettoCarbs + e.nettoCarbs }),
    { kcal: 0, nettoCarbs: 0 }
  );

  const eintraegeNachHabit = new Map();
  for (const e of habitEintraege) {
    if (!eintraegeNachHabit.has(e.habitId)) eintraegeNachHabit.set(e.habitId, new Map());
    eintraegeNachHabit.get(e.habitId).set(e.datum, e.anzahl);
  }

  let habitsErledigt = 0;
  let habitsGesamt = 0;
  for (const h of habits) {
    const tageMap = eintraegeNachHabit.get(h.id) || new Map();
    const erfolg = (anzahl) => (h.art === 'negativ' ? anzahl <= h.zielAnzahl : anzahl >= h.zielAnzahl);

    if (h.frequenz === 'woechentlich') {
      const wochenSummen = new Map();
      for (const tag of alleTage(von, bis)) {
        const w = wochenSchluessel(tag);
        wochenSummen.set(w, (wochenSummen.get(w) || 0) + (tageMap.get(tag) || 0));
      }
      for (const summe of wochenSummen.values()) {
        habitsGesamt += 1;
        if (erfolg(summe)) habitsErledigt += 1;
      }
    } else {
      for (const tag of alleTage(von, bis)) {
        habitsGesamt += 1;
        if (erfolg(tageMap.get(tag) || 0)) habitsErledigt += 1;
      }
    }
  }

  res.json({
    von,
    bis,
    ernaehrung,
    buecher: leserunden.map((l) => ({
      id: l.buch.id,
      titel: l.buch.titel,
      aktuelleSeite: l.buch.aktuelleSeite,
      seitenzahl: l.buch.seitenzahl,
      begonnenAm: l.begonnenAm,
      beendetAm: l.beendetAm,
    })),
    habits: { erledigt: habitsErledigt, gesamt: habitsGesamt },
    aufgaben: { erledigt: aufgabenFaellig.filter((a) => a.erledigt).length, gesamt: aufgabenFaellig.length },
  });
}

module.exports = { uebersicht };
