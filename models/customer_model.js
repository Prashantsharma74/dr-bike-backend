const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const CustomerSchema = new mongoose.Schema({
    id: {
        type: Number,
        default: 0, // Default ID as 0 (if not provided)
    },
    first_name: {
        type: String,
        default: "", // Default empty string if not given
    },
    last_name: {
        type: String,
        default: "",
    },
    pincode: {
        type: String,
        default: "",
    },
    email: {
        type: String,
        default: "",
    },
    password: {
        type: String,
        select: false, // Ensure password is not selected by default
    },
    phone: {
        type: Number,
        default: null, // Default `null` if not given
    },
    state: {
        type: String,
        default: "",
    },
    city: {
        type: String,
        default: "",
    },
    address: {
        type: String,
        default: "",
    },
    image: {
        type: String,
        default: "",
    },
    ftoken: {
        type: String,
        default: "",
    },
    device_token: {
        type: String,
        default: "",
    },
    userBike: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "UserBike",
        default: [], // Default empty array
    }], 
    otp: {
        type: Number,
        default: null, // Default `null`
    },
    isProfile: {
        type: Boolean,
        default: false, // Default false
    },
    reward_points: { type: Number, default: 0 },
},

{
    timestamps:true
}
)

// CustomerSchema.plugin(AutoIncrement);

CustomerSchema.plugin(AutoIncrement, {id:'user_seq',inc_field: 'id'});
module.exports = mongoose.model("customers",CustomerSchema);

// const customers = mongoose.model('customers', CustomerSchema);
// module.exports = customers;