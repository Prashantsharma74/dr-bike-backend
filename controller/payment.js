var crypto = require('crypto');
const jwt_decode = require("jwt-decode");
const { type } = require("os");
const Booking = require("../models/Booking");
const sdk = require('api')('@cashfreedocs-new/v3#4xc3n730larv4wbt');
var Tracking = require("../models/Tracking");
const { default: axios } = require("axios");
var Payment = require("../models/Payment");
const customers = require("../models/customer_model");
const Dealer = require("../models/Dealer");
const Card = require("../models/cardModel");
const Wallet = require("../models/Wallet_modal")
const Razorpay = require('razorpay');
const { method } = require('lodash');
const contacts = require("../models/Contact_model")
const FundAccount = require("../models/FundAccount_model")
const CryptoJS = require('crypto-js');
const QRCode = require('qrcode');
const API_KEY_ID = process.env.API_KEY_ID_RAZO;
const API_KEY_SECRET = process.env.API_KEY_SECRET_RAZO;



async function paymentRequest(req, res) {
  try {
    var postData = {
      //"appId" : req.body.appId,
      "appId": process.env.APP_ID,
      "orderId": req.body.orderId,
      "orderAmount": req.body.orderAmount,
      "orderCurrency": req.body.orderCurrency,
      "orderNote": req.body.orderNote,
      "customerName": req.body.customerName,
      "customerEmail": req.body.customerEmail,
      "customerPhone": req.body.customerPhone,
      //"returnUrl" : req.body.returnUrl,
      "returnUrl": "https://goofy-clarke.89-163-227-50.plesk.page/bikedoctor/payment/paymentResponse",
      // "notifyUrl" : req.body.notifyUrl
    },
      // mode = "TEST",
      mode = "PROD",
      // secretKey = "<YOUR SECRET KEY HERE>",
      secretKey = process.env.SECRET_KEY,
      sortedkeys = Object.keys(postData),
      url = "",
      signatureData = "";
    sortedkeys.sort();
    for (var i = 0; i < sortedkeys.length; i++) {
      k = sortedkeys[i];
      signatureData += k + postData[k];
    }
    // console.log(signatureData);
    var signature = crypto.createHmac('sha256', secretKey).update(signatureData).digest('base64');

    postData['signature'] = signature;

    //console.log(postData);

    if (mode == "PROD") {
      url = "https://www.cashfree.com/checkout/post/submit";
    } else {
      url = "https://test.cashfree.com/billpay/checkout/post/submit";
    }

    // const options = {
    // 	method: 'POST',
    // 	url: "https://test.cashfree.com/billpay/checkout/post/submit",
    // 	headers: {'Content-Type': 'application/json'},
    // 	body: postData,
    // 	json:true
    // };
    // request(options, function (error, response, body) {
    // 	if (error) throw new Error(error);
    // 	//console.log(response);
    // 	console.log(body);
    //   });

    res.render('request', { postData: JSON.stringify(postData), url: url })

  } catch (error) {
    console.log("error", error);
    response = {
      status: 201,
      message: "Operation was not successful",
    };
    return res.status(201).send(response);
  }
}


async function paymentResponse(req, res) {
  try {

    //let bookings = await booking.findOne({_id:req.body.orderId})
    //console.log("booking",bookings);
    //
    //let track = await Tracking.findOne({booking_id:req.body.orderId})
    //console.log("track",track);

    var postData = {
      "orderId": req.body.orderId,
      //"dealer_id": bookings.dealer_id,
      //"user_id": bookings.created_by,
      "orderAmount": req.body.orderAmount,
      "referenceId": req.body.referenceId,
      "txStatus": req.body.txStatus,
      "paymentMode": req.body.paymentMode,
      "txMsg": req.body.txMsg,
      "txTime": req.body.txTime
    },

      //secretKey = "<YOUR SECRET KEY HERE>",
      secretKey = process.env.SECRET_KEY,

      signatureData = "";
    for (var key in postData) {
      signatureData += postData[key];
    }

    var computedsignature = crypto.createHmac('sha256', secretKey).update(signatureData).digest('base64');
    postData['signature'] = req.body.signature;
    postData['computedsignature'] = computedsignature;
    res.render('response', { postData: JSON.stringify(postData) });
    console.log(postData);
    //res.send("hello");
    //       if(postData){

    //         const data =await Tracking.findByIdAndUpdate({_id:track._id},{status:"Payment"},{new:true})
    //         // console.log(data);
    //         const paymentres = await Payment.create(postData)
    //         // var datetime = new Date().toISOString().slice(0,10);
    //         // console.log(datetime);
    //         const response={
    //             status:200,
    //             message:"Payment Successfull",
    //             data:paymentres	
    //         }
    //         res.status(200).json(response)
    //       } else {
    //         const response = {
    //             status: 201,
    //             message: "Operation was not successful",
    //       }
    //      return res.status(201).send(response);
    // }
  } catch (error) {
    console.log("error", error);
    response = {
      status: 201,
      message: "Operation was not successful",
    };
    return res.status(201).send(response);
  }
}


