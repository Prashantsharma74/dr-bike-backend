const Ticket = require("../models/ticket_model");
const jwt_decode = require("jwt-decode");

// 📌 Create a new ticket (User/Dealer -> Admin)
const createTicket = async (req, res) => {
    try {
        const data = jwt_decode(req.headers.token);
        const user_id = data.user_id;
        const user_type = data.user_type;
        const { subject, message } = req.body;

        if (![2, 4].includes(user_type)) {
            return res.status(200).json({ success: false, message: "Only users or dealers can create tickets." });
        }
                                                                        
        const newTicket = new Ticket({
            user_id,
            user_type,
            subject,
            messages: [{ sender_id: user_id, sender_type: user_type, message }]
        });

        await newTicket.save();
        res.status(200).json({ success: true, message: "Ticket created successfully", data: newTicket });

    } catch (error) {
        console.error("Ticket Creation Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

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
const getMyTickets = async (req, res) => {
    try {
        const data = jwt_decode(req.headers.token);
        const user_id = data.user_id;
        const user_type = data.user_type;

        if (![2, 4].includes(user_type)) {
            return res.status(200).json({ success: false, message: "Unauthorized access" });
        }

        const tickets = await Ticket.find({ user_id }).sort({ created_at: -1 });
        res.status(200).json({ success: true, message: "Tickets retrieved successfully", data: tickets });

    } catch (error) {
        console.error("Fetch Tickets Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 📌 Get all user & dealer tickets (Admin Only)
const getAllUserAndDealerTickets = async (req, res) => {
    try {
        const data = jwt_decode(req.headers.token);
        const user_type = data.user_type;

        if (user_type !== 1) {
            return res.status(200).json({ success: false, message: "Only admins can access all user and dealer tickets" });
        }

        const tickets = await Ticket.find({ user_type: { $in: [2, 4] } }).sort({ created_at: -1 });

        res.status(200).json({ success: true, message: "User and dealer tickets retrieved successfully", data: tickets });

    } catch (error) {
        console.error("Fetch User & Dealer Tickets Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
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

// 📌 Get a single ticket by ID
const getTicketById = async (req, res) => {
    try {
        const data = jwt_decode(req.headers.token);
        const user_id = data.user_id;
        const user_type = data.user_type;
        const { ticket_id } = req.params;

     
       
        // ✅ Find the ticket by ID and populate messages with sender details
        const ticket = await Ticket.findById(ticket_id).populate("messages.sender_id", "name email");

        if (!ticket) {
            return res.status(200).json({ success: false, message: "Ticket not found" });
        }

        // ✅ Allow only the ticket owner or an admin to access the ticket
        if (user_type !== 1 && ticket.user_id.toString() !== user_id) {
            return res.status(200).json({ success: false, message: "Unauthorized access" });
        }

        res.status(200).json({ success: true, message: "Ticket retrieved successfully", data: ticket });

    } catch (error) {
        console.error("Fetch Single Ticket Error:", error);
        res.status(200).json({ success: false, message: "Internal server error" });
    }
};


// ✅ Exporting all functions

module.exports = {
    createTicket,
    replyToTicket,
    getMyTickets,
    getAllUserAndDealerTickets,
    updateTicketStatus,
    getTicketById
};
