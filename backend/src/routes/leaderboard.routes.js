const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboard.controller');

router.get('/rt', leaderboardController.getRTLeaderboard);
router.get('/users', leaderboardController.getUserLeaderboard);

module.exports = router;
