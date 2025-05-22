
var router = require('express').Router();
var multer = require('multer');
var fs = require('fs-extra');
const {verifyUser} = require("../helper/verifyAuth");

var { usersignin, verifyOTP, logout, sendOtp,changePassword} = require("../controller/dealerAuth")

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        var path = `./upload/vendors`;
        fs.mkdirsSync(path);
        callback(null, path);
    },
    filename(req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    },
});
const upload = multer({ storage });


/* POST users listing. */
router.post('/signin', usersignin);
router.post('/sendotp', sendOtp);
// router.post('/sendotp',verifyUser, sendOTP);
router.post('/verifyotp', verifyOTP);
router.post('/logout', logout);
router.post('/changepassword', changePassword);


module.exports = router;