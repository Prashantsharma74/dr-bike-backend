
const mongoose = require("mongoose");

const dealerModel = new mongoose.Schema({
  shopName: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  aadharCardNo: { type: Number, required: false },
  shopPincode: { type: String, required: true },
  fullAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },

  ownerName: { type: String, required: true },

  shopImages: [{ type: String }],

  personalEmail: { type: String, required: true },
  personalPhone: { type: String, required: true },
  alternatePhone: { type: String, required: true },

  permanentAddress: {
    address: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true }
  },
  presentAddress: {
    address: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true }
  },

  documents: {
    panCardFront: { type: String, required: true },
    aadharFront: { type: String, required: true },
    aadharBack: { type: String, required: true },
    // passbookImage: { type: String, required: true }
  },

  bankDetails: {
    accountHolderName: { type: String, required: true },
    ifscCode: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true }
  },
  // commission: { 
  //   type: Number,
  //   required: true,
  //   min: 0,
  //   max: 100,
  //   get: v => parseFloat(v.toFixed(2)),
  //   set: v => parseFloat(v) 
  // },
  commission: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    set: v => parseFloat(v)
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
    max: 18
  },
  isVerify: { type: Boolean, default: false },
  isProfile: { type: Boolean, default: true },
  isDoc: { type: Boolean, default: false },
}, { timestamps: true });

// DealerSchema.index({ shopEmail: 1 }, { 
//   unique: true,
//   partialFilterExpression: {
//     shopEmail: { $exists: true, $ne: null }
//   }
// });

module.exports = mongoose.model("Vendor", dealerModel);