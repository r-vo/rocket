const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { modulListe, modulSetzen } = require('../controllers/einstellungenController');

const router = express.Router();

router.use(authMiddleware);
router.get('/module', modulListe);
router.put('/module/:schluessel', modulSetzen);

module.exports = router;
