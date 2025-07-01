const express = require('express');
const { verifyToken } = require('../helper/verifyAuth');
const router = express.Router();


const genrateToken = require('./tokenRoute');
const adminauth = require('./adminAuthRoutes');
// const employee = require('./employeeRoutes');
const customers = require('./customerRoutes');
const service = require('./serviceRoutes');
const servicefeature = require('./servicefeatureRoute');
const bikes = require('./bikeRoutes');
const locations = require('./locationsRoutes');
const dealers = require('./dealerRoutes');
const userauth = require('./userAuthRoutes');
const banner = require('./bannerRoutes');
const offer = require('./offerRoutes');
const additionalOption = require('./additionalOptionsRoute');
const servicesalientfeature = require("./service_Salient_feature_Route")
const booking = require("./bookingRoutes")
const tracking = require("./trackingRoute")
const pickndrop = require("./pickupndrop")
const payment = require("./payment")
const statencity = require("./StatenCity")
const bank = require("./bankroute")
const dealerauth = require("./dealerAuthRoutes");
const rating = require("./ratingRoutes");
const report = require("./reportRoutes")
const { geocode, geo_place } = require('../controller/map');
const { Returnurl, ReturnurlNew } = require('../controller/payment');
const { verifyOtpAdmin, sendOtpAdmin } = require("../controller/adminAuth");
const reward = require('../routes/rewardRoutes');
const ticket = require("../routes/ticketRoutes");
const notification = require("../routes/notification")
const additional = require("../routes/additionalRouter")


// User App Admin
router.use('/tokenGenrate', genrateToken);
router.use('/adminauth', adminauth);
// router.use('/employee',verifyToken,employee);
router.use('/customers', customers);
router.use('/service', service);
router.use('/additional-service', additional);
router.use('/ticket', verifyToken, ticket);
router.use('/servicefeature', verifyToken, servicefeature);
router.use('/servicesalientfeature', verifyToken, servicesalientfeature);
router.use('/bike', bikes);
router.use('/locations', verifyToken, locations);
router.use('/dealer', dealers);
router.use('/userAuth', userauth);
router.use('/banner', banner);
router.use('/offer', offer);
router.use('/additionalOptions', verifyToken, additionalOption);
router.use('/bookings', booking);
router.use('/trackings', verifyToken, tracking);
router.use('/pickndrop', verifyToken, pickndrop);
router.use('/payment', payment);
router.get('/returnurl', Returnurl);
router.get('/returnurlnew', ReturnurlNew);
router.use('/statencity', statencity);
router.use('/notification', notification);

router.use('/bank', verifyToken, bank);
router.use('/report', verifyToken, report);
router.use('/reward', reward);
router.use('/rating', rating);

// Map
router.post('/geocode', geocode);
router.post('/geo_place', geo_place);

// otp
// router.post('/send-otp', sendOtpAdmin);
// Route to verify OTP for SubAdmin (direct login for Admin)
router.post('/verify-otp', verifyOtpAdmin);

// Provider APP
router.use('/dealerAuth', dealerauth);


module.exports = router;

