
const mongoose = require("mongoose");

const dealerModel = new mongoose.Schema({
  shopName: { type: String, required: false },
  email: {
    type: String,
    required: false,
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
  password: { type: String, required: false },
  aadharCardNo: {
    type: String,
    required: false,
    validate: {
      validator: function (v) {
        return /^\d{12}$/.test(v);
      },
      message: props => `${props.value} is not a valid Aadhar number!`
    }
  },

  panCardNo: {
    type: String,
    required: false,
    uppercase: true,
    validate: {
      validator: function (v) {
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      message: props => `${props.value} is not a valid PAN number!`
    }
  },
  shopPincode: { type: String, required: false },
  fullAddress: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  latitude: { type: Number, required: false },
  longitude: { type: Number, required: false },

  ownerName: { type: String, required: false },

  shopImages: [{ type: String }],

  personalEmail: { type: String, required: false },
  personalPhone: { type: String, required: false },
  alternatePhone: { type: String, required: false },

  permanentAddress: {
    address: { type: String, required: false },
    state: { type: String, required: false },
    city: { type: String, required: false }
  },
  presentAddress: {
    address: { type: String, required: false },
    state: { type: String, required: false },
    city: { type: String, required: false }
  },

  documents: {
    panCardFront: { type: String, required: false },
    aadharFront: { type: String, required: false },
    aadharBack: { type: String, required: false },
    // passbookImage: { type: String, required: true }
  },

  bankDetails: {
    accountHolderName: { type: String, required: false },
    ifscCode: { type: String, required: false },
    bankName: { type: String, required: false },
    accountNumber: { type: String, required: false }
  },
  commission: {
    type: Number,
    required: false,
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
  isProfile: { type: Boolean, default: false },
  isDoc: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Vendor", dealerModel);