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

        const order_id = "ORD_1761506677639";
        const order_status = "SUCCESS";
        const order_token = "temp_token";

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
                options: { strictPopulate: false },
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

// const createCheckoutUrl = async (req, res) => {
//   try {
//     const {
//       orderAmount,
//       orderCurrency = "INR",
//       user_id,
//       dealer_id,
//       booking_id,
//       customer_email,
//       customer_phone,
//       payment_type = "ONLINE",
//       payment_by = "user",
//     } = req.body;

//     if (!orderAmount || !user_id || !dealer_id || !booking_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields (orderAmount, user_id, dealer_id, booking_id)",
//       });
//     }

//     // Unique order ID for Cashfree
//     const orderId = `ORD_${Date.now()}`;

//     const payload = {
//       order_id: orderId,
//       order_amount: orderAmount,
//       order_currency: orderCurrency,
//       customer_details: {
//         customer_id: user_id,
//         customer_email: customer_email || "user@example.com",
//         customer_phone: customer_phone || "9999999999",
//       },
//       order_meta: {
//         return_url: `https://dr-bike-backend.onrender.com/payment-success?order_id={order_id}`,
//         notify_url: `https://dr-bike-backend.onrender.com/api/payments/webhook`,
//       },
//     };

//     // Create order via Cashfree
//     const response = await axios.post(CASHFREE_BASE_URL, payload, {
//       headers: {
//         "x-client-id": process.env.APP_ID,
//         "x-client-secret": process.env.SECRET_KEY,
//         "x-api-version": "2022-09-01",
//         "Content-Type": "application/json",
//       },
//     });

//     const data = response.data;

//     // FIX: Handle missing order_token
//     const orderToken = data.order_token || `temp_token_${Date.now()}`;

//     // FIX: Normalize order status
//     const orderStatus = data.order_status === "ACTIVE" ? "PENDING" : data.order_status;

//     await Payment.create({
//       cf_order_id: data.cf_order_id,
//       orderId,
//       booking_id,
//       dealer_id,
//       user_id,
//       orderAmount,
//       payment_type,
//       order_currency: orderCurrency,
//       order_status: orderStatus,
//       order_token: orderToken, // Now this will never be undefined
//       payment_by,
//     });

//     // FIX: Generate checkout URL if payment_link is not provided
//     const checkoutUrl = data.payment_link || 
//                        `https://${process.env.CASHFREE_ENV === 'production' ? 'payments.cashfree.com' : 'sandbox.cashfree.com'}/orders/${orderId}`;

//     return res.status(200).json({
//       success: true,
//       message: "Checkout URL created successfully",
//       checkout_url: checkoutUrl,
//       cf_order_id: data.cf_order_id,
//       orderId: orderId,
//       order_status: orderStatus,
//     });
//   } catch (error) {
//     console.error("Checkout URL creation error:", error.response?.data || error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create checkout URL",
//       error: error.response?.data || error.message,
//     });
//   }
// };

// const createCheckoutUrl = async (req, res) => {
//   try {
//     const {
//       orderAmount,
//       orderCurrency = "INR",
//       user_id,
//       dealer_id,
//       booking_id,
//       customer_email,
//       customer_phone,
//       payment_type = "ONLINE",
//       payment_by = "user",
//     } = req.body;

//     if (!orderAmount || !user_id || !dealer_id || !booking_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });
//     }

//     const orderId = `ORD_${Date.now()}`;

//     // Use your actual deployed backend URL
//     const returnUrl = `https://dr-bike-backend.onrender.com/payment-success?order_id={order_id}`;
//     const notifyUrl = `https://dr-bike-backend.onrender.com/api/payments/webhook`;

//     console.log("Return URL:", returnUrl);
//     console.log("Notify URL:", notifyUrl);

//     const payload = {
//       order_id: orderId,
//       order_amount: parseFloat(orderAmount),
//       order_currency: orderCurrency,
//       customer_details: {
//         customer_id: user_id,
//         customer_email: customer_email || "user@example.com",
//         customer_phone: customer_phone || "9999999999",
//       },
//       order_meta: {
//         return_url: returnUrl,
//         notify_url: notifyUrl,
//       },
//     };

//     console.log("Making request to Cashfree with payload:", JSON.stringify(payload, null, 2));

