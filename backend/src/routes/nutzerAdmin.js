const express = require('express');
const { alleNutzer, nutzerErstellen, nutzerAktualisieren, passwortZuruecksetzen } = require('../controllers/nutzerAdminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);
router.get('/', alleNutzer);
router.post('/', nutzerErstellen);
router.patch('/:id', nutzerAktualisieren);
router.post('/:id/passwort', passwortZuruecksetzen);

module.exports = router;
