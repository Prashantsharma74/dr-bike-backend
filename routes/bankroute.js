var express = require("express");
var multer = require("multer");
var fs = require("fs-extra");

var {
    addBank,
    banklist,
    deletebank,
    editbank,
    getAllBank,
} = require("../controller/bank");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    var path = `./upload/bank`;
    fs.mkdirsSync(path);
    callback(null, path);
  },
  filename(req, file, callback) {
    callback(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

/* POST users listing. */
router.post("/addbank", addBank);
router.get("/banklist", banklist);
router.delete("/deletebank", deletebank);
router.put("/editbank", editbank);
router.get("/getallbanks", getAllBank);

module.exports = router;
