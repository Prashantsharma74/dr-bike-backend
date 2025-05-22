
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema (
    {
        cf_order_id:{
            type:Number,
        },
        orderId:{
            type:String,
        },
        booking_id:{
            // type:String,
            type:mongoose.Schema.Types.ObjectId,
            ref:"Booking"
        },
        dealer_id:{
            // type:String,
            type:mongoose.Schema.Types.ObjectId,
            ref:"dealer"
        },
        user_id:{
            // type:String,
            type:mongoose.Schema.Types.ObjectId,
            ref:"customers"
        },
        users_id:{
            type:String,
        },
        dealers_id:{
            type:String,
        },
        orderAmount:{
            type:Number,
        },
        payment_type:{
            type:String,
        },
        order_currency:{
            type:String,
            default:"INR"
        },
        order_status:{
            type:String,
        },
        order_token:{
            type:String,
        },     
        payment_by: {
            type: String,
            enum: ["dealer", "user"],
            default: "dealer", 
          },            
        create_date: {
            type: Date,
            default: Date.now
        },
},
{
    timestamps:true,
}
);


module.exports = mongoose.model("Payment", paymentSchema );