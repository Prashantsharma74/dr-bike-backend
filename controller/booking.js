const booking = require("../models/Booking");
const additionaloptions = require("../models/additionalOptionsModel");
const service = require("../models/service_model");
const bike = require("../models/bikeModel");
const Tracking = require("../models/Tracking");
const jwt_decode = require("jwt-decode");
const customers = require("../models/customer_model");
const Dealer = require("../models/Dealer");
const Role = require('../models/Roles_modal')
const Admin = require('../models/admin_model')
const { Notification } = require("../helper/pushNotification");
const {handleBookingCompletion} = require("../controller/reward")


async function checkPermission(user_id, requiredPermission) {
  try {
      const userRole = await Role.findOne({ subAdmin: user_id });
      console.log(userRole,"1")
      if (!userRole) {
          return false;
      }
      const permissions = userRole.permissions;
      console.log(permissions,"2")

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

async function addbooking(req, res) {


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

    const customer = await customers.findById(user_id);

    // let services = await service.findById(req.params.id)
    // let services = await service.findById(req.params.id)
    const servicelist = req.body.Servicelist;
    const dealerIdToCheck = servicelist[0]?.dealerId;


if (!servicelist.every(service => service.dealerId === dealerIdToCheck)) {
  return res.status(400).json({ message: 'All dealerId should be from the same dealer.' });
}


// const serviceIds = servicelist.map(service => service._id);
// console.log(serviceIds);

// // Check if any of the services do not exist
// const nonExistingServices = await service.find({ _id: { $nin: serviceIds } });

// if (nonExistingServices.length > 0) {
//   console.log(`Services not found for IDs:`);
//   const nonExistingServiceIds = nonExistingServices.map(service => service._id.toString());
//   res.status(400).json({ error: `Services not found for IDs: ${nonExistingServiceIds.join(', ')}` });
//   return;
// }


    // if (!services) {
    //   res.status(201).json({ error: "No Service exists" })
    //   return;
    // }

    const { bullet_points, additonal_options, bike_id, area, city, address, description, estimated_cost,Servicelist,additonal_data_moveable } = req.body;

    let bikes = await bike.findById(bike_id)
    if (!bikes) {
      res.status(201).json({ error: "No Bike Found" })
      return;
    }

    const dealers = await Dealer.find({ id: req.params.id }).exec();

    const timeout = 3 * 60 * 1000;
    // const timeout = 20 * 1000;

    // console.log(dealers);

    if (additonal_options) {
      let extra_charges = 0;
      let count = 0;
      let size = additonal_options.length

      if (size > 0) {
        await additonal_options.forEach(data => {
          additionaloptions.find({ name: data }, async (err, datas) => {
            extra_charges += datas[0].cost
            count++
            //console.log(extra_charges);
            if (count == size) {
              const data = {
               // service_id: services._id,
               services: Servicelist,
                bullet_points: bullet_points,
                additonal_options: additonal_options,
                model: bikes.model,
                brand: bikes.name,
                bike_charge: bikes.extra_charges,
                area: area.toLowerCase(),
                city: city.toLowerCase(),
                address: address,
                description: description,
                estimated_cost: estimated_cost,
                created_by: user_id,
                assigned_to: dealers[0].name,
                assigned_toid: dealers[0].id,
                extra_charges: dealers[0].extra_charges,
                dealer_shop_name: dealers[0].shop,
                additonal_data_moveable: additonal_data_moveable,
              };

              const bookingresponce = await booking.create(data);

              
              
              if (bookingresponce) {
                
                // Add booking for tracking
                const datas = {
                  // service_id: services._id,
                  services: Servicelist,
                  booking_id: bookingresponce._id,
                  user_id: user_id,
                  users_id: customer?.id
                }
                const traking = await Tracking.create(datas)
                setTimeout(async () => {
                  const updatedBooking = await booking.findById(bookingresponce._id);
                
                  if (updatedBooking && updatedBooking.status === 'pending') {
                    await booking.findByIdAndUpdate(bookingresponce._id, { status: 'rejected' });
                    await Tracking.updateOne({ _id: traking._id }, { $set: { status: 'rejected' } });
                    Notification(customer.device_token, `Sorry ${customer.name},our Provider is buzzy now, Booking is canceled for ${bikes?.name} ${bikes?.model} ${bikes?.bike_cc} Bike`, customer.id)
                    console.log(`Booking ${bookingresponce._id} automatically rejected after 3 minutes.`);
                  }
                  // console.log({message : "booking 1111111111",traking,customer,});
                  // Notification(dealers[0].device_token, `Hi ${dealers.name}, New Booking is Arrived for ${bikes?.name} ${bikes?.model} ${bikes?.bike_cc} Bike`)
                }, timeout);

                // send Push notification to  nearer dealer 
                if (dealers) {
                    Notification(dealers[0].device_token, `Hi ${data.name}, New Booking is Arrived for ${bikes?.name} ${bikes?.model} ${bikes?.bike_cc} Bike`, dealers[0].id)
                }

                var response = {
                  status: 200,
                  message: "User Booking successfull",
                  data: bookingresponce,
                  image_base_url: process.env.BASE_URL,
                };
                return res.status(200).send(response);
              } else {
                var response = {
                  status: 201,
                  message: "Unable to add Booking",
                };
                return res.status(201).send(response);
              }
            }
          })
        })
      } else {
        const data = {
         // service_id: services._id,
         services: Servicelist,
          bullet_points: bullet_points,
          additonal_options: additonal_options,
          model: bikes.model,
          brand: bikes.name,
          bike_charge: bikes.extra_charges,
          area: area.toLowerCase(),
          city: city.toLowerCase(),
          address: address,
          description: description,
          estimated_cost: estimated_cost,
          created_by: user_id,
          assigned_to: dealers[0].name,
          assigned_toid: dealers[0].id,
          extra_charges: dealers[0].extra_charges,
          dealer_shop_name: dealers[0].shop,
          additonal_data_moveable,
        };
        const bookingresponce = await booking.create(data);

        if (bookingresponce) {
          
          // Add booking for tracking
          const datas = {
            // service_id: services._id,
            services: Servicelist,
            booking_id: bookingresponce._id,
            user_id: user_id,
            users_id: customer?.id
          }
          const traking = await Tracking.create(datas)
          setTimeout(async () => {
            const updatedBooking = await booking.findById(bookingresponce._id);
          
            if (updatedBooking && updatedBooking.status === 'pending') {
              await booking.findByIdAndUpdate(bookingresponce._id, { status: 'rejected' });
              await Tracking.updateOne({ _id: traking._id }, { $set: { status: 'rejected' } });
              Notification(customer.device_token, `Sorry ${customer.name},our Provider is buzzy now, Booking is canceled for ${bikes?.name} ${bikes?.model} ${bikes?.bike_cc} Bike`, customer.id)
              console.log(`Booking ${bookingresponce._id} automatically rejected after 3 minutes.`);
            }
            // console.log({message : "booking 2222222",traking,customer,});
          }, timeout);

          
          console.log("dealers11" , dealers);

          // send Push notification to  nearer dealer 
          if (dealers) {
            Notification(dealers[0].device_token, `Hi ${dealers.name}, New Booking is Arrived for ${bikes?.name} ${bikes?.model} ${bikes?.bike_cc} Bike`, dealers[0].id)
            // dealers.map((data, index) => {
            // })
          }


          var response = {
            status: 200,
            message: "User Booking successfull",
            data: bookingresponce,
            image_base_url: process.env.BASE_URL,
          };
          return res.status(200).send(response);
        } else {
          var response = {
            status: 201,
            message: "Unable to add Booking",
          };
          return res.status(201).send(response);
        }
      }
    }
    else {
      const data = {
       // service_id: services._id,
       services: Servicelist,
        bullet_points: bullet_points,
        //additonal_options:additonal_options,
        model: bikes.model,
        brand: bikes.name,
        bike_charge: bikes.extra_charges,
        area: area.toLowerCase(),
        city: city.toLowerCase(),
        address: address,
        description: description,
        estimated_cost: estimated_cost,
        created_by: user_id,
        assigned_to: dealers[0].name,
        assigned_toid: dealers[0].id,
        extra_charges: dealers[0].extra_charges,
        dealer_shop_name: dealers[0].shop,
        additonal_data_moveable,
      };
      const bookingresponce = await booking.create(data);

      
      if (bookingresponce) {
        
        // Add booking for tracking
        const datas = {
          // service_id: services._id,
          services: Servicelist,
          booking_id: bookingresponce._id,
          user_id: user_id,
          users_id: customer?.id
        }
        const traking = await Tracking.create(datas)
        setTimeout(async () => {
          const updatedBooking = await booking.findById(bookingresponce._id);
        
          if (updatedBooking && updatedBooking.status === 'pending') {
            await booking.findByIdAndUpdate(bookingresponce._id, { status: 'rejected' });
            await Tracking.updateOne({ _id: traking._id }, { $set: { status: 'rejected' } });
            Notification(customer.device_token, `Sorry ${customer.name},our Provider is buzzy now, Booking is canceled for ${bikes?.name} ${bikes?.model} ${bikes?.bike_cc} Bike`, customer.id)
            console.log(`Booking ${bookingresponce._id} automatically rejected after 3 minutes.`);
          }
          // console.log({message : "booking 3333333",traking,customer,});
        }, timeout);

        console.log("dealers2" , dealers);
        console.log("dealername" , dealers[0].name);
        const testt = "c9HJP6A2RLqjGzHjemYT6Z:APA91bFrGTGQnL0OdQpcv-8lTJWtlVan7E54ofXhGuUB2Hz2wMwMQ5hq18PQeP8AAS1T1ilNQ3HFI72dBTFMbdT9ts8FJHR0CNYORYQ4sY7RW4HBLo6eInezbEwCyFlDv2LBDZ-uR1GS"


        // send Push notification to  nearer dealer 
        if (dealers) {
          Notification(dealers[0].device_token, `Hi ${dealers[0].name}, New Booking is Arrived for ${bikes?.name} ${bikes?.model} ${bikes?.bike_cc} Bike`, dealers[0].id)
          // dealers.map((data, index) => {
          // })
        }

        var response = {
          status: 200,
          message: "User Booking successfull",
          data: bookingresponce,
          image_base_url: process.env.BASE_URL,
        };
        return res.status(200).send(response);
      } else {
        var response = {
          status: 201,
          message: "Unable to add Booking",
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


async function getallbookings(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;

    if (!user_id || (user_type !== 1 && user_type !== 2 && user_type !== 3)) {
      return res.status(200).json({ status: 200, message: "Unauthorized access!" });
    }

    // Fetch all bookings and populate required fields
    const bookingresponce = await booking
      .find(req.query)
      .populate("services") // Fetch service details
      .populate("dealer_id") // Fetch dealer details
      .populate("pickupAndDropId") // Fetch pickup & drop details
      .populate("user_id") // Fetch user details
      .sort({ "_id": -1 });

    if (bookingresponce.length > 0) {
      return res.status(200).json({
        status: 200,
        message: "Successfully retrieved bookings",
        data: bookingresponce,
        image_base_url: process.env.BASE_URL,
      });
    } else {
      return res.status(200).json({
        status: 200,
        message: "No bookings found",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
}



async function getbooking(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1 && user_type != 2 && user_type != 4) {
      var response = {
        status: 401,
        message: "admin is un-authorised !",
      };
      return res.status(401).send(response);
    }

    let bookingresponce = await booking.findOne({ _id: req.params.id })
      .populate({ path: "service_id", select: ['name', 'image', 'description'] })
      .populate({ path: "created_by", select: ['first_name', 'email', 'last_name', 'phone', 'image', 'address', 'city'] })
    // .populate({path:"service_provider_id",select: ['name', 'email', 'phone']})

    if (bookingresponce) {
      var response = {
        status: 200,
        message: "successfull",
        data: bookingresponce,
        image_base_url: process.env.BASE_URL,
      };
      return res.status(200).send(response);
    } else {
      var response = {
        status: 201,
        data: [],
        message: "No bookings Found",
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


// async function getuserbookings(req, res) {
//   try {
//     const data = jwt_decode(req.headers.token);
//     const user_id = data.user_id;
//     const user_type = data.user_type;
//     const type = data.type;
//     if (user_id == null || user_type != 1 && user_type != 4) {
//       var response = {
//         status: 401,
//         message: "admin is un-authorised !",
//       };
//       return res.status(401).send(response);
//     }

//     let bookingresponce = await booking.find({ created_by: req.params.id })
//     .populate({ path: "service_id", select: ['name', 'image', 'description'] })
//     .populate({ path: "created_by", select: ['first_name', 'last_name', 'phone', 'address', 'city'] })
//     .populate({ path: "additonal_options"})
//     .sort({ "_id": -1 })
//     .lean();

//  if (bookingresponce.length > 0) {
//       const formattedBookings = bookingresponce.map(booking => ({
//         ...booking,
//         bookingId: `B-${booking.id.toString().padStart(3, '0')}`,
//       }));

//       var response = {
//         status: 200,
//         message: 'Successfully retrieved bookings',
//         data: formattedBookings,
//         image_base_url: process.env.BASE_URL,
//       };
//       return res.status(200).send(response);
//     } else {
//       var response = {
//         status: 201,
//         data: [],
//         message: 'No bookings found',
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


const getuserbookings = async (req, res) => {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;

    console.log(user_type,"user_type")
    if (!user_id) {
      return res.status(200).json({ status: 200, message: "Unauthorized access!" });
    }

    let filter = {};

    if (user_type == 2) {
      filter = { dealer_id: user_id }; // Fetch bookings for the dealer
    } else if (user_type == 4) {
      filter = { user_id: user_id }; // Fetch bookings for the user
    } else {
      return res.status(200).json({ status: 200, message: "Access denied!" });
    }
    console.log(filter,"filter")

    // Fetch bookings for the user and populate related fields
    const userBookings = await booking.find(filter)
      .populate("services") // Fetch service name and price
      .populate("dealer_id") // Fetch dealer name and location
      .populate("pickupAndDropId") // Fetch pickup & drop details
      .populate("user_id") // Fetch pickup & drop details
      // .populate({
      //   path: "variant_id",
      //   populate: {
      //     path: "model_id", // This will populate model_id inside variant_id
      //   },
      // }) // Fetch pickup & drop details
      .sort({ create_date: -1 }); // Sort by most recent bookings first

    if (!userBookings || userBookings.length === 0) {
      return res.status(200).json({ status: 200, message: "No bookings found!" });
    }

    res.status(200).json({ status: 200, data: userBookings });

  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

async function deletebooking(req, res) {
  try {

    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;

    if (user_id == null || user_type != 1) {
  
    
      if(user_type === 3){
      const subAdmin = await Admin.findById(user_id)
      
      if (!subAdmin) {
        var response = {
          status: 401,
          message: "Subadmin not found!",
        };
        return res.status(401).send(response);
      }

      if(user_type === 3){
        const subAdmin = await Admin.findById(user_id)
        
        if (!subAdmin) {
          var response = {
            status: 401,
            message: "Subadmin not found!",
          };
          return res.status(401).send(response);
        }
      }
  
      const isAllowed = await checkPermission(user_id, "Booking.delete");

      if (!isAllowed) {
        var response = {
          status: 401,
          message: "Subadmin does not have permission to add Booking!",
        };
        return res.status(401).send(response);
      }

    }

    }



    const { booking_id } = req.body;
    const bookingRes = await booking.findOne({ _id: booking_id });
    if (bookingRes) {
      booking.findByIdAndDelete({ _id: booking_id }, async function (err, docs) {
        if (err) {
          var response = {
            status: 201,
            message: "Booking delete failed",
          };
          return res.status(201).send(response);
        } else {
          var response = {
            status: 200,
            message: "Booking deleted successfully",
          };
          return res.status(200).send(response);
        }
      });
    } else {
      var response = {
        status: 201,
        message: "Booking not Found",
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


async function updatebooking(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1 && user_type != 2 && user_type != 4) {
      var response = {
        status: 401,
        message: "Admin is un-authorised !",
      };
      return res.status(401).send(response);
    }

    const { status, dealer_id, additonal_options, estimated_cost, final_cost,additonal_data_moveable } = req.body;

    let bookings = await booking.findById(req.params.id);
    
    if (!bookings) {
      res.status(201).json({ status: 201, error: "No Booking Found" });
      return;
    }

    const user = await customers.findById(bookings.created_by).exec();

    if(bookings.status === status){
      res.status(201).json({ status: 201, message: `Booking is Already ${status}` });
      return;
    }

    if (status === "completed") {
      await handleBookingCompletion(bookings);
  }

    let dealers = await Dealer.findOne({ _id: dealer_id }); // changes

    if (!dealers) {
      res.status(201).json({ status: 201, error: "No Dealer Found" });
      return;
    }

    const datas =
    {
      status: status,
      dealer_name: dealers.name,
      dealr_id: dealers.id,
      dealer_id: dealer_id,
      dealer_address: dealers.address,
      dealer_phone: dealers.phone,
      additonal_options: additonal_options,
      estimated_cost: estimated_cost,
      final_cost: final_cost,
      additonal_data_moveable,
    };

    booking.findByIdAndUpdate(
      { _id: req.params.id },
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
          // const sphone = vendors.phone
          // const uphone = user.phone
          // const service_provider_address = docs.service_provider_address
          // const user_address = user.address

          // const data = await otpAuth.pickndropotp(sphone,uphone,service_provider_address,user_address)
          // docs.otp = data.otp

          // push notification on booking update
          if(status == "rejected"){
            Notification( user?.device_token || user?.ftoken, `Sorry ${user?.first_name} , Your Booking of ${bookings?.brand} ${bookings?.model} has been Rejected`, user?.id);
          }else{
            Notification( user?.device_token || user?.ftoken, `Hi ${user?.first_name} , Your Booking of ${bookings?.brand} ${bookings?.model} ${status} successfully`, user?.id);
          }

          var response = {
            status: 200,
            message: "Booking updated successfully",
            // data: docs,
            // image_base_url: process.env.BASE_URL,
          };
          return res.status(200).send(response);
        }
      }
    );

  } catch (error) {
    console.log("error", error);
    response = {
      status: 201,
      message: "Operation was not successful",
    };
    return res.status(201).send(response);
  }
}

// Create Booking
async function createBooking(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    
    const { dealer_id, services, pickupAndDropId,userBike_id,pickupDate } = req.body;
    if (!dealer_id || !services || services.length === 0) {
      return res.status(400).json({ success: false, message: "Dealer and at least one service are required" });
    }

    const newBooking = new booking({
      user_id,
      dealer_id,
      services,
      pickupAndDropId:pickupAndDropId || null,
      userBike_id,
      pickupDate
    });

    await newBooking.save();
    res.status(201).json({ success: true, message: "Booking created successfully", data: newBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// Get Booking Details with Populated Data
async function getBookingDetails(req, res) {
  try {
    const bookingId = req.params.id;
    const bookings = await booking.findById(bookingId)
      .populate("user_id")
      .populate("dealer_id")
      .populate("services")
      .populate("pickupAndDropId")
      .populate("userBike_id");

    if (!bookings) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const userBikeCC = parseInt(bookings?.userBike_id?.bike_cc); // bike_cc is a string
    const filteredServices = bookings.services.map(service => {
      const matchingBikes = service.bikes.filter(b => b.cc === userBikeCC);
      return {
        ...service.toObject(),
        bikes: matchingBikes
      };
    }).filter(service => service.bikes.length > 0);

    const result = {
      ...bookings.toObject(),
      services: filteredServices
    };

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}



async function updateBooking(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;

    const { bookingId, ...updateFields } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Booking ID is required" });
    }

    let existingBooking = await booking.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Update only the provided fields
    Object.keys(updateFields).forEach((key) => {
      if (updateFields[key] !== undefined) {
        existingBooking[key] = updateFields[key];
      }
    });

    await existingBooking.save();

    res.status(200).json({ success: true, message: "Booking updated successfully", data: existingBooking });

  } catch (error) {
    console.error("Update Booking Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function updateBookingStatus(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;

    const { bookingId, status } = req.body;

    if (!bookingId || !status) {
      return res.status(400).json({ success: false, message: "Booking ID and status are required" });
    }

    let existingBooking = await booking.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    existingBooking.status = status;
    await existingBooking.save();

    if (status === "completed") {
      await handleBookingCompletion(existingBooking);
  }


    // Fetch customer details
    const customer = await customers.findById(existingBooking.user_id);
    if (customer && customer.device_token) {
      Notification(customer.device_token, `Your booking status has been updated to: ${status}`,customer._id.toString());
    }

    res.status(200).json({ success: true, message: "Booking status updated successfully", data: existingBooking });

  } catch (error) {
    console.error("Update Booking Status Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

const sendBookingOTP = async (req, res) => {
  try {
      const { bookingId } = req.body;
      if (!bookingId) {
          return res.status(200).json({ success: false, message: "Booking ID is required" });
      }

      // Booking aur Dealer ka data fetch karna
      const bookingData = await booking.findById(bookingId).populate("dealer_id");
      if (!bookingData) {
          return res.status(200).json({ success: false, message: "Booking not found" });
      }

      const dealer = await Dealer.findById(bookingData.dealer_id);
      if (!dealer || !dealer.phone) {
          return res.status(200).json({ success: false, message: "Dealer phone number not found" });
      }

      const phoneNumber = dealer.phone; // Dealer ka phone number

      // OTP Generate karna
      const otp = Math.floor(100000 + Math.random() * 900000);

      // OTP ko database me save karna
      bookingData.otp = 9999;
      await bookingData.save();

      // Twilio ya SMS API se OTP bhejna
      // const otpResponse = await sendotp(phoneNumber);

      res.status(200).json({ success: true, message: "OTP sent successfully to dealer" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const verifyBookingOTP = async (req, res) => {
  try {
      const { bookingId, otp } = req.body;
      if (!bookingId || !otp) {
          return res.status(200).json({ success: false, message: "Booking ID and OTP are required" });
      }

      // Booking ka data fetch karna
      const bookingData = await booking.findById(bookingId).populate("dealer_id");
      if (!bookingData) {
          return res.status(200).json({ success: false, message: "Booking not found" });
      }

      // OTP Check karna
      if (bookingData.otp !== otp) {
          return res.status(200).json({ success: false, message: "Invalid OTP" });
      }

      // OTP Verify hone ke baad null kar dena
      bookingData.otp = null;
      await bookingData.save();

      res.status(200).json({ success: true, message: "OTP verified successfully by dealer" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updatePickupStatus = async (req, res) => {
  try {
      const { bookingId, status } = req.body;

      // Validate Input
      if (!bookingId || !status) {
          return res.status(200).json({ success: false, message: "Booking ID and Status are required" });
      }

      // Valid Status Values
      const validStatuses = ["arriving", "arrived"];
      if (!validStatuses.includes(status)) {
          return res.status(200).json({ success: false, message: "Invalid status value" });
      }

      // Fetch Booking
      const bookingData = await booking.findById(bookingId);
      if (!bookingData) {
          return res.status(200).json({ success: false, message: "Booking not found" });
      }

      // Update Pickup Status
      bookingData.pickupStatus = status;
      await bookingData.save();

      res.status(200).json({ success: true, message: "Pickup status updated successfully", data: bookingData });
  } catch (error) {
      console.error("Error updating pickup status:", error);
      res.status(500).json({ success: false, message:error });
  }
};



async function addNoteToBooking(req, res) {
  try {
      const { bookingId, note } = req.body;

      if (!bookingId || !note) {
          return res.status(400).json({ success: false, message: "Booking ID and note are required" });
      }

      const updatedBooking = await booking.findByIdAndUpdate(
          bookingId,
          { $push: { additionalNotes: note } },
          { new: true }
      );

      if (!updatedBooking) {
          return res.status(404).json({ success: false, message: "Booking not found" });
      }

      res.status(200).json({ success: true, message: "Note added successfully", data: updatedBooking.additionalNotes });
  } catch (error) {
      console.error("Add Note Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function getNotesFromBooking(req, res) {
  try {
      const { bookingId } = req.params;

      if (!bookingId) {
          return res.status(400).json({ success: false, message: "Booking ID is required" });
      }

      const bookingData = await booking.findById(bookingId, "additionalNotes");

      if (!bookingData) {
          return res.status(404).json({ success: false, message: "Booking not found" });
      }

      res.status(200).json({ success: true, data: bookingData.additionalNotes });
  } catch (error) {
      console.error("Get Notes Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function updateNoteInBooking(req, res) {
  try {
      const { bookingId, noteIndex, newNote } = req.body;

      if (!bookingId || noteIndex === undefined || !newNote) {
          return res.status(400).json({ success: false, message: "Booking ID, note index, and new note are required" });
      }

      const updatedBooking = await booking.findById(bookingId);

      if (!updatedBooking) {
          return res.status(404).json({ success: false, message: "Booking not found" });
      }

      if (noteIndex < 0 || noteIndex >= updatedBooking.additionalNotes.length) {
          return res.status(400).json({ success: false, message: "Invalid note index" });
      }

      updatedBooking.additionalNotes[noteIndex] = newNote;
      await updatedBooking.save();

      res.status(200).json({ success: true, message: "Note updated successfully", data: updatedBooking.additionalNotes });
  } catch (error) {
      console.error("Update Note Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

async function deleteNoteFromBooking(req, res) {
  try {
      const { bookingId, noteIndex } = req.body;

      if (!bookingId || noteIndex === undefined) {
          return res.status(400).json({ success: false, message: "Booking ID and note index are required" });
      }

      const updatedBooking = await booking.findById(bookingId);

      if (!updatedBooking) {
          return res.status(404).json({ success: false, message: "Booking not found" });
      }

      if (noteIndex < 0 || noteIndex >= updatedBooking.additionalNotes.length) {
          return res.status(400).json({ success: false, message: "Invalid note index" });
      }

      updatedBooking.additionalNotes.splice(noteIndex, 1);
      await updatedBooking.save();

      res.status(200).json({ success: true, message: "Note deleted successfully", data: updatedBooking.additionalNotes });
  } catch (error) {
      console.error("Delete Note Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}





module.exports = {
  addbooking,
  getallbookings,
  getbooking,
  deletebooking,
  getuserbookings,
  updatebooking,
  createBooking,
  getBookingDetails,
  updateBooking,
  updateBookingStatus,
  sendBookingOTP,
  verifyBookingOTP,
  updatePickupStatus,
  addNoteToBooking,
  getNotesFromBooking,
  updateNoteInBooking,
  deleteNoteFromBooking
}