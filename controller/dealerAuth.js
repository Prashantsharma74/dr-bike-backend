var validation = require('../helper/validation');
const otpAuth = require("../helper/otpAuth");
const Dealer = require('../models/Dealer');
const Vendor = require('../models/dealerModel');

async function sendOtp(req, res) {
  try {
    const { phone } = req.body;

    if (phone != '' || phone === null) {
      var userResm = await Dealer.findOne({ phone });

      if (userResm) {
        const data = await otpAuth.otp(phone)

        Dealer.findByIdAndUpdate({ _id: userResm._id },
          { otp: data.otp },
          { new: true },
          async function (err, docs) {
            if (err) {
              var response = {
                status: 201,
                message: err,
              };
              return res.status(201).send(response);
            }
            else {
              var response = {
                status: 200,
                message: 'OTP send successfully',
              };
              res.status(200)
                .json(response);
            }
          });
      } else {
        var response = {
          status: 201,
          message: 'Dealer not exist',
        };
        return res.status(201).send(response);
      }

    } else {
      var response = {
        status: 201,
        message: 'Phone No can not be empty value!',
      };
      return res.status(201).send(response);
    }
  } catch (error) {
    console.log("error", error);
    response = {
      status: 201,
      message: 'Operation was not successful',
    };
    return res.status(201).send(response);
  }
}

