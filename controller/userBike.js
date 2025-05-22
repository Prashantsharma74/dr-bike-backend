const mongoose = require("mongoose");

const userBikeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customers",
      required: true,
    },
    bike_company: {
      type: String,
      required: true,
    },
    model_name: {
      type: String,
      required: true,
    },
    variant: {
      type: String,
      required: true,
    },
    plate_number: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: Number,
      default: 1, // 1 = Active, 0 = Inactive
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserBike", userBikeSchema);
