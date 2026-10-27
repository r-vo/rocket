const express = require('express');
const { eintraege, eintragErstellen, eintragLoeschen, favoriten } = require('../controllers/ernaehrungController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
router.get('/favoriten', favoriten);
router.get('/', eintraege);
router.post('/', eintragErstellen);
router.delete('/:id', eintragLoeschen);

module.exports = router;
