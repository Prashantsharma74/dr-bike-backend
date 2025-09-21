const mongoose = require("mongoose");
const Ticket = require("../models/ticket_model");

const parseTicketNo = (s) => {
  const m = /^TCK-(\d+)$/.exec(String(s || "").trim());
  return m ? parseInt(m[1], 10) : null;
};

const createTicket = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { subject, message, user_type, sender_id, sender_type } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ success: false, message: "Invalid user_id" });
    }
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required" });
    }

    // Only dealer/user allowed
    const allowed = ["dealer", "user"];
    if (!allowed.includes(user_type)) {
      return res.status(400).json({
        success: false,
        message: 'user_type must be "dealer" or "user"',
      });
    }

    const msgSenderId = sender_id || user_id;
    if (!mongoose.Types.ObjectId.isValid(msgSenderId)) {
      return res.status(400).json({ success: false, message: "Invalid sender_id" });
    }

    // sender_type falls back to user_type if not valid
    const msgSenderType = allowed.includes(sender_type) ? sender_type : user_type;

    const created = await Ticket.create({
      user_id,
      user_type, // ✅ the actual string, not the whole array
      subject,
      messages: [
        {
          sender_id: msgSenderId,
          sender_type: msgSenderType, // ✅ single string
          message,
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: created,
    });
  } catch (error) {
    console.error("Ticket Creation Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Role helpers: accept numeric or string; normalize to string
const ROLE_NUM2STR = { 1: "admin", 2: "dealer", 4: "user" };
const ROLE_STR = ["admin", "dealer", "user"];

const normalizeRole = (val) => {
  if (val == null) return null;
  const n = Number(val);
  if ([1, 2, 4].includes(n)) return ROLE_NUM2STR[n];
  const s = String(val).toLowerCase().trim();
  if (ROLE_STR.includes(s)) return s;
  return null;
};

const replyToTicket = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const { message, sender_id, sender_type } = req.body;

    if (!ticket_id || !message || !sender_id || !sender_type) {
      return res.status(400).json({ success: false, message: "ticket_id, message, sender_id, sender_type are required" });
    }

    const ticket = await Ticket.findById(ticket_id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    if (ticket.status === "Closed") return res.status(400).json({ success: false, message: "Ticket is closed" });

    // push message
    ticket.messages.push({
      sender_id,
      sender_type,       // "admin" | "dealer" | "user"  (or numbers if that's what you store)
      message,
      timestamp: new Date(),
    });
    // optional: update convenience fields
    ticket.lastMessageAt = new Date();
    ticket.lastMessageText = message;

    await ticket.save();

    // repop / lean if you want to send a clean object
    const updated = await Ticket.findById(ticket_id).lean({ virtuals: true });

    // 🔊 emit to everyone viewing this ticket
    const io = req.app.get("io");
    io.to(String(ticket_id)).emit("ticket:message:new", {
      ticketId: String(ticket_id),
      ticket: updated,                // or just send the new message to minimize payload
      // message: updated.messages[updated.messages.length - 1],
    });

    return res.status(200).json({ success: true, message: "Reply added", data: updated });
  } catch (err) {
    console.error("Ticket Reply Error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// const replyToTicket = async (req, res) => {
//   try {
//     const { ticket_id } = req.params;
//     let {
//       sender_id,
//       sender_type,
//       message,
//       attachments = [],
//       internal = false,
//       repliedTo = null,
//     } = req.body || {};

//     let filter;
//     if (mongoose.Types.ObjectId.isValid(ticket_id)) {
//       filter = { _id: ticket_id };
//     } else {
//       const ticketNo = parseTicketNo(ticket_id);
//       if (!ticketNo) {
//         return res.status(400).json({ success: false, message: "ticket_id must be a valid ObjectId or like TCK-00001" });
//       }
//       filter = { ticketNo };
//     }

//     if (!sender_id || !mongoose.Types.ObjectId.isValid(sender_id)) {
//       return res.status(400).json({ success: false, message: "Invalid sender_id" });
//     }

//     const senderRole = normalizeRole(sender_type);
//     if (!senderRole) {
//       return res.status(400).json({ success: false, message: 'sender_type must be 1/2/4 or "admin"/"dealer"/"user"' });
//     }

//     const text = String(message || "").trim();
//     if (!text) {
//       return res.status(400).json({ success: false, message: "Message is required" });
//     }
//     if (text.length > 10_000) {
//       return res.status(400).json({ success: false, message: "Message must be ≤ 10,000 characters" });
//     }

//     const ticket = await Ticket.findOne(filter);
//     if (!ticket) {
//       return res.status(404).json({ success: false, message: "Ticket not found" });
//     }

//     internal = Boolean(internal);
//     if (internal && senderRole !== "admin") {
//       return res.status(403).json({ success: false, message: "Only admins can create internal messages" });
//     }

//     const normAtt = Array.isArray(attachments)
//       ? attachments.map((a) => ({
//         url: typeof a?.url === "string" ? a.url.trim() : "",
//         name: typeof a?.name === "string" ? a.name.trim() : "",
//         type: typeof a?.type === "string" ? a.type.trim() : "",
//         size: Number(a?.size || 0),
//       }))
//       : [];

//     for (const a of normAtt) {
//       if (!a.url) {
//         return res.status(400).json({ success: false, message: "Each attachment requires a url" });
//       }
//       if (a.name.length > 255) {
//         return res.status(400).json({ success: false, message: "Attachment name must be ≤ 255 characters" });
//       }
//     }

//     const now = new Date();
//     const msgDoc = {
//       sender_id,
//       sender_type: senderRole,
//       message: text,
//       attachments: normAtt,
//       internal,
//       repliedTo: mongoose.Types.ObjectId.isValid(repliedTo) ? repliedTo : null,
//       timestamp: now,
//     };

//     ticket.messages.push(msgDoc);

//     ticket.lastMessageAt = now;
//     ticket.lastMessageText = text || (normAtt?.[0]?.name || "[attachment]");

//     const senderIdStr = String(sender_id);
//     const participants = new Set([
//       String(ticket.user_id),
//       ...ticket.messages.map((m) => String(m.sender_id)).filter(Boolean),
//     ]);

//     participants.forEach((pid) => {
//       if (pid === senderIdStr) return;
//       if (internal) {
//         return;
//       }
//       const cur = ticket.unreadFor.get(pid) || 0;
//       ticket.unreadFor.set(pid, cur + 1);
//     });

//     await ticket.save();

//     await ticket.populate({ path: "messages.sender_id", select: "name email" });

//     return res.status(200).json({
//       success: true,
//       message: "Message added to ticket",
//       data: ticket.toJSON({ virtuals: true }),
//     });
//   } catch (error) {
//     console.error("Ticket Reply Error:", error);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// const getMyTickets = async (req, res) => {
//   try {
//     const { user_id } = req.params;
//     console.log("id", user_id)
//     if (!user_id) {
//       return res.status(400).json({ success: false, message: "User ID is required" });
//     }

//     const tickets = await Ticket.find({ user_id }).sort({ created_at: -1 });

//     res.status(200).json({
//       success: true,
//       message: "Tickets retrieved successfully",
//       data: tickets
//     });

//   } catch (error) {
//     console.error("Fetch Tickets Error:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

const getMyTickets = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ success: false, message: "Invalid user_id" });
    }

    const tickets = await Ticket.find({ user_id: new mongoose.Types.ObjectId(user_id) })
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Tickets retrieved successfully",
      data: tickets,
    });
  } catch (error) {
    console.error("Fetch Tickets Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAllUserAndDealerTickets = async (req, res) => {
  try {
    // ---- optional query params ----
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const q = (req.query.q || "").trim();           // search term (subject / lastMessageText)
    const status = (req.query.status || "").trim();     // "Open" | "In Progress" | "Closed"
    const sortBy = (req.query.sortBy || "lastMessageAt"); // "lastMessageAt" | "created_at"
    const sortDir = (req.query.sortDir || "desc").toLowerCase() === "asc" ? 1 : -1;

    // ---- base filter: dealer + user (string) OR legacy numeric 2/4 ----
    const typeFilter = {
      $or: [
        { user_type: { $in: ["dealer", "user"] } },
        { user_type: { $in: [2, 4] } }, // compatibility if some docs are still numeric
      ],
    };

    const filter = { ...typeFilter };

    if (status) {
      filter.status = status; // relies on enum: "Open" | "In Progress" | "Closed"
    }

    // Text search: uses text index if available, else regex on subject/lastMessageText
    let useProjectScore = false;
    let sort = {};
    if (q) {
      // If you created a text index on subject + lastMessageText:
      // TicketSchema.index({ subject: "text", lastMessageText: "text" })
      filter.$text = { $search: q };
      useProjectScore = true;
      sort = { score: { $meta: "textScore" }, [sortBy]: sortDir, _id: -1 };
    } else {
      sort = { [sortBy]: sortDir, _id: -1 };
    }

    const skip = (page - 1) * limit;

    // Query
    const query = Ticket.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    if (useProjectScore) {
      query.select({ score: { $meta: "textScore" } });
    } else {
      // pick a lightweight projection; add/remove fields as needed
      query.select({
        subject: 1,
        status: 1,
        user_id: 1,
        user_type: 1,
        lastMessageAt: 1,
        lastMessageText: 1,
        created_at: 1,
        ticketNo: 1,
        ticketId: 1, // virtual if enabled
        // comment the next line back in if you need unread map on list
        // unreadFor: 1,
      });
    }

    const [tickets, total] = await Promise.all([
      query.exec(),
      Ticket.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "User and dealer tickets retrieved successfully",
      data: tickets,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
        sortBy,
        sortDir: sortDir === 1 ? "asc" : "desc",
        q: q || undefined,
        status: status || undefined,
      },
    });
  } catch (error) {
    console.error("Fetch User & Dealer Tickets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getTicketById = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    // Optional query flags
    const markSeen = String(req.query.markSeen || "false").toLowerCase() === "true";
    const includeMessages = String(req.query.includeMessages || "true").toLowerCase() === "true";

    if (!ticket_id) {
      return res.status(400).json({ success: false, message: "ticket_id is required" });
    }

    // Resolve by _id or ticketId (TCK-xxxxx)
    let findFilter = null;
    if (mongoose.Types.ObjectId.isValid(ticket_id)) {
      findFilter = { _id: ticket_id };
    } else {
      const ticketNo = parseTicketNo(ticket_id);
      if (!ticketNo) {
        return res.status(400).json({
          success: false,
          message: "ticket_id must be a valid ObjectId or like TCK-00001",
        });
      }
      findFilter = { ticketNo };
    }

    // identify viewer (assumes you set req.user in auth middleware)
    // expected shape: { _id: ObjectId, role: "admin" | "dealer" | "user" }
    const viewer = req.user || {};
    const viewerId = viewer._id ? String(viewer._id) : null;
    const isAdmin = viewer.role === "admin";

    // Fetch ticket
    let ticket = await Ticket.findOne(findFilter)
      .select({
        subject: 1,
        status: 1,
        user_id: 1,
        user_type: 1,
        messages: includeMessages ? 1 : 0,
        lastMessageAt: 1,
        lastMessageText: 1,
        unreadFor: 1,
        created_at: 1,
        ticketNo: 1,
      })
      .populate({
        path: "messages.sender_id",
        select: "name email", // keep it light
      })
      .lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // ACL: non-admins can only read their own ticket
    if (!isAdmin && viewerId && String(ticket.user_id) !== viewerId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Hide internal messages for non-admins
    if (!isAdmin && includeMessages && Array.isArray(ticket.messages)) {
      ticket.messages = ticket.messages.filter((m) => !m.internal);
    }

    // Optionally mark seen for viewer (non-admin/admin both allowed)
    if (markSeen && viewerId) {
      // Build updates: add viewerId to seenBy for each visible message, and reset unreadFor[viewerId]
      // Only mark non-internal or admin messages.
      const updateOps = [];

      // Reset unreadFor viewer
      updateOps.push({
        updateOne: {
          filter: { _id: ticket._id },
          update: { $set: { [`unreadFor.${viewerId}`]: 0 } },
        },
      });

      // Add to seenBy per message (only when messages included)
      if (includeMessages && Array.isArray(ticket.messages) && ticket.messages.length) {
        // collect message _ids to update where viewer not already present
        const messageIdsToUpdate = ticket.messages
          .filter((m) => !m.internal || isAdmin)
          .filter((m) => !(m.seenBy || []).some((x) => String(x) === viewerId))
          .map((m) => m._id);

        if (messageIdsToUpdate.length) {
          updateOps.push({
            updateOne: {
              filter: { _id: ticket._id },
              update: {
                $addToSet: {
                  "messages.$[msg].seenBy": new mongoose.Types.ObjectId(viewerId),
                },
              },
              arrayFilters: [{ "msg._id": { $in: messageIdsToUpdate } }],
            },
          });
        }
      }

      if (updateOps.length) {
        await Ticket.bulkWrite(updateOps);
        // reflect locally
        if (ticket.unreadFor) ticket.unreadFor[viewerId] = 0;
        if (includeMessages && Array.isArray(ticket.messages)) {
          ticket.messages = ticket.messages.map((m) => {
            if ((!m.internal || isAdmin) && updateOps.length) {
              const shouldAdd =
                m._id &&
                (m.seenBy || []).every((x) => String(x) !== viewerId);
              if (shouldAdd) {
                return {
                  ...m,
                  seenBy: [...(m.seenBy || []), viewer._id],
                };
              }
            }
            return m;
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Ticket retrieved successfully",
      data: {
        ...ticket,
        ticketId: `TCK-${String(ticket.ticketNo).padStart(5, "0")}`, // ensure present if toJSON virtuals not active on lean
      },
    });
  } catch (error) {
    console.error("Fetch Single Ticket Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const { status } = req.body;

    const allowed = ["Open", "In Progress", "Closed"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowed.join(", ")}`
      });
    }

    // Support either ObjectId or TCK-xxxxx
    let filter;
    if (mongoose.Types.ObjectId.isValid(ticket_id)) {
      filter = { _id: ticket_id };
    } else {
      const ticketNo = parseTicketNo(ticket_id);
      if (!ticketNo) {
        return res.status(400).json({
          success: false,
          message: "ticket_id must be a valid ObjectId or like TCK-00001"
        });
      }
      filter = { ticketNo };
    }

    // Fetch existing (lean for speed)
    const existing = await Ticket.findOne(filter)
      .select({ status: 1, ticketNo: 1 })
      .lean();

    if (!existing) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Prevent changes when already Closed
    if (existing.status === "Closed") {
      return res.status(400).json({
        success: false,
        message: "Ticket is already Closed and cannot be updated"
      });
    }

    // No-op guard
    if (existing.status === status) {
      return res.status(409).json({
        success: false,
        message: `Ticket is already in status "${status}"`
      });
    }

    // Apply update
    const updated = await Ticket.findOneAndUpdate(
      filter,
      { $set: { status } },
      { new: true } // return the updated doc
    ).lean();

    // Ensure pretty id in response even if toJSON virtuals aren't applied on lean
    const response = {
      ...updated,
      ticketId: updated.ticketNo != null
        ? `TCK-${String(updated.ticketNo).padStart(5, "0")}`
        : undefined,
    };

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      data: response
    });
  } catch (err) {
    console.error("Update Ticket Status Error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  createTicket,
  replyToTicket,
  getMyTickets,
  getAllUserAndDealerTickets,
  updateTicketStatus,
  getTicketById,
};
