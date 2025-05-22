var pickndrop = require("../models/PickupnDrop");
const customers = require("../models/customer_model");
const jwt_decode = require("jwt-decode");
const otpAuth = require("../helper/otpAuth");
const Dealer = require("../models/Dealer");

async function PicknDrop(req, res) {
    try {
        const data = jwt_decode(req.headers.token);
        const user_ids = data.user_id;
        const user_type = data.user_type;
  
        if (user_ids == null || (user_type !== 1 && user_type !== 4)) {
            return res.status(401).json({ status: 401, message: "Admin is unauthorized!" });
        }
  
        const { dealer_id, user_lat, user_lng } = req.body;
  
        let dealer = await Dealer.findById(dealer_id);
        if (!dealer) {
            return res.status(401).json({ error: "No Dealer Found" });
        }
  
        let user = await customers.findById(user_ids);
        if (!user) {
            return res.status(401).json({ error: "No User Found" });
        }
  
        // User & provider mobile numbers
        const sphone = dealer.phone;
        const uphone = user.phone;
  
        // Prepare data for insertion
        const datas = {
            dealer_id: dealer_id,
            user_id: user_ids,
            service_provider_lat: dealer.latitude,  // Replacing dealer_address
            service_provider_lng: dealer.longitude, // Replacing dealer_address
            user_lat: user_lat,  // Replacing user_address
            user_lng: user_lng   // Replacing user_address
        };
  
        const pickndropResponse = await pickndrop.create(datas);
  
        if (pickndropResponse) {
            const otpData = await otpAuth.pickndropotp(sphone, uphone, dealer.latitude, dealer.longitude, user_lat, user_lng);
            pickndropResponse.otp = otpData.otp;
  
            return res.status(200).json({
                status: 200,
                message: "Pick and drop added successfully",
                data: pickndropResponse,
                image_base_url: process.env.BASE_URL
            });
        } else {
            return res.status(201).json({ status: 201, message: "Unable to add Pick and Drop" });
        }
  
    } catch (error) {
        console.error("Error in PicknDrop:", error);
        return res.status(500).json({ status: 500, message: "Operation was not successful" });
    }
  }

module.exports = { PicknDrop }