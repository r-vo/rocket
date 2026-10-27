const { PrismaClient } = require('@prisma/client');
const { MODULE_REGISTRY } = require('../utils/module');

const prisma = new PrismaClient();

function deaktivierteLesen(nutzer) {
  try {
    const liste = JSON.parse(nutzer.deaktivierteModule || '[]');
    return Array.isArray(liste) ? liste : [];
  } catch {
    return [];
  }
}

async function modulListe(req, res) {
  const nutzer = await prisma.nutzer.findUnique({ where: { id: req.user.id } });
  const deaktiviert = deaktivierteLesen(nutzer);
  res.json(MODULE_REGISTRY.map((m) => ({ ...m, aktiv: !deaktiviert.includes(m.schluessel) })));
}

async function modulSetzen(req, res) {
  const { schluessel } = req.params;
  const { aktiv } = req.body;
  if (!MODULE_REGISTRY.some((m) => m.schluessel === schluessel)) {
    return res.status(404).json({ error: 'Unbekanntes Modul' });
  }

  const nutzer = await prisma.nutzer.findUnique({ where: { id: req.user.id } });
  const deaktiviert = new Set(deaktivierteLesen(nutzer));
  if (aktiv) {
    deaktiviert.delete(schluessel);
  } else {
    deaktiviert.add(schluessel);
  }

  await prisma.nutzer.update({
    where: { id: req.user.id },
    data: { deaktivierteModule: JSON.stringify([...deaktiviert]) },
  });
  res.json({ schluessel, aktiv: !!aktiv });
}

module.exports = { modulListe, modulSetzen };
