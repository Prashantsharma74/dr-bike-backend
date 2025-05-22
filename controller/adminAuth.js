const path = require('path');
const fs = require('fs');
var validation = require('../helper/validation');
require('dotenv').config();

const admin = require('../models/admin_model');
var bcrypt = require('bcryptjs');
const jwt_decode = require("jwt-decode");
const Role = require("../models/Roles_modal")
const otpAuth = require("../helper/otpAuth");
const { getRoleCode, generateRandomSuffix } = require('../helper/helper');


//user_type = (1=admin, 2=admin,3=subAdmin 4=customer )
// Admin Signup
async function suadminsignup(req, res) {
  try {
    const { name, email, password, mobile } = req.body;

    let user = await admin.findOne({ email });

    if (user) {
      res.status(400).json({
        success: false,
        message: "Email Already Exists"
      });
      return;
    }

    user = await admin.findOne({ mobile });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "Mobile Number Already Exists"
      });
    }

    user = await admin({
      name,
      email,
      password,
      mobile,
      role: "Admin",
    });

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);

    // now we set user password to hashed password
    user.password = await bcrypt.hash(user.password, salt);

    user.save();

    res.status(200).json({
      status: 200,
      success: true,
      message: " Admin Created Successfully"
    });

  } catch (error) {
    response = {
      status: 201,
      message: 'Operation was not successful',
      Error: error
    };
    return res.status(201).send(response);
  }
}


// Assuming you have already set up Express.js and Mongoose

