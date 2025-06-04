const service = require("../models/service_model");
const jwt_decode = require("jwt-decode");
const adminservices = require("../models/adminService");
const mongoose = require("mongoose");

async function servicelist(req, res) {
  try {
    const services = await service
      .find()
      .populate("dealer_id", "name email")
      .sort({ id: -1 });

    return res.status(200).send({
      status: 200,
      message: services.length > 0 ? "Success" : "No services available",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}


async function singleService(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(200).send({ status: 400, message: "Service ID is required!" });
    }

    const serviceData = await service.findById(id).populate("dealer_id", "name email");
    return res.status(200).send({
      status: 200,
      message: serviceData ? "Success" : "Service not found!",
      data: serviceData || {},
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}


async function updateService(req, res) {
  try {
    const { service_id, name, description, dealer_id, bikes } = req.body;
    if (!service_id || !name || !dealer_id) {
      return res.status(200).send({ status: 400, message: "Service ID, name, and dealer ID are required!" });
    }

    let parsedBikes = [];
    if (bikes) {
      try {
        parsedBikes = JSON.parse(bikes);
      } catch (error) {
        return res.status(200).send({ status: 400, message: "Invalid bikes data format!" });
      }
    }

    const updateData = { name, description, dealer_id };
    if (req.file) {
      updateData.image = req.file.filename;
    }
    if (parsedBikes.length > 0) {
      updateData.bikes = parsedBikes;
    }

    const updatedService = await service.findByIdAndUpdate(service_id, updateData, { new: true });
    return res.status(200).send({
      status: 200,
      message: updatedService ? "Service updated successfully" : "Service not found!",
      data: updatedService || {},
    });
  } catch (error) {
    console.error("Error updating service:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}


async function deleteService(req, res) {
  try {
    const { service_id } = req.body;
    if (!service_id) {
      return res.status(200).send({ status: 400, message: "Service ID is required!" });
    }

    const deletedService = await service.findByIdAndDelete(service_id);
    return res.status(200).send({
      status: 200,
      message: deletedService ? "Service deleted successfully" : "Service not found!",
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}


async function getServicesByDealer(req, res) {
  try {
    const { dealer_id } = req.params;

    if (!dealer_id) {
      return res.status(200).send({ status: 400, message: "Dealer ID is required!" });
    }

    const services = await service.find({ dealer_id }).populate("dealer_id", "name email");

    return res.status(200).send({
      status: 200,
      message: services.length > 0 ? "Success" : "No services found for this dealer",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services by dealer:", error);
    return res.status(200).send({ status: 500, message: "Internal Server Error" });
  }
}


async function addAdminService(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    if (!user_id) {
      return res.status(401).send({ status: false, message: "Unauthorized!" });
    }

    const { name, description } = req.body;
    if (!req.file || !name) {
      return res.status(400).send({ status: false, message: "Name and image are required!" });
    }

    const newService = await adminservices.create({
      name,
      image: req.file.filename,
      description,
    });

    return res.status(200).send({
      status: true,
      message: "Admin service created successfully",
      data: newService,
    });
  } catch (error) {
    console.error("Error adding admin service:", error);
    return res.status(500).send({ status: false, message: "Internal Server Error" });
  }
}

async function listAdminServices(req, res) {
  try {
    const services = await adminservices.find().sort({ id: -1 });

    return res.status(200).send({
      status: true,
      message: services.length ? "Success" : "No services found",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching admin services:", error);
    return res.status(500).send({ status: false, message: "Internal Server Error" });
  }
}

// By Prashant 

async function addservice(req, res) {
  try {
    const { name, description, dealer_id, bikes } = req.body;

    // Validate: name
    if (!name || name.trim() === "") {
      return res.status(200).send({
        status: 400,
        message: "Service name is required.",
        field: "name",
      });
    }

    // Validate: dealer_id
    if (!dealer_id || !mongoose.Types.ObjectId.isValid(dealer_id)) {
      return res.status(200).send({
        status: 400,
        message: "Valid dealer ID is required.",
        field: "dealer_id",
      });
    }

    // Validate and parse bikes
    let parsedBikes = [];

    if (!bikes) {
      return res.status(200).send({
        status: 400,
        message: "Bikes field is required.",
        field: "bikes",
      });
    }

    try {
      if (typeof bikes === "string") {
        if (bikes.trim() === "") {
          return res.status(200).send({
            status: 400,
            message: "Bikes field is required.",
            field: "bikes",
          });
        }
        parsedBikes = JSON.parse(bikes);
      } else {
        parsedBikes = bikes;
      }

      if (!Array.isArray(parsedBikes) || parsedBikes.length === 0) {
        return res.status(200).send({
          status: 400,
          message: "Bikes must be a non-empty array.",
          field: "bikes",
        });
      }

      for (let i = 0; i < parsedBikes.length; i++) {
        const bike = parsedBikes[i];

        // Convert to numbers
        bike.cc = Number(bike.cc);
        bike.price = Number(bike.price);

        if (
          isNaN(bike.cc) ||
          isNaN(bike.price)
        ) {
          return res.status(200).send({
            status: 400,
            message: `Bike at index ${i} must have numeric 'cc' and 'price' values.`,
            field: "bikes",
          });
        }
      }
    } catch (err) {
      return res.status(200).send({
        status: 400,
        message: "Invalid bikes format. Must be JSON array.",
        field: "bikes",
      });
    }

    // Handle image
    const image = req.file?.filename || ""; // multer will save image file

    // Create service
    const newService = await service.create({
      name: name.trim(),
      description: description?.trim() || "",
      image,
      dealer_id,
      bikes: parsedBikes,
    });

    return res.status(200).send({
      status: 200,
      message: "Service added successfully",
      data: newService,
    });
  } catch (error) {
    console.error("Error adding service:", error);
    return res.status(200).send({
      status: 500,
      message: "Internal Server Error",
    });
  }
}


module.exports = {
  addservice,
  servicelist,
  singleService,
  updateService,
  deleteService,
  getServicesByDealer,
  addAdminService,
  listAdminServices
};