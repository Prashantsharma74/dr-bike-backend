const AdditionalService = require("../models/additionalServiceSchema");
const mongoose = require("mongoose");

// 1. Add Additional Service
const addAdditionalService = async (req, res) => {
    try {
        console.log("Request body:");
        // const { name, description } = req.body;
        // const image = req.file?.filename || "";

        // const newService = await AdditionalService.create({
        //   name,
        //   image,
        //   description
        // });

        // res.status(201).json({
        //   status: 200,
        //   message: "Additional service added successfully",
        //   data: newService
        // });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Failed to add additional service",
            error: error.message
        });
    }
};

// 2. Get All Additional Services
const getAllAdditionalServices = async (req, res) => {
    try {
        const services = await AdditionalService.find()
        .populate("dealer_id", "shopName email")
        .sort({ id: -1 })

        res.status(200).json({
            status: 200,
            message: services.length > 0 ? "Success" : "No additional services found",
            data: services
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Failed to fetch additional services",
            error: error.message
        });
    }
};

// 3. Get Single Additional Service
const getAdditionalServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 400,
                message: "Invalid service ID format"
            });
        }

        const service = await AdditionalService.findById(id);

        if (!service) {
            return res.status(404).json({
                status: 404,
                message: "Additional service not found"
            });
        }

        res.status(200).json({
            status: 200,
            message: "Success",
            data: service
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Failed to fetch additional service",
            error: error.message
        });
    }
};

// 4. Update Additional Service
const updateAdditionalService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const image = req.file?.filename;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 400,
                message: "Invalid service ID format"
            });
        }

        const updateData = { name, description };
        if (image) updateData.image = image;

        const updatedService = await AdditionalService.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!updatedService) {
            return res.status(404).json({
                status: 404,
                message: "Additional service not found"
            });
        }

        res.status(200).json({
            status: 200,
            message: "Additional service updated successfully",
            data: updatedService
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Failed to update additional service",
            error: error.message
        });
    }
};

// 5. Delete Additional Service
const deleteAdditionalService = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 400,
                message: "Invalid service ID format"
            });
        }

        const deletedService = await AdditionalService.findByIdAndDelete(id);

        if (!deletedService) {
            return res.status(404).json({
                status: 404,
                message: "Additional service not found"
            });
        }

        res.status(200).json({
            status: 200,
            message: "Additional service deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Failed to delete additional service",
            error: error.message
        });
    }
};

// 6. Get Additional Services by Dealer ID
// Get Additional Services by Dealer ID with optional CC filter
const getAdditionalServicesByDealerId = async (req, res) => {
    try {
        const { dealerId } = req.params;
        const { cc } = req.query; // Get CC from query params

        if (!mongoose.Types.ObjectId.isValid(dealerId)) {
            return res.status(400).json({
                status: 400,
                message: "Invalid dealer ID format"
            });
        }

        // Build the query object
        const query = { dealer_id: dealerId };
        
        // Add CC filter if provided
        if (cc) {
            query['bikes.cc'] = Number(cc);
        }

        const services = await AdditionalService.find(query)
            .populate("dealer_id", "shopName email")
            .sort({ id: -1 });

        // Filter bikes array if CC was specified
        let result = services;
        if (cc) {
            result = services.map(service => ({
                ...service.toObject(),
                bikes: service.bikes.filter(bike => bike.cc === Number(cc))
            }));
        }

        res.status(200).json({
            status: 200,
            message: result.length > 0 ? "Success" : "No additional services found",
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Failed to fetch additional services",
            error: error.message
        });
    }
};

const saveSelectedServices = async (req, res) => {
  try {
    const { dealer_id, selected_services } = req.body;

    // Validate dealer_id
    if (!mongoose.Types.ObjectId.isValid(dealer_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dealer ID format"
      });
    }

    // Validate selected services
    if (!Array.isArray(selected_services) || selected_services.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one service"
      });
    }

    // Check if services exist
    const validServices = await AdditionalOptions.find({
      _id: { $in: selected_services }
    });

    if (validServices.length !== selected_services.length) {
      const invalidServices = selected_services.filter(
        id => !validServices.some(s => s._id.equals(id))
      );
      return res.status(400).json({
        success: false,
        message: "Some selected services are invalid",
        invalidServices
      });
    }

    // Update dealer with selected services
    const updatedDealer = await Dealer.findByIdAndUpdate(
      dealer_id,
      { $addToSet: { services: { $each: selected_services } } },
      { new: true }
    );

    if (!updatedDealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Services saved successfully",
      data: {
        dealer: updatedDealer.name,
        selectedServices: validServices.map(s => s.name)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save services",
      error: error.message
    });
  }
};

module.exports = {
    addAdditionalService,
    getAllAdditionalServices,
    getAdditionalServiceById,
    updateAdditionalService,
    deleteAdditionalService,
    getAdditionalServicesByDealerId,
    saveSelectedServices
};