// POST endpoint to add a new role
const AdminPermission = async (req, res) => {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    if (user_id == null || user_type != 1) {
      if (user_type === 3) {
        var response = {
          status: 201,
          message: "SubAdmin is un-authorised !",
        };
        return res.status(201).send(response);
      }
    }
    // Extract permissions data from the request body
    const { permissions } = req.body;

    // Extract subadmin ID from URL params
    const subAdminId = req.params.id;

    // Check if the role already exists for the given subadmin ID
    const existingRole = await Role.findOne({ subAdmin: subAdminId });
    if (existingRole) {
      return res.status(400).json({ error: "Role already exists for this subadmin" });
    }

    // Create a new role instance
    const newRole = new Role({
      permissions,
      subAdmin: subAdminId // Assign the subadmin ID to the role
    });

    // Save the new role to the database
    await newRole.save();

    // Return success response
    res.status(201).json({ message: "Role created successfully", role: newRole });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


const updateAdminPermission = async (req, res) => {
  try {
    // Check authorization
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    if (user_id == null || user_type !== 1) {
      if (user_type === 3) {
        return res.status(403).json({ error: "SubAdmin is unauthorized" });
      } else {
        return res.status(403).json({ error: "Unauthorized access" });
      }
    }

    // Extract permissions data from the request body
    const { permissions } = req.body;

    const subAdminId = req.params.id;

    const existingRole = await Role.findOne({ subAdmin: subAdminId });
    if (!existingRole) {
      return res.status(404).json({ error: "Role not found for this subadmin" });
    }

    existingRole.permissions = permissions;

    await existingRole.save();

    // Return success response
    res.status(200).json({ message: "Role updated successfully", role: existingRole });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//user_type = (1=admin, 2=admin, 4=customer )
async function suadminLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(201).json({
      status: 201,
      message: 'Email and password cannot be empty!',
    });
  }

  try {
    const userRes = await admin.findOne({ email }).select("+password");
    if (!userRes) {
      return res.status(201).json({
        status: 201,
        message: 'Email does not exist',
      });
    }

    if (validation.comparePassword(userRes.password, password)) {
      // Admin login, no OTP needed
      if (userRes.role === "Admin") {
        const token = validation.generateUserToken(userRes._id, 'logged', 1);
        return res.status(200).cookie("token", token, {
          expires: new Date(Date.now() + 60000 * 24 * 60 * 60 * 1000),
          httpOnly: true,
        }).json({
          status: 200,
          message: 'Admin login successful',
          token,
        });
      }

      console.log(userRes.role, "user")
      // SubAdmin login, send OTP
      if (userRes.role === "SubAdmin") {
        const otpData = await otpAuth.otp(userRes.mobile); // Assuming otpAuth.otp sends OTP and returns data
        if (!otpData || !otpData.otp) {
          return res.status(201).json({
            status: 500,
            message: 'Failed to generate OTP'
          });
        }

        // Save the OTP to the user's record in the database
        userRes.otp = otpData.otp;
        await userRes.save();
        return res.status(200).json({
          status: 200,
          message: 'OTP sent successfully for SubAdmin',
          mobile: userRes.mobile
        });
      }

      // If user type is not recognized
      return res.status(400).json({
        status: 400,
        message: 'User type not supported for login',
      });
    } else {
      return res.status(201).json({
        status: 201,
        message: 'Incorrect password',
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: 500,
      message: 'Login failed. Please try again.',
    });
  }
}


async function verifyOtpAdmin(req, res) {
  try {
    const { otp, mobile } = req.body;

    const adminUser = await admin.findOne({ mobile });
    console.log(adminUser, "userss")
    if (!adminUser) {
      return res.status(404).json({
        status: 404,
        message: "This mobile number is not associated with any admin account",
      });
    }

    // Check if the OTP matches for SubAdmin
    // if (adminUser.role === "SubAdmin" && otp === otp) {
    if (adminUser.role === "SubAdmin" && otp === 1234) {
      const token = validation.generateUserToken(adminUser._id, 'logged', 2);
      return res.status(200)
        .cookie("token", token, {
          expires: new Date(Date.now() + 60000 * 24 * 60 * 60 * 1000),
          sameSite: 'strict',
          httpOnly: true,
        })
        .json({
          status: 200,
          message: 'SubAdmin verified successfully',
          admin_id: adminUser._id,
          token: token,
        });
    } else {
      return res.status(400).json({
        status: 400,
        message: 'Incorrect OTP',
      });
    }
  } catch (error) {
    console.error("Error in verifyOtpAdmin:", error);
    return res.status(500).json({
      status: 500,
      message: 'Operation was not successful',
    });
  }
}

// Register SubAdmin
async function subadminsignup(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    if (user_id == null || user_type != 1) {
      if (user_type === 3) {
        var response = {
          status: 403,
          message: "SubAdmin is un-authorised !",
        };
        return res.status(201).send(response);
      } else {
        var response = {
          status: 403,
          message: "Admin is un-authorised !",
        };
        return res.status(401).send(response);
      }
    }

    const { name, email, password, image, mobile, role } = req.body;
    const roleCode = getRoleCode(role);
    const randomSuffix = generateRandomSuffix(6);
    const employeeId = `${roleCode}${randomSuffix}`;

    let user = await admin.findOne({ email });

    if (user) {
      res.status(400).json({
        success: false,
        message: "Email Already Exists"
      });
      return;
    }

    user = await admin.findOne({ mobile });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "Mobile Number Already Exists"
      });
    }

    user = await admin({
      name,
      email,
      password,
      image,
      mobile,
      role,
      employeeId: employeeId
    });

    console.log(user, "user")
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);

    // now we set user password to hashed password
    user.password = await bcrypt.hash(user.password, salt);
    // user.save();

    await user.save()
      .then(async savedUser => {
        const userId = savedUser._id;
        const newRole = new Role({
          subAdmin: savedUser._id
        });
        await newRole.save();
        console.log("User created with ID:", userId);
        // Now you can use userId wherever you need it
      })
      .catch(err => {
        console.error("Error saving user:", err);
      });

    res.status(200).json({
      status: 200,
      success: true,
      message: "Sub Admin Created Successfully"
    });

  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({
      status: 500,
      message: 'Operation was not successful',
      error: error.message || error
    });
  }
}

async function getAllAdmin(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1 && user_type != 3) {
      var response = {
        status: 401,
        message: "Admin is un-authorised !",
      };
      return res.status(401).send(response);
    }

    const admins = await admin.find(req.query).sort({ "_id": -1 });

    var response = {
      status: 200,
      message: "success",
      data: admins,
    };
    return res.status(200).send(response);

  } catch (error) {
    response = {
      status: 201,
      message: 'Operation was not successful',
      Error: error
    };
    return res.status(201).send(response);
  }
}



