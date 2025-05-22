var validation = require("../helper/validation");
var helper = require("../helper/helper");
require("dotenv").config();
var moment = require("moment");
const employee = require("../models/employee_model");
const login = require("../models/login_model");
const jwt_decode = require("jwt-decode");


async function addemployee(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
      if (user_id == null || user_type != 1) {
      var response = {
        status: 401,
        message: "admin is un-authorised !",
      };
      return res.status(401).send(response);
    }
    if (req.body.email != "" && req.body.passwords != "") {
      var emailCheck = await login.findOne({ email: req.body.email });
      if (!emailCheck) {
        /*   if (req.files.profile_image != undefined || req.files.profile_image != null) {
                    var profile_image = req.files.profile_image[0].filename;
                } */
        const data = {
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          email: req.body.email,
          password: validation.hashPassword(req.body.password),
          phone: req.body.phone,
          state: req.body.state,
          city: req.body.city,
          address: req.body.address,
          pincode: req.body.pincode,
          latitude: req.body.latitude, 
          longitude: req.body.longitude,
          create_by: user_id,
        };
        // console.log("data: ", data);
        const employeeResposnse = await employee.create(data);
        if (employeeResposnse) {
          const logindata = {
            user_id: employeeResposnse._id,
            user_type: 2, //employee
            name: req.body.first_name,
            email: req.body.email,
            password: validation.hashPassword(req.body.password),
            phone: req.body.phone,
            state: req.body.state,
            city: req.body.city,
            address: req.body.address,
            pincode: req.body.pincode,
            latitude: req.body.latitude, 
            longitude: req.body.longitude,
            create_by: user_id,

          };
          const loginemployeedata = await login.create(logindata);
          var response = {
            status: 200,
            message: "Registration success",
            data: employeeResposnse,
          };
          return res.status(200).send(response);
        } else {
          var response = {
            status: 201,
            message: "Registration failed",
          };
          return res.status(201).send(response);
        }
      } else {
        var response = {
          status: 201,
          message: "Email already exist",
        };
        return res.status(201).send(response);
      }
    } else {
      var response = {
        status: 201,
        message: "email and password not be empty value !",
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


async function employeelist(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
      if (user_id == null || user_type != 1 && user_type != 4) {
      var response = {
        status: 401,
        message: "admin is un-authorised !",
      };
      return res.status(401).send(response);
    }
    var employeeResposnse = await employee.find().sort( { "_id": -1 } );
    // console.log('employeeResposnse: ', employeeResposnse);

    var response = {
      status: 200,
      message: "success",
      data: employeeResposnse,
      //employee_url: process.env.BASE_URL + '/employee',
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


async function singleemployee(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1 && user_type != 2) {
      var response = {
        status: 401,
        message: "admin is un-authorised !",
      };
      return res.status(401).send(response);
    }

    var employeeResposnse = await employee.findById(req.params.id)
    if(employeeResposnse){
            var response = {
                status: 200,
                message: 'success',
                data: employeeResposnse,
            };
            return res.status(200).send(response);
    }else{
            var response = {
                status: 201,
                message: 'No employee Found',
                data: [],
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


async function deleteemployee(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1) {
      var response = {
        status: 401,
        message: "Admin is un-authorised !",
      };
      return res.status(401).send(response);
    }
    
    const { employee_id } = req.body;
    const employeeRes = await employee.findOne({ _id: employee_id });
    if (employeeRes) {
      employee.findByIdAndDelete(
        { _id: employee_id },
        async function (err, docs) {
          if (err) {
            var response = {
              status: 201,
              message: "employee delete failed",
            };
            return res.status(201).send(response);
          } else {
            const result = await login.deleteOne({ user_id: employee_id });
            var response = {
              status: 200,
              message: "employee deleted successfully",
            };
            return res.status(200).send(response);
          }
        }
      );
    } else {
      var response = {
        status: 201,
        message: "employee not Available",
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


async function editemployee(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1 && user_type != 2) {
      var response = {
        status: 401,
        message: "Admin is un-authorised !",
      };
      return res.status(401).send(response);
    }
    const {
      employee_id,
      first_name,
      last_name,
      phone,
      state,
      city,
      address,
      pincode,
      latitude,
      longitude,
    } = req.body;
    //console.log("req.body: ", req.body);
    const employeeResp = await employee.findOne({ _id: employee_id });
    //console.log('employeeResp: ', employeeResp);
    if (employeeResp) {
      /*  if (req.files.patient_image != undefined || req.files.patient_image != null) {
                var patient_image = req.files.patient_image[0].filename;
            } else
               var patient_image = patientResp.image; */
      const data = {
        first_name: first_name,
        last_name: last_name,
        phone: phone,
        state: state,
        city: city,
        address: address,
        pincode: pincode,
        latitude: latitude, 
        longitude: longitude,
      };
      employee.findByIdAndUpdate(
        { _id: employee_id },
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
            var response = {
              status: 200,
              message: "employee updated successfully",
              data: docs,
              // _url: process.env.BASE_URL + '/employee',
            };
            return res.status(200).send(response);
          }
        }
      );
    } else {
      response = {
        status: 201,
        message: "employee not available",
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


module.exports = {
  addemployee,
  employeelist,
  singleemployee,
  deleteemployee,
  editemployee,
};