//     // Create order via Cashfree
//     const response = await axios.post(CASHFREE_BASE_URL, payload, {
//       headers: {
//         "x-client-id": process.env.CASHFREE_APP_ID || process.env.APP_ID,
//         "x-client-secret": process.env.CASHFREE_SECRET_KEY || process.env.SECRET_KEY,
//         "x-api-version": "2022-09-01",
//         "Content-Type": "application/json",
//       },
//     });

//     const data = response.data;
//     console.log("Cashfree full response:", JSON.stringify(data, null, 2));

//     // Handle order token
//     const orderToken = data.order_token || `temp_${Date.now()}`;
//     const orderStatus = data.order_status === "ACTIVE" ? "PENDING" : data.order_status;

//     // Create payment record
//     await Payment.create({
//       cf_order_id: data.cf_order_id,
//       orderId,
//       booking_id,
//       dealer_id,
//       user_id,
//       orderAmount,
//       payment_type,
//       order_currency: orderCurrency,
//       order_status: orderStatus,
//       order_token: orderToken,
//       payment_by,
//     });

//     // FIX: Generate correct checkout URL without #
//     let checkoutUrl;

//     if (data.payment_link) {
//       checkoutUrl = data.payment_link;
//     } else if (data.payment_session_id) {
//       // Use payment session URL (recommended)
//       checkoutUrl = `https://${process.env.CASHFREE_ENV === 'production' ? 'payments.cashfree.com' : 'sandbox.cashfree.com'}/payment/session/${data.payment_session_id}`;
//     } else {
//       // Use order URL without #
//       checkoutUrl = `https://${process.env.CASHFREE_ENV === 'production' ? 'payments.cashfree.com' : 'sandbox.cashfree.com'}/order/${orderId}`;
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Checkout URL created successfully",
//       checkout_url: checkoutUrl,
//       cf_order_id: data.cf_order_id,
//       orderId: orderId,
//       order_status: orderStatus,
//       debug_info: {
//         payment_link: data.payment_link,
//         payment_session_id: data.payment_session_id,
//         cashfree_order_status: data.order_status
//       }
//     });

//   } catch (error) {
//     console.error("Checkout URL creation error:", error.response?.data || error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create checkout URL",
//       error: error.response?.data?.message || error.message,
//     });
//   }
// };

const createCheckoutUrl = async (req, res) => {
  try {
    console.log("Cashfree Credentials Check:", {
      hasAppId: !!process.env.APP_ID,
      hasSecretKey: !!process.env.SECRET_KEY,
      appIdLength: process.env.APP_ID ? process.env.APP_ID.length : 0,
      secretKeyLength: process.env.SECRET_KEY ? process.env.SECRET_KEY.length : 0,
      env: process.env.CASHFREE_ENV
    });

    const {
      orderAmount,
      orderCurrency = "INR",
      user_id,
      dealer_id,
      booking_id,
      customer_email,
      customer_phone,
      customer_name,
      payment_type = "ONLINE",
      payment_by = "user",
    } = req.body;

    if (!orderAmount || !user_id || !dealer_id || !booking_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if credentials exist
    if (!process.env.APP_ID || !process.env.SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Cashfree credentials not configured",
        debug: {
          APP_ID: process.env.APP_ID ? "***" + process.env.APP_ID.slice(-4) : "MISSING",
          SECRET_KEY: process.env.SECRET_KEY ? "***" + process.env.SECRET_KEY.slice(-4) : "MISSING"
        }
      });
    }

    const orderId = `ORD_${Date.now()}`;
    const returnUrl = `https://dr-bike-backend.onrender.com/payment-success?order_id={order_id}`;
    const notifyUrl = `https://dr-bike-backend.onrender.com/api/payments/webhook`;

    const payload = {
      order_id: orderId,
      order_amount: parseFloat(orderAmount),
      order_currency: orderCurrency,
      customer_details: {
        customer_id: user_id,
        customer_name: customer_name || "Customer",
        customer_email: customer_email || "customer@example.com",
        customer_phone: customer_phone || "9999999999",
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
      },
    };

    console.log("Making request to Cashfree with credentials:", {
      appId: "***" + process.env.APP_ID.slice(-4),
      baseUrl: CASHFREE_BASE_URL
    });

    // Make API call to Cashfree
    const response = await axios.post(CASHFREE_BASE_URL, payload, {
      headers: {
        "x-client-id": process.env.APP_ID,
        "x-client-secret": process.env.SECRET_KEY,
        "x-api-version": "2022-09-01",
        "Content-Type": "application/json",
      },
    });

    const data = response.data;

    // Handle order token and status
    const orderToken = data.order_token || `temp_token_${Date.now()}`;
    const orderStatus = data.order_status === "ACTIVE" ? "PENDING" : data.order_status;

    // Create payment record
    await Payment.create({
      cf_order_id: data.cf_order_id,
      orderId,
      booking_id,
      dealer_id,
      user_id,
      orderAmount,
      payment_type,
      order_currency: orderCurrency,
      order_status: orderStatus,
      order_token: orderToken,
      payment_by,
    });

    // Generate checkout URL
    let checkoutUrl = data.payment_link || `https://sandbox.cashfree.com/orders/${orderId}`;

    return res.status(200).json({
      success: true,
      message: "Checkout URL created successfully",
      data: {
        checkout_url: checkoutUrl,
        orderId,
        cf_order_id: data.cf_order_id,
        order_status: orderStatus,
      }
    });

  } catch (error) {
    console.error("Cashfree Authentication Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    return res.status(500).json({
      success: false,
      message: "Cashfree authentication failed - check your credentials",
      error: error.response?.data || error.message,
    });
  }
};

