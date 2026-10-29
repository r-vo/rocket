const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ART_WERTE = ['positiv', 'negativ'];
const FREQUENZ_WERTE = ['taeglich', 'woechentlich'];

function heuteDatum() {
  return new Date().toISOString().slice(0, 10);
}

// Montag der Kalenderwoche, die `datum` enthält (yyyy-mm-dd).
function wochenstart(datum) {
  const d = new Date(`${datum}T00:00:00Z`);
  const tagIndex = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - tagIndex);
  return d.toISOString().slice(0, 10);
}

function datumPlusTage(datum, tage) {
  const d = new Date(`${datum}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + tage);
  return d.toISOString().slice(0, 10);
}

// Liefert alle Habits mit ihrem Fortschritt im jeweils relevanten Fenster (heute bei täglich,
// aktuelle Kalenderwoche bei wöchentlich), damit die Liste ohne Folge-Request anzeigbar ist.
async function liste(req, res) {
  const nutzerId = req.user.id;
  const habits = await prisma.habit.findMany({ where: { nutzerId }, orderBy: { erstelltAm: 'asc' } });
  const heute = heuteDatum();
  const wStart = wochenstart(heute);
  const wEnde = datumPlusTage(wStart, 6);

  const ergebnis = await Promise.all(
    habits.map(async (h) => {
      const von = h.frequenz === 'woechentlich' ? wStart : heute;
      const bis = h.frequenz === 'woechentlich' ? wEnde : heute;
      const eintraege = await prisma.habitEintrag.findMany({ where: { habitId: h.id, datum: { gte: von, lte: bis } } });
      // aktuelleAnzahl = Summe im relevanten Fenster (Tag bei täglich, Woche bei wöchentlich,
      // für die Anzeige „x von Ziel"); heutigeAnzahl = nur der heutige Tag, da +/- im Frontend
      // immer den heutigen Eintrag verändert (auch bei wöchentlichen Habits).
      const aktuelleAnzahl = eintraege.reduce((summe, e) => summe + e.anzahl, 0);
      const heutigeAnzahl = eintraege.find((e) => e.datum === heute)?.anzahl || 0;
      return { ...h, aktuelleAnzahl, heutigeAnzahl, heute };
    })
  );
  res.json(ergebnis);
}

async function erstellen(req, res) {
  const { bezeichnung, art, frequenz, zielAnzahl } = req.body;
  if (!bezeichnung?.trim()) return res.status(400).json({ error: 'Bezeichnung ist erforderlich' });
  if (art !== undefined && !ART_WERTE.includes(art)) return res.status(400).json({ error: 'Ungültige Art' });
  if (frequenz !== undefined && !FREQUENZ_WERTE.includes(frequenz)) return res.status(400).json({ error: 'Ungültige Frequenz' });

  const habit = await prisma.habit.create({
    data: {
      nutzerId: req.user.id,
      bezeichnung: bezeichnung.trim(),
      art: art || 'positiv',
      frequenz: frequenz || 'taeglich',
      zielAnzahl: zielAnzahl != null ? Math.max(1, Math.round(+zielAnzahl)) : 1,
    },
  });
  res.status(201).json(habit);
}

async function aktualisieren(req, res) {
  const id = +req.params.id;
  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit || habit.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Habit nicht gefunden' });
  }

  const { bezeichnung, art, frequenz, zielAnzahl, aktiv } = req.body;
  if (bezeichnung !== undefined && !bezeichnung.trim()) {
    return res.status(400).json({ error: 'Bezeichnung darf nicht leer sein' });
  }
  if (art !== undefined && !ART_WERTE.includes(art)) return res.status(400).json({ error: 'Ungültige Art' });
  if (frequenz !== undefined && !FREQUENZ_WERTE.includes(frequenz)) return res.status(400).json({ error: 'Ungültige Frequenz' });

  const aktualisiert = await prisma.habit.update({
    where: { id },
    data: {
      ...(bezeichnung !== undefined ? { bezeichnung: bezeichnung.trim() } : {}),
      ...(art !== undefined ? { art } : {}),
      ...(frequenz !== undefined ? { frequenz } : {}),
      ...(zielAnzahl !== undefined ? { zielAnzahl: Math.max(1, Math.round(+zielAnzahl)) } : {}),
      ...(aktiv !== undefined ? { aktiv: !!aktiv } : {}),
    },
  });
  res.json(aktualisiert);
}

async function loeschen(req, res) {
  const id = +req.params.id;
  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit || habit.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Habit nicht gefunden' });
  }
  await prisma.habit.delete({ where: { id } });
  res.json({ ok: true });
}

// Setzt die Anzahl für ein Datum direkt (Frontend rechnet +1/-1 selbst und schickt den neuen
// Wert). Bei 0 wird die Zeile entfernt statt auf 0 gesetzt, damit „kein Eintrag" und „Anzahl 0"
// identisch bleiben — wichtig für die Heute-Übersicht, die fehlende Tage als 0 wertet.
async function eintragSetzen(req, res) {
  const id = +req.params.id;
  const datum = req.params.datum;
  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit || habit.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Habit nicht gefunden' });
  }

  const anzahl = Math.max(0, Math.round(+req.body.anzahl) || 0);
  if (anzahl === 0) {
    await prisma.habitEintrag.deleteMany({ where: { habitId: id, datum } });
  } else {
    await prisma.habitEintrag.upsert({
      where: { habitId_datum: { habitId: id, datum } },
      update: { anzahl },
      create: { habitId: id, datum, anzahl },
    });
  }
  res.json({ ok: true, datum, anzahl });
}

module.exports = { liste, erstellen, aktualisieren, loeschen, eintragSetzen };
