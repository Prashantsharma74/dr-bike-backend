const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
//mongoose.set('debug', true);
mongoose.set('strictQuery', true);
const db ={};
db.mongoose = mongoose;
module.exports = db;

