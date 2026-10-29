const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function buchPruefen(buchId, nutzerId) {
  const buch = await prisma.buch.findUnique({ where: { id: buchId } });
  return buch && buch.nutzerId === nutzerId ? buch : null;
}

function tagsAusgeben(notiz) {
  let tags = [];
  try {
    const geparst = JSON.parse(notiz.tags || '[]');
    if (Array.isArray(geparst)) tags = geparst;
  } catch {
    tags = [];
  }
  return { ...notiz, tags };
}

function tagsBereinigen(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))];
}

// Verknüpfungen sind in der DB gerichtet (notizVonId/notizZuId, kleinere id zuerst, siehe
// schema.prisma), fachlich aber ungerichtet — hier wird für eine Notiz jeweils die "andere
// Seite" jeder Verknüpfung aufgelöst, unabhängig davon, auf welcher Seite sie gespeichert ist.
async function anreichern(notiz) {
  const links = await prisma.notizVerknuepfung.findMany({
    where: { OR: [{ notizVonId: notiz.id }, { notizZuId: notiz.id }] },
    include: { notizVon: { include: { buch: true } }, notizZu: { include: { buch: true } } },
  });
  const verknuepfungen = links.map((l) => {
    const andere = l.notizVonId === notiz.id ? l.notizZu : l.notizVon;
    return {
      verknuepfungId: l.id,
      notizId: andere.id,
      text: andere.text,
      seite: andere.seite,
      buchId: andere.buchId,
      buchTitel: andere.buch.titel,
    };
  });
  return tagsAusgeben({ ...notiz, verknuepfungen });
}

async function liste(req, res) {
  const buchId = +req.params.buchId;
  const buch = await buchPruefen(buchId, req.user.id);
  if (!buch) return res.status(404).json({ error: 'Buch nicht gefunden' });

  const notizen = await prisma.buchNotiz.findMany({ where: { buchId }, orderBy: { erstelltAm: 'asc' } });
  res.json(await Promise.all(notizen.map(anreichern)));
}

// Für den Verknüpfen-Dialog: Notizen über alle eigenen Bücher hinweg durchsuchen (einfache
// Enthält-Suche, clientseitig case-insensitiv gefiltert, da SQLite in Prisma kein
// `mode: 'insensitive'` unterstützt und die Datenmenge für eine persönliche Bibliothek klein ist).
async function suchen(req, res) {
  const { q, ausser } = req.query;
  const where = { nutzerId: req.user.id };
  if (ausser) where.id = { not: +ausser };

  const notizen = await prisma.buchNotiz.findMany({ where, include: { buch: true }, orderBy: { erstelltAm: 'desc' } });
  const begriff = q?.trim().toLowerCase();
  const gefiltert = begriff ? notizen.filter((n) => n.text.toLowerCase().includes(begriff)) : notizen;
  res.json(
    gefiltert.slice(0, 30).map((n) => ({ id: n.id, text: n.text, seite: n.seite, buchId: n.buchId, buchTitel: n.buch.titel }))
  );
}

async function erstellen(req, res) {
  const buchId = +req.params.buchId;
  const buch = await buchPruefen(buchId, req.user.id);
  if (!buch) return res.status(404).json({ error: 'Buch nicht gefunden' });

  const { text, seite, tags } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text ist erforderlich' });

  const notiz = await prisma.buchNotiz.create({
    data: {
      buchId,
      nutzerId: req.user.id,
      text: text.trim(),
      seite: seite != null ? +seite : null,
      tags: JSON.stringify(tagsBereinigen(tags)),
    },
  });
  res.status(201).json(await anreichern(notiz));
}

async function aktualisieren(req, res) {
  const id = +req.params.id;
  const notiz = await prisma.buchNotiz.findUnique({ where: { id } });
  if (!notiz || notiz.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Notiz nicht gefunden' });
  }

  const { text, seite, tags } = req.body;
  if (text !== undefined && !text.trim()) return res.status(400).json({ error: 'Text darf nicht leer sein' });

  const aktualisiert = await prisma.buchNotiz.update({
    where: { id },
    data: {
      ...(text !== undefined ? { text: text.trim() } : {}),
      ...(seite !== undefined ? { seite: seite != null ? +seite : null } : {}),
      ...(tags !== undefined ? { tags: JSON.stringify(tagsBereinigen(tags)) } : {}),
    },
  });
  res.json(await anreichern(aktualisiert));
}

async function loeschen(req, res) {
  const id = +req.params.id;
  const notiz = await prisma.buchNotiz.findUnique({ where: { id } });
  if (!notiz || notiz.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Notiz nicht gefunden' });
  }
  await prisma.buchNotiz.delete({ where: { id } });
  res.json({ ok: true });
}

async function verknuepfen(req, res) {
  const id = +req.params.id;
  const zielId = +req.body.zielId;
  if (!zielId || zielId === id) return res.status(400).json({ error: 'Ungültige Ziel-Notiz' });

  const [a, b] = await Promise.all([
    prisma.buchNotiz.findUnique({ where: { id } }),
    prisma.buchNotiz.findUnique({ where: { id: zielId } }),
  ]);
  if (!a || a.nutzerId !== req.user.id || !b || b.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Notiz nicht gefunden' });
  }

  const [notizVonId, notizZuId] = id < zielId ? [id, zielId] : [zielId, id];
  await prisma.notizVerknuepfung.upsert({
    where: { notizVonId_notizZuId: { notizVonId, notizZuId } },
    update: {},
    create: { notizVonId, notizZuId },
  });
  res.status(201).json(await anreichern(a));
}

async function verknuepfungLoeschen(req, res) {
  const id = +req.params.id;
  const link = await prisma.notizVerknuepfung.findUnique({ where: { id }, include: { notizVon: true } });
  if (!link || link.notizVon.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Verknüpfung nicht gefunden' });
  }
  await prisma.notizVerknuepfung.delete({ where: { id } });
  res.json({ ok: true });
}

module.exports = { liste, suchen, erstellen, aktualisieren, loeschen, verknuepfen, verknuepfungLoeschen };
