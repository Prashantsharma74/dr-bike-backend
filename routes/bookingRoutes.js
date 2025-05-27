var express = require('express');
var multer = require('multer');
var fs = require('fs-extra');
const router = express.Router();
const { getNotificationsByReceiverId } = require("../controller/notificationController");
const { 
    addbooking, 
    getallbookings, 
    getbooking, 
    deletebooking, 
    getuserbookings,
    updatebooking,
    createBooking,
    getBookingDetails,
    updateBooking,
    updateBookingStatus,
    verifyBookingOTP,
    sendBookingOTP,
    updatePickupStatus,
    deleteNoteFromBooking,
    updateNoteInBooking,
    getNotesFromBooking,
    addNoteToBooking
} = require("../controller/booking")

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        var path = `./upload/booking`;
        fs.mkdirsSync(path);
        callback(null, path);
    },
    filename(req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    },
});
const upload = multer({ storage });

/* POST users listing. */
router.post('/addbooking/:id',addbooking)

// By Prashant 
router.get('/getallbookings',getallbookings)


router.get('/getuserbookings',getuserbookings)
router.get('/getbooking/:id',getbooking)
router.delete('/deletebooking',deletebooking)
router.put('/updatebooking/:id',updatebooking)
router.post('/createBooking',createBooking)
router.get('/getBookingDetails/:id',getBookingDetails)
router.post('/updateBooking',updateBooking)
router.post('/updateBookingStatus',updateBookingStatus)
router.post('/sendBookingOTP',sendBookingOTP)
router.post('/verifyBookingOTP',verifyBookingOTP)
router.post("/update-pickup-status", updatePickupStatus);
router.post('/addNote', addNoteToBooking);
router.get('/getNotes/:bookingId', getNotesFromBooking);
router.put('/updateNote', updateNoteInBooking);
router.delete('/deleteNote', deleteNoteFromBooking);

router.get("notification/:receiverId", getNotificationsByReceiverId);




module.exports = router;
