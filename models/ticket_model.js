const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
    user_type: { type: Number, required: true }, // 2 - Dealer, 4 - User
    subject: { type: String, required: true }, // Ticket subject
    status: { type: String, enum: ["Open", "In Progress", "Closed"], default: "Open" },
    messages: [
        {
            sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
            sender_type: { type: Number, required: true }, 
            message: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ticket", TicketSchema);
