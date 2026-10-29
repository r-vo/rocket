require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const nutzerAdminRoutes = require('./routes/nutzerAdmin');
const profilRoutes = require('./routes/profil');
const ernaehrungRoutes = require('./routes/ernaehrung');
const gewichtRoutes = require('./routes/gewicht');
const fotoRoutes = require('./routes/fotos');
const planRoutes = require('./routes/plan');
const einstellungenRoutes = require('./routes/einstellungen');
const buecherRoutes = require('./routes/buecher');
const heuteRoutes = require('./routes/heute');
const habitRoutes = require('./routes/habits');
const rezepteRoutes = require('./routes/rezepte');

const app = express();
const PORT = process.env.PORT || 3002;

// Läuft hinter Caddy (Reverse Proxy) — nötig, damit express-rate-limit die echte
// Client-IP aus X-Forwarded-For korrekt liest statt alle Anfragen als eine IP zu zählen.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin/nutzer', nutzerAdminRoutes);
app.use('/api/profil', profilRoutes);
app.use('/api/ernaehrung', ernaehrungRoutes);
app.use('/api/gewicht', gewichtRoutes);
app.use('/api/fotos', fotoRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/einstellungen', einstellungenRoutes);
app.use('/api/buecher', buecherRoutes);
app.use('/api/heute', heuteRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/rezepte', rezepteRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route nicht gefunden: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    const nachricht = err.code === 'LIMIT_FILE_SIZE' ? 'Datei zu groß (max. 8 MB).' : 'Datei-Upload fehlgeschlagen.';
    return res.status(400).json({ error: nachricht });
  }
  const statusCode = err.statusCode || 500;
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }
  const nachricht = statusCode < 500 ? err.message : 'Ein interner Fehler ist aufgetreten.';
  res.status(statusCode).json({ error: nachricht });
});

// Siehe Verwalterapp-Konvention: ein einzelner unbehandelter Fehler soll nicht den ganzen
// Prozess mitreißen, sondern nur geloggt werden.
process.on('unhandledRejection', (err) => {
  console.error('Unbehandelte Promise-Ablehnung (Prozess läuft weiter):', err);
});

app.listen(PORT, () => {
  console.log(`Rocket Backend läuft auf http://localhost:${PORT}`);
});

module.exports = app;
