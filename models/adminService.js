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
  },
  {
    timestamps: true,
  }
);

serviceSchema.plugin(AutoIncrement, { id: "adminservices_seq", inc_field: "id" });

module.exports = mongoose.model("adminservices", serviceSchema);
