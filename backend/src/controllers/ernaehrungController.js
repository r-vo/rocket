const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function eintraege(req, res) {
  const { datum, von, bis } = req.query;
  const where = { nutzerId: req.user.id };
  if (datum) {
    where.datum = datum;
  } else if (von && bis) {
    where.datum = { gte: von, lte: bis };
  } else {
    return res.status(400).json({ error: 'datum oder von/bis erforderlich' });
  }
  const liste = await prisma.ernaehrungseintrag.findMany({ where, orderBy: { erstelltAm: 'asc' } });
  res.json(liste);
}

async function eintragErstellen(req, res) {
  const { datum, mahlzeit, bezeichnung, menge, einheit, kcal, nettoCarbs, fett, eiweiss } = req.body;
  if (!datum || !mahlzeit || !bezeichnung?.trim()) {
    return res.status(400).json({ error: 'Datum, Mahlzeit und Bezeichnung sind erforderlich' });
  }
  const eintrag = await prisma.ernaehrungseintrag.create({
    data: {
      nutzerId: req.user.id,
      datum,
      mahlzeit,
      bezeichnung: bezeichnung.trim(),
      menge: menge != null ? +menge : null,
      einheit: einheit || null,
      kcal: Math.round(+kcal) || 0,
      nettoCarbs: +nettoCarbs || 0,
      fett: +fett || 0,
      eiweiss: +eiweiss || 0,
    },
  });
  res.status(201).json(eintrag);
}

async function eintragLoeschen(req, res) {
  const id = +req.params.id;
  const eintrag = await prisma.ernaehrungseintrag.findUnique({ where: { id } });
  if (!eintrag || eintrag.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Eintrag nicht gefunden' });
  }
  await prisma.ernaehrungseintrag.delete({ where: { id } });
  res.json({ ok: true });
}

// Meistgegessene Lebensmittel (gesamt oder je Mahlzeit) — Grundlage für Essensplan-Vorschläge.
async function favoriten(req, res) {
  const { mahlzeit } = req.query;
  const where = { nutzerId: req.user.id };
  if (mahlzeit) where.mahlzeit = mahlzeit;
  const gruppen = await prisma.ernaehrungseintrag.groupBy({
    by: ['bezeichnung'],
    where,
    _count: { bezeichnung: true },
    orderBy: { _count: { bezeichnung: 'desc' } },
    take: 8,
  });
  res.json(gruppen.map((g) => ({ bezeichnung: g.bezeichnung, anzahl: g._count.bezeichnung })));
}

module.exports = { eintraege, eintragErstellen, eintragLoeschen, favoriten };
