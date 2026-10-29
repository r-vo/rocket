const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function heuteDatum() {
  return new Date().toISOString().slice(0, 10);
}

// Eine Abfrage über alle Module hinweg (statt vier Einzel-Requests) — genau der Vorteil der
// „eine App, eine DB"-Architektur-Entscheidung: modulübergreifende Auswertungen sind damit
// trivial. Aufgaben/Habits liefern aktuell 0 von 0, da diese Module noch keine eigene
// CRUD-Oberfläche haben (nur die Modelle existieren) — die Zählung ist aber bereits korrekt und
// zeigt echte Werte, sobald dort Daten entstehen.
//
// `von`/`bis` (yyyy-mm-dd, inklusiv) grenzen den Zeitraum ein — ohne Angabe nur der heutige Tag.
// Pro Modul bedeutet „im Zeitraum":
//  - Ernährung: Summe aller Einträge mit Datum im Zeitraum.
//  - Bücher: alle Leserunden, die sich mit dem Zeitraum überschneiden (offene Leserunden zählen
//    immer mit) — zeigt die aktuelle Seite als bestverfügbaren Fortschritts-Snapshot, da es keine
//    tagesgenaue Seiten-Historie gibt.
//  - Habits: erledigt = Einträge mit erledigt=true im Zeitraum; gesamt = aktive Habits × Anzahl
//    Tage im Zeitraum (Tag-Ansicht ⇒ ×1, identisch zum bisherigen Verhalten).
//  - Aufgaben: fällig = Fälligkeitsdatum ≤ Ende des Zeitraums (gleiche „überfällige zählen mit"-
//    Logik wie bisher, nur verallgemeinert von „heute" auf „Zeitraum-Ende").
async function uebersicht(req, res) {
  const nutzerId = req.user.id;
  const heute = heuteDatum();
  const von = req.query.von || heute;
  const bis = req.query.bis || heute;
  const tageImZeitraum = Math.round((new Date(`${bis}T00:00:00Z`) - new Date(`${von}T00:00:00Z`)) / 86400000) + 1;

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
    prisma.habitEintrag.findMany({
      where: { datum: { gte: von, lte: bis }, erledigt: true, habit: { nutzerId, aktiv: true } },
    }),
    prisma.aufgabe.findMany({ where: { nutzerId, faelligAm: { not: null, lte: bis } } }),
  ]);

  const ernaehrung = ernaehrungEintraege.reduce(
    (summe, e) => ({ kcal: summe.kcal + e.kcal, nettoCarbs: summe.nettoCarbs + e.nettoCarbs }),
    { kcal: 0, nettoCarbs: 0 }
  );

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
    habits: { erledigt: habitEintraege.length, gesamt: habits.length * tageImZeitraum },
    aufgaben: { erledigt: aufgabenFaellig.filter((a) => a.erledigt).length, gesamt: aufgabenFaellig.length },
  });
}

module.exports = { uebersicht };
