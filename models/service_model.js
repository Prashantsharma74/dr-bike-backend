const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const serviceSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
    },
    name: String,
    image: String,
    description: String,

    bikes: [
      {
        cc: Number,
        price: Number
      }
    ],
    dealer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },  
   },
  {
    timestamps: true,
  }
);
serviceSchema.plugin(AutoIncrement, { id: "service_seq", inc_field: "id" });

module.exports = mongoose.model("service", serviceSchema);
