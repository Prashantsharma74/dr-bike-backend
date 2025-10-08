
// const mongoose = require("mongoose");

// const paymentSchema = new mongoose.Schema (
//     {
//         cf_order_id:{
//             type:Number,
//         },
//         orderId:{
//             type:String,
//         },
//         booking_id:{
//             // type:String,
//             type:mongoose.Schema.Types.ObjectId,
//             ref:"Booking"
//         },
//         dealer_id:{
//             // type:String,
//             type:mongoose.Schema.Types.ObjectId,
//             ref:"dealer"
//         },
//         user_id:{
//             // type:String,
//             type:mongoose.Schema.Types.ObjectId,
//             ref:"customers"
//         },
//         users_id:{
//             type:String,
//         },
//         dealers_id:{
//             type:String,
//         },
//         orderAmount:{
//             type:Number,
//         },
//         payment_type:{
//             type:String,
//         },
//         order_currency:{
//             type:String,
//             default:"INR"
//         },
//         order_status:{
//             type:String,
//         },
//         order_token:{
//             type:String,
//         },     
//         payment_by: {
//             type: String,
//             enum: ["dealer", "user"],
//             default: "dealer", 
//           },            
//         create_date: {
//             type: Date,
//             default: Date.now
//         },
// },
// {
//     timestamps:true,
// }
// );


// module.exports = mongoose.model("Payment", paymentSchema );

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    cf_order_id: {
        type: Number,
    },
    orderId: {
        type: String,
    },
    booking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking"
    },
    dealer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dealer"
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "customers"
    },
    users_id: {
        type: String,
    },
    dealers_id: {
        type: String,
    },
    orderAmount: {
        type: Number,
    },
    payment_type: {
        type: String,
        // enum: ["qr", "online", "cash", "card"],
         enum: ["qr", "online", "cash", "card", "upi", "upi_qr", "cashfree_qr", "phonepay_qr"],
        default: "qr"
    },
    order_currency: {
        type: String,
        default: "INR"
    },
    order_status: {
        type: String,
        enum: ["created", "pending", "completed", "failed", "cancelled"],
        default: "created"
    },
    order_token: {
        type: String,
    },
    qr_data: {
        type: String, // Store QR code data/URL
    },
    qr_image_url: {
        type: String, // Store QR image URL
    },
    upi_id: {
        type: String, // UPI ID for QR payments
    },
    payment_by: {
        type: String,
        enum: ["dealer", "user"],
        default: "dealer",
    },
    payment_gateway: {
        type: String,
        enum: ["cashfree", "razorpay", "phonepe", "paytm", "upi"],
        default: "cashfree"
    },
    create_date: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("Payment", paymentSchema);