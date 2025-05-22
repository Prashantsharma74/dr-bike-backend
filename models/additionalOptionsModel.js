const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);


const additionalOptionsSchema = new mongoose.Schema(
  // {
  //   id: {
  //     type: Number,
  //   },
  //   name: String,
  //   cost: Number,
  //   image: {
  //     type: String,
  //   },
  // },
  // {
  //   timestamps: true,
  // }
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

additionalOptionsSchema.plugin(AutoIncrement, {
  id: "additionalOptionsSchema_seq",
  inc_field: "id",
});

module.exports = mongoose.model("additionalOptions", additionalOptionsSchema);
