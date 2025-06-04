const mongoose = require("mongoose");

const bikeCompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BikeCompany", bikeCompanySchema);
