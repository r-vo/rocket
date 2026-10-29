const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'rezeptfotos');

function tagsAusgeben(rezept) {
  let tags = [];
  try {
    const geparst = JSON.parse(rezept.tags || '[]');
    if (Array.isArray(geparst)) tags = geparst;
  } catch {
    tags = [];
  }
  return { ...rezept, tags };
}

function tagsBereinigen(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))];
}

function zutatenBereinigen(zutaten) {
  if (!Array.isArray(zutaten)) return [];
  return zutaten.map((z) => String(z).trim()).filter(Boolean);
}

const MIT_ZUTATEN_UND_NUTZER = {
  zutaten: { orderBy: { reihenfolge: 'asc' } },
  nutzer: { select: { id: true, name: true } },
};

// `favoritenIds` ist bewusst ein Set der ID's, die der ANFRAGENDE Nutzer favorisiert hat — ein
// Favorit ist rein persönlich (siehe RezeptFavorit in schema.prisma), gilt also nie für alle
// Nutzer gleich, selbst bei einem geteilten Rezept.
function antwortAufbereiten(rezept, eigenerNutzerId, favoritenIds = new Set()) {
  const { nutzer, ...rest } = tagsAusgeben(rezept);
  return {
    ...rest,
    nutzerName: nutzer.name,
    istEigenes: rezept.nutzerId === eigenerNutzerId,
    istFavorit: favoritenIds.has(rezept.id),
  };
}

async function favoritenIdsLaden(nutzerId) {
  const favoriten = await prisma.rezeptFavorit.findMany({ where: { nutzerId }, select: { rezeptId: true } });
  return new Set(favoriten.map((f) => f.rezeptId));
}

// Eigene Rezepte + öffentliche Rezepte anderer Nutzer — Bearbeiten/Löschen bleibt serverseitig
// trotzdem dem Ersteller vorbehalten (siehe schema.prisma).
async function liste(req, res) {
  const nutzerId = req.user.id;
  const [rezepte, favoritenIds] = await Promise.all([
    prisma.rezept.findMany({
      where: { OR: [{ nutzerId }, { oeffentlich: true }] },
      include: MIT_ZUTATEN_UND_NUTZER,
      orderBy: { erstelltAm: 'desc' },
    }),
    favoritenIdsLaden(nutzerId),
  ]);
  res.json(rezepte.map((r) => antwortAufbereiten(r, nutzerId, favoritenIds)));
}

async function erstellen(req, res) {
  const { titel, portionen, zeitMinuten, zubereitung, tags, oeffentlich, zutaten, kcal, nettoCarbs, fett, eiweiss } = req.body;
  if (!titel?.trim()) {
    return res.status(400).json({ error: 'Titel ist erforderlich' });
  }
  const zutatenListe = zutatenBereinigen(zutaten);
  const rezept = await prisma.rezept.create({
    data: {
      nutzerId: req.user.id,
      titel: titel.trim(),
      portionen: portionen != null ? +portionen : null,
      zeitMinuten: zeitMinuten != null ? +zeitMinuten : null,
      zubereitung: zubereitung?.trim() || null,
      kcal: kcal != null ? Math.max(0, Math.round(+kcal)) : null,
      nettoCarbs: nettoCarbs != null ? Math.max(0, +nettoCarbs) : null,
      fett: fett != null ? Math.max(0, +fett) : null,
      eiweiss: eiweiss != null ? Math.max(0, +eiweiss) : null,
      tags: JSON.stringify(tagsBereinigen(tags)),
      oeffentlich: !!oeffentlich,
      zutaten: { create: zutatenListe.map((text, i) => ({ text, reihenfolge: i })) },
    },
    include: MIT_ZUTATEN_UND_NUTZER,
  });
  res.status(201).json(antwortAufbereiten(rezept, req.user.id));
}

