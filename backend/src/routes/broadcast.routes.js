const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcast.controller');

router.get('/history', broadcastController.getBroadcastHistory);
router.post('/log', broadcastController.logBroadcast);

module.exports = router;
