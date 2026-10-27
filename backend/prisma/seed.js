const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const name = process.env.SEED_ADMIN_NAME;
  const passwort = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !name || !passwort) {
    console.error('SEED_ADMIN_EMAIL, SEED_ADMIN_NAME und SEED_ADMIN_PASSWORD müssen gesetzt sein.');
    process.exit(1);
  }

  const vorhanden = await prisma.nutzer.findUnique({ where: { email } });
  if (vorhanden) {
    console.log(`Admin-Nutzer ${email} existiert bereits — nichts geändert.`);
    return;
  }

  const passwortHash = await bcrypt.hash(passwort, 12);
  await prisma.nutzer.create({
    data: { name, email, passwortHash, istAdmin: true },
  });
  console.log(`Admin-Nutzer ${email} angelegt. Weitere Nutzer können danach über die Admin-Oberfläche angelegt werden.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
