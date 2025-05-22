const mongoose  =require("mongoose")
const AutoIncrement = require('mongoose-sequence')(mongoose);

const featureSchema = new mongoose.Schema({
    id:{
        type:Number,
      },
    name:{
        type:String,
    },
    image: {
        type: String,
    },
    description:{
        type:String,
    },
    service_id:{
        type:String,
    },
    service_name:{
        type:String,
    },
},
{
    timestamps:true
})

featureSchema.plugin(AutoIncrement, { id: "servicefeature_seq", inc_field: "id" });

module.exports = mongoose.model("Feature",featureSchema);