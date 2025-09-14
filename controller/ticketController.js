const mongoose = require("mongoose");
const jwt_decode = require("jwt-decode");
const Ticket = require("../models/ticket_model");

const createTicket = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { subject, message, user_type, sender_id, sender_type } = req.body;

    // Basic validation
    if (!user_id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ success: false, message: "Invalid user_id" });
    }
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Subject and message are required" });
    }

    // Who is creating the ticket? 2 = Dealer, 4 = User
    const creatorType = Number(user_type);
    if (![2, 4].includes(creatorType)) {
      return res.status(400).json({ success: false, message: "user_type must be 2 (Dealer) or 4 (User)" });
    }

    // First message sender (defaults to ticket creator)
    const msgSenderId = sender_id || user_id;
    if (!mongoose.Types.ObjectId.isValid(msgSenderId)) {
      return res.status(400).json({ success: false, message: "Invalid sender_id" });
    }
    const msgSenderType = [2, 4].includes(Number(sender_type)) ? Number(sender_type) : creatorType;

    const newTicket = await Ticket.create({
      user_id,
      user_type: creatorType,
      subject,
      messages: [
        {
          sender_id: msgSenderId,
          sender_type: msgSenderType,
          message,
        },
      ],
    });

    console.log("Ticket Create", newTicket)

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: newTicket,
    });
  } catch (error) {
    console.error("Ticket Creation Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// const createTicket = async (req, res) => {
//   try {
//     const user_id = req.params.user_id;

//     const { subject, message, sender_id } = req.body;

//     if (!user_id) {
//       return res.status(400).json({
//         success: false,
//         message: "User ID is required",
//       });
//     }

//     if (!sender_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Sender ID is required",
//       });
//     }

//     if (!subject || !message) {
//       return res.status(400).json({
//         success: false,
//         message: "Subject and message are required",
//       });
//     }

//     const newTicket = new Ticket({
//       user_id,
//       subject,
//       messages: [
//         { sender_id, message } 
//       ]
//     });

//     await newTicket.save();

//     res.status(200).json({
//       success: true,
//       message: "Ticket created successfully",
//       data: newTicket,
//     });

//   } catch (error) {
//     console.error("Ticket Creation Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// 📌 Reply to a ticket (Admin/User/Dealer)
const replyToTicket = async (req, res) => {
  try {
    const data = jwt_decode(req.headers.token);
    const sender_id = data.user_id;
    const sender_type = data.user_type;
    const { message } = req.body;
    const { ticket_id } = req.params;

    const ticket = await Ticket.findById(ticket_id);
    if (!ticket) {
      return res.status(200).json({ success: false, message: "Ticket not found" });
    }

    if (![1, 2, 4].includes(sender_type)) {
      return res.status(200).json({ success: false, message: "Unauthorized access" });
    }

    ticket.messages.push({ sender_id, sender_type, message });
    await ticket.save();

    res.status(200).json({ success: true, message: "Message added to ticket", data: ticket });

  } catch (error) {
    console.error("Ticket Reply Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 📌 Get all tickets for the logged-in User/Dealer
// const getMyTickets = async (req, res) => {
//     try {
//         const data = jwt_decode(req.headers.token);
//         const user_id = data.user_id;
//         const user_type = data.user_type;

//         if (![2, 4].includes(user_type)) {
//             return res.status(200).json({ success: false, message: "Unauthorized access" });
//         }

//         const tickets = await Ticket.find({ user_id }).sort({ created_at: -1 });
//         res.status(200).json({ success: true, message: "Tickets retrieved successfully", data: tickets });

//     } catch (error) {
//         console.error("Fetch Tickets Error:", error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };

const getMyTickets = async (req, res) => {
  try {
    const { user_id } = req.params;
    console.log("id", user_id)
    if (!user_id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const tickets = await Ticket.find({ user_id }).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Tickets retrieved successfully",
      data: tickets
    });

  } catch (error) {
    console.error("Fetch Tickets Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/tickets/admin-all
const getAllUserAndDealerTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user_type: { $in: [2, 4] } })
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "User and dealer tickets retrieved successfully",
      data: tickets,
    });
  } catch (error) {
    console.error("Fetch User & Dealer Tickets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// 📌 Update ticket status (Admin Only)
const updateTicketStatus = async (req, res) => {
  try {
    const data = jwt_decode(req.headers.token);
    // if (data.user_type !== 1 || data.user_type) {
    //     return res.status(200).json({ success: false, message: "Only admins can update ticket status" });
    // }

    const { ticket_id } = req.params;
    const { status } = req.body;

    if (!["Open", "In Progress", "Closed"].includes(status)) {
      return res.status(200).json({ success: false, message: "Invalid status" });
    }

    const ticket = await Ticket.findByIdAndUpdate(ticket_id, { status }, { new: true });
    if (!ticket) {
      return res.status(200).json({ success: false, message: "Ticket not found" });
    }

    res.status(200).json({ success: true, message: "Ticket status updated", data: ticket });

  } catch (error) {
    console.error("Update Ticket Status Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get single ticket by ID (no JWT check)
const getTicketById = async (req, res) => {
  try {
    const { ticket_id } = req.params;

    if (!ticket_id) {
      return res.status(400).json({ success: false, message: "ticket_id is required" });
    }

    const ticket = await Ticket.findById(ticket_id)
      .populate("messages.sender_id", "name email");

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Ticket retrieved successfully",
      data: ticket,
    });

  } catch (error) {
    console.error("Fetch Single Ticket Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  createTicket,
  replyToTicket,
  getMyTickets,
  getAllUserAndDealerTickets,
  updateTicketStatus,
  getTicketById
};
