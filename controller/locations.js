var validation = require("../helper/validation");
var helper = require("../helper/helper");
require("dotenv").config();
var moment = require("moment");
const locations = require("../models/locations_model ");
const jwt_decode = require("jwt-decode");
var fetch = require('node-fetch');


async function addlocations(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1 ) {
      var response = {
        status: 401,
        message: "User is un-authorised !",
      };
      return res.status(401).send(response);
    }

    var { name, longitude, latitude } = req.body;

    var namecheck = await locations.findOne({ name: name });
    if (namecheck) {
      var response = {
        status: 201,
        message: "Already exist location",
      };
      return res.status(201).send(response);
    } else {
      const data = {
        name: name,
        longitude: longitude,
        latitude: latitude,
        create_by: user_id,
      };
      console.log("data: ", data);
      const locationsResponse = await locations.create(data);

      if (locationsResponse) {
        var response = {
          status: 200,
          message: "location added successfully",
          data: locationsResponse,
          image_base_url: process.env.BASE_URL,
        };
        return res.status(200).send(response);
      } else {
        var response = {
          status: 201,
          message: "Unable to add location",
        };
        return res.status(201).send(response);
      }
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


async function locationslist(req, res) {
  try {
    // const user_id = req["user_id"];
    // const type = req["type"];
    // if (user_id == null) {
    //   var response = {
    //     status: 401,
    //     message: "offer is un-authorised !",
    //   };
    //   return res.status(401).send(response);
    // }
    var locationsResposnse = await locations.find();
    console.log("locationsResposnse: ", locationsResposnse);

    var response = {
      status: 200,
      message: "success",
      data: locationsResposnse,
      image_base_url: process.env.BASE_URL,
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


async function deletelocations(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1 ) {
      var response = {
        status: 401,
        message: "Admin is un-authorised !",
      };
      return res.status(401).send(response);
    }
    const { location_id } = req.body;
    console.log("location_id: ", location_id);
    const locationsRes = await locations.findOne({ _id: location_id });
    if (locationsRes) {
      locations.findByIdAndDelete(
        { _id: location_id },
        async function (err, docs) {
          if (err) {
            var response = {
              status: 201,
              message: "location delete failed",
            };
            return res.status(201).send(response);
          } else {
            var response = {
              status: 200,
              message: "location deleted successfully",
            };
            return res.status(200).send(response);
          }
        }
      );
    } else {
      var response = {
        status: 201,
        message: "location not Available",
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


async function editlocations(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1 ) {
      var response = {
        status: 401,
        message: "Admin is un-authorised !",
      };
      return res.status(401).send(response);
    }
    const { location_id, name, longitude, latitude } = req.body;
    const locationsResp = await locations.findOne({ _id: location_id });

    if (locationsResp) {
      const data = {
        name: name,
        longitude: longitude,
        latitude: latitude,
      };
      locations.findByIdAndUpdate(
        { _id: location_id },
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
              message: "location updated successfully",
              data: docs,
              image_base_url: process.env.BASE_URL,
            };
            return res.status(200).send(response);
          }
        }
      );
    } else {
      console.log("error", error);
      response = {
        status: 201,
        message: "location  not available",
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


async function currentlocation(req, res) {
  try{
    //console.log(ip.address());
    //console.log(req.connection);

     await fetch(`https://geolocation-db.com/json/0f761a30-fe14-11e9-b59f-e53803842572`)
     .then(res => res.json())
     .then(async(datas) => {
       //return res.status(201).json({datas:datas});

      await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${datas.latitude}+${datas.longitude}&key=37cd7ba4971447209042d2a701ed4d6f`)
      .then(res => res.json())
      .then(data => {
        var response = {
          status: 200,
          message: "successfull",
          address:data.results[0].formatted,
          quard:data.results[0].geometry
        };
      // console.log(data.results[0]);
      return res.status(201).json(response);
       
     });
     });
  }catch (error) {
    console.log("error", error);
    response = {
      status: 201,
      message: "Operation was not successful",
    };
    return res.status(201).send(response);
  }
}

// async function vendorlocation(req, res) {
  async function currentaddress(req, res) {
  try{
    //console.log(ip.address());
    //console.log(req.connection);

    //  await fetch(`https://geolocation-db.com/json/0f761a30-fe14-11e9-b59f-e53803842572`)
    //  .then(res => res.json())
    //  .then(async(datas) => {
    //    //return res.status(201).json({datas:datas});
      const {latitude, longitude} =req.body;
      if(latitude !="" && longitude !=""){
        await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=37cd7ba4971447209042d2a701ed4d6f`)
        .then(res => res.json())
        .then(data => {
          var response = {
            status: 200,
            message: "successfull",
			city:data.results[0]?.components.city,
            address:data.results[0].formatted
          };
        // console.log(data.results[0]);
        return res.status(201).json(response);
       });
      } else{
        response = {
          status: 201,
          message: "fill all the details",
        };
        return res.status(201).send(response);
      }
      
  }catch (error) {
    console.log("error", error);
    response = {
      status: 201,
      message: "Operation was not successful",
    };
    return res.status(201).send(response);
  }
}


module.exports = {
  addlocations,
  locationslist,
  deletelocations,
  editlocations,
  currentlocation,
  currentaddress,
};


// Post fetch
/*
let todo = {
  userId: 123,
  title: "loren impsum doloris",
  completed: false
};

fetch('https://jsonplaceholder.typicode.com/todos', {
  method: 'POST',
  body: JSON.stringify(todo),
  headers: { 'Content-Type': 'application/json' }
}).then(res => res.json())
.then(json => console.log(json))
*/
