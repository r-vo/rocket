const express = require('express');
const { liste, setzen, entfernen, alleEntfernen } = require('../controllers/planController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
router.get('/', liste);
router.delete('/', alleEntfernen);
router.put('/:wochentag/:mahlzeit', setzen);
router.delete('/:wochentag/:mahlzeit', entfernen);

module.exports = router;
