const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { addAdditionalService, getAllAdditionalServices, getAdditionalServiceById, updateAdditionalService, deleteAdditionalService, getAdditionalServicesByDealerId, saveSelectedServices } = require("../controller/additionalServiceController");

// Configure Multer directly in the router file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/uploads/additional-services"));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            "additional-service-" + uniqueSuffix + path.extname(file.originalname)
        );
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, JPEG, PNG & GIF files are allowed"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

router.post("/add-service", upload.single("image"), (req, res) => {
    console.log("cndskdjsdjksd")
});
router.get("/all-additional-services", getAllAdditionalServices);
router.get("/single-additional-service/:id", getAdditionalServiceById);
router.put("/updated-additional-service/:id", upload.single("image"), updateAdditionalService);
router.delete("/delete-additional-service/:id", deleteAdditionalService);
router.get('/:dealerId', getAdditionalServicesByDealerId);
// Save selected services
router.post('/select-services', saveSelectedServices);

module.exports = router;