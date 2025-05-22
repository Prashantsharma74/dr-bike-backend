var express = require('express');
var multer = require('multer');
var fs = require('fs-extra');
const router = express.Router();
var {addfeature, getfeature, deletefeature, editfeature,getAllfeature} = require("../controller/service_salient_features")

// Store data
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        var path = `./upload/servicesalientfeature`;
        fs.mkdirsSync(path);
        callback(null, path);
    },
    filename(req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    },
});
const upload = multer({ storage });

router.post('/addfeature',addfeature);
router.get('/getallfeature',getAllfeature);
router.get('/getfeature/:id',getfeature);
router.delete('/deletefeature',deletefeature);
router.put('/updatefeature/:id',editfeature);


module.exports = router;

