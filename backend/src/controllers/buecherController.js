const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'buchcover');

const STATUS_WERTE = ['wunschliste', 'am_lesen', 'gelesen'];

function heuteDatum() {
  return new Date().toISOString().slice(0, 10);
}

async function liste(req, res) {
  const { status } = req.query;
  const where = { nutzerId: req.user.id };
  if (status) {
    if (!STATUS_WERTE.includes(status)) return res.status(400).json({ error: 'Ungültiger Status' });
    where.status = status;
  }
  const buecher = await prisma.buch.findMany({ where, orderBy: { erstelltAm: 'desc' } });
  res.json(buecher);
}

async function erstellen(req, res) {
  const { titel, autor, coverUrl, seitenzahl, status } = req.body;
  if (!titel?.trim()) {
    return res.status(400).json({ error: 'Titel ist erforderlich' });
  }
  const gewaehlterStatus = status && STATUS_WERTE.includes(status) ? status : 'wunschliste';
  const buch = await prisma.buch.create({
    data: {
      nutzerId: req.user.id,
      titel: titel.trim(),
      autor: autor?.trim() || null,
      coverUrl: coverUrl || null,
      seitenzahl: seitenzahl != null ? +seitenzahl : null,
      status: gewaehlterStatus,
      begonnenAm: gewaehlterStatus === 'am_lesen' ? heuteDatum() : null,
      beendetAm: gewaehlterStatus === 'gelesen' ? heuteDatum() : null,
    },
  });
  res.status(201).json(buch);
}

async function aktualisieren(req, res) {
  const id = +req.params.id;
  const buch = await prisma.buch.findUnique({ where: { id } });
  if (!buch || buch.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Buch nicht gefunden' });
  }

  const { titel, autor, coverUrl, seitenzahl, status, aktuelleSeite, begonnenAm, beendetAm, bewertung } = req.body;
  const data = {};
  if (titel !== undefined) {
    if (!titel.trim()) return res.status(400).json({ error: 'Titel darf nicht leer sein' });
    data.titel = titel.trim();
  }
  if (autor !== undefined) data.autor = autor?.trim() || null;
  if (coverUrl !== undefined) data.coverUrl = coverUrl || null;
  if (seitenzahl !== undefined) data.seitenzahl = seitenzahl != null ? +seitenzahl : null;
  if (aktuelleSeite !== undefined) data.aktuelleSeite = aktuelleSeite != null ? +aktuelleSeite : null;
  if (bewertung !== undefined) data.bewertung = bewertung != null ? Math.min(5, Math.max(1, +bewertung)) : null;
  if (begonnenAm !== undefined) data.begonnenAm = begonnenAm || null;
  if (beendetAm !== undefined) data.beendetAm = beendetAm || null;

  if (status !== undefined) {
    if (!STATUS_WERTE.includes(status)) return res.status(400).json({ error: 'Ungültiger Status' });
    data.status = status;
    // Datum automatisch setzen, wenn der Nutzer beim Statuswechsel keins mitschickt.
    if (status === 'am_lesen' && !buch.begonnenAm && begonnenAm === undefined) data.begonnenAm = heuteDatum();
    if (status === 'gelesen' && !buch.beendetAm && beendetAm === undefined) data.beendetAm = heuteDatum();
  }

  const aktualisiert = await prisma.buch.update({ where: { id }, data });
  res.json(aktualisiert);
}

async function loeschen(req, res) {
  const id = +req.params.id;
  const buch = await prisma.buch.findUnique({ where: { id } });
  if (!buch || buch.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Buch nicht gefunden' });
  }
  await prisma.buch.delete({ where: { id } });
  if (buch.coverDateiname) {
    fs.unlink(path.join(UPLOAD_DIR, String(req.user.id), buch.coverDateiname), () => {});
  }
  res.json({ ok: true });
}

// Eigenes Cover-Foto bei manueller Eingabe — wie Fortschrittsfoto nicht öffentlich per
// express.static, sondern nur über diese authentifizierte Route und nur an den Eigentümer.
async function coverDatei(req, res) {
  const id = +req.params.id;
  const buch = await prisma.buch.findUnique({ where: { id } });
  if (!buch || buch.nutzerId !== req.user.id || !buch.coverDateiname) {
    return res.status(404).json({ error: 'Kein Cover-Foto vorhanden' });
  }
  res.sendFile(path.join(UPLOAD_DIR, String(req.user.id), buch.coverDateiname));
}

async function coverHochladen(req, res) {
  const id = +req.params.id;
  const buch = await prisma.buch.findUnique({ where: { id } });
  if (!buch || buch.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Buch nicht gefunden' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei empfangen' });
  }

  if (buch.coverDateiname) {
    fs.unlink(path.join(UPLOAD_DIR, String(req.user.id), buch.coverDateiname), () => {});
  }
  const aktualisiert = await prisma.buch.update({
    where: { id },
    data: { coverDateiname: req.file.filename, coverUrl: null },
  });
  res.status(201).json(aktualisiert);
}

module.exports = { liste, erstellen, aktualisieren, loeschen, coverDatei, coverHochladen, UPLOAD_DIR };
