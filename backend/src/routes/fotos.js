const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { liste, datei, hochladen, loeschen, UPLOAD_DIR } = require('../controllers/fotoController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_DIR, String(req.user.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  // Zufälliger Dateiname statt z. B. des Originalnamens — die Datei wird zwar ohnehin nur über
  // die authentifizierte Route ausgeliefert, aber so bleibt auch der Dateiname selbst
  // nicht erratbar/aussagekräftig.
  filename: (req, file, cb) => cb(null, `${crypto.randomBytes(16).toString('hex')}.jpg`),
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

router.get('/', liste);
router.get('/:id/datei', datei);
router.post('/', upload.single('foto'), hochladen);
router.delete('/:id', loeschen);

module.exports = router;
