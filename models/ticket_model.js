const mongoose = require("mongoose");

// const TicketSchema = new mongoose.Schema({
//     user_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
//     user_type: { type: Number, default: false }, // 2 - Dealer, 4 - User
//     subject: { type: String, required: true }, // Ticket subject
//     status: { type: String, enum: ["Open", "In Progress", "Closed"], default: "Open" },
//     messages: [
//         {
//             sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
//             sender_type: { type: Number, default: false },
//             message: { type: String, required: true },
//             timestamp: { type: Date, default: Date.now }
//         }
//     ],
//     created_at: { type: Date, default: Date.now }
// });
const AutoIncrement = require("mongoose-sequence")(mongoose);

const TicketSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "customers",
    required: true
  },
  user_type: { type: Number, default: false },
  subject: { type: String, required: true },
  status: {
    type: String,
    enum: ["Open", "In Progress", "Closed"],
    default: "Open"
  },
  messages: [
    {
      sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
      sender_type: { type: Number, default: false }, // 2=Dealer, 4=User
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  created_at: { type: Date, default: Date.now }
});

// auto-increment ticket number
TicketSchema.plugin(AutoIncrement, { id: "ticket_seq", inc_field: "ticketNo" });

// add a virtual for formatted Ticket ID
TicketSchema.virtual("ticketId").get(function () {
  return `TCK-${String(this.ticketNo).padStart(5, "0")}`;
});

TicketSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Ticket", TicketSchema);


module.exports = mongoose.model("Ticket", TicketSchema);
