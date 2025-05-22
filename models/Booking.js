const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const bookingSchema = new mongoose.Schema(
  {
    id: { type: Number },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true }, // User who made the booking
    dealer_id: { type: mongoose.Schema.Types.ObjectId, ref: "dealer", required: true }, // Dealer ID
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: "service"}], // Multiple services
    pickupAndDropId: { type: mongoose.Schema.Types.ObjectId, ref: "PicknDrop", default: null }, // Optional Pickup & Drop service
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "Payment", "rejected", "user_cancelled", "cash received"],
      default: "pending"
    },
    userBike_id: { type: mongoose.Schema.Types.ObjectId, ref: "UserBike", required: true },
    pickupStatus: {
      type: String,
      default: "pending"
    },
    serviceDate: { type: Date },
    billGenerated: { type: Boolean, default: false },
    lastServiceKm: { type: Number, default: 0 },
   // Storing Multiple Services with Default Empty serviceName
   serviceSummary: [{
    serviceName: { type: String, default: "" }, // Default empty string
    price: { type: Number, default: 0 }
  }],
    otp: { type: Number, default: null },
    tax: { type: Number, default: 0 }, // Tax for all services
    totalBill: { type: Number, default: 0 }, // Total Bill after all services
    
    billStatus: { 
      type: String, 
      enum: ["pending", "paid", "cancelled"], 
      default: "pending"
    },
    additionalNotes: { type: [String], default: [] } ,


    pickupDate: { type: Date, default: null }, // ✅ Added Pickup Date
    create_date: { type: Date, default: Date.now },

  },

  { timestamps: true }
);

bookingSchema.plugin(AutoIncrement, { id: "booking_seq", inc_field: "id" });
bookingSchema.virtual("bookingId").get(function () {
  return `B-${this.id.toString().padStart(2, "0")}`;
});
bookingSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Booking", bookingSchema);
