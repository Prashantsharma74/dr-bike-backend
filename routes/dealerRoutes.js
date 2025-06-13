var express = require("express");
const multer = require("multer");
var fs = require("fs");
var path = require("path");
const Dealer = require("../models/Dealer");
var {
  addDealer,
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
    { name: "passbookImage", maxCount: 1 },
    { name: "shopImages", maxCount: 10 }
  ]),
  async function addDealer(req, res) {
    try {
      const dealerData = {
        shopName: req.body.shopName,
        shopEmail: req.body.shopEmail,
        shopContact: req.body.shopContact,
        password: req.body.password,
        shopPincode: req.body.shopPincode,
        fullAddress: req.body.fullAddress,
        city: req.body.city,
        state: req.body.state,
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
        ownerName: req.body.ownerName,

        // Personal Details
        personalEmail: req.body.personalEmail,
        personalPhone: req.body.personalPhone,
        alternatePhone: req.body.alternatePhone,

        // Addresses (corrected mapping)
        permanentAddress: {
          address: req.body.permanentAddress,
          state: req.body.permanentState || req.body.shopState, // Fallback
          city: req.body.permanentCity || req.body.shopCity    // Fallback
        },
        presentAddress: {
          address: req.body.presentAddress,
          state: req.body.presentState || req.body.shopState,  // Fallback
          city: req.body.presentCity || req.body.shopCity      // Fallback
        },

        // Bank Details
        bankDetails: {
          accountHolderName: req.body.accountHolderName,
          ifscCode: req.body.ifscCode,
          bankName: req.body.bankName,
          accountNumber: req.body.accountNumber
        },

        // Documents (ensure field names match Multer config)
        documents: {
          panCardFront: req.files?.panCardFront?.[0]?.filename,
          aadharFront: req.files?.aadharFront?.[0]?.filename,
          aadharBack: req.files?.aadharBack?.[0]?.filename,
          passbookImage: req.files?.passbookImage?.[0]?.filename
        },

        // Shop Images
        shopImages: req.files?.shopImages?.map(file => file.filename) || [],

        // System Flags
        isVerify: false,
        isProfile: true,
        isDoc: true,
        goDigital: true,
        aadharCardNo:""
      };

      // 2. Validate required documents
      if (!dealerData.documents.panCardFront ||
        !dealerData.documents.aadharFront ||
        !dealerData.documents.aadharBack ||
        !dealerData.documents.passbookImage) {
        return res.status(400).json({
          success: false,
          message: "All documents (PAN, Aadhaar front/back, Passbook) are required"
        });
      }

      // 3. Create dealer
      const newDealer = await Dealer.create(dealerData);

      return res.status(201).json({
        success: true,
        message: "Dealer registered successfully",
        data: {
          id: newDealer._id,
          shopName: newDealer.shopName
        }
      });

    } catch (error) {
      console.error("Registration error:", error);

      // Cleanup uploaded files on error
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          if (file.filename) {
            fs.unlinkSync(path.join(uploadDir, file.filename));
          }
        });
      }

      return res.status(500).json({
        success: false,
        message: "Registration failed. Please check all required fields.",
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
