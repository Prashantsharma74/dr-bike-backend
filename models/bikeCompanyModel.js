const mongoose = require("mongoose");

const bikeCompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate companies
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BikeCompany", bikeCompanySchema);
