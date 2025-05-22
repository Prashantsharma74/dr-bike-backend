const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true }, // Store booking ID
    reward_points: { type: Number, required: true }, // Randomized (10-50)
    is_scratched: { type: Boolean, default: false }, // Check if user scratched reward
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reward', rewardSchema);