async function paymentInvoices(req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    const type = data.type;
    if (user_id == null || user_type != 1 && user_type != 2 && user_type != 3) {
      var response = {
        status: 200,
        message: "admin is un-authorised !",
      };
      return res.status(200).send(response);
    }


    const payment = await Payment.find(req.query);

    if (payment) {
      var response = {
        status: 200,
        message: "Payment Invoice Successfull",
        data: payment,
      };
      return res.status(200).send(response);
    } else {
      var response = {
        status: 201,
        featureresponce,
        message: "No Payment Invoice Found",
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


async function GetPaymentOrder(req, res) {
  try {
    const order_id = req.params.id;

    // for Production
    sdk.server('https://api.cashfree.com/pg');
    // console.log(order_id);
    // for testing
    //sdk.server('https://sandbox.cashfree.com/pg');
    sdk.GetOrder({
      order_id: order_id,
      'x-client-id': process.env.APP_ID,
      'x-client-secret': process.env.SECRET_KEY,
      'x-api-version': '2022-01-01'
    })
      .then(data => {
        res.json(data);
      })
      .catch(err => {
        var response = {
          status: 201,
          error: err
        };
        return res.status(201).send(response);
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

// this api is not deployed in production mode.
async function Cashpayment(req, res) {
  try {
      const data = jwt_decode(req.headers.token);
      const user_id = data.user_id;
      const user_type = data.user_type;

      if (user_id == null || (user_type != 1 && user_type != 3 && user_type != 4)) {
          return res.status(200).json({ status: 200, message: "Admin is unauthorized!" });
      }

      const { customer_id, order_amount, pay_type, booking_id, dealer_id} = req.body;
      const order_id = Math.floor(1000000000000000 + Math.random() * 90000000000000).toString();

      const bookings = await Booking.findById(booking_id);
      console.log(bookings,"bookings")
      const dealer = await Dealer.findById(dealer_id);
      const trackings = await Tracking.findOne({ booking_id: booking_id });
      const PaymentCheck = await Payment.findOne({ booking_id: booking_id });

      if (!bookings) {
          return res.status(200).json({ status: 200, message: "No Booking Found" });
      }

      if (!dealer) {
          return res.status(200).json({ status: 200, message: "No Dealer Found" });
      }

      if (PaymentCheck) {
          return res.status(200).json({ status: 200, message: "Payment already received for thi booking",data:PaymentCheck });
      }

    // This represents 10%
      const commissionPercentage = (order_amount * dealer.commission) / 100; // Calculate commission amount as percentage of order_amount
      

      // Deduct commission amount from the dealer's wallet if payment type is cash
      // if (pay_type === "cash") {
      //     if (dealer.wallet >= commissionPercentage) {
      //         // Sufficient balance in dealer's wallet
      //       } else {
      //         // Insufficient balance in dealer's wallet, allow wallet to go into negative balance
      //         dealer.wallet -= commissionPercentage;
      //         await dealer.save();
      //       }
      //     }
      dealer.wallet -= commissionPercentage;
      await dealer.save();

      const datas = {
          orderId: order_id,
          booking_id: booking_id,
          dealer_id: dealer_id,
          user_id: customer_id,
          orderAmount: order_amount,
          payment_type: "cash",
          order_status: "PAID",
          order_currency: 'INR',
      };

      const payment = await Payment.create(datas);

      // Create wallet document
      const walletData = {
          dealer_id: dealer._id,
          user_id: customer_id,
          Amount: order_amount,
          Type: 'Debit',
          Note: 'Cash Payment received',
          Total: dealer.wallet,
      };
      await Wallet.create(walletData);

      // Update Booking status
    const updatebookStatus =   await Booking.findByIdAndUpdate(
          { _id: booking_id },
          { $set: { status: "cash received" } },
          { new: true }
      );
console.log(updatebookStatus,"status")
      // Update Tracking status
      await Tracking.findByIdAndUpdate(
          { _id: trackings._id },
          { $set: { status: "cash received" } },
          { new: true }
      );

      return res.status(200).json({ status: 200, message: "Cash Payment successful", data: payment });
  } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ status: 500, message: "Operation was not successful" });
  }
}

async function GetPayment(req, res) {
  try {

    const payment = await Payment.findById(req.params.id);

    if (payment) {
      var response = {
        status: 200,
        message: "successfull",
        data: payment,
      };
      return res.status(200).send(response);
    } else {
      var response = {
        status: 201,
        message: "No Payment Found",
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


async function GetAllPayment(req, res) {
  try {

    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;
    if (user_id == null || user_type != 1 && user_type != 3 && user_type != 2) {
      var response = {
        status: 200,
        message: "admin is un-authorised !",
      };
      return res.status(200).send(response);
    }

    const payment = await Payment.find(req.query)
      .populate({ path: "user_id", select: ['first_name', 'last_name',"id"] })
      .populate({ path: "booking_id", select: ['id'] })
      .populate({ path: "dealer_id", select: ['name',"id"] })
      
      .sort({ "_id": -1 });

    if (payment) {

      // payment.forEach(async (data) => {

      //   if (data.dealer_id && data.dealer_id.wallet) {
      //     // You can now access the 'Total' field like this:
      //     const dealerTotalAmount = data.dealer_id.wallet.Total;
      //     console.log("Total Wallet Amount for Dealer:", dealerTotalAmount);
      //   }

        // for Production
        // sdk.server('https://api.cashfree.com/pg');
        //console.log(order_id);
        // for testing
        // https://sandbox.cashfree.com/pg/orders/${data.orderId}
        // const payment_id = data._id
        // testing 
        // await axios.get(`https://sandbox.cashfree.com/pg/orders/${data.orderId}`,

        // production
      //   await axios.get(`https://api.cashfree.com/pg/orders/${data.orderId}`,
      //     {
      //       headers: {
      //         'Content-Type': 'application/json',
      //         'x-client-id': process.env.APP_ID,
      //         'x-client-secret': process.env.SECRET_KEY,
      //         'x-api-version': "2022-01-01"
      //       }
      //     })
      //     .then(async (datas) => {

      //       if (datas.data.order_status == "PAID") {

      //         // datas.data.order_status = "PAID"
      //         // await datas.save();

      //         const dataz =
      //         {
      //           status: "payment",
      //         };

      //         const datazz =
      //         {
      //           status: "Payment",
      //         };

      //         const datazs =
      //         {
      //           order_status: "PAID",
      //         };

      //         await Payment.findByIdAndUpdate(
      //           { _id: payment_id },
      //           { $set: datazs },
      //           { new: true });


      //         await Booking.findByIdAndUpdate(
      //           { _id: data.booking_id },
      //           { $set: dataz },
      //           { new: true });

      //         const tracks = await Tracking.findOne({ booking_id: data.booking_id });

      //         await Tracking.findByIdAndUpdate(
      //           { _id: tracks._id },
      //           { $set: datazz },
      //           { new: true });
      //       }
      //     })
      //     .catch(err => console.log(err.stack));
      // })
      var response = {
        status: 200,
        message: "successfull",
        data: payment,
      };
      return res.status(200).send(response);
    } else {
      var response = {
        status: 201,
        data: [],
        message: "No payment Found",
      };
      return res.status(201).send(response);
    }
  } catch (error) {

    response = {
      status: 201,
      message: "Operation was not successful",
      error: error
    };

    return res.status(201).send(response);
  }
}


// async function payment(req, res) {
//   try {

//     const { customer_id, customer_name, customer_email, customer_phone,
//       order_amount, booking_id, dealer_id, return_url } = req.body;

//     var order_id = Math.floor(1000000000000000 + Math.random() * 90000000000000).toString();


//     const user = {
//       order_meta: {
//         // return_url: `https://merchantsite.com/return?order_id={order_id}`
//         // return_url: return_url
//         return_url: `https://mrbikedoctor.in/api/returnurl`
//       },
//       customer_details: {
//         customer_id: customer_id,
//         customer_name: customer_name,
//         customer_email: customer_email,
//         customer_phone: customer_phone
//       },
//       order_tags: {
//         booking_id: booking_id,
//         dealer_id: dealer_id
//       },
//       orderId:"Order_"+order_id,
//       order_amount: order_amount,
//       order_currency: 'INR',
//       order_id: "Ord_"+order_id,
//       order_note: "Booking order"
//     }

//     // console.log(user.customer_details);
//     // console.log(user.order_tags);
//     // console.log(user.order_amount);
//     // console.log(user.order_id);
//     // console.log(55555555555);

//     // testing
//     await axios.post("https://sandbox.cashfree.com/pg/orders", user, {

//     // for production
//     // await axios.post("https://api.cashfree.com/pg/orders", user, {
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-version': "2023-08-01",
//         'x-client-id': process.env.APP_ID,
//         'x-client-secret': process.env.SECRET_KEY,
//         // 'x-api-version': "2022-01-01",   // v2
//         // 'x-api-version': "2022-09-01",   // v3
//         // 'x-api-version': "2023-08-01",   // v4
//       },
//     })
//     .then((result) => {
//         console.log("result" , result);
//         var response = {
//           status: 200,
//           message: "Payment Order Created Successfully",
//           order_token: result.data.order_token,
//           payment_link: result.data.payment_link,
//           stack: 'good',
//           return_data: result.data,
//         };
//         return res.status(200).send(response);
//       })
//       .catch((e) => res.json({ error: e.stack }))

//   } catch (error) {
//     response = {
//       status: 201,
//       message: "Operation was not successful",
//       error: error
//     };
//     return res.status(201).send(response);
//   }
// }



async function paymentNew(req, res) {
  try {
  var receipt = Math.floor(
        1000000000000000 + Math.random() * 90000000000000
      ).toString();
  
      const razorpayData = {
        amount: req.body.amount,
        currency: req.body.currency,
        receipt: receipt,
        notes: {
          // orderNote: req.body.notes.orderNote,
          customerName: req.body.customerName,
          customerEmail: req.body.customerEmail,
          customerPhone: req.body.customerPhone,
          customer_id: req.body.customer_id,
          booking_id: req.body.booking_id,
          dealer_id: req.body.dealer_id,
          method:req.body.method
        },
      };
  
      const config = {
        auth: {
          username: "rzp_test_TImTSdtCMH1eMv",
        password: "5gpvEPZjQsa8klSeYdu1Ht4N"
        },
        headers: {
          "Content-Type": "application/json",
        },
      };
  
      const response = await axios.post('https://api.razorpay.com/v1/orders', razorpayData, config);

      // const paymentData = {
      //   // cf_order_id: result?.data.cf_order_id,
      //   orderId: order_id,
      //   booking_id: booking_id,
      //   dealer_id: dealer_id,
      //   user_id: customer_id,
      //   orderAmount: order_amount,
      //   order_status: "Order created",
      //   // order_token: result?.data.order_token,
      //   // users_id: customer?.id,
      //   // dealers_id: dealer?.id,
      // };
      // await Payment.create(paymentData);
  
      res.json({ postData: response.data, url: 'https://api.razorpay.com/v1/checkout' });
    } catch (error) {
      console.log("error", error);
      const response = {
        status: 500,
        message: "Operation was not successful"
      };
      return res.status(500).json(response);
    }
};


// CashFree payment Return URL
// async function Returnurl(req, res) {

//   try {

//     const order_id = req.query.order_id;
//     console.log("teststeste===========>",req.query.order_id);



//     // for testing
//     await axios.get(`https://sandbox.cashfree.com/pg/orders/${order_id}`,

//     // for Production
//     // axios.get(`https://api.cashfree.com/pg/orders/${order_id}`,
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'x-client-id': process.env.APP_ID,
//           'x-client-secret': process.env.SECRET_KEY,
//           'x-api-version': "2023-08-01"
//         }
//       })
//       .then(async (result) => {
//         // console.log("result",result);

//         const customer = await customers.findById(result?.data.customer_details.customer_id);
//         const dealer = await Dealer.findById(result?.data.order_tags.dealer_id);

//         const datass = {
//           cf_order_id: result?.data.cf_order_id,
//           orderId: result?.data.order_id,
//           booking_id: result?.data.order_tags.booking_id,
//           dealer_id: result?.data.order_tags.dealer_id,
//           user_id: result?.data.customer_details.customer_id,
//           orderAmount: result?.data.order_amount,
//           order_status: result?.data.order_status,
//           order_token: result?.data.order_token,
//           users_id: customer?.id,
//           dealers_id: dealer?.id,
//           payment_type: 'Online',
//           // method:result?.data.notes.method,
//         }
//         console.log(datass)

//         // await Payment.create(datass);

//         if(result?.data.order_status == "PAID"){

//           await Payment.updateOne(
//             { orderId: datass.orderId }, // match condition
//             datass, // update fields
//             { upsert: true } // create a new document if no match is found
//           );

//           const percentageAmount = (dealer.commission/100) * result?.data.order_amount
//           dealer.wallet += result?.data.order_amount-percentageAmount;
//           await dealer.save();

//             const walletData = {
//               dealer_id: dealer?._id,
//               user_id: customer?._id,
//               Amount: result?.data.order_amount, // paid amount
//               Type: 'Credit', 
//               Note: 'Online payment received, commission deducted', 
//               Total:  dealer.wallet
//             };
//                 // Create wallet document
//            const check = await Wallet.create(walletData);
//            console.log(check,"data")

//             //  Update booking status
//             await Booking.findOneAndUpdate({ _id:result?.data.order_tags.booking_id }, { status: 'Payment' });
//             // Update tracking status
//             const trackings = await Tracking.findOneAndUpdate({ booking_id: result?.data.order_tags.booking_id },{ status: 'Payment' })
//             console.log(trackings);  
//          }

//         const dataz = {
//           amount: result?.data.order_amount,
//           Cashfree_order_id: result.data.cf_order_id,
//           orderId: result?.data.order_id,
//           order_status: result?.data.order_status,
//         }
        
//         // return res.status(201).send("ok");
//         return res.status(201).json({ result: dataz });
//         // res.render('response', { postData: JSON.stringify(dataz) });
//       })
//       .catch((e) => {
//         console.error(e.stack)
//         return res.json({ error: e.stack });
//       })
//   } catch (error) {
//     response = {
//       status: 201,
//       message: "Operation was not successful",
//       error: error
//     };
//     return res.status(201).send(response);
//   }
// }






const secret_key = process.env.SECRETKEYTESTWEBHOOK;
// router.post("/update_order", async (req, res) => {
async function Returnurlweb (req, res){
  // console.log(
  //   "update_order-------astropush123-------payment-----entity---------->",
  //   req.body.payload.payment.entity
  // );
  const data = crypto.createHmac("sha256", secret_key);
  data.update(JSON.stringify(req.body));
  const digest = data.digest("hex");
  if (digest === req.headers["x-razorpay-signature"]) {
    console.log("request is legit");
    //we can store detail in db and send the response
    var status = req.body.payload.payment.entity.status || "success"; // for testing
    var order_id = req.body.payload.payment.entity.order_id || ""; // for testing
    var transaction_id = req.body.payload.payment.entity.id || ""; // for testing
    if (status == "authorized") {
      if (order_id) {
        var order_data = await Payment.findOne({ orderId: order_id });
        console.log("order_data------->", order_data);
        var error_data = "";
        await paymentAttemptSave(order_data.user_id,order_id,order_data.amount,transaction_id,status,error_data,order_data.platform
        );
        if (order_data) {
          await user_wallet_add(order_data.amount,order_data.wallet_amount,transaction_id,order_data.wallet_offer_id,order_data.gst_amount,order_id,order_data.user_id
          );
        }
      }
    } else if (status == "failed") {
      var order_data = await Payment.findOne({ orderId: order_id });
      var payment_data = req.body.payload.payment.entity;
      var error_data = {
        error_code: payment_data.error_code,
        error_description: payment_data.error_description,
        error_source: payment_data.error_source,
        error_step: payment_data.error_step,
        error_reason: payment_data.error_reason,
      };
      const myJSON = JSON.stringify(error_data);
      var update_data = {
        order_status: "failed",
        transaction_id: payment_data.id,
        error_data: myJSON,
      };
      console.log("update_data----->", update_data);
      // await Payment.findOneAndUpdate(
      //   { orderId: order_id },
      //   update_data,
      //   { new: true },
      //   (err, doc) => {
      //     console.log(doc);
      //     console.log("err", err);
      //   }
      // );
      await paymentAttemptSave(
        order_data.user_id,
        order_id,
        order_data.amount,
        transaction_id,
        status,
        myJSON
      );
    }
    return res.status(200).json({
      status: "ok",
      result: null,
    });
  } else {
    return res.status(200).send("Invalid signature");
  }
};

function paymentAttemptSave(user_id,order_id,amount,transaction_id,status,error_data,platform) {
  colcole.log("paymentAttemptSave",user_id,order_id,amount,transaction_id,status,error_data,platform );
  // var admin_data = new PaymentAttempt();
  // admin_data.user_id = user_id;
  // admin_data.order_id = order_id;
  // admin_data.amount = amount;
  // admin_data.transaction_id = transaction_id;
  // admin_data.status = status;
  // admin_data.error_data = error_data ? error_data : "";
  // admin_data.Created_date = get_current_date();
  // admin_data.platform = platform;
  // console.log("paymentAttemptSave---admin_data------>", admin_data);
  // admin_data.save((err, doc) => {
  //   console.log("paymentAttemptSave--------->", doc);
  //   console.log("paymentAttemptSave---err------>", err);
  // });
}

function user_wallet_add(amount,wallet_amount,transaction_id,wallet_offer_id,gst_amount,order_id,user_id) {
  console.log("user_wallet_add", amount,wallet_amount,transaction_id,wallet_offer_id,gst_amount,order_id,user_id)


  // var request = require("request");
  // var options = {
  //   method: "POST",
  //   url: base_url + "user_api/user_wallet_add_webhook",
  //   headers: {
  //     "Content-Type": "application/json",
  //     // 'Authorization': 'Bearer '+token,
  //     // 'Cookie': 'connect.sid=s%3AlBsHQaYI2l2rYXiSr3W2hodhBjKfJpx7.gPanv3M7tX1vhDrCn1IgWROYMFRgQ23Kzm2MI%2BqixhQ'
  //   },
  //   body: JSON.stringify({
  //     user_id: user_id,
  //     amount: amount,
  //     wallet_amount: wallet_amount,
  //     transaction_id: transaction_id,
  //     wallet_offer_id: wallet_offer_id,
  //     order_id: order_id,
  //     gst_amount: gst_amount,
  //   }),
  // };
  // request(options, function (error, response) {
  //   if (error) throw new Error(error);
  //   console.log("user_wallet_add_webhook------------->", response.body);
  // });
}

async function makeTransfer(vendorId, transferAmount, remark) {
    try {
        const response = await axios.post(`https://sandbox.cashfree.com/pg/easy-split/vendors/D-${vendorId}/transfer`, {
            transfer_from: 'MERCHANT',
            transfer_type: 'DIRECT_BANK_TRANSFER',
            transfer_amount: transferAmount,
            remark: remark
        }, {
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': '145051b44a8163dab2b9915df0150541',
                'x-client-secret': '9f8c083893c1969049995373f3f922c5c7232db5'
                // 'x-client-id': process.env.APP_ID,
                // 'x-client-secret': process.env.SECRET_KEY,
            }
        });
        
        console.log('Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error:', error.response.data);
        throw error;
    }
}

async function saveCard(req, res) {
  try {
    const { cardNumber, cardHolderName, expirationMonth, expirationYear, cvv } = req.body;

    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const user_type = data.user_type;

    if (expirationMonth < 1 || expirationMonth > 12) {
      return res.status(200).json({ error: 'Invalid expiration month' });
    }

    const currentYear = new Date().getFullYear();
    if (expirationYear < currentYear) {
      return res.status(200).json({ error: 'Invalid expiration year' });
    }
    const newCard = new Card({
      user_id,
      cardNumber,
      cardHolderName,
      expirationMonth,
      expirationYear,
      cvv,
    });
    await newCard.save();

    return res.status(201).json({ message: 'Card saved successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

async function getAllCards (req, res) {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;

    const cards = await Card.find({ user_id });

    return res.status(200).json(cards);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

async function deleteCard (req, res) {
  try {
        const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    const cardId = req.params.id;
    const card = await Card.findOne({ _id: cardId, user_id });

    if (!card) {
            return res.status(200).json({ error: 'Card not found' });
    }
    await card.remove();
    return res.status(200).json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


const razorpay = new Razorpay({
  key_id: API_KEY_ID,
  key_secret: API_KEY_SECRET
});

async function ReturnurlNew(req, res) {
  console.log("Returnurl triggered");

  try {
    const order_id = req.query.order_id;

    const result = await axios.get(`https://api.razorpay.com/v1/orders/${order_id}`, {
      auth: {
        username: "rzp_test_TImTSdtCMH1eMv",
        password: "5gpvEPZjQsa8klSeYdu1Ht4N"
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("result", result.data);

    const customer = await customers.findById(result?.data.notes.customer_id);
    const dealer = await Dealer.findById(result?.data.notes.dealer_id);

    const datass = {
      orderId: result?.data.id,
      booking_id: result?.data.notes.booking_id,
      dealer_id: result?.data.notes.dealer_id,
      user_id: result?.data.notes.customer_id,
      orderAmount: result?.data.amount / 100,
      order_status: result?.data.status,
      method:result?.data.notes.method,
      users_id: customer?.id,
      dealers_id: dealer?.id,
      payment_type: 'Online',
    };

    
    if (result?.data.status === "paid") {
      await Payment.updateOne(
        { orderId: datass.orderId }, // match condition
        datass, // update fields
        { upsert: true } // create a new document if no match is found
      );
      const amountPaid = result?.data.amount / 100;
      const commission = (10 / 100) * amountPaid;
      console.log(commission,"commission")
      
      if (result?.data.notes.method === "cash") {
        // Deduct the commission amount from dealer's wallet
        dealer.wallet -= commission;
        await dealer.save();

        const walletData = {
          dealer_id: dealer?._id,
          user_id: customer?._id,
          Amount: amountPaid, // paid amount
          Type: 'Debit',
          Note: 'Cash payment received, commission deducted',
          Total: dealer.wallet // Updated wallet balance
        };

        await Wallet.create(walletData);
      } else {
        // For online payment, add the amount to dealer's wallet after deducting commission
        dealer.wallet += amountPaid - commission;
        await dealer.save();

        const walletData = {
          dealer_id: dealer?._id,
          user_id: customer?._id,
          Amount: amountPaid, // paid amount
          Type: 'Credit',
          Note: 'Online payment received, commission deducted',
          Total: dealer.wallet // Updated wallet balance
        };

        await Wallet.create(walletData);

        const commition = 0

        const settlementAmount = (amountPaid - commission) * 100; // Convert to smallest currency unit (e.g., paise for INR)

      }

      // Update booking status
      await Booking.findOneAndUpdate({ _id: result?.data.notes.booking_id }, { status: 'Payment' });

      // Update tracking status
      const trackings = await Tracking.findOneAndUpdate({ booking_id: result?.data.notes.booking_id }, { status: 'Payment' });
      console.log(trackings);
    }

    const dataz = {
      amount: result?.data.amount / 100,
      orderId: result?.data.id,
      order_status: result?.data.status,
    };

    return res.status(201).json(result.data);

  } catch (error) {
    console.error(error.stack);
    const response = {
      status: 201,
      message: "Operation was not successful",
      error: error
    };
    return res.status(201).send(response);
  }
}



const Ondemand = async (req, res) => {
  try {
    const { amount, description, notes, dealerId, commissionPercentage, method } = req.body;

    // Fetch dealer details from the database
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      return res.status(200).json({ message: "Dealer not found" });
    }

    // Calculate the commission amount
    const commission = (commissionPercentage / 100) * amount;

    if (method === 'cash') {
      // Deduct the commission amount from dealer's wallet
      dealer.wallet -= commission;
    } else {
      // For online payments, add the amount to the dealer's wallet after deducting commission
      dealer.wallet += amount - commission;
    }

    // Save the updated wallet balance
    await dealer.save();

    // Create a wallet transaction entry
    const walletData = {
      dealer_id: dealer._id,
      amount: amount,
      type: method === 'cash' ? 'Debit' : 'Credit',
      note: method === 'cash' ? 'Cash payment received, commission deducted' : 'Online payment received, commission deducted',
      total: dealer.wallet // Updated wallet balance
    };

    await Wallet.create(walletData);

    // Prepare settlement data
    const settlementAmount = (amount - commission) * 100; // Convert to the smallest currency unit (e.g., paise for INR)

    const settlementResponse = await razorpay.settlements.createOndemandSettlement({
      amount: settlementAmount,
      settle_full_balance: false,
      description: description,
      notes: {
        ...notes,
        dealer_id: dealer._id.toString()
      }
    });

    res.status(201).json(settlementResponse);
  } catch (error) {
    console.error("Error creating on-demand settlement:", error);
    res.status(500).json({
      message: "Failed to create on-demand settlement",
      error: error.message
    });
  }
};

const razorpayInstance = new Razorpay({
  key_id: API_KEY_ID,
  key_secret: API_KEY_SECRET
});

async function onDemandNew(req, res) {
  try {
    

    const { amount, settle_full_balance, description, notes } = req.body;

    // Create settlement request data
    const requestData = {
      amount: amount,
      settle_full_balance: settle_full_balance,
      description: description,
      notes: notes
    };

    // Create settlement using Razorpay SDK
    razorpayInstance.settlements.createOndemandSettlement(requestData, async function(error, settlement) {
      if (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while initiating settlement',error });
      } else {
        console.log('Settlement created:', settlement);
        
        // Step 2: Update dealer's wallet
        // const dealer = await Dealer.findById(dealer_id);
        // if (!dealer) {
        //   return res.status(200).json({ error: 'Dealer not found' });
        // }
        // if (!dealer.wallet || dealer.wallet < amount) {
        //   return res.status(200).json({ error: 'Insufficient funds in the wallet' });
        // }
        // dealer.wallet -= amount;
        // await dealer.save();

        // Step 3: Send success response
        res.status(200).json({ message: 'On-demand settlement initiated successfully' });
      }
    });
  } catch (error) {
    // Handle any unexpected errors
    console.error('Error:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

async function paymentDealer(req, res) {
  try {
  var receipt = Math.floor(
        1000000000000000 + Math.random() * 90000000000000
  ).toString();
  
      const razorpayData = {
        amount: req.body.amount,
        currency: req.body.currency,
        receipt: receipt,
        notes: {
          // orderNote: req.body.notes.orderNote,
          dealerName: req.body.dealerName,
          dealerEmail: req.body.dealerEmail,
          dealerPhone: req.body.dealerPhone,
         
          dealer_id: req.body.dealer_id,
        },
      };
  
      const config = {
        auth: {
        username: API_KEY_ID,
        password: API_KEY_SECRET
        },
        headers: {
          "Content-Type": "application/json",
        },
      };
  
      const response = await axios.post('https://api.razorpay.com/v1/orders', razorpayData, config);

  
      res.json({ postData: response.data, url: 'https://api.razorpay.com/v1/checkout' });
    } catch (error) {
      console.log("error", error);
      const response = {
        status: 500,
        message: "Operation was not successful"
      };
      return res.status(500).json(response);
    }
};

async function paymentDealerCash (req, res) {
  try {
    const {amount, currency, dealerName, dealerEmail, dealerPhone, dealer_id } = req.body;
    var order_id = Math.floor(1000000000000000 + Math.random() * 90000000000000).toString();
    const user = {
      order_meta: {
        // return_url: `https://merchantsite.com/return?order_id={order_id}`
        // return_url: return_url
        return_url: `https://mrbikedoctor.in/api/returnurl`
      },
      customer_details: {
      },
      order_tags: {
        dealer_id: dealer_id,
        dealer_id: dealer_id,
        dealer_id: dealer_id,
        dealer_id: dealer_id,
      },
      orderId:"Order_"+order_id,
      order_amount: amount,
      order_currency: 'INR',
      order_id: "Ord_"+order_id,
      order_note: "Recharge wallet"
    }

  var receipt = Math.floor(
        1000000000000000 + Math.random() * 90000000000000
  ).toString();
  
      const razorpayData = {
        amount: req.body.amount,
        currency: req.body.currency,
        receipt: receipt,
        notes: {
          // orderNote: req.body.notes.orderNote,
          dealerName: req.body.dealerName,
          dealerEmail: req.body.dealerEmail,
          dealerPhone: req.body.dealerPhone,
         
          dealer_id: req.body.dealer_id,
        },
      };
  
      const config = {
        auth: {
        username: API_KEY_ID,
        password: API_KEY_SECRET
        },
        headers: {
          "Content-Type": "application/json",
        },
      };
  
      const response = await axios.post('https://api.razorpay.com/v1/orders', razorpayData, config);

  
      res.json({ postData: response.data, url: 'https://api.razorpay.com/v1/checkout' });
    } catch (error) {
      console.log("error", error);
      const response = {
        status: 500,
        message: "Operation was not successful"
      };
      return res.status(500).json(response);
    }
};

async function ReturnurlDealer(req, res) {
  console.log("Returnurl triggered");

  try {
    const order_id = req.query.order_id;

    const result = await axios.get(`https://api.razorpay.com/v1/orders/${order_id}`, {
      auth: {
        username: API_KEY_ID,
        password: API_KEY_SECRET
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("result", result.data);

    const dealer = await Dealer.findById(result?.data.notes.dealer_id);
   

    const datass = {
      orderId: result?.data.id,
      dealer_id: result?.data.notes.dealer_id,
      orderAmount: result?.data.amount / 100,
      order_status: result?.data.status,
      method: result?.data.notes.method,
      dealers_id: dealer?.id,
    };

    await Payment.updateOne({ orderId: order_id }, datass);
    await Payment.create(datass);

    if (result?.data.status === "paid") {
      const amountPaid = result?.data.amount / 100;
      // const amountPaid = result?.data.amount
      console.log(amountPaid,"amunt")
      const commission = 0;
      console.log(dealer.wallet,"dealer")
      dealer.wallet += amountPaid - commission;
      await dealer.save();

      const walletData = {
        dealer_id: dealer?._id,
        Amount: amountPaid, // paid amount
        Type: 'Credit',
        Note: 'recharge successfully',
        Total: dealer.wallet // Updated wallet balance
      };

      await Wallet.create(walletData);
    } 
    const dataz = {
      amount: result?.data.amount / 100,
      orderId: result?.data.id,
      order_status: result?.data.status,
    };

    return res.status(201).json(result.data);

  } catch (error) {
    console.error(error.stack);
    const response = {
      status: 201,
      message: "Operation was not successful",
      error: error
    };
    return res.status(201).send(response);
  }
}

const createContact = async (req, res) => {
  const { name, email, contact, dealerId } = req.body;
  
  try {
      // Create contact in Razorpay
      const response = await axios.post('https://api.razorpay.com/v1/contacts', {
          name,
          email,
          contact
      }, {
          auth: {
              username: API_KEY_ID,
              password: API_KEY_SECRET
          }
      });

      // Save contact data to MongoDB
      const contactData = {
          name,
          email,
          contact,
          dealerId
      };

      const newContact = new contacts(contactData);
      await newContact.save();

      res.json({ razorpayResponse: response.data });
  } catch (error) {
      console.log(error);
      res.status(500).json(error);
  }
};

const CreateFund =  async (req, res) => {
  const { contact_id, account_type, bank_account, dealerId } = req.body;
  
  try {
      const response = await axios.post('https://api.razorpay.com/v1/fund_accounts', {
          contact_id,
          account_type,
          bank_account
      }, {
          auth: {
              username: API_KEY_ID,
              password: API_KEY_SECRET
          }
      });

      console.log("response =========>",response)

      const { name, ifsc, account_number } = req.body.bank_account;
      const fund_id = response.data.id
      const fundAccountData = {
        fund_id,
        contact_id,
        account_type,
        name,
        ifsc,
        account_number,
        dealerId
      };

      const newFundAccount = new FundAccount(fundAccountData);

      await newFundAccount.save();

      res.json(newFundAccount);
  } catch (error) {
      console.log(error);
      res.status(500).json(error);
  }
};

const AllFund =  async (req, res) => {
  try {

    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;

      const fundAccounts = await FundAccount.find({ "dealerId": user_id });
      res.json(fundAccounts);
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

const AllContact =  async (req, res) => {

  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id
    const contactAccounts = await contacts.find({ "dealerId": user_id });

      res.json(contactAccounts);
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

// PhonePay
function generatedTranscId() {
  return 'T' + Date.now();
}

const PhonepaynewPayment = async (req, res) => {
  try {
    const userdata = jwt_decode(req.headers.token);
    const user_id = userdata.user_id;

    const user = await customers.findById(user_id);
    if (!user) {
      return res.status(200).json({ msg: 'User not found' });
    }

    const { booking_id, dealer_id, order_amount } = req.body;

    // Validate order_amount
    const parsedOrderAmount = parseFloat(order_amount);
    if (isNaN(parsedOrderAmount) || parsedOrderAmount < 1) {
      return res.status(200).json({ msg: 'Invalid order amount' });
    }

    const generatedTransactionId = generatedTranscId();

    const data = {
      merchantId: "M22QPAB8V1OYHUAT",
      merchantTransactionId: generatedTransactionId,
      user_id: user_id,
      booking_id: booking_id,
      dealer_id: dealer_id,
      amount: parsedOrderAmount * 100, // Using parsedOrderAmount here
      order_status: "pending",
      redirectUrl: `http://localhost:3001/api/v1/orders/status/${generatedTransactionId}`,
      redirectMode: "POST",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // Save the initial data to the database
    await Payment.create({
      orderId: generatedTransactionId,
      user_id: user_id,
      booking_id: booking_id,
      dealer_id: dealer_id,
      orderAmount: parsedOrderAmount * 100,
      order_status: "pending",
    });

    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");

    const key = "0f0a921e-a289-4353-888d-3169a8c73eb7";
    const keyIndex = 1;
    const string = payloadMain + "/pg/v1/pay" + key;

    const sha256 = CryptoJS.SHA256(string).toString();
    const checksum = sha256 + "###" + keyIndex;

    const prod_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
    const requestData = {
      method: "POST",
      url: prod_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadMain,
      },
    };

    axios.request(requestData)
      .then(async function (response) {
        const phonePeTransactionId = response.data.data.merchantTransactionId;
        res.status(201).send({
          msg: "payment done",
          status: "success",
          data: response.data,
          phonePeTransactionId: phonePeTransactionId,
        });
        console.log("Payment API Response:", response.data);
      })
      .catch(function (error) {
        console.error("Payment API Error:", error);
        res.status(500).json({ msg: "Payment Failed", status: "error", error: error.message });
      });
  } catch (e) {
    console.error("Internal Server Error:", e.message);
    res.status(500).json({ msg: "Internal Server Error", status: "error", error: e.message });
  }
};


const PhonepaycheckStatus = async (req, res) => {
  try {
    const merchantTransactionId = req.params.txnId;
    const merchantUserId = "M22QPAB8V1OYHUAT";
    const key = "0f0a921e-a289-4353-888d-3169a8c73eb7";

    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantUserId}/${merchantTransactionId}` + key;
    const sha256 = CryptoJS.SHA256(string).toString();
    const checksum = sha256 + "###" + keyIndex;

    const URL = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantUserId}/${merchantTransactionId}`;

    const options = {
      method: 'GET',
      url: URL,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantUserId,
      }
    };

    console.log("Status API Request Options:", options);

    try {
      const response = await axios.request(options);

      // Retrieve the initial data from the database
      const paymentRecord = await Payment.findOne({ orderId: merchantTransactionId });
      
      const dealer = await Dealer.findById(paymentRecord.dealer_id)
     

      if (!paymentRecord) {
        return res.status(200).json({ msg: "Payment record not found", status: "error" });
      }

      if (response.data.data.responseCode === 'SUCCESS') {
        // Update the payment status in the database
        paymentRecord.order_status = 'success';
        await paymentRecord.save();
       
        const amountPaid = paymentRecord.orderAmount / 100; // Convert orderAmount from cents to dollars
        console.log(amountPaid, "amountPaid");
        
        const commissionRate = 10; // Commission rate in percentage
        const commissionAmount = (commissionRate / 100) * amountPaid; // Calculate commission amount
        
        console.log(commissionAmount, "commissionAmount");
        
        // Subtract commission from amountPaid to get the amount to add to dealer's wallet
        const amountToAddToWallet = amountPaid - commissionAmount;
        
        // Add amountToAddToWallet to dealer's wallet
        dealer.wallet += amountToAddToWallet;
        await dealer.save();

   
  
        const walletData = {
          dealer_id: dealer?._id,
          Amount: amountPaid, // paid amount
          Type: 'Credit',
          Note: 'recharge successfully by phonepay',
          Total: dealer.wallet // Updated wallet balance
        };
  
        await Wallet.create(walletData);
       


        return res.status(201).json(response.data);
      } else {
        // Handle other response codes if necessary
        paymentRecord.order_status = 'failed';
        await paymentRecord.save();
        
        return res.status(200).json(response.data);
      }


    } catch (error) {
      console.error("Status API Error:", error);
      if (error.response) {
        console.error("Status API Error Response Data:", error.response.data);
      }
      res.status(500).json({ msg: "Error checking payment status", status: "error", error: error.message });
    }
  } catch (error) {
    console.error("Internal Server Error:", error.message);
    res.status(500).json({ msg: "Internal Server Error", status: "error", error: error.message });
  }
};

async function paymentDealerCash(req, res) {
  try {
    const { dealerName, dealerEmail, dealerPhone, order_amount, dealer_id, return_url } = req.body;

    const order_id = Math.floor(1000000000000000 + Math.random() * 90000000000000).toString();

    const user = {
      order_meta: {
        return_url: return_url || `https://mrbikedoctor.in/api/returnurl`
      },
      customer_details: {
        customer_id: dealer_id,        
        customer_name: dealerName,     
        customer_email: dealerEmail,  
        customer_phone: dealerPhone   
      },
      orderId: "Order_" + order_id,
      order_amount: order_amount,
      order_currency: 'INR',
      order_id: "Ord_" + order_id,
      order_note: "Recharge"
    };

    // Log for debugging
    console.log("Request Body:", user);

    await axios.post("https://sandbox.cashfree.com/pg/orders", user, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': "2023-08-01",
        'x-client-id': process.env.APP_ID,
        'x-client-secret': process.env.SECRET_KEY
      }
    })
    .then((result) => {
      console.log("Result:", result.data);
      const response = {
        status: 200,
        message: "Payment Order Created Successfully",
        order_token: result.data.order_token,
        payment_link: result.data.payment_link,
        return_data: result.data
      };
      return res.status(200).send(response);
    })
    .catch((e) => {
      console.error("Error:", e.response ? e.response.data : e.message);
      res.status(e.response ? e.response.status : 500).json({ error: e.response ? e.response.data : e.message });
    });

  } catch (error) {
    console.error("Catch Error:", error);
    const response = {
      status: 500,
      message: "Operation was not successful",
      error: error.message
    };
    return res.status(500).send(response);
  }
}

async function ReturnurlDealerCash(req, res) {

  try {

    const order_id = req.query.order_id;
    console.log("teststeste===========>",req.query.order_id);



    // for testing
    await axios.get(`https://sandbox.cashfree.com/pg/orders/${order_id}`,

    // for Production
    // axios.get(`https://api.cashfree.com/pg/orders/${order_id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.APP_ID,
          'x-client-secret': process.env.SECRET_KEY,
          'x-api-version': "2023-08-01"
        }
      })
      .then(async (result) => {
        console.log("result",result.data);

        const customer = await customers.findById(result?.data.customer_details.customer_id);
        const dealer = await Dealer.findById(result?.data.customer_details.customer_id);

        const datass = {
          cf_order_id: result?.data.cf_order_id,
          orderId: result?.data.order_id,
          dealer_id: result?.data.customer_details.customer_id,
          orderAmount: result?.data.order_amount,
          order_status: result?.data.order_status,
          order_token: result?.data.order_token,
          payment_type: 'Online',
          // method:result?.data.notes.payment_methods,
        }
        console.log(datass)

        await Payment.create(datass);

        if(result?.data.order_status == "PAID"){

          await Payment.updateOne(
            { orderId: datass.orderId }, 
            datass, 
            { upsert: true } 
          );

          dealer.wallet += result?.data.order_amount
          await dealer.save();

            const walletData = {
              dealer_id: dealer?._id,
              Amount: result?.data.order_amount,
              Type: 'Credit', 
              Note: 'RECHARGE', 
              Total:  dealer.wallet
            };
                // Create wallet document
           const check = await Wallet.create(walletData);
           console.log(check,"data")

         }

        const dataz = {
          amount: result?.data.order_amount,
          Cashfree_order_id: result.data.cf_order_id,
          orderId: result?.data.order_id,
          order_status: result?.data.order_status,
        }
        
        // // return res.status(201).send("ok");
        return res.status(201).json({ result: dataz });
        // res.render('response', { postData: JSON.stringify(dataz) });
      })
      .catch((e) => {
        console.error(e.stack)
        return res.json({ error: e.stack });
      })
  } catch (error) {
    response = {
      status: 201,
      message: "Operation was not successful",
      error: error
    };
    return res.status(201).send(response);
  }
}

// //////// Payout process ceshfree //////////////////

const APP_ID_P = process.env.APP_ID_P;
const SECRET_KEY_P = process.env.SECRET_KEY_P

const createBeneficiary = async (req, res) => {
  try {
    const data = jwt_decode(req.headers.token);
    const user_id = data.user_id;
    console.log(user_id);
    console.log("dealer id >>>>>>>>>>",user_id);

      const beneficiary_id = crypto.randomBytes(10).toString("hex");
      const { beneficiary_name, beneficiary_instrument_details,beneficiary_contact_details } = req.body;

      // Ensure you have the required parameters
      // if (!beneficiary_id || !beneficiary_name || !beneficiary_instrument_details) {
      //     return res.status(200).json({
      //         status: false,
      //         error: 'Missing required parameters'
      //     });
      // }

      // Construct the request body
      let requestBody = {
        beneficiary_id,
          beneficiary_name,
          beneficiary_instrument_details,
          beneficiary_contact_details
      };

      // Make the API call to create a beneficiary
      const response = await axios.post(
          'https://sandbox.cashfree.com/payout/beneficiary',
          requestBody,
          {
              headers: {
                  'x-api-version': '2024-01-01',
                  'x-client-id': APP_ID_P, 
                  'x-client-secret': SECRET_KEY_P, 
                  'Content-Type': 'application/json'
              }
          }
      );

      // Check if the response is successful
      if (response.status === 201) {
        const update_data = {
          beneficiary_id : response.data.beneficiary_id,
          beneficiary_accountNo : response.data.beneficiary_instrument_details?.bank_account_number,
          beneficiary_ifsc : response.data.beneficiary_instrument_details?.bank_ifsc
        }
        // console.log("data",update_data);
        const update_dealer = await Dealer.findByIdAndUpdate(user_id,update_data,{new:true})
          res.status(201).json({ status: true, data: response.data });
      } else {
          res.status(response.status).json({ status: false, error: response.data });
      }
  } catch (error) {
      // Handle error response
      res.status(error.response ? error.response.status : 500).json({
          status: false,
          error: error.response ? error.response.data : error.message
      });
  }
}
const getBeneficiary = async(req,res)=>{
  const data = jwt_decode(req.headers.token);
  const user_id = data.user_id;
  console.log("userid",user_id)

  const dealer = await Dealer.findOne({ _id: user_id });
  console.log(dealer,"dealer")
  const beneficiary_id = dealer?.beneficiary_id
  const bank_account_number = dealer?.beneficiary_accountNo
  const bank_ifsc = dealer?.beneficiary_ifsc

try{

  const getResponse = await axios.get('https://sandbox.cashfree.com/payout/beneficiary', {
    params: { 
      beneficiary_id,
      // bank_account_number,
      // bank_ifsc
    },  
    headers: {
      'x-api-version': '2024-01-01',
      'x-client-id': APP_ID_P, 
      'x-client-secret': SECRET_KEY_P, 
      'Content-Type': 'application/json'
    },
  });

  if (getResponse.data.beneficiary_status === "VERIFIED") {
    res.status(200).json({ status: true, data: getResponse.data });
  } else {

      res.status(200).json({ status: false, message: getResponse.data });
  }

}catch(error){
  console.log(error)
  res.status(500).json({ status: false, message: error.message });

}

}
async function transferFunds(req,res) {
  const data = jwt_decode(req.headers.token);
  const user_id = data.user_id;

    const {
      transfer_amount,
      transfer_remarks,
    } = req.body;
    
    if (!transfer_amount) {
      return res.status(200).json({ status: false, error: 'Missing transfer_amount required parameters' });
    }
    
    const dealer = await Dealer.findOne({ _id: user_id });
    console.log(dealer,"dealer")
    const beneficiary_id = dealer.beneficiary_id
    const bank_account_number = dealer.beneficiary_accountNo
    const bank_ifsc = dealer.beneficiary_ifsc
     console.log(dealer);

   const beneficiary_details =  {
    beneficiary_id,
    bank_account_number,
    bank_ifsc,
  }
    
    if (dealer.wallet < parseInt(transfer_amount, 10)) {
      return res.status(200).json({ status: false, error: 'Insufficient funds in wallet' });
    }
    try {
        const trans_id=crypto.randomBytes(16).toString('hex')
      const response = await axios.post(
        'https://sandbox.cashfree.com/payout/transfers',
        {
          transfer_id:trans_id,
          transfer_amount,
          transfer_currency:'INR',
          transfer_mode :'banktransfer',
          beneficiary_details,
          transfer_remarks,
          fundsource_id:"CASHFREE_171164"
        },
        {
          headers: {
            'x-api-version': '2024-01-01',
            'x-request-id': crypto.randomBytes(16).toString('hex'),
            'x-client-id': APP_ID_P,
            'x-client-secret': SECRET_KEY_P
          }
        }
      );

      res.status(response.status).json({ status: true, data: response.data });

      if(dealer){
      const walletData = {
        dealer_id: dealer?._id,
        Amount: response?.data.transfer_amount, 
        Type: 'Debit', 
        Note: 'Payout', 
        Total:  dealer.wallet - response?.data.transfer_amount
      };
     dealer.wallet= dealer.wallet -response?.data.transfer_amount;
      await dealer.save();
      // Create wallet document
     const check = await Wallet.create(walletData);
     console.log(check,"data")
    }
    } catch (error) {
      console.error(error);
      res.status(error.response ? error.response.status : 500).json({
        status: false,
        error: error.response ? error.response.data : error.message
      });
    }
}

// async function payment(req, res) {
//   try {
//     const { customer_id, customer_name, customer_email, customer_phone,
//       order_amount, booking_id, dealer_id, return_url } = req.body;

//     const order_id = "Order_" + Math.floor(1000000000000000 + Math.random() * 90000000000000).toString();

//     const orderData = {
//       order_meta: {
//         return_url: return_url || "https://mrbikedoctors.com/api"
//       },
//       customer_details: {
//         customer_id: customer_id,
//         customer_name: customer_name,
//         customer_email: customer_email,
//         customer_phone: customer_phone
//       },
//       order_tags: {
//         booking_id: booking_id,
//         dealer_id: dealer_id
//       },
//       order_amount: order_amount,
//       order_currency: 'INR',
//       order_id: order_id,
//       order_note: "Booking order"
//     };

//     // Create an order in Cashfree
//     const response = await axios.post("https://sandbox.cashfree.com/pg/orders", orderData, {
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-version': "2023-08-01",
//         'x-client-id': process.env.APP_ID,
//         'x-client-secret': process.env.SECRET_KEY
//       }
//     });

//     if (response.data && response.data.payment_session_id) {
//       const paymentSessionId = response.data.payment_session_id;
//       const paymentUrl = `https://payments.cashfree.com/order/#payment_session_id=${paymentSessionId}`;

//       // Generate QR code
//       const qrCodeData = await QRCode.toDataURL(paymentUrl);

//       return res.status(200).json({
//         status: 200,
//         message: "Payment Order Created Successfully",
//         order_token: response.data.order_token,
//         payment_link: response.data.payment_link,
//         qr_code: qrCodeData,  // QR Code Image Data
//         return_data: response.data
//       });
//     } else {
//       return res.status(200).json({ status: 200, message: "Failed to create order" });
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     return res.status(500).json({ status: 500, message: "Operation was not successful", error: error.message });
//   }
// }


async function payment(req, res) {
  try {
    const {
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      order_amount,
      booking_id,
      dealer_id,
      return_url,
    } = req.body;

    // Generate a unique order ID
    const order_id = "Order_" + Date.now() + Math.floor(Math.random() * 1000);

    const orderData = {
      order_meta: {
        return_url: return_url || "https://mrbikedoctors.com/api",
      },
      customer_details: {
        customer_id: customer_id,
        customer_name: customer_name,
        customer_email: customer_email,
        customer_phone: customer_phone,
      },
      order_tags: {
        booking_id: booking_id,
        dealer_id: dealer_id,
      },
      order_amount: order_amount,
      order_currency: "INR",
      order_id: order_id,
      order_note: "Booking order",
    };

    // Create an order in Cashfree
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      orderData,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": process.env.APP_ID,
          "x-client-secret": process.env.SECRET_KEY,
        },
      }
    );

    if (response.data && response.data.payment_session_id) {
      const paymentSessionId = response.data.payment_session_id;
      const paymentUrl = `https://payments.cashfree.com/order/#payment_session_id=${paymentSessionId}`;
      console.log("Payment Url", paymentUrl);
      // Generate QR code
      const qrCodeData = await QRCode.toDataURL(paymentUrl);

      return res.status(200).json({
        status: 200,
        message: "Payment Order Created Successfully",
        order_token: response.data.order_token,
        payment_link: paymentUrl,
        qr_code: qrCodeData,
        order_id: order_id,
        return_data: response.data,
      });
    } else {
      return res
        .status(200)
        .json({ status: 200, message: "Failed to create order" });
    }
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return res
      .status(500)
      .json({
        status: 500,
        message: "Operation was not successful",
        error: error.message,
      });
  }
}

async function createOrderForAdd(req, res) {
  try {
    const {
      order_amount,
      order_currency = "INR",
      customer_id,
      customer_email,
      customer_phone,
      customer_name,
      order_note = "Test order",
    } = req.body;

    if (!order_amount || !customer_id || !customer_email || !customer_phone || !customer_name) {
      return res.status(200).json({ message: "Missing required fields" });
    }

    // Generate unique order ID
    const generated_order_id = "ORD_" + Date.now();

    const orderData = {
      order_id: generated_order_id,
      order_amount: parseFloat(order_amount),
      order_currency: order_currency,
      customer_details: {
        customer_id: customer_id,
        customer_email: customer_email,
        customer_phone: customer_phone,
        customer_name: customer_name,
      },
      order_note: order_note,
      "payment_methods": "cc,dc,upi,nb,app,emi,cardless_emi,upi_qr,upi_collect,ppc,mpc"

    };

    // Headers for authentication
    const headers = {
      "Content-Type": "application/json",
      "x-api-version": "2025-01-01",
      "x-client-id": "145051b44a8163dab2b9915df0150541",
      "x-client-secret": "9f8c083893c1969049995373f3f922c5c7232db5",
      "x-request-id": crypto.randomUUID(),
      "x-idempotency-key": crypto.randomUUID(),
    };

    // API request to Cashfree
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      orderData,
      { headers }
    );

    // Save Order in Wallet Model (before payment is completed)
    const walletEntry = new Wallet({
      dealer_id: customer_id, // Storing customer_id as dealer for now
      user_id: null, // No user involved
      orderId: generated_order_id,
      Amount: order_amount,
      Type: "Pending",
      order_status: "ACTIVE", // ✅ Set initial order status to ACTIVE
      Note: "Awaiting Payment via Cashfree",
      Total: 0, // No money added yet
    });

    await walletEntry.save();

    return res.status(200).json({
      status: "success",
      message: "Order created successfully",
      cf_order_id: response.data.cf_order_id,
      payment_session_id: response.data.payment_session_id,
      order_data: response.data,
    });
  } catch (error) {
    console.error("Cashfree Order API Error:", error.response?.data || error.message);
    return res.status(500).json({
      status: "error",
      message: "Failed to create order",
      error: error.response?.data || error.message,
    });
  }
}


async function Returnurl(req, res) {
  try {
    const order_id = req.query.order_id;

    // Fetch payment details from Cashfree
    const response = await axios.get(`https://sandbox.cashfree.com/pg/orders/${order_id}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.APP_ID,
        'x-client-secret': process.env.SECRET_KEY,
        'x-api-version': "2023-08-01"
      }
    });

    const paymentData = response.data;

    if (paymentData.order_status === "PAID") {
      // Find wallet entry for this order
      const walletEntry = await Wallet.findOne({ orderId: order_id });

      if (!walletEntry) {
        return res.status(404).json({ message: "Wallet transaction not found" });
      }

      // Find dealer and update wallet balance
      const dealer = await Dealer.findById(walletEntry.dealer_id);

      if (!dealer) {
        return res.status(404).json({ message: "Dealer not found" });
      }

      // Add amount to dealer's wallet
      dealer.wallet += walletEntry.Amount;
      await dealer.save();

      // Update Wallet Entry
      walletEntry.Type = "Credit";
      walletEntry.order_status = "PAID"; 
      walletEntry.Note = "Payment received via Cashfree";
      walletEntry.Total = dealer.wallet;
      await walletEntry.save();

      return res.status(200).json({
        message: "Payment Processed & Wallet Updated Successfully",
        payment_details: paymentData,
        wallet_transaction: walletEntry
      });
    } else {
      return res.status(200).json({ message: "Payment not successful", status: paymentData.order_status });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to process payment", error: error.message });
  }
}


async function getValidToken() {
  const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds

  if (!process.env.CASHFREE_PAYOUT_TOKEN || currentTimestamp >= process.env.CASHFREE_PAYOUT_TOKEN_EXPIRY) {
    console.log("Generating new token...");

    try {
      const response = await axios.post("https://sandbox.cashfree.com/payout/v1/authorize", {}, {
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": process.env.CASHFREE_PAYOUT_CLIENT_ID, // ✅ Use correct credentials
          "X-Client-Secret": process.env.CASHFREE_PAYOUT_CLIENT_SECRET // ✅ Use correct credentials
        }
      });
console.log(response.data,"status")
      if (response.data.status === "SUCCESS") {
        process.env.CASHFREE_PAYOUT_TOKEN = response.data.data.token;
        process.env.CASHFREE_PAYOUT_TOKEN_EXPIRY = response.data.data.expiry;
        console.log("New token generated successfully.");
        return response.data.data.token;
      } else {
        throw new Error("Failed to generate token");
      }
    } catch (error) {
      console.error("Error generating Cashfree token:", error.message);
      throw error;
    }
  }

  console.log("Using existing token.");
  return process.env.CASHFREE_PAYOUT_TOKEN;
}


async function dealerPayout(req, res) {
  try {
    const { dealer_id, amount } = req.body;

    // Validate required inputs
    if (!dealer_id || !amount) {
      return res.status(200).json({ message: "Missing required fields" });
    }

    // Find dealer in database
    const dealer = await Dealer.findById(dealer_id);
    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    // Generate unique Transfer ID
    const transferId = `PAYOUT_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // Create Wallet Transaction Entry with status "PENDING"
    const walletTransaction = new Wallet({
      dealer_id: dealer._id,
      orderId: transferId,
      Amount: amount,
      Type: "Debit",
      order_status: "PENDING",
      Note: "Withdrawal request submitted",
      Total: dealer.wallet, // Wallet balance remains unchanged
    });

    await walletTransaction.save();

    return res.status(200).json({
      message: "Withdrawal request submitted successfully",
      wallet_transaction: walletTransaction,
    });
  } catch (error) {
    console.error("Payout Error:", error.message);
    return res.status(500).json({ message: "Payout request failed", error: error.message });
  }
}


async function approvePayout(req, res) {
  try {
    const { orderId, status } = req.body; // status can be "APPROVED" or "REJECTED"

    if (!orderId || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the wallet transaction
    const walletTransaction = await Wallet.findOne({ orderId });
    if (!walletTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (walletTransaction.order_status !== "PENDING") {
      return res.status(400).json({ message: "Transaction is already processed" });
    }

    // Find the dealer
    const dealer = await Dealer.findById(walletTransaction.dealer_id);
    if (!dealer) {
      return res.status(404).json({ message: "Dealer not found" });
    }

    console.log(walletTransaction.dealer_id,"dealer_id")

    if (status === "APPROVED") {
      if (dealer.wallet < walletTransaction.Amount) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      // Deduct the amount from dealer's wallet
      dealer.wallet -= walletTransaction.Amount;
      walletTransaction.order_status = "APPROVED";
    } else if (status === "REJECTED") {
      walletTransaction.order_status = "REJECTED";
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    await dealer.save();
    await walletTransaction.save();

    return res.status(200).json({
      message: `Payout ${status.toLowerCase()} successfully`,
      wallet_transaction: walletTransaction,
    });
  } catch (error) {
    console.error("Approval Error:", error.message);
    return res.status(500).json({ message: "Approval request failed", error: error.message });
  }
}


async function bookingPayment(req, res) {
  try {
    const {
      order_amount,
      order_currency = "INR",
      customer_id,
      customer_email,
      customer_phone,
      customer_name,
      order_note = "Booking payment",
      service_id,
      booking_id,
      dealer_id,
      userbike_id
    } = req.body;

    if (!order_amount || !customer_id || !customer_email || !customer_phone || !customer_name) {
      return res.status(400).json({ status: false, message: "Missing required fields" });
    }

    const generated_order_id = "ORD_" + Date.now();

    const orderData = {
      order_id: generated_order_id,
      order_amount: parseFloat(order_amount),
      order_currency,
      customer_details: {
        customer_id,
        customer_email,
        customer_phone,
        customer_name,
      },
      order_note,
      order_tags: {
        service_id,
        booking_id,
        dealer_id,
        userbike_id,
      },
    };

    const headers = {
      "Content-Type": "application/json",
      "x-api-version": "2025-01-01",
      "x-client-id": "145051b44a8163dab2b9915df0150541",
      "x-client-secret": "9f8c083893c1969049995373f3f922c5c7232db5",
      "x-request-id": crypto.randomUUID(),
      "x-idempotency-key": crypto.randomUUID(),
    };

    const response = await axios.post("https://sandbox.cashfree.com/pg/orders", orderData, { headers });

    return res.status(200).json({
      status: true,
      message: "Order created successfully",
      cf_order_id: response.data.cf_order_id,
      payment_session_id: response.data.payment_session_id,
      payment_link: `https://payments.cashfree.com/order/#payment_session_id=${response.data.payment_session_id}`,
      order_data: response.data,
    });
  } catch (error) {
    console.error("bookingPayment Error:", error.response?.data || error.message);
    return res.status(500).json({ status: false, message: "Failed to create order", error: error.message });
  }
}


async function bookingPaymentReturn(req, res) {
  try {
    const order_id = req.query.order_id;

    const result = await axios.get(`https://sandbox.cashfree.com/pg/orders/${order_id}`, {
      headers: {
        "Content-Type": "application/json",
        "x-client-id": "145051b44a8163dab2b9915df0150541",
        "x-client-secret": "9f8c083893c1969049995373f3f922c5c7232db5",
        "x-api-version": "2025-01-01"
      }
    });

    const data = result.data;

    if (data.order_status !== "PAID") {
      return res.status(200).json({
        status: false,
        message: "Payment not successful",
        order_status: data.order_status
      });
    }

    // Fetch entities
    const dealer = await Dealer.findById(data.order_tags?.dealer_id);
    const customer = await customers.findById(data.customer_details?.customer_id);

    if (!dealer || !customer) {
      return res.status(404).json({ status: false, message: "Dealer or customer not found" });
    }

    const amountPaid = parseFloat(data.order_amount);
    const commissionRate = dealer.commission || 10;
    const commission = (commissionRate / 100) * amountPaid;
    const finalWalletAmount = amountPaid - commission;

    // Save or update payment
    const paymentInfo = {
      cf_order_id: data.cf_order_id,
      orderId: data.order_id,
      booking_id: data.order_tags?.booking_id,
      service_id: data.order_tags?.service_id,
      userbike_id: data.order_tags?.userbike_id,
      dealer_id: dealer._id,
      user_id: customer._id,
      orderAmount: amountPaid,
      order_status: "PAID",
      payment_type: "Online",
    };

    console.log(paymentInfo,"inforpayment")

    await Payment.updateOne(
      { orderId: data.order_id },
      paymentInfo,
      { upsert: true }
    );

    // Update dealer wallet
    dealer.wallet += finalWalletAmount;
    await dealer.save();

   const storedInWallet =  await Wallet.create({
      dealer_id: dealer._id,
      user_id: customer._id,
      orderId: data.order_id,
      Amount: amountPaid,
      Type: "Credit",
      Note: "Online payment received via booking",
      Total: dealer.wallet
    });

    console.log(storedInWallet,"storedInWallet")
    // Update booking + tracking
    if (paymentInfo.booking_id) {
      await Booking.findByIdAndUpdate(paymentInfo.booking_id, { status: "Payment" });
      await Tracking.findOneAndUpdate(
        { booking_id: paymentInfo.booking_id },
        { status: "Payment" }
      );
    }

    return res.status(200).json({
      status: true,
      message: "Payment completed and wallet credited",
      data: paymentInfo
    });

  } catch (error) {
    console.error("bookingPaymentReturn error:", error.response?.data || error.message);
    return res.status(500).json({
      status: false,
      message: "Error finalizing payment",
      error: error.message
    });
  }
}



module.exports = {
  paymentRequest,
  paymentResponse,
  paymentInvoices,
  payment,
  GetPaymentOrder,
  GetAllPayment,
  Cashpayment,
  GetPayment,
  Returnurl,
  ReturnurlNew,
  paymentNew,
  Ondemand,
  saveCard,
  getAllCards,
  deleteCard,
  onDemandNew,
  paymentDealer,
  ReturnurlDealer,
  createContact,
  CreateFund,
  AllFund,
  AllContact,
  PhonepaynewPayment,
  PhonepaycheckStatus,
  paymentDealerCash,
  ReturnurlDealerCash,
  transferFunds,
  createBeneficiary,
  getBeneficiary,
  createOrderForAdd,
  dealerPayout,
  approvePayout,
  bookingPayment,
  bookingPaymentReturn
}