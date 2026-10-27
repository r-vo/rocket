const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function buchPruefen(buchId, nutzerId) {
  const buch = await prisma.buch.findUnique({ where: { id: buchId } });
  return buch && buch.nutzerId === nutzerId ? buch : null;
}

async function liste(req, res) {
  const buchId = +req.params.buchId;
  const buch = await buchPruefen(buchId, req.user.id);
  if (!buch) return res.status(404).json({ error: 'Buch nicht gefunden' });

  const notizen = await prisma.buchNotiz.findMany({ where: { buchId }, orderBy: { erstelltAm: 'asc' } });
  res.json(notizen);
}

async function erstellen(req, res) {
  const buchId = +req.params.buchId;
  const buch = await buchPruefen(buchId, req.user.id);
  if (!buch) return res.status(404).json({ error: 'Buch nicht gefunden' });

  const { text, seite } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text ist erforderlich' });

  const notiz = await prisma.buchNotiz.create({
    data: { buchId, nutzerId: req.user.id, text: text.trim(), seite: seite != null ? +seite : null },
  });
  res.status(201).json(notiz);
}

async function aktualisieren(req, res) {
  const id = +req.params.id;
  const notiz = await prisma.buchNotiz.findUnique({ where: { id } });
  if (!notiz || notiz.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Notiz nicht gefunden' });
  }

  const { text, seite } = req.body;
  if (text !== undefined && !text.trim()) return res.status(400).json({ error: 'Text darf nicht leer sein' });

  const aktualisiert = await prisma.buchNotiz.update({
    where: { id },
    data: {
      ...(text !== undefined ? { text: text.trim() } : {}),
      ...(seite !== undefined ? { seite: seite != null ? +seite : null } : {}),
    },
  });
  res.json(aktualisiert);
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

module.exports = { liste, erstellen, aktualisieren, loeschen };
