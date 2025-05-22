// models/Notification.js (if not already exists)
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: String,
  body: String,
  data: Object,
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
  receiverType: { type: String, enum: ['user', 'dealer', 'admin'], required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  sentAt: Date,
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);