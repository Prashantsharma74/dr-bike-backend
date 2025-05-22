var express = require('express');
var multer = require('multer');
var fs = require('fs-extra');
const router = express.Router();
const {getAllState, getAllcity} = require("../controller/states")

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        var path = `./upload/stateandcity`;
        fs.mkdirsSync(path);
        callback(null, path);
    },
    filename(req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    },
});
const upload = multer({ storage });

/* POST users listing. */
router.get('/allState',getAllState);
router.post('/allCity',getAllcity);



module.exports = router;
