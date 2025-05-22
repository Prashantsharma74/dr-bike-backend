const express = require("express");
const router = express.Router();
const { getNotificationsByReceiverId,deleteNotify } = require("../controller/notificationController");

// GET /api/notifications/:receiverId
router.get("/:receiverId", getNotificationsByReceiverId);
router.delete("/:id", deleteNotify);

module.exports = router;