// Normale Felder (Titel/Zutaten/Zubereitung/...) darf nur der Ersteller ändern. Die
// Nährwert-Felder darf laut Ronnys Wunsch jeder ändern, der das Rezept sehen darf — also auch
// der Empfänger eines geteilten (öffentlichen) Rezepts, nicht nur der Ersteller.
async function aktualisieren(req, res) {
  const id = +req.params.id;
  const rezept = await prisma.rezept.findUnique({ where: { id } });
  const istEigentuemer = !!rezept && rezept.nutzerId === req.user.id;
  const sichtbarFuerMich = !!rezept && (istEigentuemer || rezept.oeffentlich);
  if (!sichtbarFuerMich) {
    return res.status(404).json({ error: 'Rezept nicht gefunden' });
  }

  const { titel, portionen, zeitMinuten, zubereitung, tags, oeffentlich, zutaten, kcal, nettoCarbs, fett, eiweiss } = req.body;
  const data = {};

  if (istEigentuemer) {
    if (titel !== undefined) {
      if (!titel.trim()) return res.status(400).json({ error: 'Titel darf nicht leer sein' });
      data.titel = titel.trim();
    }
    if (portionen !== undefined) data.portionen = portionen != null ? +portionen : null;
    if (zeitMinuten !== undefined) data.zeitMinuten = zeitMinuten != null ? +zeitMinuten : null;
    if (zubereitung !== undefined) data.zubereitung = zubereitung?.trim() || null;
    if (tags !== undefined) data.tags = JSON.stringify(tagsBereinigen(tags));
    if (oeffentlich !== undefined) data.oeffentlich = !!oeffentlich;
    if (zutaten !== undefined) {
      // Einfachste Variante für die geringe Zeilenzahl eines Rezepts: komplett ersetzen statt
      // einzelne Zeilen zu diffen.
      const zutatenListe = zutatenBereinigen(zutaten);
      data.zutaten = {
        deleteMany: {},
        create: zutatenListe.map((text, i) => ({ text, reihenfolge: i })),
      };
    }
  }

  if (kcal !== undefined) data.kcal = kcal != null ? Math.max(0, Math.round(+kcal)) : null;
  if (nettoCarbs !== undefined) data.nettoCarbs = nettoCarbs != null ? Math.max(0, +nettoCarbs) : null;
  if (fett !== undefined) data.fett = fett != null ? Math.max(0, +fett) : null;
  if (eiweiss !== undefined) data.eiweiss = eiweiss != null ? Math.max(0, +eiweiss) : null;

  const aktualisiert = await prisma.rezept.update({ where: { id }, data, include: MIT_ZUTATEN_UND_NUTZER });
  const favoritenIds = await favoritenIdsLaden(req.user.id);
  res.json(antwortAufbereiten(aktualisiert, req.user.id, favoritenIds));
}

async function loeschen(req, res) {
  const id = +req.params.id;
  const rezept = await prisma.rezept.findUnique({ where: { id } });
  if (!rezept || rezept.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Rezept nicht gefunden' });
  }
  await prisma.rezept.delete({ where: { id } });
  if (rezept.fotoDateiname) {
    fs.unlink(path.join(UPLOAD_DIR, String(req.user.id), rezept.fotoDateiname), () => {});
  }
  res.json({ ok: true });
}

// Foto darf sehen, wer das Rezept sehen darf (Ersteller oder — bei öffentlichem Rezept — jeder
// Nutzer), analog zum Buchcover-Muster aber mit zusätzlicher Sichtbarkeitsprüfung.
async function fotoDatei(req, res) {
  const id = +req.params.id;
  const rezept = await prisma.rezept.findUnique({ where: { id } });
  const sichtbar = rezept && (rezept.nutzerId === req.user.id || rezept.oeffentlich);
  if (!sichtbar || !rezept.fotoDateiname) {
    return res.status(404).json({ error: 'Kein Foto vorhanden' });
  }
  res.sendFile(path.join(UPLOAD_DIR, String(rezept.nutzerId), rezept.fotoDateiname));
}

async function fotoHochladen(req, res) {
  const id = +req.params.id;
  const rezept = await prisma.rezept.findUnique({ where: { id } });
  if (!rezept || rezept.nutzerId !== req.user.id) {
    return res.status(404).json({ error: 'Rezept nicht gefunden' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei empfangen' });
  }
  if (rezept.fotoDateiname) {
    fs.unlink(path.join(UPLOAD_DIR, String(req.user.id), rezept.fotoDateiname), () => {});
  }
  const aktualisiert = await prisma.rezept.update({
    where: { id },
    data: { fotoDateiname: req.file.filename },
    include: MIT_ZUTATEN_UND_NUTZER,
  });
  const favoritenIds = await favoritenIdsLaden(req.user.id);
  res.status(201).json(antwortAufbereiten(aktualisiert, req.user.id, favoritenIds));
}

// Favorit ist eine rein persönliche Einstufung (siehe schema.prisma) — erlaubt für jedes
// sichtbare Rezept, nicht nur eigene.
async function favoritSetzen(req, res) {
  const id = +req.params.id;
  const rezept = await prisma.rezept.findUnique({ where: { id } });
  if (!rezept || (rezept.nutzerId !== req.user.id && !rezept.oeffentlich)) {
    return res.status(404).json({ error: 'Rezept nicht gefunden' });
  }
  await prisma.rezeptFavorit.upsert({
    where: { nutzerId_rezeptId: { nutzerId: req.user.id, rezeptId: id } },
    update: {},
    create: { nutzerId: req.user.id, rezeptId: id },
  });
  res.status(201).json({ ok: true, istFavorit: true });
}

async function favoritEntfernen(req, res) {
  const id = +req.params.id;
  await prisma.rezeptFavorit.deleteMany({ where: { nutzerId: req.user.id, rezeptId: id } });
  res.json({ ok: true, istFavorit: false });
}

module.exports = {
  liste,
  erstellen,
  aktualisieren,
  loeschen,
  fotoDatei,
  fotoHochladen,
  favoritSetzen,
  favoritEntfernen,
  UPLOAD_DIR,
};
