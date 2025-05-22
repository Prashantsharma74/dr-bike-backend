const mongoose = require("mongoose");
const LocationsSchema = new mongoose.Schema({
  name: String,
  active: Number,
  create_by: String,
  latitude: String,
  longitude: String,
},
{
  timestamps:true,
}
);

module.exports = mongoose.model("Locations", LocationsSchema);
