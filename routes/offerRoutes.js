var express = require('express');
var multer = require('multer');
var fs = require('fs-extra');

var { addoffer,offerlist,deleteoffer,editoffer, Singleoffer,applyPromoCode } =  require('../controller/offer');
const router = express.Router();


/* POST users listing. */
router.post('/addoffer',addoffer);
router.get('/offerlist',offerlist);
router.delete('/deleteoffer',deleteoffer);
router.put('/editoffer',editoffer);
router.put('/editoffer/:id',editoffer);
router.get('/Singleoffer/:id',Singleoffer);
router.post("/applyPromo", applyPromoCode);

module.exports = router;
