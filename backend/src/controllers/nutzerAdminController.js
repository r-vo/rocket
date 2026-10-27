const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function alleNutzer(req, res) {
  const nutzer = await prisma.nutzer.findMany({
    select: { id: true, name: true, email: true, istAdmin: true, aktiv: true, erstelltAm: true },
    orderBy: { name: 'asc' },
  });
  res.json(nutzer);
}

async function nutzerErstellen(req, res) {
  const { name, email, passwort, istAdmin } = req.body;
  if (!name?.trim() || !email?.trim() || !passwort || passwort.length < 8) {
    return res.status(400).json({ error: 'Name, E-Mail und ein Passwort mit mindestens 8 Zeichen sind erforderlich' });
  }
  const vorhanden = await prisma.nutzer.findUnique({ where: { email: email.trim() } });
  if (vorhanden) {
    return res.status(409).json({ error: 'Diese E-Mail ist bereits vergeben' });
  }
  const passwortHash = await bcrypt.hash(passwort, 12);
  const nutzer = await prisma.nutzer.create({
    data: { name: name.trim(), email: email.trim(), passwortHash, istAdmin: !!istAdmin },
    select: { id: true, name: true, email: true, istAdmin: true, aktiv: true, erstelltAm: true },
  });
  res.status(201).json(nutzer);
}

// Sperrt/entsperrt einen Nutzer, statt ihn zu löschen — vorhandene Daten (Einträge, Aufgaben,
// Habits) bleiben dabei unangetastet erhalten.
async function nutzerAktualisieren(req, res) {
  const id = +req.params.id;
  const { aktiv, istAdmin, name } = req.body;
  if (id === req.user.id && aktiv === false) {
    return res.status(400).json({ error: 'Du kannst dich nicht selbst sperren' });
  }
  const data = {};
  if (aktiv !== undefined) data.aktiv = !!aktiv;
  if (istAdmin !== undefined) data.istAdmin = !!istAdmin;
  if (name !== undefined && name.trim()) data.name = name.trim();

  const nutzer = await prisma.nutzer.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, istAdmin: true, aktiv: true, erstelltAm: true },
  });
  res.json(nutzer);
}

async function passwortZuruecksetzen(req, res) {
  const id = +req.params.id;
  const { passwort } = req.body;
  if (!passwort || passwort.length < 8) {
    return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen haben' });
  }
  const passwortHash = await bcrypt.hash(passwort, 12);
  await prisma.nutzer.update({ where: { id }, data: { passwortHash } });
  // Alle bestehenden Sitzungen dieses Nutzers beenden, damit ein altes Passwort nicht über eine
  // noch laufende Sitzung weiter nutzbar bleibt.
  await prisma.sitzung.deleteMany({ where: { nutzerId: id } });
  res.json({ ok: true });
}

module.exports = { alleNutzer, nutzerErstellen, nutzerAktualisieren, passwortZuruecksetzen };
