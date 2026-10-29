const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const heuteController = require('../controllers/heuteController');

const router = express.Router();
router.use(authMiddleware);

router.get('/', heuteController.uebersicht);

module.exports = router;
