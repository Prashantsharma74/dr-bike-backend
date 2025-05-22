// UserBike.js (Updated Schema)
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const userBikeSchema = new mongoose.Schema(
  {
    bike_id: { type: Number, unique: true }, // Auto-incremented bike ID
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customers",
      required: true,
    },
    name: { // Updated from bike_company
      type: String,
      required: true,
    },
    model: { // Updated from model_name
      type: String,
      required: true,
    },
    bike_cc: { // Updated from variant
      type: String,
      required: true,
    },
    plate_number: {
      type: String,
      required: true,
      unique: true,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BikeVariant", // References the Bike Variant model
      required: true,
    },
    status: {
      type: Number,
      default: 1, // 1 = Active, 0 = Inactive
    },
  },
  { timestamps: true }
);

// Auto-increment plugin for bike_id
userBikeSchema.plugin(AutoIncrement, { id: "UserBike", inc_field: "bike_id" });

module.exports = mongoose.model("UserBike", userBikeSchema);
