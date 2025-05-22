const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema({
    dealer_id:String,
    dealer_name:String,
    dealer_city:String,
    accholdername:String,
    accountno: String,
    bankname: String,
    ifsc: String,
    location: String,
  },
  {
     timestamps:true,
  }
  );

module.exports = mongoose.model("Bank", bankSchema);


   
