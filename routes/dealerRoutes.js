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

const uploadDir = path.join(__dirname, "../uploads/dealer-documents");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 14
  }
});

router.post("/addDealer",
  upload.fields([
    { name: "panCardFront", maxCount: 1 },
    { name: "aadharFront", maxCount: 1 },
    { name: "aadharBack", maxCount: 1 },
    { name: "shopImages", maxCount: 10 }
  ]),
  async function addDealer(req, res) {
    try {
      console.log("Incoming payload:", req.body);

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
        comission: commissionInput,
        tax,
        aadharCardNo,
        panCardNo
      } = req.body;

      // Debug log
      console.log("Commission input:", commissionInput, typeof commissionInput);
      console.log("Tax input:", tax, typeof tax);

      // Validate commission
      const commission = parseFloat(commissionInput);
      if (isNaN(commission) || commission < 0 || commission > 100) {
        return res.status(400).json({
          success: false,
          message: `Commission must be between 0-100%. Received: ${commissionInput}`
        });
      }

      // Validate tax
      const taxValue = tax ? parseFloat(tax) : 0;
      if (tax && (isNaN(taxValue) || taxValue < 0 || taxValue > 18)) {
        return res.status(400).json({
          success: false,
          message: `Tax must be between 0-18%. Received: ${tax}%`
        });
      }

      // Email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }

      // PAN format: 5 letters, 4 digits, 1 letter
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panCardNo || !panRegex.test(panCardNo.trim().toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid PAN card number"
        });
      }

      // Aadhar format: 12-digit number
      const aadharRegex = /^\d{12}$/;
      if (!aadharCardNo || !aadharRegex.test(aadharCardNo.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid Aadhar card number"
        });
      }

      // Check duplicate email/phone
      const existingDealer = await Vendor.findOne({
        $or: [{ email }, { phone }]
      });

      if (existingDealer) {
        const conflictField = existingDealer.email === email ? 'Shop Email' : 'Shop Contact';
        return res.status(409).json({
          success: false,
          message: `${conflictField} already exists`,
          field: conflictField.toLowerCase().replace(' ', '-')
        });
      }

      // Required document validation
      const requiredDocs = {
        panCardFront: 'PAN Card Front',
        aadharFront: 'Aadhar Front',
        aadharBack: 'Aadhar Back',
      };

      const missingDocs = Object.entries(requiredDocs)
        .filter(([key]) => !req.files?.[key]?.[0])
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
        aadharCardNo: aadharCardNo.trim(),
        panCardNo: panCardNo.trim().toUpperCase(),
        commission,
        tax: taxValue,
        documents,
        shopImages: req.files?.shopImages?.map(file => file.filename) || [],
        isVerify: false,
        isProfile: true,
        isDoc: true,
        isActive: true
      };

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

      // Cleanup uploaded files
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

// By Prashant 
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const dealer = await Vendor.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: 'Dealer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Dealer status updated to ${dealer.isActive ? 'Active' : 'Inactive'}`,
      data: {
        id: dealer._id,
        isActive: dealer.isActive,
        shopName: dealer.shopName
      }
    });

  } catch (error) {
    console.error('Error updating dealer status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating dealer status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/view/:id', async (req, res) => {
  try {
    const dealer = await Vendor.findById(req.params.id);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }
    res.json(dealer);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

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
