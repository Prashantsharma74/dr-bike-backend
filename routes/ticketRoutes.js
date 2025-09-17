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

router.post("/create/:user_id", createTicket);
router.post("/reply/:ticket_id", replyToTicket);
router.get("/my-tickets/:user_id", getMyTickets);
router.get("/user-dealer", getAllUserAndDealerTickets);
router.post("/status/:ticket_id", updateTicketStatus);
router.get("/tickets/:ticket_id", getTicketById);

module.exports = router;
