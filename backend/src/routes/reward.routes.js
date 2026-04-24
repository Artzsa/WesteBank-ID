const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/reward.controller');

router.get('/', rewardController.getRewards);
router.post('/', rewardController.createReward);
router.patch('/:id', rewardController.updateReward);
router.delete('/:id', rewardController.deleteReward);

router.post('/redeem', rewardController.redeemReward);
router.get('/redemptions', rewardController.getRedemptions);

module.exports = router;
