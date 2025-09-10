const mongoose = require("mongoose");
const AutoIncrement = require('mongoose-sequence')(mongoose);

const walletSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
    },
    dealer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dealer"
    },
    Amount: {
        type: Number
    },
    Type: {
        type: String,
        enum: ["Credit", "Debit", "Pending"],
    },
    Note: {
        type: String
    },
    Total: {
        type: Number
    },
    order_status: {
        type: String,
        enum: ["ACTIVE", "PAID", "PENDING", "FAILED", "EXPIRED", "APPROVED", "REJECTED"],
        default: "PENDING",
    },
}, {
    timestamps: true,
});

walletSchema.plugin(AutoIncrement, { id: "wallet_seq", inc_field: "id" });

module.exports = mongoose.model("Wallet", walletSchema);
