const mongoose = require('mongoose');
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
const { handleBookingCompletion } = require("../controller/reward")

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

    const { bullet_points, additonal_options, bike_id, area, city, address, description, estimated_cost, Servicelist, additonal_data_moveable } = req.body;

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


          console.log("dealers11", dealers);

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

        console.log("dealers2", dealers);
        console.log("dealername", dealers[0].name);
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

const getuserbookings = async (req, res) => {
  try {
    const { user_id } = req.params;

    const { user_type } = req.query;

    if (!user_id) {
      return res.status(400).json({
        status: 400,
        message: "User ID is required in URL (e.g., /api/bookings/123)"
      });
    }

    if (!user_type || ![2, 4].includes(Number(user_type))) {
      return res.status(400).json({
        status: 400,
        message: "Valid user_type (2 for dealer, 4 for user) is required in query params"
      });
    }

    console.log("user_type", user_type, "user_id", user_id);

    // Set filter based on user_type
    let filter = {};
    if (user_type == 2) {
      filter = { dealer_id: user_id }; // Dealer's bookings
    } else if (user_type == 4) {
      filter = { user_id: user_id };   // User's bookings
    }

    const userBookings = await booking.find(filter)
      .populate("services")
      .populate("dealer_id")
      .populate("pickupAndDropId")
      .populate("user_id")
      .sort({ create_date: -1 });

    if (!userBookings?.length) {
      return res.status(404).json({
        status: 200,
        success: true,
        message: "No bookings found for this user"
      });
    }

    // Return successful response
    res.status(200).json({
      status: 200,
      success: true,
      data: userBookings
    });

  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error"
    });
  }
};

