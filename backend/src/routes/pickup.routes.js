const express = require('express');
const router = express.Router();
const pickupController = require('../controllers/pickup.controller');

router.get('/', pickupController.getAllPickups);
router.post('/', pickupController.createPickup);
router.patch('/:id', pickupController.updatePickup);
router.delete('/:id', pickupController.deletePickup);

module.exports = router;
