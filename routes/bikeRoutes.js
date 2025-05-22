var express = require("express");
var multer = require("multer");
var fs = require("fs-extra");

var {
  addBike,
  bikeList,
  editBike,
  deleteBike,
  getBike,
  addBikeCompany,
  addBikeModel,
  addBikeVariant,
  getBikeCompanies,
  getBikeModels,
  getBikeVariants,
  getAllBikes 
} = require("../controller/bikeController");
const router = express.Router();

// set storage
const storage = multer.diskStorage({
  destination : function ( req , file , callback ){
      var path = `./image`;
      fs.mkdirsSync(path);
      //callback(null, 'uploads')
      callback(null, path);
  },
  filename : function (req, file , callback){
      // image.jpg
      var ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
      return callback(null, file.fieldname + '-' + Date.now() + ext)
      //callback(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
      //callback(null, file.originalname)
      // save file as original name
      // callback(null, file.originalname + ext)
  }
})

const upload = multer({ 
  storage : storage,
  limits: {
      fileSize: 20*1048576,  // 20MB
  }
})

/* POST users listing. */
router.post("/addBike",upload.single("images"), addBike);
router.get("/bikeList", bikeList);
router.put("/editBike/:id", editBike);
router.delete("/deleteBike", deleteBike);
router.get("/getBike/:id", getBike);
router.post("/add-bike-company", addBikeCompany); // Add bike company
router.post("/add-bike-model", addBikeModel); // Add bike model
router.post("/add-bike-variant", addBikeVariant); // Add bike variant
router.get("/get-bike-companies", getBikeCompanies); // Get all bike companies
router.get("/get-bike-models/:company_id", getBikeModels); // Get models by company
router.get("/get-bike-variants/:model_id", getBikeVariants); // Get variants by model
router.get("/bikes", getAllBikes);
module.exports = router;
