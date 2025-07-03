var express = require("express");
var multer = require("multer");
var fs = require("fs");
var path = require("path");

var {
  addservice,
  servicelist,
  updateService,
  deleteService,
  singleService,
  getServicesByDealer,
  addAdminService,
  listAdminServices,
  getServiceById,
  updateServiceById,
  addAdditionalService,
  additionalservicelist,
  deleteAdditionaalService,
  getAdditionalServiceById,
  updateAdditionalServiceById
} = require("../controller/service");

var { PicknDrop } = require("../controller/pickupndrop");

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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

// Define Routes
router.post("/addservice", upload.single("images"), addservice);
// router.post("/addservice",  addservice);
router.get("/servicelist", servicelist);
router.get("/edit-service/:id", getServiceById);
router.put(
  "/update-service/:id",
  upload.single("images"),
  updateServiceById
);
router.put(
  "/updateservice",
  upload.fields([{ name: "service_image", maxCount: 1 }]),
  updateService
);
router.delete("/deleteService", deleteService);
router.get("/service/:id", singleService);
router.post("/PicknDrop", PicknDrop);
router.get("/dealer/:dealer_id", getServicesByDealer);
router.post("/adminservices/create", upload.single("image"), addAdminService);
router.get("/adminservices", listAdminServices);

// Aadditional Services 
router.post("/create-additional-service", upload.single("images"), addAdditionalService);
router.get("/additionalservicelist", additionalservicelist);
router.delete("/deleteAdditionalService/:id", deleteAdditionaalService);
router.get("/getAdditionalService/:id", getAdditionalServiceById);
router.put("/updateAdditionalService/:id",upload.single('image'), updateAdditionalServiceById);


module.exports = router;
