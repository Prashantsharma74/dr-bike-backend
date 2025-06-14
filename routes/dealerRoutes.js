var express = require("express");
const multer = require("multer");
var fs = require("fs");
var path = require("path");
const Vendor = require("../models/dealerModel");
var {
  editDealer,
  dealerList,
  deleteDealer,
  singledealer,
  dealerWithInRange,
  editDealerStatus,
  GetwalletInfo,
  WalletAdd,
  addAmount,
  tranfer,
  dealerWithInRange2,
  getShopDetails,
  addDealerShopDetails,
  addDealerDocuments,
  getWallet,
  getPendingWallets,
  updateWalletStatus,
  getAllDealersWithDocFalse,
  getAllDealersWithVerifyFalse,
  updateDealerDocStatus,
  updateDealerVerfication
} = require("../controller/dealer");
const { log } = require("console");

const router = express.Router();

// // Define the folder path
// const uploadDir = path.join(__dirname, "../image");

// // Ensure the folder exists
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Set up Multer storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, uploadDir);
//   },
//   filename: function (req, file, callback) {
//     const ext = path.extname(file.originalname);
//     const uniqueName = `${file.fieldname}-${Date.now()}${ext}`;
//     callback(null, uniqueName);
//   },
// });

// // Configure Multer with size limit (20MB)
// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 50 * 1024 * 1024, // 20MB
//   },
// });

// Define the upload directory path
const uploadDir = path.join(__dirname, "../uploads/dealer-documents");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer storage with proper file naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`), false);
  }
};

// Configure Multer with proper limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
    files: 14 // Max 14 files (10 shop images + 4 documents)
  }
});

// router.post("/addDealer",
//   upload.fields([
//     { name: "panCardFront", maxCount: 1 },
//     { name: "adharCardFront", maxCount: 1 },
//     { name: "adharCardBack", maxCount: 1 },
//     { name: "PassbookImage", maxCount: 1 },
//     { name: "shopImages", maxCount: 10 }, 
//   ]),
//     addDealer
// );

router.post("/addDealer",
  upload.fields([
    { name: "panCardFront", maxCount: 1 },
    { name: "aadharFront", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
    { name: "shopImages", maxCount: 10 }
  ]),

  async function addDealer(req, res) {
    try {
      const {
        shopName,
        email,
        phone,
        password,
        shopPincode,
        fullAddress,
        city,
        state,
        latitude,
        longitude,
        ownerName,
        personalEmail,
        personalPhone,
        alternatePhone,
        permanentAddress,
        permanentState,
        permanentCity,
        presentAddress,
        presentState,
        presentCity,
        accountHolderName,
        ifscCode,
        bankName,
        accountNumber,
      } = req.body;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }

      const existingDealer = await Vendor.findOne({
        $or: [
          { email },
          { phone }
        ]
      });

      if (existingDealer) {
        let conflictField = existingDealer.email === email ? 'Shop Email' : 'Shop Contact';
        return res.status(409).json({
          success: false,
          message: `${conflictField} already exists`,
          field: conflictField.toLowerCase().replace(' ', '-')
        });
      }

      const requiredDocs = {
        panCardFront: 'PAN Card Front',
        aadharFront: 'Aadhar Front',
        aadharBack: 'Aadhar Back',
      };

      const missingDocs = Object.entries(requiredDocs)
        .filter(([key, _]) => !req.files?.[key]?.[0])
        .map(([_, label]) => label);

      if (missingDocs.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Missing required documents",
          missingDocuments: missingDocs
        });
      }

      const documents = {};
      Object.keys(requiredDocs).forEach(key => {
        documents[key] = req.files[key][0].filename;
      });

      const dealerData = {
        shopName,
        email,
        phone,
        password,
        shopPincode,
        fullAddress,
        city,
        state,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        ownerName,
        personalEmail: personalEmail.trim().toLowerCase(),
        personalPhone,
        alternatePhone,
        permanentAddress: {
          address: permanentAddress,
          state: permanentState,
          city: permanentCity
        },
        presentAddress: {
          address: presentAddress,
          state: presentState,
          city: presentCity
        },
        bankDetails: {
          accountHolderName,
          ifscCode,
          bankName,
          accountNumber
        },
        documents,
        shopImages: req.files?.shopImages?.map(file => file.filename) || [],
        isVerify: false,
        isProfile: true,
        isDoc: true
      };

      // ✅ Step 5: Create dealer with transaction for data consistency
      const newDealer = await Vendor.create(dealerData);

      return res.status(201).json({
        success: true,
        message: "Dealer registered successfully",
        data: {
          id: newDealer._id,
          shopName: newDealer.shopName,
          email: newDealer.email
        }
      });

    } catch (error) {
      console.error("Registration error:", error);

      // Cleanup uploaded files if error occurs
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          try {
            if (file?.filename) {
              fs.unlinkSync(path.join(uploadDir, file.filename));
            }
          } catch (err) {
            console.error("File cleanup error:", err);
          }
        });
      }

      return res.status(500).json({
        success: false,
        message: "Registration failed due to server error",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

router.put("/editDealer", upload.fields([
  { name: 'images', maxCount: 20 },
  { name: 'panCardFront', maxCount: 1 },
  { name: 'adharCardFront', maxCount: 1 },
  { name: 'shopImages', maxCount: 10 }
]), editDealer);


router.get("/dealerList", dealerList);
router.get("/dealerWithInRange", dealerWithInRange);
router.get("/dealerWithInRange2", dealerWithInRange2);
router.get("/dealer/:id", singledealer);
router.get("/dealerWallet/:id", GetwalletInfo);
router.get("/dealerWallet", getWallet);
router.get("/dealersWithDocFalse", getAllDealersWithDocFalse);
router.get("/dealersWithVerifyFalse", getAllDealersWithVerifyFalse);

// router.post('/addDealer',upload.fields([{ name: 'image', maxCount: 1}]),addBike);
router.delete("/deleteDealer", deleteDealer);
router.post("/update_status", editDealerStatus);

router.post('/processTransaction/:id', WalletAdd);

//  Payout of cashfree ---- NOT IN Use
router.post('/AddAmout/:id', addAmount)
router.post('/prepare-transfer', tranfer)
router.get('/getShopDetails', getShopDetails)

router.post(
  "/add-shop-details",
  upload.fields([
    { name: "shopImages", maxCount: 5 }
  ]),
  addDealerShopDetails
);


router.post(
  "/add-dealer-documents",
  upload.fields([
    { name: "adharCardFront", maxCount: 1 },
    { name: "adharCardBack", maxCount: 1 },
    { name: "panCardFront", maxCount: 1 },
    { name: "panCardBack", maxCount: 1 }
  ]),
  addDealerDocuments
);

router.get("/pending", getPendingWallets);
router.put("/updatepending", updateWalletStatus);
router.put("/updateDocStatus", updateDealerDocStatus);
router.put("/updateVerification", updateDealerVerfication);


module.exports = router;
