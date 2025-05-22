var express = require('express');
var multer = require('multer');
var fs = require('fs-extra');

var { addlocations, 
    locationslist, 
    deletelocations, 
    editlocations, 
    currentlocation,
    currentaddress } =  require('../controller/locations');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        var path = `./upload/locations`;
        fs.mkdirsSync(path);
        callback(null, path);
    },
    filename(req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    },
});
const upload = multer({ storage });

/* POST users listing. */
router.post('/addlocations',upload.fields([{ name: 'image', maxCount: 1}]),addlocations);
router.get('/locationslist',locationslist);
router.delete('/deletelocations',deletelocations);
router.put('/editlocations',upload.fields([{ name: 'image', maxCount: 1}]),editlocations);
router.get('/currentlocation',currentlocation);
router.post('/currentaddress',currentaddress);


module.exports = router;
