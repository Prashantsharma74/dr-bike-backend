const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"customers"
    },
  cardNumber: {
    type: String,
    required: true,
  },
  cardHolderName: {
    type: String,
    required: true,
  },
  expirationMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  expirationYear: {
    type: Number,
    required: true,
    min: new Date().getFullYear(),
  },
  cvv: {
    type: String,
  },
});

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
