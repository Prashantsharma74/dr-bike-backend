require("dotenv").config();
const bikeModel = require("../models/bikeModel");
// const bikemodel = require('../models/bikeModel');
const jwt_decode = require("jwt-decode");
const Role = require('../models/Roles_modal')
const Admin = require('../models/admin_model')
const BikeVariant = require("../models/bikeVariantModel");
const BikeModel = require("../models/bikeModel");
const BikeCompany = require("../models/bikeCompanyModel");

async function checkPermission(user_id, requiredPermission) {
  try {
    const userRole = await Role.findOne({ subAdmin: user_id });
    console.log(userRole, "1")
    if (!userRole) {
      return false;
    }
    const permissions = userRole.permissions;
    console.log(permissions, "2")

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


async function addBike(req, res) {
  // created by  store or vendor
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 3 && user_type != 1) {
      var response = {
        status: 401,
        message: "admin is un-authorised !",
      };
      return res.status(401).send(response);
    }

    const { name, model, bike_cc } = req.body;

    // var image = req.files.image[0].filename;
    // const userdetail = await admin.findOne({_id:user_id});

    const bikes = await bikeModel.aggregate([
      {
        $match: {
          "$and": [
            {
              model: model,
            },
            {
              bike_cc: parseInt(bike_cc),
            }
          ]
        }
      }
    ])

    if (bikes.length > 0) {
      var response = {
        status: 201,
        message: "Bike is Already Added",
      };
      return res.status(201).send(response);
    }

    const datas = {
      name: name,
      model: model,
      bike_cc: bike_cc
    };

    const bikeRes = await bikeModel.create(datas);

    if (bikeRes) {
      var response = {
        status: 200,
        message: "Vehicle added successfully",
        data: bikeRes,
      };
      return res.status(200).send(response);

    } else {
      var response = {
        status: 201,
        message: "Unable to add Vehicle",
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


async function bikeList(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1 && user_type != 3 && user_type != 4) {
      var response = {
        status: 401,
        message: "admin is un-authorised !",
      };
      return res.status(401).send(response);
    }

    // var bikeRes = await bikeModel.find({}).sort({ "_id": -1 });
    var bikeRes = await bikeModel.find({}).sort({ model: 1 })

    if (bikeRes.length > 0) {
      var response = {
        status: 200,
        message: "success",
        data: bikeRes,
      };
      return res.status(200).send(response);
    } else {
      var response = {
        status: 201,
        data: [],
        message: "No Vehicle Found",
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


// async function deleteBike(req, res) {
//   try {
//     const data = jwt_decode(req.headers.token);
//     const user_id = data.user_id;
//     const user_type = data.user_type;
//     const type = data.type;
//     if (user_id == null || user_type != 1) {

//       if (user_type === 3) {
//         const subAdmin = await Admin.findById(user_id)

//         if (!subAdmin) {
//           var response = {
//             status: 401,
//             message: "Subadmin not found!",
//           };
//           return res.status(401).send(response);
//         }

//         if (user_type === 3) {
//           const subAdmin = await Admin.findById(user_id)

//           if (!subAdmin) {
//             var response = {
//               status: 401,
//               message: "Subadmin not found!",
//             };
//             return res.status(401).send(response);
//           }
//         }

//         const isAllowed = await checkPermission(user_id, "Bikes.delete");

//         if (!isAllowed) {
//           var response = {
//             status: 401,
//             message: "Subadmin does not have permission to delete Bikes!",
//           };
//           return res.status(401).send(response);
//         }

//       }

//     }

//     const { bike_id } = req.body;
//     const bikeRes = await bikeModel.findOne({ id: bike_id });
//     if (bikeRes) {
//       bikeModel.findOneAndDelete({ id: bike_id }, async function (err, docs) {
//         if (err) {
//           var response = {
//             status: 201,
//             message: "Vehicle delete failed",
//           };
//           return res.status(201).send(response);
//         } else {
//           var response = {
//             status: 200,
//             message: "vehicle deleted successfully",
//           };
//           return res.status(200).send(response);
//         }
//       });
//     } else {
//       var response = {
//         status: 201,
//         message: "vehicle not Found",
//       };
//       return res.status(201).send(response);
//     }
//   } catch (error) {
//     console.log("error", error);
//     response = {
//       status: 201,
//       message: "Operation was not successful",
//     };
//     return res.status(201).send(response);
//   }
// }


async function deleteBike(req, res) {
  try {
    const user_id = req.params.user_id; // get user id from params
    if (!user_id) {
      return res.status(400).json({ status: 400, message: "User ID is required" });
    }

    // Check if user is sub-admin
    const subAdmin = await Admin.findById(user_id);
    if (!subAdmin) {
      return res.status(404).json({ status: 404, message: "Subadmin not found" });
    }

    // Check permission
    const isAllowed = await checkPermission(user_id, "Bikes.delete");
    if (!isAllowed) {
      return res.status(403).json({ status: 403, message: "You do not have permission to delete Bikes" });
    }

    const { bike_id } = req.body;
    if (!bike_id) {
      return res.status(400).json({ status: 400, message: "Bike ID is required" });
    }

    const bike = await BikeModel.findById(bike_id);
    if (!bike) {
      return res.status(404).json({ status: 404, message: "Bike not found" });
    }

    await BikeModel.findByIdAndDelete(bike_id);

    return res.status(200).json({ status: 200, message: "Bike deleted successfully" });
  } catch (error) {
    console.error("Error deleting bike:", error);
    return res.status(500).json({ status: 500, message: "Operation was not successful" });
  }
}



async function editBike(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1) {

      if (user_type === 3) {
        const subAdmin = await Admin.findById(user_id)

        if (!subAdmin) {
          var response = {
            status: 401,
            message: "Subadmin not found!",
          };
          return res.status(401).send(response);
        }

        if (user_type === 3) {
          const subAdmin = await Admin.findById(user_id)

          if (!subAdmin) {
            var response = {
              status: 401,
              message: "Subadmin not found!",
            };
            return res.status(401).send(response);
          }
        }

        const isAllowed = await checkPermission(user_id, "Bikes.update");

        if (!isAllowed) {
          var response = {
            status: 401,
            message: "Subadmin does not have permission to add Bikes!",
          };
          return res.status(401).send(response);
        }

      }

    }
    const { name, model, bike_cc, extra_charges } = req.body;


    const bike_id = req.params.id;
    const bikeResult = await bikeModel.findById(bike_id);

    if (bikeResult != null) {

      const data = {
        name: name,
        model: model,
        extra_charges: extra_charges,
        bike_cc: bike_cc,
      };

      bikeModel.findByIdAndUpdate(
        { _id: bike_id },
        { $set: data },
        { new: true },
        async function (err, docs) {
          if (err) {
            var response = {
              status: 201,
              message: err,
            };
            return res.status(201).send(response);
          } else {
            // const bikeRes = await bikeModel.findOne({ _id: bike_id });
            var response = {
              status: 200,
              message: "Vehicle updated successfully",
              data: docs,
            };
            return res.status(200).send(response);
          }
        }
      );
    } else {
      response = {
        status: 201,
        message: "Vehicle not available",
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


async function getBike(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 4 && user_type != 1 && user_type != 3 && user_type != 2) {
      var response = {
        status: 401,
        message: "admin is un-authorised !",
      };
      return res.status(401).send(response);
    }

    var bikeRes = await bikeModel.findById(req.params.id);
    if (!bikeRes) {
      var response = {
        status: 201,
        message: "No Bike Found",
      };
      return res.status(201).send(response);
    }
    var response = {
      status: 200,
      message: "success",
      data: bikeRes,
    };
    return res.status(200).send(response);
  } catch (error) {
    console.log("error", error);
    response = {
      status: 201,
      message: "Operation was not successful",
    };

    return res.status(201).send(response);
  }
}

// const addBikeCompany = async (req, res) => {
//   try {
//     const { name } = req.body;

//     if (!name) {
//       return res.status(200).json({ status: 200, message: "Bike company name is required!", data: [] });
//     }

//     const existingCompany = await BikeCompany.findOne({ name });

//     if (existingCompany) {
//       return res.status(200).json({ status: 200, message: "Bike company already exists!", data: [] });
//     }

//     const newCompany = new BikeCompany({ name });
//     await newCompany.save();

//     res.status(200).json({ status: 200, message: "Bike company added successfully", data: newCompany });

//   } catch (error) {
//     console.error("Error adding bike company:", error);
//     res.status(500).json({ status: 500, message: "Internal Server Error", data: [] });
//   }
// };

const addBikeCompany = async (req, res) => {
  try {
    let { name } = req.body;

    if (!name) {
      return res.status(200).json({
        status: 200,
        message: "Bike company name is required!",
        data: [],
      });
    }

    name = name.trim().toUpperCase(); // Normalize to uppercase

    const existingCompany = await BikeCompany.findOne({ name });

    if (existingCompany) {
      return res.status(200).json({
        status: 200,
        message: "Bike company already exists!",
        data: [],
      });
    }

    const newCompany = new BikeCompany({ name });
    await newCompany.save();

    res.status(200).json({
      status: 200,
      message: "Bike company added successfully",
      data: newCompany,
    });

  } catch (error) {
    console.error("Error adding bike company:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: [],
    });
  }
};

const addBikeModel = async (req, res) => {
  try {
    const { company_id, model_name } = req.body;

    if (!company_id || !model_name) {
      return res.status(200).json({
        status: 200,
        message: "company_id and model_name are required!",
        data: [],
      });
    }

    const normalizedModelName = model_name.trim().toUpperCase();

    // Check if model already exists for the same company (case-insensitive)
    const existingModel = await BikeModel.findOne({
      company_id,
      model_name: normalizedModelName,
    });

    if (existingModel) {
      return res.status(200).json({
        status: 200,
        message: "Bike model already exists for this company!",
        data: [],
      });
    }

    const newModel = new BikeModel({
      company_id,
      model_name: normalizedModelName,
    });

    await newModel.save();

    res.status(200).json({
      status: 200,
      message: "Bike model added successfully",
      data: newModel,
    });
  } catch (error) {
    console.error("Error adding bike model:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      data: [],
    });
  }
};

const addBikeVariant = async (req, res) => {
  try {
    const { model_id, variant_name, engine_cc } = req.body;

    if (!model_id || !variant_name || !engine_cc) {
      return res.status(200).json({ status: 200, message: "model_id, variant_name, and engine_cc are required!", data: [] });
    }

    const newVariant = new BikeVariant({ model_id, variant_name, engine_cc });
    await newVariant.save();

    res.status(200).json({ status: 200, message: "Bike variant added successfully", data: newVariant });

  } catch (error) {
    console.error("Error adding bike variant:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error", data: [] });
  }
}

const getBikeCompanies = async (req, res) => {
  try {
    const companies = await BikeCompany.find().sort({ name: 1 });

    if (!companies.length) {
      return res.status(200).json({ status: 200, message: "No bike companies found!", data: [] });
    }

    res.status(200).json({ status: 200, message: "Bike companies retrieved successfully!", data: companies });

  } catch (error) {
    console.error("Error fetching bike companies:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error", data: [] });
  }
};

const getBikeModels = async (req, res) => {
  try {
    const { company_id } = req.params;

    if (!company_id) {
      return res.status(200).json({ status: 200, message: "company_id is required!", data: [] });
    }

    const models = await BikeModel.find({ company_id }).sort({ model_name: 1 });

    if (!models.length) {
      return res.status(200).json({ status: 200, message: "No models found for this company!", data: [] });
    }

    res.status(200).json({ status: 200, message: "Bike models retrieved successfully!", data: models });

  } catch (error) {
    console.error("Error fetching bike models:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error", data: [] });
  }
};


const getBikeVariants = async (req, res) => {
  try {
    const { model_id } = req.params;

    if (!model_id) {
      return res.status(200).json({ status: 200, message: "model_id is required!", data: [] });
    }

    const variants = await BikeVariant.find({ model_id }).sort({ engine_cc: 1 });

    if (!variants.length) {
      return res.status(200).json({ status: 200, message: "No variants found for this model!", data: [] });
    }

    res.status(200).json({ status: 200, message: "Bike variants retrieved successfully!", data: variants });

  } catch (error) {
    console.error("Error fetching bike variants:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error", data: [] });
  }
};

