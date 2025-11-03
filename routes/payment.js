const express = require('express');
const router = express.Router();
const { getAllPayments, initiatePayment, getPaymentById, paymentWebhook, createCheckoutUrl, createCheckoutSession, createPaymentLink } = require("../controller/payment");

// Route: GET /api/payments
router.get("/all-payments", getAllPayments);
router.post("/initiate", initiatePayment);
router.post("/create-checkout", createCheckoutUrl);
router.post('/create-checkout-session', createCheckoutSession);
router.post('/link', createPaymentLink);
router.get("/single-payment-detail/:id", getPaymentById);
router.get("/webhook", paymentWebhook);

module.exports = router;