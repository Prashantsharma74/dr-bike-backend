const express = require("express");
const multer = require("multer");
const router = express.Router();
var fs = require('fs-extra');

// for single image path
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    // var path = `./image`;
    var path = `./testimage`;
    fs.mkdirsSync(path);
    callback(null, path);
  },
  filename: function (req, file, callback) {
    var ext = file.originalname.substring(file.originalname.lastIndexOf("."));
    return callback(null, file.fieldname + "-" + Date.now() + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1048576, // 20MB
  },
});

router.post("/",upload.single("image"), (req, res) => {
    console.log("file", req.file);
    console.log("files", req.body);
  res.json({ success: true, message: "working" });
});

module.exports = router;
