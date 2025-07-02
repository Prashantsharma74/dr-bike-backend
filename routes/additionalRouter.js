const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const additionalServiceController = require("../controller/additionalServiceController");

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

router.post("/add-service", upload.single("image"), additionalServiceController.addAdditionalService);
router.get("/all-additional-services", additionalServiceController.getAllAdditionalServices);
router.get("/single-additional-service/:id", additionalServiceController.getAdditionalServiceById);
router.put("/updated-additional-service/:id", upload.single("image"), additionalServiceController.updateAdditionalService);
router.delete("/delete-additional-service/:id", additionalServiceController.deleteAdditionalService);

module.exports = router;