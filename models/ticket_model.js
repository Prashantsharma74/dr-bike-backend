// // const mongoose = require("mongoose");
// // const AutoIncrement = require("mongoose-sequence")(mongoose);

// // // const TicketSchema = new mongoose.Schema({
// // //   user_id: {
// // //     type: mongoose.Schema.Types.ObjectId,
// // //     ref: "customers",
// // //     required: true
// // //   },
// // //   user_type: { type: Number, default: false },
// // //   subject: { type: String, required: true },
// // //   status: {
// // //     type: String,
// // //     enum: ["Open", "In Progress", "Closed"],
// // //     default: "Open"
// // //   },
// // //   messages: [
// // //     {
// // //       sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
// // //       sender_type: { type: Number, default: false },
// // //       message: { type: String, required: true },
// // //       timestamp: { type: Date, default: Date.now }
// // //     }
// // //   ],
// // //   created_at: { type: Date, default: Date.now }
// // // });

// // // // auto-increment ticket number
// // // TicketSchema.plugin(AutoIncrement, { id: "ticket_seq", inc_field: "ticketNo" });

// // // // add a virtual for formatted Ticket ID
// // // TicketSchema.virtual("ticketId").get(function () {
// // //   return `TCK-${String(this.ticketNo).padStart(5, "0")}`;
// // // });

// // // TicketSchema.set("toJSON", { virtuals: true });
// // // TicketSchema.set("toObject", { virtuals: true });

// // // module.exports = mongoose.model("Ticket", TicketSchema);

// // const TicketSchema = new mongoose.Schema({
// //   user_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
// //   user_type: { type: Number, default: false },
// //   subject: { type: String, required: true },
// //   status: { type: String, enum: ["Open", "In Progress", "Closed"], default: "Open" },
// //   messages: [
// //     {
// //       sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
// //       sender_type: { type: Number, default: false },
// //       message: { type: String, required: true },
// //       timestamp: { type: Date, default: Date.now }
// //     }
// //   ],
// //   created_at: { type: Date, default: Date.now }
// // });

// // // auto-increment ticket number
// // TicketSchema.plugin(AutoIncrement, { id: "ticket_seq", inc_field: "ticketNo" });

// // // virtual for formatted Ticket ID
// // TicketSchema.virtual("ticketId").get(function () {
// //   return `TCK-${String(this.ticketNo).padStart(5, "0")}`;
// // });

// // // 🔑 important
// // TicketSchema.set("toJSON", { virtuals: true });
// // TicketSchema.set("toObject", { virtuals: true });

// // module.exports = mongoose.model("Ticket", TicketSchema);


// const mongoose = require("mongoose");
// const AutoIncrement = require("mongoose-sequence")(mongoose);

// const AttachmentSchema = new mongoose.Schema({
//   url: { type: String, required: true },
//   name: { type: String, default: "" },
//   type: { type: String, default: "" },
//   size: { type: Number, default: 0 },
// }, { _id: false });

// const MessageSchema = new mongoose.Schema({
//   sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
//   sender_type: { type: Number, default: false },
//   message: { type: String, default: "" },
//   attachments: { type: [AttachmentSchema], default: [] },
//   internal: { type: Boolean, default: false },
//   repliedTo: { type: mongoose.Schema.Types.ObjectId, default: null },
//   seenBy: { type: [mongoose.Schema.Types.ObjectId], ref: "customers", default: [] },
//   editedAt: { type: Date, default: null },
//   timestamp: { type: Date, default: Date.now },
// }, { _id: true });

// const TicketSchema = new mongoose.Schema({
//   user_id: { type: mongoose.Schema.Types.ObjectId, ref: "customers", required: true },
//   user_type: { type: Number, default: false },
//   subject: { type: String, required: true },
//   status: { type: String, enum: ["Open", "In Progress", "Closed"], default: "Open" },

//   messages: { type: [MessageSchema], default: [] },

//   lastMessageAt: { type: Date, default: null },
//   lastMessageText: { type: String, default: "" },

//   unreadFor: { type: Map, of: Number, default: {} },

//   created_at: { type: Date, default: Date.now }
// });

// TicketSchema.plugin(AutoIncrement, { id: "ticket_seq", inc_field: "ticketNo" });

// TicketSchema.virtual("ticketId").get(function () {
//   return `TCK-${String(this.ticketNo).padStart(5, "0")}`;
// });

// TicketSchema.set("toJSON", { virtuals: true });
// TicketSchema.set("toObject", { virtuals: true });

// TicketSchema.methods._recomputeLastMessage = function () {
//   const last = this.messages[this.messages.length - 1];
//   if (last) {
//     this.lastMessageAt = last.timestamp;
//     this.lastMessageText = last.message || (last.attachments?.[0]?.name || "[attachment]");
//   } else {
//     this.lastMessageAt = null;
//     this.lastMessageText = "";
//   }
// };

// module.exports = mongoose.model("Ticket", TicketSchema);

// models/ticket.js
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const ROLES = /** @type const */ ({
  ADMIN: "admin",
  DEALER: "dealer",
  USER: "user",
});
const TICKET_STATUS = /** @type const */ ({
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  CLOSED: "Closed",
});

const AttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    name: { type: String, default: "", trim: true, maxlength: 255 },
    type: { type: String, default: "", trim: true, maxlength: 128 }, // e.g. 'image/png'
    size: { type: Number, default: 0, min: 0 },                      // bytes
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    // If all actors (admin, dealer, user) live in "customers" with a "role" field, keep this ref.
    // If admins are in a different collection, consider refPath instead.
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customers",
      required: true,
      index: true,
    },
    sender_type: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },

    message: { type: String, default: "", trim: true, maxlength: 10_000 },
    attachments: { type: [AttachmentSchema], default: [] },

    // true = internal note visible only to admins (won't increment dealer/user unread)
    internal: { type: Boolean, default: false },

    // simple reply threading
    repliedTo: { type: mongoose.Schema.Types.ObjectId, default: null },

    // who has seen this particular message (store user ids from "customers")
    seenBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "customers",
      default: [],
      index: false,
    },

    editedAt: { type: Date, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { _id: true }
);

const TicketSchema = new mongoose.Schema(
  {
    // creator of the ticket (dealer or user). Admin may also create on behalf.
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customers",
      required: true,
      index: true,
    },
    user_type: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },

    subject: { type: String, required: true, trim: true, maxlength: 255 },

    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.OPEN,
      index: true,
    },

    messages: { type: [MessageSchema], default: [] },

    lastMessageAt: { type: Date, default: null, index: true },
    lastMessageText: { type: String, default: "", maxlength: 500 },

    /**
     * unreadFor: Map<customerId string, number>
     * - Maintains an exact unread count per participant.
     * - Keys must be stringified ObjectIds.
     */
    unreadFor: {
      type: Map,
      of: Number,
      default: {},
    },

    // Optional: assign ticket to specific admin (routing/ownership)
    assignee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customers", // if admins are also in "customers"
      default: null,
      index: true,
    },

    created_at: { type: Date, default: Date.now, index: true },
  },
  {
    versionKey: "version",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Virtuals ----
TicketSchema.plugin(AutoIncrement, { id: "ticket_seq", inc_field: "ticketNo" });

TicketSchema.virtual("ticketId").get(function () {
  return `TCK-${String(this.ticketNo).padStart(5, "0")}`;
});

// ---- Helper methods ----

// Internal: recompute last message metadata
TicketSchema.methods._recomputeLastMessage = function () {
  const last = this.messages[this.messages.length - 1];
  if (last) {
    this.lastMessageAt = last.timestamp;
    this.lastMessageText =
      (last.message && last.message.trim()) ||
      (last.attachments?.[0]?.name || "[attachment]");
  } else {
    this.lastMessageAt = null;
    this.lastMessageText = "";
  }
};

// Add a new message & maintain unread counts atomically in memory before save
TicketSchema.methods.addMessage = function ({
  sender_id,
  sender_type,
  message = "",
  attachments = [],
  internal = false,
  repliedTo = null,
  timestamp = new Date(),
}) {
  this.messages.push({
    sender_id,
    sender_type,
    message,
    attachments,
    internal,
    repliedTo,
    timestamp,
  });

  this._recomputeLastMessage();

  // Update unread counters:
  // - If internal: only admins should care; do NOT notify dealer/user.
  // - Else: increment for everyone except the sender.
  const participants = new Set([
    String(this.user_id),
    ...(this.messages
      .map((m) => String(m.sender_id))
      .filter(Boolean)),
    ...(this.assignee_id ? [String(this.assignee_id)] : []),
  ]);

  // You likely want admins (multiple) to see unreads via dashboard; if admins share a queue,
  // consider using a pseudo key like "admins" or per-assignee only.
  participants.forEach((pid) => {
    if (pid !== String(sender_id)) {
      // Don't notify non-admins for internal notes
      if (internal) {
        // If pid corresponds to a non-admin (unknown here), you can skip. If your "customers"
        // doc has a role, enforce at service layer or preload roles in the request.
        return;
      }
      const cur = this.unreadFor.get(pid) || 0;
      this.unreadFor.set(pid, cur + 1);
    }
  });

  return this;
};

// Mark a message (or entire ticket) as seen by a viewer
TicketSchema.methods.markSeen = function ({ viewer_id, message_id = null }) {
  const vid = String(viewer_id);
  if (!message_id) {
    // mark all messages as seen
    this.messages.forEach((m) => {
      if (!m.internal || m.sender_type === ROLES.ADMIN) {
        if (!m.seenBy.some((x) => String(x) === vid)) m.seenBy.push(viewer_id);
      }
    });
  } else {
    const msg = this.messages.id(message_id);
    if (msg && (!msg.internal || msg.sender_type === ROLES.ADMIN)) {
      if (!msg.seenBy.some((x) => String(x) === vid)) msg.seenBy.push(viewer_id);
    }
  }

  // reset unread counter for this viewer
  this.unreadFor.set(vid, 0);
  return this;
};

// Convenience status changes
TicketSchema.methods.setStatus = function (next) {
  if (!Object.values(TICKET_STATUS).includes(next)) {
    throw new Error("Invalid status");
  }
  this.status = next;
  return this;
};

// ---- Hooks ----

// Keep lastMessage* in sync when messages change via direct set/patch
TicketSchema.pre("save", function (next) {
  this._recomputeLastMessage();
  next();
});

// ---- Indexes ----

// Dashboard & inbox patterns
TicketSchema.index({ status: 1, lastMessageAt: -1 });
TicketSchema.index({ user_id: 1, lastMessageAt: -1 });
TicketSchema.index({ assignee_id: 1, status: 1, lastMessageAt: -1 });

// Basic text search (lightweight)
TicketSchema.index({
  subject: "text",
  lastMessageText: "text",
}, { name: "ticket_text_idx", weights: { subject: 5, lastMessageText: 1 } });

module.exports = mongoose.model("Ticket", TicketSchema);
module.exports.ROLES = ROLES;
module.exports.TICKET_STATUS = TICKET_STATUS;
