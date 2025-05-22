const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
  id: String,
  name: String,
});

const citySchema = new mongoose.Schema({
  id: String,
  name: String,
  state_id: String,
});

const State = mongoose.model("State", stateSchema);
const City = mongoose.model("City", citySchema);

module.exports = {
  State,
  City,
};
