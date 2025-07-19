
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
  formProgress: {
    currentStep: { type: Number, default: 1 }, // Tracks which step user should see next
    completedSteps: {
      type: Map, // Using Map for flexible field addition
      of: Boolean,
      default: {
        'basicInfo': false,
        'locationInfo': false,
        'shopDetails': false,
        'documents': false,
        'bankDetails': false
      }
    },
    lastActiveStep: { type: Number, default: 1 } // Last step user interacted with
  },
  completionTimestamps: {
    basicInfo: Date,
    locationInfo: Date,
    shopDetails: Date,
    documents: Date,
    bankDetails: Date
  },
  registrationStatus: {
    type: String,
    enum: ['Draft', 'Pending', 'Approved', 'Rejected'],
    default: 'Draft',
    required: true
  },
  adminNotes: String,
  submittedAt: Date,
  approvedAt: Date,
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
    // Authentication Fields
  otp: String,
  otpExpiry: Date,
  loginAttempts: { type: Number, default: 0 },
  accountLockedUntil: Date,
  isVerify: { type: Boolean, default: false },
  isProfile: { type: Boolean, default: false },
  isDoc: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  // Document Verification Status
  documentVerification: {
    aadhar: { type: Boolean, default: false },
    pan: { type: Boolean, default: false },
    bank: { type: Boolean, default: false },
    shop: { type: Boolean, default: false }
  },

  // Shop Opening Information
  shopOpeningDate: { type: Date, required: false },
  businessHours: {
    open: String,
    close: String,
    days: [String] // e.g., ['Monday', 'Tuesday', ...]
  },
  // Notification Preferences
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    app: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Add index for better query performance
dealerModel.index({ phone: 1, email: 1, registrationStatus: 1 });

// Add pre-save hook to handle registration status changes
dealerModel.pre('save', function(next) {
  if (this.isModified('registrationStatus')) {
    if (this.registrationStatus === 'Pending' && !this.submittedAt) {
      this.submittedAt = new Date();
    } else if (this.registrationStatus === 'Approved' && !this.approvedAt) {
      this.approvedAt = new Date();
      this.isActive = true;
    }
  }
  next();
});

module.exports = mongoose.model("Vendor", dealerModel);