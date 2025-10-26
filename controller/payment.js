var crypto = require('crypto');
const jwt_decode = require("jwt-decode");
const { type } = require("os");
const Booking = require("../models/Booking");
// const Booking = require("../models/Booking");
const sdk = require('api')('@cashfreedocs-new/v3#4xc3n730larv4wbt');
var Tracking = require("../models/Tracking");
const { default: axios } = require("axios");
var Payment = require("../models/Payment");
const customers = require("../models/customer_model");
// const Dealer = require("../models/Dealer");
const Dealer = require("../models/dealerModel");
const Card = require("../models/cardModel");
const Wallet = require("../models/Wallet_modal")
const Razorpay = require('razorpay');
const { method } = require('lodash');
const contacts = require("../models/Contact_model")
const FundAccount = require("../models/FundAccount_model")
const CryptoJS = require('crypto-js');
const QRCode = require('qrcode');
const API_KEY_ID = process.env.API_KEY_ID_RAZO;
const API_KEY_SECRET = process.env.API_KEY_SECRET_RAZO;
const Vendor = require("../models/Dealer");
const Customer = require("../models/customer_model");

const CASHFREE_BASE_URL =
    process.env.CASHFREE_ENV === "production"
        ? "https://api.cashfree.com/pg/orders"
        : "https://sandbox.cashfree.com/pg/orders";

// Initiate Payment
const initiatePayment = async (req, res) => {
    try {
        // Temporary data
        const booking_id = "68fc8781a2bb1e138c0e0e04";
        const dealer_id = "68d8dbbd1b6028afae8ee02b";
        const user_id = "688cd4088e19dcba2bcff2b7";
        const orderAmount = 1200;
        const payment_by = "user";
        const payment_type = "ONLINE";

        const orderId = `ORD_${Date.now()}`;

        const payload = {
            order_id: orderId,
            order_amount: orderAmount,
            order_currency: "INR",
            customer_details: {
                customer_id: user_id,
                customer_email: "user@example.com",
                customer_phone: "9999999999",
            },
            order_meta: {
                return_url: `https://yourfrontend.com/payment-success?order_id={order_id}`,
                notify_url: `https://yourbackend.com/api/payments/webhook`,
            },
        };

        const response = await axios.post(CASHFREE_BASE_URL, payload, {
            headers: {
                "x-client-id": process.env.APP_ID,
                "x-client-secret": process.env.SECRET_KEY,
                "x-api-version": "2022-09-01",
                "Content-Type": "application/json",
            },
        });

        const data = response.data;

        // Normalize status & token
        const orderStatus = data.order_status === "ACTIVE" ? "PENDING" : data.order_status;
        const orderToken = data.order_token || "temp_token";

        const payment = await Payment.create({
            cf_order_id: data.cf_order_id,
            orderId,
            booking_id,
            dealer_id,
            user_id,
            orderAmount,
            payment_type,
            order_currency: "INR",
            order_status: orderStatus,
            order_token: orderToken,
            payment_by,
        });

        res.status(200).json({
            success: true,
            message: "Payment initiated successfully",
            data: {
                orderId,
                cf_order_id: data.cf_order_id,
                payment_session_id: data.payment_session_id,
                order_status: orderStatus,
                paymentLink: data.payment_link,
            },
        });
    } catch (error) {
        console.error("Payment initiation error:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: "Payment initiation failed",
            error: error.response?.data || error.message,
        });
    }
};

// Handle Cashfree webhook to update payment status
const paymentWebhook = async (req, res) => {
    try {
        // const data = req.body;

        // const { order_id, order_status, order_token } = data;

        const order_id="ORD_1761506677639";
        const order_status="SUCCESS";
        const order_token="temp_token";

        if (!order_id) {
            return res.status(400).json({ success: false, message: "Missing order_id" });
        }

        // Map Cashfree statuses to your enum
        let mappedStatus;
        switch (order_status) {
            case "SUCCESS":
                mappedStatus = "SUCCESS";
                break;
            case "FAILED":
                mappedStatus = "FAILED";
                break;
            case "CANCELLED":
                mappedStatus = "CANCELLED";
                break;
            case "ACTIVE": // just in case
            case "PENDING":
                mappedStatus = "PENDING";
                break;
            default:
                mappedStatus = "PENDING";
        }

        // Update the payment in DB
        const updatedPayment = await Payment.findOneAndUpdate(
            { orderId: order_id },
            {
                order_status: mappedStatus,
                order_token: order_token || "temp_token",
            },
            { new: true }
        );

        if (!updatedPayment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        // Optional: trigger other actions, e.g., mark booking as paid
        // await Booking.findByIdAndUpdate(updatedPayment.booking_id, { billStatus: "paid" });

        console.log(`Webhook processed: order_id=${order_id}, status=${mappedStatus}`);

        res.status(200).send("Webhook received"); // Cashfree expects 200 response
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).send("Server error");
    }
};

//  Get single payment details
const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find by MongoDB _id OR orderId
        let payment = await Payment.findById(id)
            .populate({
                path: "booking_id",
                select: "bookingId totalBill status serviceDate",
                options: { strictPopulate: false },
            })
            .populate("dealer_id", "name email")
            .populate("user_id", "name email");

        // If not found by _id, try finding by orderId
        if (!payment) {
            payment = await Payment.findOne({ orderId: id })
                .populate({
                    path: "booking_id",
                    select: "bookingId totalBill status serviceDate",
                    options: { strictPopulate: false },
                })
                .populate("dealer_id", "name email")
                .populate("user_id", "name email");
        }

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment fetched successfully",
            data: payment,
        });
    } catch (error) {
        console.error("Error fetching payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payment",
            error: error.message,
        });
    }
};


// Get All Payments 
const getAllPayments = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filters
        const filters = {};
        if (req.query.status) filters.order_status = req.query.status.toUpperCase();
        if (req.query.dealer_id) filters.dealer_id = req.query.dealer_id;
        if (req.query.user_id) filters.user_id = req.query.user_id;

        // Date Range (optional)
        if (req.query.startDate && req.query.endDate) {
            filters.create_date = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate),
            };
        }

        // Sort (latest first)
        const sort = { createdAt: -1 };

        // Fetch data with safe population
        const payments = await Payment.find(filters)
            .populate({
                path: "booking_id",
                select: "bookingId totalBill status serviceDate",
                options: { strictPopulate: false }, // avoids crash if booking missing
            })
            .populate("dealer_id", "name email")
            .populate("user_id", "first_name last_name email")
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // Count total
        const total = await Payment.countDocuments(filters);

        // Response
        res.status(200).json({
            success: true,
            message: "Payments fetched successfully",
            page,
            totalPages: Math.ceil(total / limit),
            totalRecords: total,
            data: payments,
        });
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payments",
            error: error.message,
        });
    }
};

module.exports = { getAllPayments, initiatePayment, getPaymentById, paymentWebhook };
