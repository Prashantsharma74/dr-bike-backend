var express = require('express');
const router = express.Router();
const { ReportAdd,AllReport,replyAdmin,userReport,SingleReport } = require('../controller/reportController');

// const router = express.Router();

router.post('/add', ReportAdd);
router.get('/getAll', AllReport);
router.get('/getSingle/:id', SingleReport);
router.put('/update/:id', replyAdmin);
router.get('/getByuser',userReport);

module.exports = router;
