const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const DealerSchema = new mongoose.Schema ({
    id:{
      type:Number,
    },
    name: {type: String, required: true},
    email: {type: String, unique: true, lowercase: true, required: true},
    password: {
      type:String,
      select:false,
      required: true
    },
    device_token:{
      type: String,
    },
    is_online: {
      type: String,
      default: "off"
    },
    phone: {type: Number, unique: true, required: true},
    extra_charges: Number,
    state: [String],
    city: String,
    area: String,
    address: String,
    latitude: Number,
    longitude: Number, 
    create_by: String,
    otp:Number,
    ftoken:String,
    profileImage:String,
    accholdername:String,
    accountno:String,

    bankname: String,
    ifsc: String,
    location: String,

    passportImage:String,
    PassbookImage:String,
    isVerify:{
      type:Boolean,
      default:false
    },
    images: { type: String },
    wallet:{
      type:Number,
      default:0

    },
    commission : {
      type:Number,
      default : 10
    },
    isBlock:{
      type:Boolean,
      default:false
    },
    shopName: String, // New field
    shopImages: [{ type: String }], // Updated to support multiple images
    shopDescription: String, // New field
    beneficiary_id:{
      type:String,
      default:""
    },
    beneficiary_accountNo:{
      type:String,
      default:""
    },
    beneficiary_ifsc:{
      type:String,
      default:""
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "service",
      }
    ],
    bikes: [ 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bike",
      }
    ],
    isProfile: {
      type: Boolean,
      default: false
  },
    isDoc:{
      type: Boolean,
      default: false
  },
    pickupAndDrop: { type: Boolean, default: false }, // New field
    pickupAndDropDescription: String, // New field
    goDigital: { type: Boolean, default: false },
    expertAdvice: { type: String, default: "Expert guidance for vehicle maintenance" }, 
    ourPromise: { type: String, default: "100% satisfaction guaranteed" },
    isShopDetailsAdded: { type: Boolean, default: false },
    businessEmail: { type: String, default: "" },
    shopPhone: { type: String, default: "" },
    shopState: { type: String, default: "" },   
    shopCity: { type: String, default: "" },    
    shopPinCode: { type: String, default: "" }, 
    aadharCardNo: { type: Number, unique: true, },
    adharCardFront: { type: String, default: "" }, 
    adharCardBack: { type: String, default: "" }, 
    panCardNo: {type: String, unique: true, upperCase: true}, 
    panCardFront: { type: String, default: "" },  
    panCardBack: { type: String, default: "" },  
    GST: { type: String, default: "" },  
    isDocumentsAdded: { type: Boolean, default: false },  
  },

{
  timestamps:true,
}
);

// DealerSchema.plugin(AutoIncrement);

DealerSchema.plugin(AutoIncrement, {id:'dealer_seq',inc_field: 'id'});

module.exports = mongoose.model("dealer", DealerSchema);