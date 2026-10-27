const crypto = require('crypto');

const SITZUNG_GUELTIGKEIT_TAGE = 60;

const tokenErzeugen = () => crypto.randomBytes(32).toString('hex');
const tokenHashen = (token) => crypto.createHash('sha256').update(token).digest('hex');

function gueltigBis() {
  const d = new Date();
  d.setDate(d.getDate() + SITZUNG_GUELTIGKEIT_TAGE);
  return d;
}

module.exports = { tokenErzeugen, tokenHashen, gueltigBis, SITZUNG_GUELTIGKEIT_TAGE };
