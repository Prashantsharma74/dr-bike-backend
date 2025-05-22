const mongoose = require("mongoose");

const bikeVariantSchema = new mongoose.Schema(
  {
    model_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BikeModel", // References Bike Model
      required: true,
    },
    variant_name: {
      type: String,
      required: true,
    },
    engine_cc: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BikeVariant", bikeVariantSchema);
