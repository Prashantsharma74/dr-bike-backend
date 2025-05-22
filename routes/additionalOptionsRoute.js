var express = require("express");
var multer = require("multer");
var fs = require("fs");
var path = require("path");

// var {
//   addAdditionalOption,
//   additionalList,
//   updateAdditional,
//   deleteAdditional,
//   Getadditional,
// } = require("../controller/additionalOptionscontroller");
// const router = express.Router();

// // set storage
// const storage = multer.diskStorage({
//   destination : function ( req , file , callback ){
//       var path = `./image`;
//       fs.mkdirsSync(path);
//       //callback(null, 'uploads')
//       callback(null, path);
//   },
  
//   filename : function (req, file , callback){
//       // image.jpg
//       var ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
//       return callback(null, file.fieldname + '-' + Date.now() + ext)
//       //callback(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
//       //callback(null, file.originalname)
//       // save file as original name
//       // callback(null, file.originalname + ext)
//   }
// })

// const upload = multer({ 
//   storage : storage,
//   limits: {
//       fileSize: 20*1048576,  // 20MB
//   }
// })


// /* POST users listing. */
// router.post("/addAdditionalOption", upload.single("images"),addAdditionalOption);
// router.get("/additionalList", additionalList);
// router.put("/updateAdditional/:id",upload.single("images"), updateAdditional);
// router.delete("/deleteAdditional", deleteAdditional);
// router.get("/additionalOne/:id", Getadditional);

// module.exports = router;



var {
  addservice,
  servicelist,
  updateService,
  deleteService,
  singleService,
  getServicesByDealer
} = require("../controller/additionalOptionscontroller");


const router = express.Router();

// Define the folder path
const uploadDir = path.join(__dirname, "../image");

// Ensure the folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, uploadDir);
  },
  filename: function (req, file, callback) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${file.fieldname}-${Date.now()}${ext}`;
    callback(null, uniqueName);
  },
});

// Configure Multer with size limit (20MB)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// Define Routes
router.post("/addservice", upload.single("images"), addservice);
router.get("/servicelist", servicelist);
router.put(
  "/updateservice",
  upload.fields([{ name: "service_image", maxCount: 1 }]),
  updateService
);
router.delete("/deleteService", deleteService);
router.get("/service/:id", singleService);

router.get("/dealer/:dealer_id", getServicesByDealer);

module.exports = router;
