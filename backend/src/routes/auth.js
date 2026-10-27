const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, logout, me } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Versuche. Bitte in 15 Minuten erneut probieren.' },
});

router.post('/login', loginLimiter, login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);

module.exports = router;
