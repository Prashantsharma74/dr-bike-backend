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

module.exports = {
    addAdditionalService,
    getAllAdditionalServices,
    getAdditionalServiceById,
    updateAdditionalService,
    deleteAdditionalService
};