async function usersignin(req, res) {
  try {
    const { phone, ftoken, device_token } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required!'
      });
    }

    let dealer = await Vendor.findOne({ phone, isActive: true, isBlock: false });

    const otpData = await otpAuth.otp(phone);
    const otp = otpData.otp;

    if (!dealer) {
      dealer = new Vendor({
        phone,
        otp,
        ftoken,
        device_token,
        isActive: true,
        isVerify: false,
        isProfile: false,
        isDoc: false
      });
    } else {
      dealer.otp = otp;
      dealer.ftoken = ftoken;
      dealer.device_token = device_token;
      dealer.isActive = true;
    }

    await dealer.save();

    res.status(dealer.isNew ? 201 : 200).json({
      success: true,
      message: 'OTP sent to your mobile.',
      data: {
        phone: dealer.phone,
        isVerify: dealer.isVerify,
        isDoc: dealer.isDoc,
        isProfile: dealer.isProfile
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function verifyOTP(req, res) {
  try {
    const { otp, phone } = req.body;

    // Validate required fields
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Find dealer by phone only
    const dealer = await Vendor.findOne({ phone });

    // OTP validation (hardcoded 9999)
    if (otp !== '9999') {
      return res.status(401).json({
        success: false,
        message: 'Incorrect OTP'
      });
    }

    // If dealer doesn't exist, create new one
    if (!dealer) {
      const newDealer = new Vendor({
        phone,
        email: `user_${Date.now()}_${Math.floor(Math.random() * 10000)}@autogen.dr`,
        isVerify: false,
        isProfile: false,
        isDoc: false,
        isActive: true,
      });

      await newDealer.save();

      const token = validation.generateUserToken(newDealer._id, 'dealer', '2h');

      return res.status(201).json({
        success: true,
        message: 'New user created successfully',
        data: {
          dealer_id: newDealer._id,
          token,
          isNewUser: true,
          status: {
            isVerify: newDealer.isVerify,
            isDoc: newDealer.isDoc,
            isProfile: newDealer.isProfile
          }
        }
      });
    }

    // For existing dealer
    const token = validation.generateUserToken(dealer._id, 'dealer', '2h');
    const isNewUser = !dealer.isProfile || !dealer.isDoc || !dealer.isVerify;

    return res.status(200).json({
      success: true,
      message: isNewUser ? 'Signup in progress' : 'Login successful',
      data: {
        dealer_id: dealer._id,
        token,
        isNewUser,
        status: {
          isVerify: dealer.isVerify,
          isDoc: dealer.isDoc,
          isProfile: dealer.isProfile
        }
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      if (error.keyPattern.phone) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already registered'
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
}

async function changePassword(req, res) {
  try {
    const { phone, new_password, confirm_password } = req.body;

    const dealers = await Dealer.findOne({ phone }).select("+password");

    if (!dealers) {
      var response = {
        status: 201,
        message: 'Mobile no not exist',
      };
      return res.status(201).send(response);
    }

    if (validation.comparePassword(dealers.password, new_password)) {
      var response = {
        status: 201,
        message: 'New Password can not Same as Old Password',
      };
      return res.status(201).send(response);
    }

    if (new_password != confirm_password) {
      var response = {
        status: 201,
        message: 'Password Not Matched',
      };
      return res.status(201).send(response);
    }

    const datas = {
      password: validation.hashPassword(new_password)
    }

    var where = { _id: dealers._id };

    Dealer.findByIdAndUpdate(where,
      { $set: datas },
      { new: true },
      async function (err, docs) {
        if (err) {
          var response = {
            status: 201,
            message: err,
          };
          return res.status(201).send(response);
        }
        else {
          var response = {
            status: 200,
            message: 'Dealer Password Updated Successfully',
            // data: docs,
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

async function logout(req, res) {
  try {
    // res.clearCookie('refreshToken')
    res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
      .cookie("accessToken", null, { expires: new Date(Date.now()), httpOnly: true })
      .cookie("refreshToken", null, { expires: new Date(Date.now()), httpOnly: true })
      .cookie("authSession", null, { expires: new Date(Date.now()), httpOnly: true })
      .cookie("refreshTokenID", null, { expires: new Date(Date.now()), httpOnly: true })
      .json({
        success: true,
        message: "Logged out",
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

async function resendOtp(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const user = await Dealer.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otpData = await otpAuth.otp(phone);
    user.otp = otpData.otp;
    await user.save();

    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.getProgress = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id)
      .select("formProgress completionTimestamps");
    
    const nextStep = determineNextStep(vendor.formProgress.completedSteps);
    
    res.status(200).json({
      success: true,
      currentStep: vendor.formProgress.currentStep,
      nextStep,
      completedSteps: Object.fromEntries(vendor.formProgress.completedSteps),
      timestamps: vendor.completionTimestamps
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching progress",
      error: error.message 
    });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { section } = req.params;
    const validSections = ['basicInfo', 'locationInfo', 'shopDetails', 'documents', 'bankDetails'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid section" 
      });
    }

    const update = {
      [`formProgress.completedSteps.${section}`]: true,
      [`completionTimestamps.${section}`]: new Date(),
      "formProgress.lastActiveStep": getStepNumber(section),
      "formProgress.currentStep": getNextStepAfter(section)
    };

    await Vendor.findByIdAndUpdate(req.user._id, update);

    res.status(200).json({
      success: true,
      message: "Progress updated successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error updating progress",
      error: error.message 
    });
  }
};

exports.updateBasicInfo = async (req, res) => {
  try {
    const { fullName, personalEmail, phone, gender, dateOfBirth } = req.body;
    
    // Validate required fields
    if (!fullName || !personalEmail || !phone) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and phone are required"
      });
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.user._id,
      {
        fullName,
        personalEmail,
        phone,
        gender,
        dateOfBirth,
        "formProgress.completedSteps.basicInfo": true
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Basic info updated successfully",
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating basic info",
      error: error.message
    });
  }
};

exports.updateLocationInfo = async (req, res) => {
  try {
    const { address, city, state, pincode, latitude, longitude } = req.body;
    
    if (!address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Address, city, state, and pincode are required"
      });
    }

    await Vendor.findByIdAndUpdate(
      req.user._id,
      {
        address: { address, city, state, pincode },
        latitude,
        longitude,
        "formProgress.completedSteps.locationInfo": true
      }
    );

    res.status(200).json({
      success: true,
      message: "Location info updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating location info",
      error: error.message
    });
  }
};

exports.updateShopDetails = async (req, res) => {
  try {
    const { shopName, shopEmail, shopContact, holiday } = req.body;
    const shopImages = req.files.map(file => file.path);

    if (!shopName || !shopEmail || !shopContact) {
      return res.status(400).json({
        success: false,
        message: "Shop name, email, and contact are required"
      });
    }

    await Vendor.findByIdAndUpdate(
      req.user._id,
      {
        shopName,
        shopEmail,
        shopContact,
        holiday,
        shopImages,
        "formProgress.completedSteps.shopDetails": true
      }
    );

    res.status(200).json({
      success: true,
      message: "Shop details updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating shop details",
      error: error.message
    });
  }
};

exports.uploadDocuments = async (req, res) => {
  try {
    const files = req.files;
    const updates = {
      "documents.aadharFront": files.aadharFront?.[0]?.path,
      "documents.aadharBack": files.aadharBack?.[0]?.path,
      "documents.panCard": files.panCard?.[0]?.path,
      "documents.shopCertificate": files.shopCertificate?.[0]?.path,
      "formProgress.completedSteps.documents": true
    };

    await Vendor.findByIdAndUpdate(req.user._id, updates);

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error uploading documents",
      error: error.message
    });
  }
};

exports.updateBankDetails = async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;
    const passbookImage = req.file?.path;

    if (!accountHolderName || !accountNumber || !ifscCode || !bankName || !passbookImage) {
      return res.status(400).json({
        success: false,
        message: "All bank details and passbook image are required"
      });
    }

    await Vendor.findByIdAndUpdate(
      req.user._id,
      {
        bankDetails: { accountHolderName, accountNumber, ifscCode, bankName },
        "documents.passbookImage": passbookImage,
        "formProgress.completedSteps.bankDetails": true
      }
    );

    res.status(200).json({
      success: true,
      message: "Bank details updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating bank details",
      error: error.message
    });
  }
};

// Registration Submission & Status
exports.submitForApproval = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id);
    
    // Check if all sections are completed
    const allCompleted = Array.from(vendor.formProgress.completedSteps.values())
      .every(val => val === true);
    
    if (!allCompleted) {
      return res.status(400).json({
        success: false,
        message: "Please complete all sections before submitting"
      });
    }

    // Check if all required documents are uploaded
    if (!vendor.documents.aadharFront || !vendor.documents.panCard || !vendor.documents.passbookImage) {
      return res.status(400).json({
        success: false,
        message: "Please upload all required documents"
      });
    }

    vendor.registrationStatus = 'Pending';
    vendor.submittedAt = new Date();
    await vendor.save();

    // Notify admin
    await notifyAdmin(vendor._id);

    res.status(200).json({
      success: true,
      message: "Registration submitted for admin approval"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error submitting registration",
      error: error.message
    });
  }
};

exports.checkApprovalStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id)
      .select("registrationStatus adminNotes submittedAt approvedAt");
    
    res.status(200).json({
      success: true,
      status: vendor.registrationStatus,
      adminNotes: vendor.adminNotes,
      submittedAt: vendor.submittedAt,
      approvedAt: vendor.approvedAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking approval status",
      error: error.message
    });
  }
};

