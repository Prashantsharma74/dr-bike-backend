// UserBike.js (Updated Schema)
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const userBikeSchema = new mongoose.Schema(
  {
    bike_id: { type: Number, unique: true },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customers",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    bike_cc: {
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
      ref: "BikeVariant", 
      required: true,
    },
    status: {
      type: Number,
      default: 1, 
    },
  },
  { timestamps: true }
);

userBikeSchema.plugin(AutoIncrement, { id: "UserBike", inc_field: "bike_id" });

module.exports = mongoose.model("UserBike", userBikeSchema);
