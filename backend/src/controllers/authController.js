const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { tokenErzeugen, tokenHashen, gueltigBis } = require('../utils/sitzung');

const prisma = new PrismaClient();

async function login(req, res) {
  const { email, passwort } = req.body;
  if (!email || !passwort) {
    return res.status(400).json({ error: 'E-Mail und Passwort erforderlich' });
  }

  const nutzer = await prisma.nutzer.findUnique({ where: { email } });
  if (!nutzer) {
    return res.status(401).json({ error: 'E-Mail oder Passwort falsch' });
  }

  const gueltig = await bcrypt.compare(passwort, nutzer.passwortHash);
  if (!gueltig) {
    return res.status(401).json({ error: 'E-Mail oder Passwort falsch' });
  }
  if (!nutzer.aktiv) {
    return res.status(403).json({ error: 'Zugang ist gesperrt' });
  }

  // Abgelaufene Sitzungen dieses Nutzers bei Gelegenheit aufräumen (kein eigener Cron-Job nötig).
  await prisma.sitzung.deleteMany({ where: { nutzerId: nutzer.id, gueltigBis: { lt: new Date() } } });

  const token = tokenErzeugen();
  await prisma.sitzung.create({
    data: { nutzerId: nutzer.id, tokenHash: tokenHashen(token), gueltigBis: gueltigBis() },
  });

  res.json({
    token,
    nutzer: { id: nutzer.id, name: nutzer.name, email: nutzer.email, istAdmin: nutzer.istAdmin },
  });
}

// Löscht die Sitzung sofort server-seitig — anders als im ersten Entwurf, wo "Abmelden" nur
// lokal das Token entfernte und die Sitzung auf dem Server faktisch bis zu 365 Tage gültig blieb.
async function logout(req, res) {
  await prisma.sitzung.deleteMany({ where: { tokenHash: req.sitzungTokenHash } });
  res.json({ ok: true });
}

async function me(req, res) {
  const nutzer = await prisma.nutzer.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, istAdmin: true },
  });
  res.json(nutzer);
}

module.exports = { login, logout, me };
