var express = require('express');
var {userLogin, otpVerify,resendOtp} =  require('../controller/userAuthController');
const router = express.Router();

/* POST users listing. */
router.post('/userLogin', userLogin);
router.post('/otpVerify', otpVerify);
router.post('/resendOtp',resendOtp);

module.exports = router;


