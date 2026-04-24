const express = require('express');
const router = express.Router();
const wasteController = require('../controllers/waste.controller');

router.post('/submit', wasteController.submitWaste);
router.get('/pending', wasteController.getPendingSubmissions);
router.patch('/:id/verify', wasteController.verifySubmission);
router.get('/stats/finance', wasteController.getFinancialStats);

module.exports = router;
