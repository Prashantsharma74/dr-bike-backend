// const mongoose = require("mongoose");

// const bikeCompanySchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       unique: true, 
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("BikeCompany", bikeCompanySchema);

const mongoose = require("mongoose");

const bikeCompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Add virtual for 'models'
bikeCompanySchema.virtual("models", {
  ref: "BikeModel",
  localField: "_id",
  foreignField: "company_id",
});

module.exports = mongoose.model("BikeCompany", bikeCompanySchema);
