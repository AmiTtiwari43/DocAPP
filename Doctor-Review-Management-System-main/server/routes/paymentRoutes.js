const express = require('express');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/create-intent', authMiddleware, paymentController.createPaymentIntent);
router.post('/confirm', authMiddleware, paymentController.confirmPayment);
router.get('/history', authMiddleware, paymentController.getPaymentHistory);

module.exports = router;

