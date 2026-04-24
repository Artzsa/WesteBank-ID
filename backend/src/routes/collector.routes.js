const express = require('express');
const router = express.Router();
const collectorController = require('../controllers/collector.controller');

router.get('/stocks', collectorController.getRTStocks);
router.get('/stats', collectorController.getDashboardStats);
router.get('/pickups', collectorController.getPickupSchedules);
router.post('/pickups', collectorController.createPickupSchedule);
router.patch('/pickups/:id/complete', collectorController.completePickup);

module.exports = router;
