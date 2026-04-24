const express = require('express');
const router = express.Router();
const botController = require('../controllers/bot.controller');

router.post('/send-message', botController.sendMessage);

module.exports = router;
