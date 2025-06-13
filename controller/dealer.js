require("dotenv").config();
const Dealer = require("../models/Dealer");
const jwt_decode = require("jwt-decode");
var validation = require("../helper/validation");
const Rating = require("../models/rating_model");
const Wallet = require("../models/Wallet_modal")
const Role = require('../models/Roles_modal')
const Admin = require('../models/admin_model')
const Bike = require('../models/bikeCompanyModel')
const UserBike = require("../models/userBikeModel")
const servicess = require("../models/service_model")
const fs = require("fs");

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}


async function checkPermission(user_id, requiredPermission) {
  try {
      const userRole = await Role.findOne({ subAdmin: user_id });
      console.log(userRole,"1")
      if (!userRole) {
          return false;
      }
      const permissions = userRole.permissions;
      console.log(permissions,"2")

      const [module, permission] = requiredPermission.split('.');
    
      // Check if the module and permission exist in permissions object
      if (!permissions || !permissions[module] || !permissions[module][permission]) {
        return false;
      }
      return true;
  } catch (error) {
      console.error("Error while checking permission:", error);
      return false;
  }
}

// const dealerWithInRange = async (req, res) => {
//   try {
//     console.log("📌 Received Query Params:", req.query);

//     // Extract query params
//     const { userLat, userLon, name, model, bike_cc, plate_number } = req.query;
//     const data = jwt_decode(req.headers.token);
//     const user_id = data.user_id;

//     console.log("📌 Extracted Data:", { userLat, userLon, name, model, bike_cc, plate_number, user_id });

//     if (!name || !model || !bike_cc || !plate_number) {
//       return res.status(200).json({ success: false, message: "Missing required bike details" });
//     }

//     // Convert bike_cc to a number for accurate filtering
//     const bikeCCAsNumber = Number(bike_cc);

//     // Check if UserBike already exists
//     let existingBike = await UserBike.findOne({ user_id, plate_number });

//     if (!existingBike) {
//       console.log("✅ Creating new UserBike entry...");
//       const newUserBike = new UserBike({ user_id, name, model, bike_cc: bikeCCAsNumber, plate_number });
//       await newUserBike.save();
//     }

//     console.log("🔎 Fetching dealers within range...");
//     const dealers = await Dealer.find({ is_online: "on", wallet: { $gt: -500 }, isBlock: false })
//       .populate("services", "name image")
//       .populate({
//         path: "bikes",
//         select: { name: 1, model: 1, bike_cc: 1 }, // Explicitly select fields to avoid issues
//         options: { lean: true } // Convert Mongoose documents to plain objects
//       });

//     console.log(`✅ Total Dealers Found: ${dealers.length}`);

//     // Filter dealers based on `model` and `bike_cc`
//     const dealersWithRatings = await Promise.all(
//       dealers.map(async (dealer) => {
//         const distance = calculateDistance(userLat, userLon, dealer.latitude, dealer.longitude);
//         console.log(`🚗 Dealer: ${dealer.name}, Distance: ${distance.toFixed(2)} km`);

//         if (distance > 3) return null; // Exclude dealers beyond 3km range

//         console.log(`🔍 Dealer ${dealer.name} Bikes:`, dealer.bikes);

//         let filteredBikes = dealer.bikes.filter((bike) => {
//           console.log(`🔎 Checking bike before filtering:`, bike);

//           // Ensure bike fields are properly populated
//           if (!bike || bike.model == null || bike.bike_cc == null) {
//             console.log(`❌ Skipping bike due to missing data:`, bike);
//             return false;
//           }

//           // Normalize model names by trimming and replacing extra spaces
//           let bikeModel = String(bike.model).toLowerCase().replace(/\s+/g, ' ').trim();
//           let searchModel = String(model).toLowerCase().replace(/\s+/g, ' ').trim();

//           // Ensure `bike_cc` is compared as a number
//           let bikeCC = Number(bike.bike_cc);
//           let searchCC = Number(bike_cc);

//           console.log(`
//             🏍 Checking bike:
//             - Bike Model: "${bikeModel}" (Type: ${typeof bikeModel})
//             - Search Model: "${searchModel}" (Type: ${typeof searchModel})
//             - Bike CC: ${bikeCC} (Type: ${typeof bikeCC})
//             - Search CC: ${searchCC} (Type: ${typeof searchCC})
//           `);

//           const modelMatch = bikeModel === searchModel;
//           const ccMatch = bikeCC === searchCC;

//           console.log(`✅ Model Match: ${modelMatch}, CC Match: ${ccMatch}`);

//           return modelMatch && ccMatch;
//         });

//         console.log("✅ Filtered Bikes for Dealer:", filteredBikes);

//         if (filteredBikes.length === 0) return null; // Skip dealers without matching bikes

//         // ✅ Fetch dealer ratings (Ensure correct ID format)
//         const ratings = await Rating.find({ dealer_id: dealer._id.toString() });

//         const totalRatings = ratings.length;
//         const sumRatings = ratings.reduce((acc, curr) => acc + curr.rating, 0);
//         const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

//         return {
//           dealer: { ...dealer.toObject(), bikes: filteredBikes },
//           averageRating: averageRating.toFixed(1),
//           reviews: ratings.map((rating) => ({
//             comment: rating.comment,
//             rating: rating.rating
//           })),
//         };
//       })
//     );

//     // Remove null values
//     const validDealersWithRatings = dealersWithRatings.filter((dealer) => dealer !== null);

//     console.log("✅ Final Dealers Response:", validDealersWithRatings);
//     res.json({ success: true, dealersWithRatings: validDealersWithRatings });

//   } catch (error) {
//     console.error("❌ Error in dealerWithInRange:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };


