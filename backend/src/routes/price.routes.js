const express = require('express');
const router = express.Router();
const priceController = require('../controllers/price.controller');

router.get('/', priceController.getAllPrices);
router.patch('/:type', priceController.updatePrice);

module.exports = router;
