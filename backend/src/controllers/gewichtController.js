const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function liste(req, res) {
  const eintraege = await prisma.gewichtseintrag.findMany({
    where: { nutzerId: req.user.id },
    orderBy: { datum: 'asc' },
  });
  res.json(eintraege);
}

async function eintragen(req, res) {
  const { datum, kg } = req.body;
  if (!datum || !kg || +kg <= 0) {
    return res.status(400).json({ error: 'Datum und ein gültiges Gewicht sind erforderlich' });
  }
  const eintrag = await prisma.gewichtseintrag.upsert({
    where: { nutzerId_datum: { nutzerId: req.user.id, datum } },
    update: { kg: +kg },
    create: { nutzerId: req.user.id, datum, kg: +kg },
  });
  res.json(eintrag);
}

module.exports = { liste, eintragen };
