const express = require("express");
const router = express.Router();
const { 
    createTicket, 
    replyToTicket, 
    getMyTickets, 
    getAllUserAndDealerTickets, 
    updateTicketStatus,
    getTicketById
} = require("../controller/ticketController");

// Routes
router.post("/create", createTicket);
router.post("/reply/:ticket_id", replyToTicket);
router.get("/my-tickets", getMyTickets);
router.get("/user-dealer", getAllUserAndDealerTickets);
router.put("/status/:ticket_id", updateTicketStatus);
router.get("/tickets/:ticket_id", getTicketById);

module.exports = router;
