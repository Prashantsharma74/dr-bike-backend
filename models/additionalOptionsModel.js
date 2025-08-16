const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);


const additionalOptionsSchema = new mongoose.Schema(
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

additionalOptionsSchema.plugin(AutoIncrement, {
  id: "additionalOptionsSchema_seq",
  inc_field: "id",
});

module.exports = mongoose.model("additionalOptions", additionalOptionsSchema);