// Admin Endpoints
exports.getPendingRegistrations = async (req, res) => {
  try {
    const pendingVendors = await Vendor.find({ registrationStatus: 'Pending' })
      .select("shopName ownerName phone submittedAt");
    
    res.status(200).json({
      success: true,
      count: pendingVendors.length,
      vendors: pendingVendors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pending registrations",
      error: error.message
    });
  }
};

exports.getDealerDetails = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .select("-password -otp -otpExpiry");
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    res.status(200).json({
      success: true,
      vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vendor details",
      error: error.message
    });
  }
};

exports.approveDealer = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      {
        registrationStatus: 'Approved',
        approvedAt: new Date(),
        approvedBy: req.user._id,
        isActive: true
      },
      { new: true }
    );

    // Send approval notification
    await sendApprovalEmail(vendor);

    res.status(200).json({
      success: true,
      message: "Vendor approved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error approving vendor",
      error: error.message
    });
  }
};

exports.rejectDealer = async (req, res) => {
  try {
    const { notes } = req.body;
    
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      {
        registrationStatus: 'Rejected',
        adminNotes: notes
      },
      { new: true }
    );

    // Send rejection notification
    await sendRejectionEmail(vendor, notes);

    res.status(200).json({
      success: true,
      message: "Vendor rejected successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rejecting vendor",
      error: error.message
    });
  }
};

// Helper Functions
function determineNextStep(completedSteps) {
  const stepsOrder = ['basicInfo', 'locationInfo', 'shopDetails', 'documents', 'bankDetails'];
  for (const step of stepsOrder) {
    if (!completedSteps.get(step)) return step;
  }
  return null;
}

function getStepNumber(section) {
  const stepMap = {
    'basicInfo': 1,
    'locationInfo': 2,
    'shopDetails': 3,
    'documents': 4,
    'bankDetails': 5
  };
  return stepMap[section];
}

function getNextStepAfter(section) {
  const stepsOrder = ['basicInfo', 'locationInfo', 'shopDetails', 'documents', 'bankDetails'];
  const currentIndex = stepsOrder.indexOf(section);
  return currentIndex < stepsOrder.length - 1 ? getStepNumber(stepsOrder[currentIndex + 1]) : 5;
}

async function notifyAdmin(vendorId) {
  const admins = await Admin.find({ role: 'admin' }).select("email");
  const adminEmails = admins.map(admin => admin.email);
  
  await sendEmail({
    to: adminEmails,
    subject: 'New Vendor Registration Requires Approval',
    html: `<p>A new vendor registration requires your approval. 
           <a href="${process.env.ADMIN_PORTAL_URL}/vendors/${vendorId}">Review now</a></p>`
  });
}

async function sendApprovalEmail(vendor) {
  await sendEmail({
    to: vendor.personalEmail,
    subject: 'Your Vendor Account Has Been Approved',
    html: `<p>Congratulations! Your vendor account for ${vendor.shopName} has been approved.</p>`
  });
}

async function sendRejectionEmail(vendor, notes) {
  await sendEmail({
    to: vendor.personalEmail,
    subject: 'Your Vendor Registration Status',
    html: `<p>Your registration was rejected. Admin notes: ${notes}</p>`
  });
}

module.exports = {
  usersignin,
  sendOtp,
  verifyOTP,
  logout,
  changePassword,
  resendOtp,
  getProgress,
  updateProgress,
  updateBasicInfo,
  updateLocationInfo,
  checkApprovalStatus,
  getPendingRegistrations,
  submitForApproval,
  getDealerDetails,
  approveDealer,
  rejectDealer,
  updateBankDetails,
  uploadDocuments,
  updateShopDetails,
  submitForApproval,
  checkApprovalStatus
};