const dealerWithInRange = async (req, res) => {
  try {
    const { userLat, userLon } = req.query;

    // Ensure user latitude and longitude are provided
    if (!userLat || !userLon) {
      return res.status(200).json({ error: "User location (latitude & longitude) is required" });
    }

    // Fetch all active dealers
    const dealers = await Dealer.find({ 
      is_online: "on",
      wallet: { $gt: -500 },
      isBlock: false
    });

    console.log("dealer",dealers)
    // Filter dealers based on 3 km distance
    const nearbyDealers = dealers.filter(dealer => {
      const distance = calculateDistance(
        parseFloat(userLat),
        parseFloat(userLon),
        parseFloat(dealer.latitude),
        parseFloat(dealer.longitude)
      );
      return distance <= 3;
    });


    console.log("nearbyDealers",nearbyDealers)


    res.status(200).json({ success: true, data: nearbyDealers });

  } catch (error) {
    console.error("Error fetching nearby dealers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const dealerWithInRange2 = async (req, res) => {
  try {
    const { userLat, userLon, variant_id } = req.query;

    if (!userLat || !userLon || !variant_id) {
      return res.status(200).json({ success: false, message: "User location (latitude & longitude) and variant_id are required!" });
    }

    console.log(`📍 Searching dealers near lat: ${userLat}, lon: ${userLon} with variant_id: ${variant_id}`);

    // Step 1: Fetch all active dealers within 3km and ensure they are not blocked
    const dealers = await Dealer.find({
      is_online: "on",
      wallet: { $gt: -500 },
      isBlock: false
    });

    console.log(`✅ Total Dealers Found: ${dealers.length}`);

    // Step 2: Filter dealers within 3km radius
    const nearbyDealers = dealers.filter((dealer) => {
      const distance = calculateDistance(
        parseFloat(userLat),
        parseFloat(userLon),
        parseFloat(dealer.latitude),
        parseFloat(dealer.longitude)
      );
      return distance <= 3;
    });

    console.log(`✅ Nearby Dealers Count: ${nearbyDealers.length}`);

    // Step 3: Check if dealer's bikes array contains the given `variant_id`
    const dealersWithMatchingBikes = nearbyDealers.filter((dealer) => {
      return dealer.bikes.some((bikeId) => bikeId.toString() === variant_id);
    });

    if (dealersWithMatchingBikes.length === 0) {
      return res.status(200).json({ success: false, message: "No dealers found with this bike variant!", data: [] });
    }

    console.log("✅ Final Dealers Response:", dealersWithMatchingBikes);
    res.status(200).json({ success: true, data: dealersWithMatchingBikes });

  } catch (error) {
    console.error("❌ Error fetching nearby dealers:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// async function addDealer(req, res) {
//   try {
//       const data = jwt_decode(req.headers.token);
//       const user_id = data.user_id;
//       const user_type = data.user_type;

//       if (!user_id || user_type !== 1) { 
//           if (user_type === 3) {
//               const subAdmin = await Admin.findById(user_id);
//               if (!subAdmin) {
//                   return res.status(403).json({ success: false, message: "Subadmin not found!" });
//               }
              
//               const isAllowed = await checkPermission(user_id, "Dealers.create");
//               if (!isAllowed) {
//                   return res.status(403).json({ success: false, message: "No permission to add dealers!" });
//               }
//           } else {
//               return res.status(403).json({ success: false, message: "Unauthorized access!" });
//           }
//       }

//       // Extract fields from request body
//       let dealerData = { ...req.body };
//       dealerData.create_by = user_id;  // Set creator


//       dealerData.isVerify = true;
//       dealerData.isProfile = true;
//       dealerData.isDoc = true;
//       dealerData.goDigital = true;
//       dealerData.isShopDetailsAdded = true;
//       dealerData.isDocumentsAdded = true;

//       // Handle file uploads
//       if (req.files) {

//         if (req.files?.images) {
//           dealerData.images = req.files.images[0].filename; // Convert array to single string
//       }
      
//           if (req.files.panCardFront) {
//               dealerData.panCardFront = req.files.panCardFront[0].filename;
//           }
//           if (req.files.panCardBack) {
//               dealerData.panCardBack = req.files.panCardBack[0].filename;
//           }
//           if (req.files.adharCardFront) {
//               dealerData.adharCardFront = req.files.adharCardFront[0].filename;
//           }
//           if (req.files.adharCardBack) {
//               dealerData.adharCardBack = req.files.adharCardBack[0].filename;
//           }
//           if (req.files.passportImage) {
//               dealerData.passportImage = req.files.passportImage[0].filename;
//           }
//           if (req.files.PassbookImage) {
//               dealerData.PassbookImage = req.files.PassbookImage[0].filename;
//           }
//           if (req.files.shopImages) {
//               dealerData.shopImages = req.files.shopImages.map(file => file.filename);
//           }
//       }

//       // Check if email already exists
//       const emailCheck = await Dealer.findOne({ email: dealerData.email });
//       if (emailCheck) {
//           return res.status(400).json({ success: false, message: "Email already exists" });
//       }

//       // Create a new dealer record
//       const newDealer = await Dealer.create(dealerData);

//       return res.status(201).json({
//           success: true,
//           message: "Dealer added successfully",
//           data: newDealer,
//       });

//   } catch (error) {
//       console.error("Error adding dealer:", error);
//       return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// }
// p start

// By Prashant
// async function addDealer(req, res) {
//   console.log("Api working");
  
//   try {
//     // Step 1: Extract form data from request body
//     let dealerData = { ...req.body };

//     // Optional: Set default flags
//     dealerData.isVerify = true;
//     dealerData.isProfile = true;
//     dealerData.isDoc = true;
//     dealerData.goDigital = true;
//     dealerData.isShopDetailsAdded = true;
//     dealerData.isDocumentsAdded = true;

//     // Step 2: Handle file uploads (Multer saves files in req.files)
//     if (req.files) {
//       if (req.files?.images) {
//         dealerData.images = req.files.images[0].filename;
//       }
//       if (req.files.panCardFront) {
//         dealerData.panCardFront = req.files.panCardFront[0].filename;
//       }
//       if (req.files.panCardBack) {
//         dealerData.panCardBack = req.files.panCardBack[0].filename;
//       }
//       if (req.files.adharCardFront) {
//         dealerData.adharCardFront = req.files.adharCardFront[0].filename;
//       }
//       if (req.files.adharCardBack) {
//         dealerData.adharCardBack = req.files.adharCardBack[0].filename;
//       }
//       if (req.files.passportImage) {
//         dealerData.passportImage = req.files.passportImage[0].filename;
//       }
//       if (req.files.PassbookImage) {
//         dealerData.PassbookImage = req.files.PassbookImage[0].filename;
//       }
//       if (req.files.shopImages) {
//         dealerData.shopImages = req.files.shopImages.map(file => file.filename);
//       }
//     }

//     // Step 3: Check for duplicate email
//     const emailCheck = await Dealer.findOne({ shopEmail: dealerData.shopEmail });
//     if (emailCheck) {
//       return res.status(400).json({ success: false, message: "Email already exists" });
//     }

//     // Step 4: Create a new dealer document
//     const newDealer = await Dealer.create(dealerData);

//     return res.status(201).json({
//       success: true,
//       message: "Dealer added successfully",
//       data: newDealer,
//     });

//   } catch (error) {
//     console.error("Error adding dealer:", error);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// }

// async function addDealer(req, res) {
//   try {
//     // 1. Prepare the dealer data structure
//     const dealerData = {
//       ...req.body,
//       // Default flags
//       isVerify: true,
//       isProfile: true,
//       isDoc: true,
//       goDigital: true,
//       isShopDetailsAdded: true,
//       isDocumentsAdded: true,
      
//       // Address fields
//       permanentAddress: {
//         address: req.body.permanentAddress,
//         state: req.body.permanentState,
//         city: req.body.permanentCity
//       },
//       presentAddress: {
//         address: req.body.presentAddress,
//         state: req.body.presentState,
//         city: req.body.presentCity
//       }
//     };

//     // 2. Process file uploads (using correct field names)
//     if (req.files) {
//       dealerData.documents = {
//         panCardFront: req.files.panCardFront?.[0]?.filename,
//         aadharFront: req.files.aadharFront?.[0]?.filename,
//         aadharBack: req.files.aadharBack?.[0]?.filename,
//         passbookImage: req.files.passbookImage?.[0]?.filename
//       };
      
//       dealerData.shopImages = req.files.shopImages?.map(file => file.filename) || [];
//     }

//     // 3. Validate required fields
//     const requiredFields = [
//       'shopName', 'shopEmail', 'shopContact', 'ownerName',
//       'permanentAddress', 'presentAddress', 'accountHolderName'
//     ];
    
//     for (const field of requiredFields) {
//       if (!dealerData[field]) {
//         return res.status(400).json({
//           success: false,
//           message: `${field} is required`
//         });
//       }
//     }

//     // 4. Check for existing dealer
//     const existingDealer = await Dealer.findOne({ 
//       $or: [
//         { shopEmail: dealerData.shopEmail },
//         { shopContact: dealerData.shopContact }
//       ]
//     });

//     if (existingDealer) {
//       return res.status(400).json({
//         success: false,
//         message: existingDealer.shopEmail === dealerData.shopEmail 
//           ? "Email already exists" 
//           : "Contact number already exists"
//       });
//     }

//     // 5. Create new dealer
//     const newDealer = await Dealer.create(dealerData);

//     return res.status(201).json({
//       success: true,
//       message: "Dealer registered successfully",
//       data: {
//         id: newDealer._id,
//         shopName: newDealer.shopName,
//         documents: dealerData.documents
//       }
//     });

//   } catch (error) {
//     console.error("Dealer registration error:", error);
    
//     // Cleanup uploaded files if error occurs
//     if (req.files) {
//       const fs = require('fs');
//       const path = require('path');
//       const uploadDir = path.join(__dirname, "../uploads/dealer-documents");
      
//       Object.values(req.files).flat().forEach(file => {
//         if (file.filename) {
//           fs.unlink(path.join(uploadDir, file.filename), () => {});
//         }
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Registration failed. Please check all required fields.",
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// }

var path = require("path");

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
      goDigital: true
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

async function addAmount(req, res) {
  try {
    const dealerId = req.params.id; 
    const orderAmount = 100;

    const dealer = await Dealer.findById(dealerId);
    console.log(dealer)

    if (!dealer) {
      return res.status(200).json({ success: false, message: 'Dealer not found' });
    }

    dealer.wallet += orderAmount;

    await dealer.save();

    return res.status(200).json({ success: true, message: 'Amount added successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}




// p end

async function addDealer1(req, res) {
  // created by  store or vendor
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || (user_type != 1 && user_type != 3)) {
      var response = {
        status: 200,
        message: "admin is un-authorised !",
      };
      return res.status(200).send(response);
    }
    const {
      dealer_id,
      name,
      description,
      estimated_cost,
      tax,
      area,
      city,
      dealerId,
    } = req.body;

    let dealers = await Dealer.findById(dealer_id);
    if (!dealers) {
      res.status(200).json({ error: "No Service exists" });
      return;
    }

    if (req.file) {
      const data = {
        dealer_id: dealer_id,
        dealerId: dealerId,
        image: req.file.filename,
        name: name,
        description: description,
        area: area,
        city: city,
        estimated_cost: estimated_cost,
        tax: tax,
        // dealerId,
      };
      console.log(data);

      const serviceResponse = await service.create(data);
      // console.log('serviceResponse', serviceResponse)

      if (serviceResponse) {
        var response = {
          status: 200,
          message: "service added successfully",
          data: serviceResponse,
        };
        return res.status(200).send(response);
      } else {
        var response = {
          status: 201,
          message: "Unable to add service",
        };
        return res.status(201).send(response);
      }
    } else {
      var response = {
        status: 201,
        message: "please upload service image",
      };

      return res.status(201).send(response);
    }
  } catch (error) {
    console.log("error", error);
    response = {
      status: 201,
      message: "Operation was not successful",
    };

    return res.status(201).send(response);
  }
}

// async function editDealer(req, res) {
//   try {
//     const data = jwt_decode(req.headers.token);
//     const user_id = data.user_id;
//     const user_type = data.user_type;
//     const type = data.type;

//     const dealer_id = user_type == 2 ? user_id : req.body.dealer_id;
//     console.log("Editing Dealer:", dealer_id);

//     let dealer = await Dealer.findById(dealer_id);
//     if (!dealer) {
//       return res.status(200).json({ success: false, message: 'Dealer not found' });
//     }

//     if (type === 2 && !dealer.isVerify) {
//       return res.status(200).json({ success: false, message: 'Dealer verification pending. Cannot edit details.' });
//     }

//     const {
//       address, latitude, longitude, phone, state, city, email, area, isBlock, deletedImages = [],
//       shopName, shopDescription, name, extra_charges, accountno, panCard, bankname,
//       ifsc, adharCard, service_id, bikes, isProfile, pickupAndDrop, pickupAndDropDescription,isDoc
//     } = req.body;

//     const image = req.files?.images ? req.files.images[0].filename : dealer.images;

//     console.log(image,"image")

//     const updatedShopImages = dealer.shopImages || [];
//     if (req.files?.shopImages) {
//       updatedShopImages.push(...req.files.shopImages.map(file => file.filename));
//     }

//     const updatedData = {
//       phone: phone ?? dealer.phone,
//       state: state ?? dealer.state,
//       city: city ?? dealer.city,
//       area: area ?? dealer.area,
//       address: address ?? dealer.address,
//       latitude: latitude ?? dealer.latitude,
//       longitude: longitude ?? dealer.longitude,
//       isBlock: isBlock ?? dealer.isBlock,
//       email: email ?? dealer.email,
//       shopName: shopName ?? dealer.shopName,
//       shopDescription: shopDescription ?? dealer.shopDescription,
//       shopImages: updatedShopImages.length ? updatedShopImages : dealer.shopImages,
//       extra_charges: extra_charges ?? dealer.extra_charges,
//       name: name ?? dealer.name,
//       images: image ? image : dealer.images,
//       accountno: accountno ?? dealer.accountno,
//       panCard: panCard ?? dealer.panCard,
//       bankname: bankname ?? dealer.bankname,
//       ifsc: ifsc ?? dealer.ifsc,
//       isProfile: isProfile ?? dealer.isProfile,
//       isDoc: isDoc ?? dealer.isDoc,
//       adharCard: adharCard ?? dealer.adharCard,
//       services: service_id ?? dealer.services,
//       bikes: bikes ?? dealer.bikes,
//       pickupAndDrop: pickupAndDrop ?? dealer.pickupAndDrop,
//       pickupAndDropDescription: pickupAndDropDescription ?? dealer.pickupAndDropDescription,
//       panCardImage: req.files?.panCardImage ? req.files.panCardImage[0].filename : dealer.panCardImage,
//       adharCardImage: req.files?.adharCardImage ? req.files.adharCardImage[0].filename : dealer.adharCardImage,
//       adharCardBackImage: req.files?.adharCardBackImage ? req.files.adharCardBackImage[0].filename : dealer.adharCardBackImage,
//       passportImage: req.files?.passportImage ? req.files.passportImage[0].filename : dealer.passportImage,
//       PassbookImage: req.files?.PassbookImage ? req.files.PassbookImage[0].filename : dealer.PassbookImage
//     };

//     await Dealer.findByIdAndUpdate(dealer_id, { $set: updatedData }, { new: true });
//     return res.status(200).json({ status: 200, message: "Dealer updated successfully",data:updatedData });

//   } catch (error) {
//     console.error("Error in editDealer:", error);
//     return res.status(500).json({ status: 500, message: "Operation was not successful" });
//   }
// }

async function editDealer(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;

    const dealer_id = user_type == 2 ? user_id : req.body.dealer_id;
    console.log("Editing Dealer:", dealer_id);

    let dealer = await Dealer.findById(dealer_id);
    if (!dealer) {
      return res.status(200).json({ success: false, message: 'Dealer not found' });
    }

    if (type === 2 && !dealer.isVerify) {
      return res.status(200).json({ success: false, message: 'Dealer verification pending. Cannot edit details.' });
    }

    // Fields to update only if they are provided in req.body
    const updateFields = {};
    const allowedFields = [
      "phone", "state", "city", "area", "address", "latitude", "longitude",
      "isBlock", "email", "shopName", "shopDescription", "extra_charges",
      "name", "accountno", "panCard", "bankname", "ifsc", "adharCard",
      "service_id", "bikes", "isProfile", "pickupAndDrop", "pickupAndDropDescription",
      "isDoc","goDigital", 
      "expertAdvice", 
      "ourPromise" ,"pincode","accholdername"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    // Handle image updates if provided
    if (req.files?.images) {
      updateFields.images = req.files.images[0].filename;
    }

    if (req.files?.shopImages) {
      updateFields.shopImages = dealer.shopImages ? [...dealer.shopImages, ...req.files.shopImages.map(file => file.filename)] : req.files.shopImages.map(file => file.filename);
    }

    if (req.files?.panCardImage) {
      updateFields.panCardImage = req.files.panCardImage[0].filename;
    }

    if (req.files?.adharCardImage) {
      updateFields.adharCardImage = req.files.adharCardImage[0].filename;
    }

    if (req.files?.adharCardBackImage) {
      updateFields.adharCardBackImage = req.files.adharCardBackImage[0].filename;
    }

    if (req.files?.passportImage) {
      updateFields.passportImage = req.files.passportImage[0].filename;
    }

    if (req.files?.PassbookImage) {
      updateFields.PassbookImage = req.files.PassbookImage[0].filename;
    }

    // Update only provided fields
    const updatedDealer = await Dealer.findByIdAndUpdate(dealer_id, { $set: updateFields }, { new: true });

    return res.status(200).json({ status: 200, message: "Dealer updated successfully", data: updatedDealer });

  } catch (error) {
    console.error("Error in editDealer:", error);
    return res.status(500).json({ status: 500, message: "Operation was not successful" });
  }
}



async function dealerList(req, res) {
  try {
    const dealerResponse = await Dealer.find(req.query);
    
    // let newDealerResponse = [...dealerResponse].sort((a, b) => b.wallet - a.wallet);

    if (dealerResponse.length > 0) {
      const response = {
        status: 200,
        message: "success",
        data: dealerResponse,
        // MaxWallet: newDealerResponse[0].wallet || 0
      };
      return res.status(200).send(response);
    } else {
      const response = {
        status: 201,
        message: "No Dealer Found",
        data: dealerResponse,
      };
      return res.status(201).send(response);
    }
  } catch (error) {
    console.log("error", error);
    const response = {
      status: 201,
      message: "Operation was not successful",
    };
    return res.status(201).send(response);
  }
}


async function singledealer(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (
      user_id == null ||
      (user_type != 1 && user_type != 3 && user_type != 2)
    ) {
      var response = {
        status: 200,
        message: "admin is un-authorised !",
      };
      return res.status(200).send(response);
    }

    var dealerResposnse = await Dealer.findById(req.params.id)
    .populate("services", "name image")
    // .populate("BikeModel");

    if (dealerResposnse) {
      var response = {
        status: 200,
        message: "success",
        data: dealerResposnse,
      };
      return res.status(200).send(response);
    } else {
      var response = {
        status: 201,
        message: "No Dealer Found",
      };
      return res.status(201).send(response);
    }
  } catch (error) {
    console.log("error", error);
    response = {
      status: 201,
      message: "Operation was not successful",
    };
    return res.status(201).send(response);
  }
}

async function deleteDealer(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1) {
     
        if(user_type === 3){
        const subAdmin = await Admin.findById(user_id)
        
        if (!subAdmin) {
          var response = {
            status: 200,
            message: "Subadmin not found!",
          };
          return res.status(200).send(response);
        }
  
        if(user_type === 3){
          const subAdmin = await Admin.findById(user_id)
          
          if (!subAdmin) {
            var response = {
              status: 200,
              message: "Subadmin not found!",
            };
            return res.status(200).send(response);
          }
        }
    
        const isAllowed = await checkPermission(user_id, "Dealers.delete");
  
        if (!isAllowed) {
          var response = {
            status: 200,
            message: "Subadmin does not have permission to delete dealers!",
          };
          return res.status(200).send(response);
        }
  
      }
  
    }

    const { dealer_id } = req.body;
    const dealerRes = await Dealer.findOne({ _id: dealer_id });

    if (!dealerRes) {
      var response = {
        status: 201,
        message: "No Dealer Found",
      };
      return res.status(201).send(response);
    }

    Dealer.findByIdAndDelete({ _id: dealer_id }, async function (err, docs) {
      if (err) {
        var response = {
          status: 201,
          message: "Dealer delete failed",
        };
        return res.status(201).send(response);
      } else {
        var response = {
          status: 200,
          message: "Dealer deleted successfully",
        };
        return res.status(200).send(response);
      }
    });
  } catch (error) {
    console.log("error", error);
    response = {
      status: 201,
      message: "Operation was not successful",
    };
    return res.status(201).send(response);
  }
}

async function editDealerStatus(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;

    // const type = data.type;

    if(user_type === 3){
      const subAdmin = await Admin.findById(user_id)
      
      if (!subAdmin) {
        var response = {
          status: 200,
          message: "Subadmin not found!",
        };
        return res.status(200).send(response);
      }

      if(user_type === 3){
        const subAdmin = await Admin.findById(user_id)
        
        if (!subAdmin) {
          var response = {
            status: 200,
            message: "Subadmin not found!",
          };
          return res.status(200).send(response);
        }
      }
  
      const isAllowed = await checkPermission(user_id, "Dealers.update");

      if (!isAllowed) {
        var response = {
          status: 200,
          message: "Subadmin does not have permission to add dealers!",
        };
        return res.status(200).send(response);
      }
  
  
    }


    const { dealer_id, status, isBlock } = req.body;

    const datas = {
      is_online: status,
      isBlock

    };
    var where = { _id : dealer_id };

    Dealer.findByIdAndUpdate(
      where,
      { $set: datas },
      { new: true },
      async function (err, docs) {
        if (err) {
          var response = {
            status: 201,
            message: err,
          };
          return res.status(201).send(response);
        } else {
          var response = {
            status: 200,
            message: "status updated successfully",
            data: docs,
            // _url: process.env.BASE_URL + '/employee',
          };
          return res.status(200).send(response);
        }
      }
    );
  } catch (error) {
    console.log("error", error);
    response = {
      status: 201,
      message: "Operation was not successful",
    };
    return res.status(201).send(response);
  }
}

async function getWallet(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_type = data.user_type;

    // if (user_type !== 4) {
    //   return res.status(200).json({ success: false, message: "Unauthorized access!" });
    // }

    const { dealer_id } = req.query;

    if (!dealer_id) {
      return res.status(200).json({ success: false, message: "Dealer ID is required!" });
    }

    // Fetch dealer details along with services
    const dealer = await Dealer.findById(dealer_id)
      .select("wallet")
     

    if (!dealer) {
      return res.status(200).json({ success: false, message: "Dealer not found!" });
    }

    // Fetch ratings for the dealer
    const ratings = await Rating.find({ dealer_id: dealer_id });

    // Calculate average rating
    const totalRatings = ratings.length;
    const sumRatings = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : "0.0";

    return res.status(200).json({
      success: true,
      message: "wallet retrieved successfully!",
      data: {
        ...dealer.toObject(),
        averageRating
      }
    });

  } catch (error) {
    console.error("Error in getShopDetails:", error);
    return res.status(200).json({ success: false, message: "Internal server error!" });
  }
}

const GetwalletInfo = async(req,res) =>{
  try{
    const walletInfo = await Wallet.find({ dealer_id: req.params.id }).sort( { "_id": -1 } )
    .populate({
        path: 'dealer_id',
        select: ['name','id']
    })
    // .populate({
    //   path:'user_id',
    //   select:['id','first_name']
    // })
  
  
  if(walletInfo){
      res.status(200).send({message:'Get wallet information',data:walletInfo})
    }
  }catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }  
}

// const WalletAdd =async(req, res) => {

//   const data = jwt_decode(req.headers.token);
//   const user_id = data.user_id;
//   const user_type = data.user_type;
//   const type = data.type;
//   if (user_id == null || user_type != 1) {
   

//       var response = {
//         status: 200,
//         message: "not authorized",
//       };
//       return res.status(200).send(response);
    
    
//   }
//   const { Amount, Type, Note } = req.body;

// const dealer_id = req.params.id

// const dealer = await Dealer.findById(dealer_id)

// if (!dealer) {
//   var response = {
//     status: 200,
//     message: "dealer not found!",
//   };
//   return res.status(200).send(response);
// }
//   if (!Amount || !Type ) {
//       return res.status(200).json({ error: 'Amount and action are required' });
//   }

//   if (Type !== 'Credit' && Type !== 'Debit') {
//       return res.status(200).json({ error: 'Invalid action. Must be "Credit" or "Debit"' });
//   }

//   // Perform Credit or Debit operation
//   if (Type == 'Credit') {
//       dealer.wallet += Amount;
//       console.log(dealer.wallet,"yes")


//   } else {
//       // if (dealer.wallet < Amount) {
//       //     return res.status(200).json({ error: 'Insufficient balance' });
//       // }
//       dealer.wallet -= Amount;
//   }
   
//     const walletData = {
//       dealer_id: req.params.id,
//       Amount: req.body.Amount,
//       Type: req.body.Type,
//       Note: req.body.Note || '',
//       Total: dealer.wallet // Updated wallet balance
//     };

//    const create =  await Wallet.create(walletData);
//     console.log(create,"creATE")
//   await dealer.save();

//   // Return updated balance
//   res.status(200).json({ balance: dealer.wallet });
// }

// Payout related in cashfree method
async function calculateDealerAmount(dealer, orderAmount) {
  // Calculate percentage amount for dealer
  const percentageAmount = (dealer.commission / 100) * orderAmount;
  dealer.wallet += orderAmount - percentageAmount;
  await dealer.save();
}

const WalletAdd = async (req, res) => {
  try {
    const data = jwt_decode(req.headers.token);
    const { user_id, user_type } = data; // Extract user info from token
    const { Amount, Type, Note } = req.body;
    const dealer_id = req.params.id;

    // Validate required fields
    if (!Amount || !Type) {
      return res.status(200).json({ 
        status: 200, 
        message: "Amount and Type are required" 
      });
    }

    // Validate transaction type
    if (!['Credit', 'Debit'].includes(Type)) {
      return res.status(200).json({ 
        status: 200, 
        message: 'Invalid transaction type. Use "Credit" or "Debit"' 
      });
    }

    // Check if dealer exists
    const dealer = await Dealer.findById(dealer_id);
    if (!dealer) {
      return res.status(200).json({ 
        status: 200, 
        message: "Dealer not found" 
      });
    }

    // Authorization check
    if (user_type === 3) { // Subadmin
      const subAdmin = await Admin.findById(user_id);
      if (!subAdmin) {
        return res.status(200).json({ 
          status: 200, 
          message: "Subadmin not found" 
        });
      }

      const isAllowed = await checkPermission(user_id, "Dealers.wallet");
      if (!isAllowed) {
        return res.status(200).json({ 
          status: 200, 
          message: "You do not have permission to perform this action" 
        });
      }
    } else if (user_type === 2) { // Dealer
      if (dealer._id.toString() !== user_id) {
        return res.status(200).json({ 
          status: 200, 
          message: "You can only manage your own wallet" 
        });
      }
    } else if (user_type !== 1) { // Admin
      return res.status(200).json({ 
        status: 200, 
        message: "Unauthorized access" 
      });
    }

    // Handle Debit (withdrawal) validation
    if (Type === 'Debit' && dealer.wallet < Amount) {
      return res.status(200).json({ 
        status: 200, 
        message: "Insufficient wallet balance" 
      });
    }

    // Update wallet balance
    Type === 'Credit' 
      ? dealer.wallet += Number(Amount)
      : dealer.wallet -= Number(Amount);

    // Create wallet transaction record
    const walletData = {
      dealer_id,
      Amount: Number(Amount),
      Type,
      Note: Note || `${Type} transaction`,
      Total: dealer.wallet,
      date: new Date().toISOString(),
      performed_by: user_id // Track who performed the transaction
    };

    await Wallet.create(walletData);
    await dealer.save();

    return res.status(200).json({
      status: 200,
      success: true,
      message: "Transaction completed successfully",
      newBalance: dealer.wallet
    });

  } catch (error) {
    console.error("Wallet error:", error);
    return res.status(500).json({ 
      status: 500, 
      message: "Internal server error" 
    });
  }
};


function prepareTransferRequest(dealerId, orderAmount) {
  const requestData = {
    transfer_from: 'VENDOR',
    transfer_type: 'ADJUSTMENT',
    transfer_amount: orderAmount,
    remark: 'Testing',
    tags: {
      size: 1,
      product: 'SHRT'
    }
  };

  const apiUrl = `https://sandbox.cashfree.com/pg/easy-split/vendors/${dealerId}/transfer`;

  const timestamp = Date.now();
  const tokenData = `${process.env.APP_ID}:${timestamp}:${process.env.SECRET_KEY}`;
  const token = crypto.createHmac('sha256', process.env.SECRET_KEY).update(tokenData).digest('base64');

  const headers = {
    'accept': 'application/json',
    'content-type': 'application/json',
    'x-api-version': '2023-08-01',
    'X-Client-Id': process.env.APP_ID, 
    'X-Client-Secret': process.env.SECRET_KEY,
    'X-Timestamp': timestamp
  };

  return { requestData, apiUrl, headers };
}

const tranfer = async (req, res) => {
  try {
    const { dealerId, orderAmount } = req.body;
    const { requestData, apiUrl, headers } = prepareTransferRequest(dealerId, orderAmount);
    return res.status(200).json({ success: true, requestData, apiUrl, headers,message:"ok" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

async function addAmount(req, res) {
  try {
    const dealerId = req.params.id;
    const { user_id, orderAmount, booking_id, tracking_id } = req.body;

    // Convert booking_id and tracking_id to MongoDB ObjectIDs
    // const bookingIdAsObjectId = mongoose.Types.ObjectId(booking_id);
    // const trackingIdAsObjectId = mongoose.Types.ObjectId(tracking_id);

    const dealer = await Dealer.findById(dealerId);

    if (!dealer) {
      return res.status(200).json({ success: false, message: 'Dealer not found' });
    }
    if (!customer) {
      return res.status(200).json({ success: false, message: 'Customer not found' });
    }

    // Update booking status
    await booking.findOneAndUpdate({ _id: booking_id }, { status: 'Payment' });

    // Update tracking status
    await tracking.findOneAndUpdate({ _id: tracking_id }, { status: 'Payment' });

    return res.status(200).json({ success: true, message: 'Amount added successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

async function getShopDetails(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_type = data.user_type;

    if (user_type !== 4) {
      return res.status(200).json({ success: false, message: "Unauthorized access!" });
    }

    const { dealer_id } = req.query;

    if (!dealer_id) {
      return res.status(200).json({ success: false, message: "Dealer ID is required!" });
    }

    // Fetch dealer details along with services
    const dealer = await Dealer.findById(dealer_id)
      .select("shopName shopImages shopDescription goDigital expertAdvice ourPromise latitude longitude pickupAndDropDescription pickupAndDrop address")
      .populate("services");

    if (!dealer) {
      return res.status(200).json({ success: false, message: "Dealer not found!" });
    }

    const services = await servicess.find({ dealer_id: dealer_id });
    // Fetch ratings for the dealer
    const ratings = await Rating.find({ dealer_id: dealer_id });

    // Calculate average rating
    const totalRatings = ratings.length;
    const sumRatings = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : "0.0";

    return res.status(200).json({
      success: true,
      message: "Shop details retrieved successfully!",
      data: {
        ...dealer.toObject(),
        services,
        averageRating
      }
    });
    

  } catch (error) {
    console.error("Error in getShopDetails:", error);
    return res.status(200).json({ success: false, message: "Internal server error!" });
  }
}

const addDealerShopDetails = async (req, res) => {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;

    let dealerId;

    if (user_type === 2) {
      // If dealer, get ID from token
      dealerId = user_id;
    } else if (user_type === 1) {
      // If admin, get ID from request body
      dealerId = req.body.dealer_id;
      if (!dealerId) {
        return res.status(200).send({ status: 200, message: "Dealer ID is required!" });
      }
    } else {
      return res.status(200).send({ status: 200, message: "Unauthorized access!" });
    }

    // Find the dealer
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      return res.status(200).send({ status: 200, message: "Dealer not found!" });
    }

    // Build update object with allowed fields from body
    let updateData = {};

    const allowedFields = [
      "shopName",
      "shopDescription",
      "shopPinCode",
      "shopCity",
      "shopState",
      "shopPhone",
      "businessEmail"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Append new shopImages if provided
    if (req.files?.shopImages) {
      const newImages = req.files.shopImages.map(file => file.filename);
      updateData.shopImages = dealer.shopImages 
        ? [...dealer.shopImages, ...newImages] 
        : newImages;
    }

    // Set shop detail flag
    updateData.isShopDetailsAdded = true;

    // Save update
    const updatedDealer = await Dealer.findByIdAndUpdate(
      dealerId,
      { $set: updateData },
      { new: true }
    );

    return res.status(200).send({
      status: 200,
      success: true,
      message: "Shop details updated successfully",
      shopAdded: true,
      data: updatedDealer
    });

  } catch (error) {
    console.error("Error updating shop details:", error);
    return res.status(500).send({
      status: 500,
      message: "Internal server error",
      shopAdded: false,
    });
  }
};


// const addDealerShopDetails = async (req, res) => {
//   try {
//     const data = jwt_decode(req.headers.token);
//     const user_id = data.user_id;
//     const user_type = data.user_type;

//     let dealerId;

//     if (user_type === 2) {
//       // If dealer, get ID from token
//       dealerId = user_id;
//     } else if (user_type === 1) {
//       // If admin, get ID from request body
//       dealerId = req.body.dealer_id;
//       if (!dealerId) {
//         return res.status(200).send({ status: 200, message: "Dealer ID is required!" });
//       }
//     } else {
//       return res.status(200).send({ status: 200, message: "Unauthorized access!" });
//     }

//     // Find the dealer
//     const dealer = await Dealer.findById(dealerId);
//     if (!dealer) {
//       return res.status(200).send({ status: 200, message: "Dealer not found!" });
//     }



//     // Create an update object with only the provided fields
//     let updateData = {};

//     const allowedFields = [
//       "shopName",
//       "shopDescription",
//       "shopPinCode",
//       "shopCity",
//       "shopState",
//       "shopPhone",
//       "businessEmail",
      
//     ];

//     allowedFields.forEach((field) => {
//       if (req.body[field] !== undefined) {
//         updateData[field] = req.body[field];
//       }
//     });

//     // Handle shop images separately
//     if (req.files?.shopImages) {
//       const newImages = req.files.shopImages.map(file => file.filename);
//       console.log("New Images:", newImages);
  
//       updateFields.shopImages = dealer.shopImages 
//           ? [...dealer.shopImages, ...newImages] 
//           : newImages;
//   }
  

//     // ✅ Set confirmation flag
//     updateData.isShopDetailsAdded = true;

//     // Update dealer document
//     await Dealer.findByIdAndUpdate(dealerId, { $set: updateData }, { new: true });

//     return res.status(200).send({
//       status: 200,
//       success: true,
//       message: "Shop details updated successfully",
//       shopAdded: true,
//     });

//   } catch (error) {
//     console.error("Error updating shop details:", error);
//     return res.status(500).send({
//       status: 500,
//       message: "Internal server error",
//       shopAdded: false,
//     });
//   }
// };

const addDealerDocuments = async (req, res) => {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;

    let dealerId;

    if (user_type === 2) {
      // If dealer, get ID from token
      dealerId = user_id;
    } else if (user_type === 1) {
      // If admin, get ID from request body
      dealerId = req.body.dealer_id;
      if (!dealerId) {
        return res.status(200).send({ status: 200, message: "Dealer ID is required!" });
      }
    } else {
      return res.status(200).send({ status: 200, message: "Unauthorized access!" });
    }

    // Find the dealer
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      return res.status(200).send({ status: 200, message: "Dealer not found!" });
    }

    // ✅ Debugging: Check if files are received
    console.log("Uploaded Files:", req.files);

    // Prepare update object
    let updateData = {};

    // ✅ Handle Aadhar & PAN Card Image Uploads
    if (req.files?.adharCardFront) {
      updateData.adharCardFront = req.files.adharCardFront[0].filename;
    }
    if (req.files?.adharCardBack) {
      updateData.adharCardBack = req.files.adharCardBack[0].filename;
    }
    if (req.files?.panCardFront) {
      updateData.panCardFront = req.files.panCardFront[0].filename;
    }
    if (req.files?.panCardBack) {
      updateData.panCardBack = req.files.panCardBack[0].filename;
    }

    // ✅ Set confirmation flag
    updateData.isDocumentsAdded = true;

    // ✅ Update dealer document
    const updatedDealer = await Dealer.findByIdAndUpdate(dealerId, { $set: updateData }, { new: true });

    console.log("Updated Dealer Documents:", updatedDealer);

    return res.status(200).send({
      status: 200,
      success: true,
      message: "Dealer documents uploaded successfully",
      documentsAdded: true,
    });

  } catch (error) {
    console.error("Error uploading dealer documents:", error);
    return res.status(500).send({
      status: 500,
      message: "Internal server error",
      documentsAdded: false,
    });
  }
};

const getPendingWallets = async (req, res) => {
  try {
    const pendingWallets = await Wallet.find({ 
      order_status: 'PENDING', 
      Type: { $nin: ['Credit', 'Pending'] } // Exclude both Credit and Pending types
    })
    .sort({ createdAt: -1 })
    .populate('dealer_id');

    return res.status(200).json({
      status: true,
      message: "Filtered pending wallet entries retrieved successfully",
      data: pendingWallets
    });
  } catch (error) {
    console.error("Error fetching pending wallets:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};



const updateWalletStatus = async (req, res) => {
  try {
    const { wallet_id } = req.params;
    const { new_status } = req.body;

    if (!wallet_id || !new_status) {
      return res.status(400).json({ status: false, message: "wallet_id and new_status are required" });
    }

    const updatedWallet = await Wallet.findByIdAndUpdate(
      wallet_id,
      { $set: { order_status: new_status, updatedAt: new Date() } },
      { new: true }
    );

    if (!updatedWallet) {
      return res.status(404).json({ status: false, message: "Wallet entry not found" });
    }

    return res.status(200).json({
      status: true,
      message: "Wallet status updated successfully",
      data: updatedWallet
    });

  } catch (error) {
    console.error("Error updating wallet status:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};

const getAllDealersWithDocFalse = async (req, res) => {
  try{
    const data = jwt_decode(req.headers.token);
    const user_type = data.user_type;
    if(user_type === 1){
      const allDealers = await Dealer.find({isDoc: false});
      if(!allDealers){
        return res.status(404).json({
          success: false,
          message: "No Dealer found in the collection."
        })
      }
      return res.status(200).json({
        succcess: true,
        message: "Dealers list fetched successfully",
        data: allDealers
      })
    }
    else{
      return res.status(403).json({
        success: false,
        message: "Unauthorised access!"
      })
    }
  }
  catch(err){
    console.error("Error fetching Dealers details:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
}

// const getAllDealersWithVerifyFalse = async (req, res) => {
//   try{
//     const data = jwt_decode(req.headers.token);
//     const user_type = data.user_type;
//     if(user_type === 1){
//       const allDealers = await Dealer.find({isVerify: false});
//       if(!allDealers){
//         return res.status(404).json({
//           success: false,
//           message: "No Dealer found in the collection."
//         })
//       }
//       return res.status(200).json({
//         succcess: true,
//         message: "Dealers list fetched successfully",
//         data: allDealers
//       })
//     }
//       else{
//         return res.status(403).json({
//           success: false,
//           message: "Unauthorised access!"
//         })
//       }
//   }
//   catch(err){
//     console.error("Error fetching Dealers details:", err);
//     return res.status(500).json({
//       status: false,
//       message: "Internal server error"
//     });
//   }
// }

const getAllDealersWithVerifyFalse = async (req, res) => {
  try {
    const allDealers = await Dealer.find({ isVerify: false });

    if (!allDealers || allDealers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Dealer found in the collection."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Dealers list fetched successfully",
      data: allDealers
    });

  } catch (err) {
    console.error("Error fetching Dealers details:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


const updateDealerDocStatus = async (req, res) =>{
  try{
    const data = jwt_decode(req.headers.token);
    const user_type = data.user_type;
    const {id } = req.body;
    if(user_type === 1){
      const dealerDetails = await Dealer.findByIdAndUpdate(id, {isDoc: true}, {new: true, runValidators: true});
      if(!dealerDetails){
        return res.status(404).json({
          success: false,
          message: "No Dealer found in the collection."
        })
      }
      return res.status(200).json({
        succcess: true,
        message: "Dealer Doc status updated successfully",
        data: dealerDetails
      })
    }
      else{
        return res.status(403).json({
          success: false,
          message: "Unauthorised access!"
        })
      }
  }
  catch(err){
    console.error("Error updating dealers details:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
} 

const updateDealerVerfication = async (req, res) =>{
  try{
    const data = jwt_decode(req.headers.token);
    const user_type = data.user_type;
    const {id} = req.body;
    if(user_type === 1){
      const dealerDetails = await Dealer.findByIdAndUpdate(id, {isVerify: true}, {new: true, runValidators: true});
      if(!dealerDetails){
        return res.status(404).json({
          success: false,
          message: "No Dealer found in the collection."
        })
      }
      return res.status(200).json({
        succcess: true,
        message: "Dealer Doc status updated successfully",
        data: dealerDetails
      })
    }
      else{
        return res.status(403).json({
          success: false,
          message: "Unauthorised access!"
        })
      }
  }
  catch(err){
    console.error("Error updating dealers details:", err);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
} 

module.exports = {
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
  updateDealerVerfication,
};
