const { PrismaClient } = require('@prisma/client');
const { tokenHashen } = require('../utils/sitzung');

const prisma = new PrismaClient();

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Kein Authentifizierungs-Token vorhanden' });
  }

  const token = authHeader.split(' ')[1];
  const tokenHash = tokenHashen(token);

  const sitzung = await prisma.sitzung.findUnique({
    where: { tokenHash },
    include: { nutzer: true },
  });

  if (!sitzung || sitzung.gueltigBis < new Date()) {
    return res.status(401).json({ error: 'Sitzung ungültig oder abgelaufen' });
  }
  if (!sitzung.nutzer.aktiv) {
    return res.status(403).json({ error: 'Zugang ist gesperrt' });
  }

  req.sitzungTokenHash = tokenHash;
  req.user = { id: sitzung.nutzer.id, email: sitzung.nutzer.email, name: sitzung.nutzer.name, istAdmin: sitzung.nutzer.istAdmin };
  next();
}

function adminMiddleware(req, res, next) {
  if (!req.user?.istAdmin) {
    return res.status(403).json({ error: 'Nur für Administratoren' });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware };
