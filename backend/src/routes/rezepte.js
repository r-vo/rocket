const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');
const rezepteController = require('../controllers/rezepteController');

const router = express.Router();
router.use(authMiddleware);

const fotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(rezepteController.UPLOAD_DIR, String(req.user.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${crypto.randomBytes(16).toString('hex')}.jpg`),
});
const fotoUpload = multer({
  storage: fotoStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

router.get('/', rezepteController.liste);
router.post('/', rezepteController.erstellen);
router.patch('/:id', rezepteController.aktualisieren);
router.delete('/:id', rezepteController.loeschen);
router.get('/:id/foto', rezepteController.fotoDatei);
router.post('/:id/foto', fotoUpload.single('foto'), rezepteController.fotoHochladen);
router.post('/:id/favorit', rezepteController.favoritSetzen);
router.delete('/:id/favorit', rezepteController.favoritEntfernen);

module.exports = router;