async function deleteAdmin(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;

    if (user_id == null || user_type != 1) {
      if (user_type === 3) {
        var response = {
          status: 201,
          message: "SubAdmin is un-authorised !",
        };
        return res.status(201).send(response);
      } else {
        var response = {
          status: 401,
          message: "Admin is un-authorised !",
        };
        return res.status(401).send(response);
      }
    }

    const { admin_id } = req.body;
    const adminRes = await admin.findById(admin_id);

    if (adminRes.role === "Admin") {
      var response = {
        status: 201,
        message: "You Can't Delete Super Admin",
      };

      return res.status(201).send(response);
    }

    if (!adminRes) {
      var response = {
        status: 201,
        message: "Admin Not Found",
      };

      return res.status(201).send(response);
    }

    admin.findByIdAndDelete(
      { _id: admin_id },
      async function (err, docs) {
        if (err) {
          var response = {
            status: 201,
            message: "Admin delete failed",
          };
          return res.status(201).send(response);
        } else {

          var response = {
            status: 200,
            message: "Admin deleted successfully",
          };
          return res.status(200).send(response);
        }
      }
    );

  } catch (error) {
    response = {
      status: 201,
      message: 'Operation was not successful',
      Error: error
    };
    return res.status(201).send(response);
  }
}

function deleteFile(filePath) {
  try {
    fs.unlinkSync(path.join(__dirname, '..', filePath));
    console.log('File deleted successfully');
  } catch (err) {
    console.error('Error deleting file', err);
  }
}

async function updateProfilePicture(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { filename } = req.file;
    console.log(filename);

    const adminData = await admin.findById(user_id);

    if (!adminData) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (adminData.image) {
      deleteFile(adminData.image);
    }

    adminData.image = filename;
    await adminData.save();

    res.status(200).json({ message: 'Profile picture updated successfully', data: adminData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


async function getProfilePicture(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;

    const adminData = await admin.findById(user_id);

    if (!adminData) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (!adminData.image) {
      return res.status(404).json({ message: 'Admin profile image not found' });
    }

    res.status(200).json({ image: adminData.image });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const changePassword = async (req, res) => {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const { newPassword, newEmail } = req.body;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const updatedAdmin = await admin.findOneAndUpdate(
      { _id: req.params.id },
      { password: hashedPassword, email: newEmail },
      { new: true }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ status: 404, message: 'Admin not found' });
    }

    res.status(200).json({
      status: 200,
      data: updatedAdmin,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

async function singleadmin(req, res) {
  try {

    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;

    var adminResposnse = await admin.findById(req.params.id).select('+password');
    var AdminRole = await Role.findOne({ subAdmin: user_id });
    // console.log(AdminRole.permissions.Admin.read)
    if (adminResposnse) {
      var response = {
        status: 200,
        message: "success",
        data: adminResposnse,
        permission: AdminRole?.permissions?.Admin?.read
      };
      return res.status(200).send(response);
    }

    else {
      var response = {
        status: 404,
        message: "No admin Found",
      };
      return res.status(201).send(response);
    }
  } catch (error) {
    console.log("error", error);
    response = {
      status: 500,
      message: "Operation was not successful",
    };
    return res.status(500).send(response);
  }
}


const getSingleRole = async (req, res) => {
  try {
    // Check authorization
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    if (user_id == null || user_type !== 1) {
      if (user_type === 3) {
        return res.status(403).json({ error: "SubAdmin is unauthorized" });
      } else {
        return res.status(403).json({ error: "Unauthorized access" });
      }
    }

    // Extract subadmin ID from URL params
    const subAdminId = req.params.id;

    // Find the role based on subadmin ID
    const role = await Role.findOne({ subAdmin: subAdminId }).populate({ path: 'subAdmin', select: ['name'] });
    if (!role) {
      return res.status(404).json({ error: "Role not found for this subadmin" });
    }

    // Return the role information in the response
    res.status(200).json({ role });
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};





module.exports = {
  suadminLogin,
  subadminsignup,
  suadminsignup,
  getAllAdmin,
  deleteAdmin,
  updateProfilePicture,
  getProfilePicture,
  changePassword,
  singleadmin,
  AdminPermission,
  updateAdminPermission,
  getSingleRole,
  // sendOtpAdmin,
  verifyOtpAdmin


};