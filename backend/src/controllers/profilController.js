const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function profilAbrufen(req, res) {
  const profil = await prisma.nutzerProfil.findUnique({ where: { nutzerId: req.user.id } });
  const letztesGewicht = await prisma.gewichtseintrag.findFirst({
    where: { nutzerId: req.user.id },
    orderBy: { datum: 'desc' },
  });
  res.json({ ...profil, gewichtAktuell: letztesGewicht?.kg ?? null });
}

async function profilSpeichern(req, res) {
  const { alter, geschlecht, groesseCm, gewichtZielKg, nettoCarbsZielG, alltagFaktor, trainingstage, equipment, tempo, zieldatum, extraDefizit } = req.body;
  if (!alter || !groesseCm) {
    return res.status(400).json({ error: 'Alter und Größe sind erforderlich' });
  }

  const data = {
    alter: +alter,
    geschlecht: geschlecht || 'f',
    groesseCm: +groesseCm,
    gewichtZielKg: gewichtZielKg ? +gewichtZielKg : null,
    nettoCarbsZielG: nettoCarbsZielG ? Math.min(150, Math.max(5, +nettoCarbsZielG)) : 25,
    alltagFaktor: alltagFaktor ? +alltagFaktor : 1.2,
    trainingstage: trainingstage ? +trainingstage : 3,
    equipment: equipment || 'home',
  };
  if (tempo !== undefined) data.tempo = tempo;
  if (zieldatum !== undefined) data.zieldatum = zieldatum;
  if (extraDefizit !== undefined) data.extraDefizit = +extraDefizit;

  const profil = await prisma.nutzerProfil.upsert({
    where: { nutzerId: req.user.id },
    update: data,
    create: { nutzerId: req.user.id, ...data },
  });
  res.json(profil);
}

module.exports = { profilAbrufen, profilSpeichern };
