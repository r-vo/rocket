// Einmaliges Übernahme-Skript (auf Ronnys Bitte 2026-10-29): wandelt bestehende Freitext-
// Planpunkte, die noch nicht mit einem Rezept verknüpft sind, in echte (private) Rezepte im
// Rezepte-Modul um und verlinkt sie automatisch. Mehrere Planpunkte desselben Nutzers mit
// exakt demselben Text landen bei genau einem gemeinsamen Rezept statt mehrfach angelegt zu
// werden. Idempotent: ein erneuter Lauf erstellt keine Duplikate, da zuerst nach einem
// bestehenden Rezept mit demselben Titel gesucht wird.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const offenePunkte = await prisma.planpunkt.findMany({ where: { rezeptId: null } });

  const gruppen = new Map(); // `${nutzerId}::${text}` -> Planpunkt[]
  for (const p of offenePunkte) {
    const text = p.text.trim();
    if (!text) continue;
    const schluessel = `${p.nutzerId}::${text}`;
    if (!gruppen.has(schluessel)) gruppen.set(schluessel, []);
    gruppen.get(schluessel).push(p);
  }

  let erstellt = 0;
  let wiederverwendet = 0;
  let verlinkt = 0;

  for (const punkte of gruppen.values()) {
    const { nutzerId, text } = punkte[0];
    let rezept = await prisma.rezept.findFirst({ where: { nutzerId, titel: text } });
    if (rezept) {
      wiederverwendet++;
    } else {
      rezept = await prisma.rezept.create({ data: { nutzerId, titel: text, oeffentlich: false } });
      erstellt++;
    }
    await prisma.planpunkt.updateMany({
      where: { id: { in: punkte.map((p) => p.id) } },
      data: { rezeptId: rezept.id },
    });
    verlinkt += punkte.length;
  }

  console.log(
    `Fertig: ${erstellt} neue Rezepte erstellt, ${wiederverwendet} bereits vorhandene wiederverwendet, ${verlinkt} Planpunkte verlinkt.`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
