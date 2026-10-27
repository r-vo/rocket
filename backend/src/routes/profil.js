const express = require('express');
const { profilAbrufen, profilSpeichern } = require('../controllers/profilController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
router.get('/', profilAbrufen);
router.put('/', profilSpeichern);

module.exports = router;
