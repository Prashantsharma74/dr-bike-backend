
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

const paymentSchema = new mongoose.Schema(
  {
    cf_order_id: {
      type: Number,
      required: true,
      unique: true
    },
    orderId: {
      type: String,
      required: true
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true
    },
    dealer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor", // Changed to match your dealer model export name
      required: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customers",
      required: true
    },
    // Remove redundant fields:
    // users_id: { type: String }, // Remove this
    // dealers_id: { type: String }, // Remove this

    orderAmount: {
      type: Number,
      required: true,
      min: 0
    },
    payment_type: {
      type: String,
      required: true
    },
    order_currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD"]
    },
    order_status: {
      type: String,
      required: true,
      enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"]
    },
    order_token: {
      type: String,
      required: true
    },
    payment_by: {
      type: String,
      enum: ["dealer", "user"],
      default: "dealer",
      required: true
    },
    create_date: {
      type: Date,
      default: Date.now
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
paymentSchema.index({ cf_order_id: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ booking_id: 1 });
paymentSchema.index({ dealer_id: 1 });
paymentSchema.index({ user_id: 1 });
paymentSchema.index({ order_status: 1 });
paymentSchema.index({ create_date: -1 });

module.exports = mongoose.model("Payment", paymentSchema);