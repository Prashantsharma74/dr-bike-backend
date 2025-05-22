 var express = require('express');
const tokenGenrate = require("../controller/jwtgenerate");
const router = express.Router();

router.get('/jwtToken', tokenGenrate);

module.exports = router;    