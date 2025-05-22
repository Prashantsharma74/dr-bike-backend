const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const serviceSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
    },
    name: String,
    image: String,
    // city: String,
    // area: String,
    description: String,
    
    bikes: [
      {
        cc: Number, // Bike engine capacity (e.g., 150cc, 200cc, etc.)
        price: Number // Price for that specific CC
      }
    ],
    // tax: Number,
    // dealerId: String,
    dealer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dealer",
    },
    // features: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Feature",
    //   },
    // ],
    // salient_features: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Salientfeature",
    //   },
    // ],
  },
  {
    timestamps: true,
  }
);
serviceSchema.plugin(AutoIncrement, { id: "service_seq", inc_field: "id" });

module.exports = mongoose.model("service", serviceSchema);
