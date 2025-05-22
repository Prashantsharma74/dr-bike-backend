var mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const salientFeatureSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    service_id: {
      type: String,
    },
    service_name: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
salientFeatureSchema.plugin(AutoIncrement, { id: "salientfeature_seq", inc_field: "id" });

module.exports = mongoose.model("Salientfeature", salientFeatureSchema);