const createCheckoutSession = async (req, res) => {
    try {
        const {
            amount,
            user_id,
            dealer_id,
            booking_id,
            customer_email,
            customer_phone,
            customer_name = "Customer"
        } = req.body;

        // Validate required fields
        if (!amount || !user_id || !dealer_id || !booking_id || !customer_email) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: amount, user_id, dealer_id, booking_id, customer_email"
            });
        }

        // Verify booking exists
        const booking = await Booking.findById(booking_id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Cashfree payload with proper return URLs
        const payload = {
            order_id: orderId,
            order_amount: parseFloat(amount),
            order_currency: "INR",
            customer_details: {
                customer_id: user_id,
                customer_name: customer_name,
                customer_email: customer_email,
                customer_phone: customer_phone || "9999999999",
            },
            order_meta: {
                return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback?order_id={order_id}&order_token={order_token}`,
                notify_url: `${process.env.BACKEND_URL || 'http://localhost:8001'}/api/payments/webhook`,
            },
            order_note: `Payment for booking ${booking_id}`
        };

        // Make API call to Cashfree
        const response = await axios.post(CASHFREE_BASE_URL, payload, {
            headers: {
                "x-client-id": process.env.CASHFREE_APP_ID,
                "x-client-secret": process.env.CASHFREE_SECRET_KEY,
                "x-api-version": "2022-09-01",
                "Content-Type": "application/json",
            },
        });

        const cashfreeData = response.data;

        // Create payment record in database
        const payment = await Payment.create({
            cf_order_id: cashfreeData.cf_order_id,
            orderId: orderId,
            booking_id: booking_id,
            dealer_id: dealer_id,
            user_id: user_id,
            orderAmount: amount,
            payment_type: "ONLINE",
            order_currency: "INR",
            order_status: cashfreeData.order_status === "ACTIVE" ? "PENDING" : cashfreeData.order_status,
            order_token: cashfreeData.order_token || "temp_token",
            payment_by: "user",
        });

        // Construct the checkout URL
        const checkoutUrl = cashfreeData.payment_link ||
            `https://${process.env.CASHFREE_ENV === 'production' ? 'payments.cashfree.com' : 'sandbox.cashfree.com'}/pg/orders/${orderId}/payments`;

        // Success response
        res.status(200).json({
            success: true,
            message: "Checkout session created successfully",
            data: {
                order_id: orderId,
                cf_order_id: cashfreeData.cf_order_id,
                payment_session_id: cashfreeData.payment_session_id,
                order_status: "PENDING",
                checkout_url: checkoutUrl,
                amount: amount,
                currency: "INR",
                expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
            }
        });

    } catch (error) {
        console.error("Checkout session creation error:", error.response?.data || error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create checkout session",
            error: error.response?.data || error.message
        });
    }
};

module.exports = { getAllPayments, initiatePayment, getPaymentById, paymentWebhook, createCheckoutUrl, createCheckoutSession };
