const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const additionalServiceSchema = new mongoose.Schema(
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
    ]
  },
  {
    timestamps: true,
  }
);

additionalServiceSchema.plugin(AutoIncrement, {
  id: "additional_services_seq",
  inc_field: "id"
});

module.exports = mongoose.model("additionalServices", additionalServiceSchema);