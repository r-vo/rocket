const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'fotos');

async function liste(req, res) {
  const fotos = await prisma.fortschrittsfoto.findMany({
    where: { nutzerId: req.user.id },
    orderBy: { datum: 'asc' },
  });
  res.json(fotos.map((f) => ({ id: f.id, datum: f.datum })));
}

// Fotos sind personenbezogene Fortschrittsbilder — werden deshalb nicht per express.static
// öffentlich ausgeliefert, sondern nur über diese authentifizierte Route und nur an den
// Eigentümer. Siehe Review des ersten Entwurfs, Punkt 3.
async function datei(req, res) {
  const id = +req.params.id;
  const foto = await prisma.fortschrittsfoto.findUnique({ where: { id } });
  if (!foto || foto.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Foto nicht gefunden' });
  }
  res.sendFile(path.join(UPLOAD_DIR, String(req.user.id), foto.dateiname));
}

async function hochladen(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei empfangen' });
  }
  const { datum } = req.body;
  const foto = await prisma.fortschrittsfoto.create({
    data: { nutzerId: req.user.id, datum: datum || new Date().toISOString().slice(0, 10), dateiname: req.file.filename },
  });
  res.status(201).json({ id: foto.id, datum: foto.datum });
}

async function loeschen(req, res) {
  const id = +req.params.id;
  const foto = await prisma.fortschrittsfoto.findUnique({ where: { id } });
  if (!foto || foto.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Foto nicht gefunden' });
  }
  await prisma.fortschrittsfoto.delete({ where: { id } });
  fs.unlink(path.join(UPLOAD_DIR, String(req.user.id), foto.dateiname), () => {});
  res.json({ ok: true });
}

module.exports = { liste, datei, hochladen, loeschen, UPLOAD_DIR };
