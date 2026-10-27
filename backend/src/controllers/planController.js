const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function liste(req, res) {
  const punkte = await prisma.planpunkt.findMany({ where: { nutzerId: req.user.id } });
  res.json(punkte);
}

async function setzen(req, res) {
  const wochentag = +req.params.wochentag;
  const { mahlzeit } = req.params;
  const { text } = req.body;
  if (wochentag < 0 || wochentag > 6 || !['B', 'L', 'D'].includes(mahlzeit)) {
    return res.status(400).json({ error: 'Ungültiger Wochentag oder Mahlzeit' });
  }
  if (!text?.trim()) {
    return res.status(400).json({ error: 'Text darf nicht leer sein' });
  }
  const punkt = await prisma.planpunkt.upsert({
    where: { nutzerId_wochentag_mahlzeit: { nutzerId: req.user.id, wochentag, mahlzeit } },
    update: { text: text.trim() },
    create: { nutzerId: req.user.id, wochentag, mahlzeit, text: text.trim() },
  });
  res.json(punkt);
}

async function entfernen(req, res) {
  const wochentag = +req.params.wochentag;
  const { mahlzeit } = req.params;
  await prisma.planpunkt.deleteMany({ where: { nutzerId: req.user.id, wochentag, mahlzeit } });
  res.json({ ok: true });
}

async function alleEntfernen(req, res) {
  await prisma.planpunkt.deleteMany({ where: { nutzerId: req.user.id } });
  res.json({ ok: true });
}

module.exports = { liste, setzen, entfernen, alleEntfernen };
