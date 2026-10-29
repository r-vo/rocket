const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function liste(req, res) {
  const punkte = await prisma.planpunkt.findMany({
    where: { nutzerId: req.user.id },
    include: { rezept: { select: { id: true, titel: true, nutzerId: true } } },
  });
  res.json(punkte);
}

async function setzen(req, res) {
  const wochentag = +req.params.wochentag;
  const { mahlzeit } = req.params;
  const { text, rezeptId } = req.body;
  if (wochentag < 0 || wochentag > 6 || !['B', 'L', 'D'].includes(mahlzeit)) {
    return res.status(400).json({ error: 'Ungültiger Wochentag oder Mahlzeit' });
  }
  if (!text?.trim()) {
    return res.status(400).json({ error: 'Text darf nicht leer sein' });
  }

  // Nur mit einem Rezept verknüpfen, das der Nutzer auch sehen darf (eigenes oder geteiltes) —
  // sonst könnte ein Planpunkt auf ein fremdes, privates Rezept zeigen.
  let geprueftesRezeptId = null;
  if (rezeptId != null) {
    const rezept = await prisma.rezept.findUnique({ where: { id: +rezeptId } });
    if (!rezept || (rezept.nutzerId !== req.user.id && !rezept.oeffentlich)) {
      return res.status(400).json({ error: 'Rezept nicht gefunden oder nicht sichtbar' });
    }
    geprueftesRezeptId = rezept.id;
  }

  const punkt = await prisma.planpunkt.upsert({
    where: { nutzerId_wochentag_mahlzeit: { nutzerId: req.user.id, wochentag, mahlzeit } },
    update: { text: text.trim(), rezeptId: geprueftesRezeptId },
    create: { nutzerId: req.user.id, wochentag, mahlzeit, text: text.trim(), rezeptId: geprueftesRezeptId },
    include: { rezept: { select: { id: true, titel: true, nutzerId: true } } },
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

// Übernimmt die aktuell im Plan angezeigten Texte (echte Einträge wie auch die clientseitig
// berechneten Vorschläge für noch leere Slots, siehe planVorschlag() im Frontend) als eigene,
// private Rezepte und verlinkt die jeweiligen Slots automatisch. Läuft bewusst über die normale
// authentifizierte Route und nur auf req.user.id, ausgelöst vom Nutzer selbst im Browser — dort
// liegen die zur Vorschlagsberechnung nötigen Profildaten (Eiweißziel etc.) bereits vor, hier
// im Backend müssten sie sonst separat nachgebildet werden. Mehrere Slots mit identischem Text
// landen bei genau einem gemeinsamen Rezept.
async function rezepteUebernehmen(req, res) {
  const { eintraege } = req.body;
  if (!Array.isArray(eintraege)) {
    return res.status(400).json({ error: 'eintraege (Array) ist erforderlich' });
  }

  const gruppen = new Map(); // text -> [{wochentag, mahlzeit}]
  for (const e of eintraege) {
    const text = e.text?.trim();
    const wochentag = +e.wochentag;
    if (!text || Number.isNaN(wochentag) || wochentag < 0 || wochentag > 6 || !['B', 'L', 'D'].includes(e.mahlzeit)) continue;
    if (!gruppen.has(text)) gruppen.set(text, []);
    gruppen.get(text).push({ wochentag, mahlzeit: e.mahlzeit });
  }

  let erstellt = 0;
  let wiederverwendet = 0;
  let verlinkt = 0;

  for (const [text, slots] of gruppen) {
    let rezept = await prisma.rezept.findFirst({ where: { nutzerId: req.user.id, titel: text } });
    if (rezept) {
      wiederverwendet++;
    } else {
      rezept = await prisma.rezept.create({ data: { nutzerId: req.user.id, titel: text, oeffentlich: false } });
      erstellt++;
    }
    for (const s of slots) {
      await prisma.planpunkt.upsert({
        where: { nutzerId_wochentag_mahlzeit: { nutzerId: req.user.id, wochentag: s.wochentag, mahlzeit: s.mahlzeit } },
        update: { text, rezeptId: rezept.id },
        create: { nutzerId: req.user.id, wochentag: s.wochentag, mahlzeit: s.mahlzeit, text, rezeptId: rezept.id },
      });
      verlinkt++;
    }
  }

  res.json({ ok: true, erstellt, wiederverwendet, verlinkt });
}

module.exports = { liste, setzen, entfernen, alleEntfernen, rezepteUebernehmen };
