const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const habitController = require('../controllers/habitController');

const router = express.Router();
router.use(authMiddleware);

router.get('/', habitController.liste);
router.post('/', habitController.erstellen);
router.patch('/:id', habitController.aktualisieren);
router.delete('/:id', habitController.loeschen);
router.put('/:id/eintraege/:datum', habitController.eintragSetzen);

module.exports = router;
