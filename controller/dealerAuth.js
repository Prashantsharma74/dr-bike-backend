var validation = require('../helper/validation');
const otpAuth = require("../helper/otpAuth");
const Dealer = require('../models/Dealer');
const Vendor = require('../models/dealerModel');


//user_type = ( 2=dealer )
// async function usersignin(req, res) {
//   try {
//     const { phone, ftoken, device_token } = req.body;

//     if (!phone) {
//       return res.status(400).json({ success: false, message: 'Phone number is required!' });
//     }

//     // Check if dealer exists
//     let dealer = await Dealer.findOne({ phone, isBlock: false });

//     if (!dealer) {
//       // Dealer does not exist, create a new dealer
//       const otpData = await otpAuth.otp(phone);

//       dealer = new Dealer({
//         phone,
//         otp: otpData.otp,
//         ftoken,
//         device_token,
//         isVerify: false, // Assuming new dealers are unverified initially
//       });

//       await dealer.save();

//       return res.status(201).json({
//         success: true,
//         message: 'OTP sent to your mobile.',
//         dealer: {
//           phone: dealer.phone,
//           isVerify: dealer.isVerify,
//         },
//       });
//     }

//     // Dealer exists, generate OTP
//     const otpData = await otpAuth.otp(phone);

//     // Update dealer with new OTP and device token
//     dealer.otp = otpData.otp;
//     dealer.ftoken = ftoken;
//     dealer.device_token = device_token;
//     await dealer.save();

//     res.status(200).json({
//       success: true,
//       message: 'OTP sent to your mobile.',
//       dealer: {
//         phone: dealer.phone,
//         isVerify: dealer.isVerify,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// }




async function sendOtp(req, res) {
  try {
    const { phone } = req.body;

    if (phone != '' || phone === null) {
      var userResm = await Dealer.findOne({ phone });

      if (userResm) {
        // const optdata = {otp:1111} 
        const data = await otpAuth.otp(phone)


        Dealer.findByIdAndUpdate({ _id: userResm._id },
          { otp: data.otp },
          { new: true },
          async function (err, docs) {
            // const token = validation.generateUserToken(userResm._id, 'logged', 2)
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
                // token:token
              };
              res.status(200)
                // .cookie('accessToken', data.accessToken, {
                //     expires: new Date(new Date().getTime() + 60 * 1000),
                //     sameSite: 'strict',
                //     httpOnly: true
                // })
                // .cookie('refreshToken', data.refreshToken, {
                //     expires: new Date(new Date().getTime() + 31557600000),
                //     sameSite: 'strict',
                //     httpOnly: true
                // })
                // .cookie('authSession', true, { 
                //     expires: new Date(new Date().getTime() + 30 * 1000), 
                //     sameSite: 'strict' 
                // })
                // .cookie('refreshTokenID', true, {
                //     expires: new Date(new Date().getTime() + 31557600000),
                //     sameSite: 'strict'
                // })
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


// async function verifyOTP(req, res) {
//   try {
//     const { otp, phone } = req.body

//     const user = await Dealer.findOne({ phone: phone });
//     if (!user) {
//       res.status(401).json({ success: false, message: "This Mobile is not associated with any account" });
//       return;
//     }
// console.log(user,"user.isVerify")
//     if (otp == 9999 || user.phone == phone ) {
//       const token = validation.generateUserToken(user._id,'logged', 2)
//       user.save()
//         .then((data) => {
//           return res.status(200)

//             .json({ status: 200, msg: 'Dealer verified successfully', dealer_id:user._id, token: token, isVerify: user.isVerify});
//         })
//         .catch(error => {
//           return res.status(400).send({ verification: false, error, msg: 'Incorrect OTP' });
//         })
//     } else {
//       return res.status(400).send({ verification: false, msg: 'Incorrect OTP' });
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


// async function usersignin(req, res) {
//   try {
//     const { phone, ftoken, device_token } = req.body;

//     if (!phone) {
//       return res.status(200).json({ success: false, message: 'Phone number is required!' });
//     }

//     let dealer = await Vendor.findOne({ phone, isBlock: false });

//     if (!dealer) {
//       const otpData = await otpAuth.otp(phone);

//       dealer = new Dealer({
//         phone,
//         otp: otpData.otp,
//         ftoken,
//         device_token,
//         isVerify: false,
//       });
//       await dealer.save();

//       return res.status(201).json({
//         success: true,
//         message: 'OTP sent to your mobile. Awaiting admin verification.',
//         dealer: { phone: dealer.phone, isVerify: dealer.isVerify, isDoc: dealer.isDoc },
//       });
//     }

//     const otpData = await otpAuth.otp(phone);
//     dealer.otp = otpData.otp;
//     dealer.ftoken = ftoken;
//     dealer.device_token = device_token;
//     await dealer.save();

//     res.status(200).json({
//       success: true,
//       message: 'OTP sent to your mobile.',
//       dealer: { phone: dealer.phone, isVerify: dealer.isVerify, isDoc: dealer.isDoc },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// }

async function usersignin(req, res) {
  try {
    const { phone, ftoken, device_token } = req.body;

    // Validate required fields
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required!'
      });
    }

    // Find existing dealer or create new one
    let dealer = await Vendor.findOne({ phone, isActive: true, isBlock: false });

    // Generate OTP (in real implementation, this would send via SMS)
    const otpData = await otpAuth.otp(phone);
    const otp = otpData.otp;

    if (!dealer) {
      // Create minimal dealer document for new users
      dealer = new Vendor({
        phone,
        otp,
        ftoken,
        device_token,
        isActive: true, // Activate on first login
        isVerify: false,
        isProfile: false,
        isDoc: false
      });
    } else {
      // Update existing dealer's tokens and OTP
      dealer.otp = otp;
      dealer.ftoken = ftoken;
      dealer.device_token = device_token;
      dealer.isActive = true; // Ensure active on login
    }

    await dealer.save();

    // Return consistent response format for both new and existing users
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
    const { otp = 9999, phone } = req.body;
    const user = await Dealer.findOne({ phone });

    if (!user) {
      return res.status(200).json({ success: false, message: 'Mobile number not registered.' });
    }

    if (otp == 9999) {
      const token = validation.generateUserToken(user._id, 'logged', 2);
      return res.status(200).json({
        status: 200,
        message: 'Dealer verified successfully.',
        dealer_id: user._id,
        token: token,
        isVerify: user.isVerify,
        isDoc: user.isDoc,
        isShopDetailsAdded: user.isShopDetailsAdded,
        isProfile: user.isProfile,
        isDocumentsAdded: user.isDocumentsAdded,
        isDoc: user.isDoc

      });
    } else {
      return res.status(200).json({ verification: false, message: 'Incorrect OTP' });
    }
  } catch (error) {
    res.status(500).json({ status: 500, message: 'Operation was not successful' });
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

module.exports = {
  usersignin,
  sendOtp,
  verifyOTP,
  logout,
  changePassword,
  resendOtp
};