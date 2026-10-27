const express = require('express');
const { liste, eintragen } = require('../controllers/gewichtController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);
router.get('/', liste);
router.put('/', eintragen);

module.exports = router;
