const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const bannerSchema = new mongoose.Schema({
  id: {
    type: Number,
  },
  name: String,
  banner_image: {
    type: String,
    default: "",
  },
  from_date: {
    type: Date,
    required: true,
  },
  expiry_date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["upcoming", "active", "expired"],
    default: "upcoming", // fallback until computed
  }
}, {
  timestamps: true,
});

bannerSchema.plugin(AutoIncrement, { id: "banner_seq", inc_field: "id" });

module.exports = mongoose.model("Banner", bannerSchema);
