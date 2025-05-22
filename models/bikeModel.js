const mongoose = require("mongoose");

const bikeModelSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BikeCompany", // References Bike Company
      required: true,
    },
    model_name: {
      type: String,
      required: true,
      unique: true, // Ensures no duplicate models
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BikeModel", bikeModelSchema);