async function deletebooking(req, res) {
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

    const { status, dealer_id, additonal_options, estimated_cost, final_cost, additonal_data_moveable } = req.body;

    let bookings = await booking.findById(req.params.id);

    if (!bookings) {
      res.status(201).json({ status: 201, error: "No Booking Found" });
      return;
    }

    const user = await customers.findById(bookings.created_by).exec();

    if (bookings.status === status) {
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
          if (status == "rejected") {
            Notification(user?.device_token || user?.ftoken, `Sorry ${user?.first_name} , Your Booking of ${bookings?.brand} ${bookings?.model} has been Rejected`, user?.id);
          } else {
            Notification(user?.device_token || user?.ftoken, `Hi ${user?.first_name} , Your Booking of ${bookings?.brand} ${bookings?.model} ${status} successfully`, user?.id);
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

    const { dealer_id, services, pickupAndDropId, userBike_id, pickupDate } = req.body;
    if (!dealer_id || !services || services.length === 0) {
      return res.status(400).json({ success: false, message: "Dealer and at least one service are required" });
    }

    const newBooking = new booking({
      user_id,
      dealer_id,
      services,
      pickupAndDropId: pickupAndDropId || null,
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

async function getBookingDetails(req, res) {
  try {
    const bookingId = req.params.id;

    // First, verify the booking exists without population
    const bookingExists = await booking.findById(bookingId);
    if (!bookingExists) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Then populate with debug logging
    const bookings = await booking.findById(bookingId)
      .populate("user_id")
      .populate({
        path: "dealer_id",
        model: "Vendor" // Ensure this matches your model name
      })
      .populate({
        path: "services",
        model: "service" // Ensure this matches your service model name
      })
      .populate("pickupAndDropId")
      .populate("userBike_id");

    console.log("Raw populated data:", bookings);

    // Check if services array exists but is empty
    if (!bookings.services || bookings.services.length === 0) {
      console.log("No services found for booking:", bookingId);
      return res.status(200).json({
        success: true,
        data: bookings,
        message: "Booking found but no services associated"
      });
    }

    const userBikeCC = parseInt(bookings?.userBike_id?.bike_cc || 0);
    console.log("Filtering services for bike CC:", userBikeCC);

    const filteredServices = bookings.services
      .map(service => {
        const matchingBikes = service.bikes?.filter(b => b.cc === userBikeCC) || [];
        return {
          ...service.toObject(),
          bikes: matchingBikes
        };
      })
      .filter(service => service.bikes.length > 0);

    console.log("Filtered services count:", filteredServices.length);

    const result = {
      ...bookings.toObject(),
      services: filteredServices.length > 0 ? filteredServices : bookings.services
    };

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getBookingDetails:", error);
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
    const { bookingId } = req.params;
    const { status, user_id } = req.body;

    if (!bookingId || !status || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Booking ID, status, and user ID are required"
      });
    }

    // Find and update booking
    let existingBooking = await booking.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Verify the requesting user has rights to update this booking
    if (existingBooking.user_id.toString() !== user_id &&
      existingBooking.dealer_id.toString() !== user_id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this booking"
      });
    }

    // Update status
    existingBooking.status = status;
    await existingBooking.save();

    // Handle completion logic if needed
    if (status === "completed") {
      await handleBookingCompletion(existingBooking);
    }

    // Notify customer if they're not the one making the update
    if (existingBooking.user_id.toString() !== user_id) {
      const customer = await customers.findById(existingBooking.user_id);
      if (customer?.device_token) {
        Notification(
          customer.device_token,
          `Your booking status has been updated to: ${status}`,
          customer._id.toString()
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: existingBooking
    });

  } catch (error) {
    console.error("Update Booking Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
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

    // Fixed OTP Check (9999)
    if (otp !== "9999") {
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
    res.status(500).json({ success: false, message: error });
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

// By Prashant 
async function getallbookings(req, res) {
  try {
    // Directly fetch bookings without auth
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

// async function updateBookingStatusDealer(req, res) {
//   try {
//     const { booking_id } = req.params;
//     const {
//       status,
//       dealer_id,
//       additional_services = [],
//       service_summary = [],
//       final_cost,
//       tax
//     } = req.body;
//     console.log("Body", req.body)
//     console.log("Booking ID", booking_id)
//     // Validate status
//     const validStatuses = ["pending", "confirmed", "completed", "Payment", "rejected", "user_cancelled", "cash received"];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status value"
//       });
//     }

//     console.log("Validaated Status", validStatuses)

//     const booking = await booking.findById(booking_id);
//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found"
//       });
//     }

//     console.log("Booking", booking)

//     if (booking.status === status) {
//       return res.status(200).json({
//         success: true,
//         message: `Status already ${status}`,
//         data: booking
//       });
//     }

//     // Prepare update
//     const updateData = { status };

//     // Status-specific logic
//     if (status === "confirmed" && dealer_id) {
//       const dealer = await Dealer.findById(dealer_id);
//       if (!dealer) {
//         return res.status(404).json({
//           success: false,
//           message: "Dealer not found"
//         });
//       }
//       updateData.dealer_id = dealer_id;
//       updateData.dealer_name = dealer.name;
//       updateData.dealer_address = dealer.address;
//       updateData.dealer_phone = dealer.phone;
//     }

//     if (status === "completed") {
//       if (!final_cost) {
//         return res.status(400).json({
//           success: false,
//           message: "final_cost required for completion"
//         });
//       }
//       updateData.final_cost = final_cost;
//       updateData.tax = tax || 0;
//       updateData.totalBill = final_cost + (tax || 0);
//       updateData.billStatus = 'paid';
//       updateData.serviceDate = new Date();

//       if (service_summary.length > 0) {
//         updateData.serviceSummary = service_summary;
//       }
//     }

//     // Handle additional services
//     if (additional_services.length > 0) {
//       const services = await AdditionalOptions.find({
//         _id: { $in: additional_services }
//       });

//       if (services.length !== additional_services.length) {
//         return res.status(404).json({
//           success: false,
//           message: "Some services not found"
//         });
//       }

//       updateData.$addToSet = {
//         services: { $each: additional_services }
//       };
//     }

//     // Execute update
//     const updatedBooking = await booking.findByIdAndUpdate(
//       booking_id,
//       updateData,
//       { new: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Booking updated successfully",
//       data: {
//         booking_id: updatedBooking._id,
//         status: updatedBooking.status,
//         totalBill: updatedBooking.totalBill,
//         services: updatedBooking.services,
//         dealer_info: {
//           name: updatedBooking.dealer_name,
//           phone: updatedBooking.dealer_phone
//         }
//       }
//     });

//   } catch (error) {
//     console.error("Booking update error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// }

async function updateBookingStatusDealer(req, res) {
  try {
    const { booking_id } = req.params;
    const {
      status,
      dealer_id,
      additional_services = [],
      service_summary = [],
      final_cost,
      tax
    } = req.body;

    console.log("Request Body:", req.body);
    console.log("Booking ID:", booking_id);

    const validStatuses = ["pending", "confirmed", "completed", "Payment", "rejected", "user_cancelled", "cash received"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const bookings = await booking.findById(booking_id);
    if (!bookings) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    console.log("Current Booking Status:", bookings.status);

    // Skip if status unchanged
    if (bookings.status === status) {
      return res.status(200).json({
        success: true,
        message: `Status already ${status}`,
        data: bookings
      });
    }

    // Prepare update data
    const updateData = { status };
    console.log("Updated Data", updateData)

    // Status-specific logic
    if (status === "confirmed" && dealer_id) {
      const dealer = await Dealer.findById(dealer_id);
      console.log("Dealer", dealer)
      if (!dealer) {
        return res.status(404).json({
          success: false,
          message: "Dealer not found"
        });
      }
      updateData.dealer_id = dealer_id;
      updateData.dealer_name = dealer.name;
      updateData.dealer_address = dealer.address;
      updateData.dealer_phone = dealer.phone;
    }

    if (status === "completed") {
      if (!final_cost) {
        return res.status(400).json({
          success: false,
          message: "final_cost required for completion"
        });
      }
      updateData.final_cost = final_cost;
      updateData.tax = tax || 0;
      updateData.totalBill = final_cost + (tax || 0);
      updateData.billStatus = 'paid';
      updateData.serviceDate = new Date();

      if (service_summary.length > 0) {
        updateData.serviceSummary = service_summary;
      }
    }
    console.log("additional_services", additional_services)

    // if (additional_services.length > 0) {
    //   console.log("additional_services 2", additional_services)
    //   const services = await additionaloptions.find({
    //     _id: { $in: additional_services }
    //   });

    //   console.log("Additional Options", services)

    //   if (services.length !== additional_services.length) {
    //     return res.status(404).json({
    //       success: false,
    //       message: "Some services not found"
    //     });
    //   }

    //   updateData.$addToSet = {
    //     services: { $each: additional_services }
    //   };
    // }

    if (additional_services.length > 0) {
      console.log("Processing additional services...");
      console.log("Raw additional_services:", additional_services);

      try {
        console.log("Checking AdditionalOptions model reference...");
        console.log("Type of AdditionalOptions:", typeof AdditionalOptions);

        console.log("Validating service IDs...");
        const validServiceIds = additional_services.filter(id => {
          const isValid = mongoose.Types.ObjectId.isValid(id);
          if (!isValid) {
            console.error(`Invalid ObjectId: ${id}`);
          }
          return isValid;
        });

        if (validServiceIds.length !== additional_services.length) {
          const invalidIds = additional_services.filter(id => !mongoose.Types.ObjectId.isValid(id));
          console.error("Invalid service IDs found:", invalidIds);
          return res.status(400).json({
            success: false,
            message: "Invalid service ID format",
            invalidIds
          });
        }

        const serviceObjectIds = validServiceIds.map(id => new mongoose.Types.ObjectId(id));
        console.log("Converted ObjectIds:", serviceObjectIds);

        console.log("Querying database for services...");
        const services = await AdditionalOptions.find({
          _id: { $in: serviceObjectIds }
        }).lean();

        console.log("Found services:", services);

        if (services.length !== additional_services.length) {
          const foundIds = services.map(s => s._id.toString());
          const missingIds = additional_services.filter(id => !foundIds.includes(id));
          console.error("Missing services:", missingIds);
          return res.status(404).json({
            success: false,
            message: "Some services not found",
            missingIds
          });
        }

        updateData.$addToSet = {
          services: { $each: serviceObjectIds }
        };
        console.log("Update data prepared with services:", updateData);

      } catch (error) {
        console.error("Error processing additional services:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        throw error;
      }
    }

    const updatedBooking = await booking.findByIdAndUpdate(
      booking_id,
      updateData,
      { new: true }
    );

    console.log("Updated", updatedBooking)

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: {
        booking_id: updatedBooking._id,
        status: updatedBooking.status,
        totalBill: updatedBooking.totalBill,
        services: updatedBooking.services,
        dealer_info: updatedBooking.dealer_id ? {
          name: updatedBooking.dealer_name,
          phone: updatedBooking.dealer_phone
        } : null
      }
    });

  } catch (error) {
    console.error("Booking update error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
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
  deleteNoteFromBooking,
  updateBookingStatusDealer
}