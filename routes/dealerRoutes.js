var express = require("express");
const multer = require("multer");
var fs = require("fs");
var path = require("path");
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
    fileSize: 50 * 1024 * 1024, // 20MB
  },
});


router.post("/addDealer",
  upload.fields([
    { name: "images", maxCount: 1 },
    { name: "panCardFront", maxCount: 1 },
    { name: "panCardBack", maxCount: 1 },
    { name: "adharCardFront", maxCount: 1 },
    { name: "adharCardBack", maxCount: 1 },
    { name: "passportImage", maxCount: 1 },
    { name: "PassbookImage", maxCount: 1 },
    { name: "shopImages", maxCount: 10 }, 
  ]),
    addDealer
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

router.post('/processTransaction/:id',WalletAdd);

//  Payout of cashfree ---- NOT IN Use
router.post('/AddAmout/:id',addAmount)
router.post('/prepare-transfer',tranfer)
router.get('/getShopDetails',getShopDetails)

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
