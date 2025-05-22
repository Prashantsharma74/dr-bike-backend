var express = require('express');
var { addemployee, employeelist, deleteemployee, editemployee,singleemployee }  =  require('../controller/employee');
const router = express.Router();

/* POST users listing. */
router.post('/addemployee', addemployee);
router.get('/employeelist', employeelist);
router.get('/employee/:id', singleemployee);
router.delete('/deleteemployee', deleteemployee);
router.put('/editemployee', editemployee);

module.exports = router;