// const getAllBikes = async (req, res) => {
//   try {
//     const companies = await BikeCompany.find().lean();

//     const bikesData = await Promise.all(
//       companies.map(async (company) => {
//         const models = await BikeModel.find({ company_id: company._id }).lean();

//         const modelsWithVariants = await Promise.all(
//           models.map(async (model) => {
//             const variants = await BikeVariant.find({ model_id: model._id }).lean();
//             return { ...model, variants };
//           })
//         );

//         return { ...company, models: modelsWithVariants };
//       })
//     );

//     res.status(200).json({ status: 200, message: "All bikes retrieved successfully", data: bikesData });
//   } catch (error) {
//     console.error("Error fetching bikes:", error);
//     res.status(500).json({ status: 500, message: "Internal Server Error", data: [] });
//   }
// };

const getAllBikes = async (req, res) => {
  try {
    // const companies = await BikeCompany.find()
    //   .populate({
    //     path: "models",
    //     populate: {
    //       path: "variants",
    //     },
    //   })
    //   .lean();

    const companies = await BikeCompany.find()
      .populate({
        path: "models",
        select: "model_name",
        populate: {
          path: "variants",
          select: "variant_name engine_cc",
        },
      })
      .lean();

    res.status(200).json({
      status: 200,
      message: "All bikes retrieved successfully",
      data: companies,
    });
  } catch (error) {
    console.error("Error fetching bikes:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error", data: [] });
  }
};


module.exports = {
  addBike,
  bikeList,
  deleteBike,
  editBike,
  getBike,
  addBikeCompany,
  addBikeModel,
  addBikeVariant,
  getBikeVariants,
  getBikeModels,
  getBikeCompanies,
  getAllBikes,

};
