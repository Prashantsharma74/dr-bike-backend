// const mongoose = require("mongoose");
// const AutoIncrement = require("mongoose-sequence")(mongoose);

// const additionalServiceSchema = new mongoose.Schema(
//   {
//     id: {
//       type: Number,
//     },
//     name: String,
//     image: String,
//     description: String,
//     bikes: [
//       {
//         cc: Number,
//         price: Number
//       }
//     ],
//     dealer_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Vendor",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// additionalServiceSchema.plugin(AutoIncrement, {
//   id: "additional_services_seq",
//   inc_field: "id"
// });

// module.exports = mongoose.model("additionalServices", additionalServiceSchema);

// models/additionalServices.js

const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const BikePriceSchema = new mongoose.Schema(
  {
    cc: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const additionalServiceSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },

    name: { type: String, required: true, trim: true },
    image: { type: String, default: null },
    description: { type: String, default: "" },

    bikes: { type: [BikePriceSchema], default: [] },

    dealer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

additionalServiceSchema.plugin(AutoIncrement, {
  id: "additional_services_seq",
  inc_field: "id",
});

module.exports = mongoose.model("additionalServices", additionalServiceSchema);
