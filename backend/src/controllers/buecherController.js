const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'buchcover');

const STATUS_WERTE = ['wunschliste', 'am_lesen', 'gelesen'];

function heuteDatum() {
  return new Date().toISOString().slice(0, 10);
}

// Tags liegen in der DB als JSON-String (siehe schema.prisma), die API gibt sie als Array aus —
// so muss das Frontend nirgends selbst parsen.
function tagsAusgeben(buch) {
  let tags = [];
  try {
    const geparst = JSON.parse(buch.tags || '[]');
    if (Array.isArray(geparst)) tags = geparst;
  } catch {
    tags = [];
  }
  return { ...buch, tags };
}

function tagsBereinigen(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))];
}

const MIT_LESERUNDEN = { leserunden: { orderBy: { id: 'asc' } } };

async function liste(req, res) {
  const { status } = req.query;
  const where = { nutzerId: req.user.id };
  if (status) {
    if (!STATUS_WERTE.includes(status)) return res.status(400).json({ error: 'Ungültiger Status' });
    where.status = status;
  }
  const buecher = await prisma.buch.findMany({ where, orderBy: { erstelltAm: 'desc' }, include: MIT_LESERUNDEN });
  res.json(buecher.map(tagsAusgeben));
}

async function erstellen(req, res) {
  const { titel, autor, verlag, ausgabe, isbn, coverUrl, seitenzahl, status, tags } = req.body;
  if (!titel?.trim()) {
    return res.status(400).json({ error: 'Titel ist erforderlich' });
  }
  const gewaehlterStatus = status && STATUS_WERTE.includes(status) ? status : 'wunschliste';
  const buch = await prisma.buch.create({
    data: {
      nutzerId: req.user.id,
      titel: titel.trim(),
      autor: autor?.trim() || null,
      verlag: verlag?.trim() || null,
      ausgabe: ausgabe?.trim() || null,
      isbn: isbn?.trim() || null,
      coverUrl: coverUrl || null,
      seitenzahl: seitenzahl != null ? +seitenzahl : null,
      status: gewaehlterStatus,
      tags: JSON.stringify(tagsBereinigen(tags)),
      leserunden: gewaehlterStatus === 'am_lesen'
        ? { create: { begonnenAm: heuteDatum() } }
        : gewaehlterStatus === 'gelesen'
          ? { create: { beendetAm: heuteDatum() } }
          : undefined,
    },
    include: MIT_LESERUNDEN,
  });
  res.status(201).json(tagsAusgeben(buch));
}

async function aktualisieren(req, res) {
  const id = +req.params.id;
  const buch = await prisma.buch.findUnique({ where: { id }, include: MIT_LESERUNDEN });
  if (!buch || buch.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Buch nicht gefunden' });
  }

  const { titel, autor, verlag, ausgabe, isbn, coverUrl, seitenzahl, status, aktuelleSeite, bewertung, tags } = req.body;
  const data = {};
  if (titel !== undefined) {
    if (!titel.trim()) return res.status(400).json({ error: 'Titel darf nicht leer sein' });
    data.titel = titel.trim();
  }
  if (autor !== undefined) data.autor = autor?.trim() || null;
  if (verlag !== undefined) data.verlag = verlag?.trim() || null;
  if (ausgabe !== undefined) data.ausgabe = ausgabe?.trim() || null;
  if (isbn !== undefined) data.isbn = isbn?.trim() || null;
  if (coverUrl !== undefined) data.coverUrl = coverUrl || null;
  if (seitenzahl !== undefined) data.seitenzahl = seitenzahl != null ? +seitenzahl : null;
  if (aktuelleSeite !== undefined) data.aktuelleSeite = aktuelleSeite != null ? +aktuelleSeite : null;
  if (bewertung !== undefined) data.bewertung = bewertung != null ? Math.min(5, Math.max(1, +bewertung)) : null;
  if (tags !== undefined) data.tags = JSON.stringify(tagsBereinigen(tags));

  if (status !== undefined) {
    if (!STATUS_WERTE.includes(status)) return res.status(400).json({ error: 'Ungültiger Status' });
    data.status = status;
    // Eine offene Leserunde ist eine ohne beendetAm. Beim Wechsel auf "am_lesen" wird — sofern
    // keine offene Leserunde existiert — eine neue begonnen (deckt sowohl den Erststart als auch
    // ein erneutes Lesen nach "gelesen" ab). Beim Wechsel auf "gelesen" wird die zuletzt offene
    // Leserunde geschlossen; existiert keine (z. B. Direktwechsel von "wunschliste"), wird eine
    // bereits abgeschlossene Leserunde ohne Startdatum angelegt.
    const offeneLeserunde = buch.leserunden.slice().reverse().find((l) => !l.beendetAm);
    if (status === 'am_lesen' && !offeneLeserunde) {
      data.leserunden = { create: { begonnenAm: heuteDatum() } };
    }
    if (status === 'gelesen') {
      if (offeneLeserunde) {
        await prisma.leserunde.update({ where: { id: offeneLeserunde.id }, data: { beendetAm: heuteDatum() } });
      } else {
        data.leserunden = { create: { beendetAm: heuteDatum() } };
      }
    }
  }

  const aktualisiert = await prisma.buch.update({ where: { id }, data, include: MIT_LESERUNDEN });
  res.json(tagsAusgeben(aktualisiert));
}

async function leserundeAktualisieren(req, res) {
  const id = +req.params.id;
  const leserunde = await prisma.leserunde.findUnique({ where: { id }, include: { buch: true } });
  if (!leserunde || leserunde.buch.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Leserunde nicht gefunden' });
  }
  const { begonnenAm, beendetAm } = req.body;
  const data = {};
  if (begonnenAm !== undefined) data.begonnenAm = begonnenAm || null;
  if (beendetAm !== undefined) data.beendetAm = beendetAm || null;
  await prisma.leserunde.update({ where: { id }, data });
  const buch = await prisma.buch.findUnique({ where: { id: leserunde.buchId }, include: MIT_LESERUNDEN });
  res.json(tagsAusgeben(buch));
}

async function leserundeLoeschen(req, res) {
  const id = +req.params.id;
  const leserunde = await prisma.leserunde.findUnique({ where: { id }, include: { buch: true } });
  if (!leserunde || leserunde.buch.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Leserunde nicht gefunden' });
  }
  await prisma.leserunde.delete({ where: { id } });
  const buch = await prisma.buch.findUnique({ where: { id: leserunde.buchId }, include: MIT_LESERUNDEN });
  res.json(tagsAusgeben(buch));
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
  res.status(201).json(tagsAusgeben(aktualisiert));
}

module.exports = {
  liste,
  erstellen,
  aktualisieren,
  loeschen,
  coverDatei,
  coverHochladen,
  leserundeAktualisieren,
  leserundeLoeschen,
  UPLOAD_DIR,
};
