const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');
const buecherController = require('../controllers/buecherController');
const notizenController = require('../controllers/buchNotizenController');

const router = express.Router();
router.use(authMiddleware);

const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(buecherController.UPLOAD_DIR, String(req.user.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${crypto.randomBytes(16).toString('hex')}.jpg`),
});
const coverUpload = multer({
  storage: coverStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

router.get('/', buecherController.liste);
router.post('/', buecherController.erstellen);
router.patch('/:id', buecherController.aktualisieren);
router.delete('/:id', buecherController.loeschen);
router.get('/:id/cover', buecherController.coverDatei);
router.post('/:id/cover', coverUpload.single('foto'), buecherController.coverHochladen);

router.patch('/leserunden/:id', buecherController.leserundeAktualisieren);
router.delete('/leserunden/:id', buecherController.leserundeLoeschen);

router.get('/:buchId/notizen', notizenController.liste);
router.post('/:buchId/notizen', notizenController.erstellen);
router.put('/notizen/:id', notizenController.aktualisieren);
router.delete('/notizen/:id', notizenController.loeschen);

module.exports = router;
