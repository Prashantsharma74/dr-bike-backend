const express = require('express');
const router = express.Router();
const { getAllPayments, initiatePayment, getPaymentById, paymentWebhook } = require("../controller/payment");

// Route: GET /api/payments
router.get("/all-payments", getAllPayments);
router.post("/initiate", initiatePayment);
router.get("/single-payment-detail/:id", getPaymentById);
router.get("/webhook", paymentWebhook);

module.exports = router;