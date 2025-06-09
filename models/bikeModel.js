const mongoose = require("mongoose");

const bikeModelSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BikeCompany",
      required: true,
    },
    model_name: {
      type: String,
      required: true,
      unique: true,
      uppercase: true, 
    },
  },
  { timestamps: true }
);

bikeModelSchema.index({ company_id: 1, model_name: 1 }, { unique: true });

module.exports = mongoose.model("BikeModel", bikeModelSchema);
