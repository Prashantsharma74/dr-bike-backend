// var FCM = require("fcm-node");

// // put the generated private key path here
// var serverKey = process.env.FIREBASE_SERVER_KEY;
// // var serverKey = "AAAAzz_cz8A:APA91bEAA5AHxsGFFqcgh5B4hk3yUdPIQZka6lpXTfptgHrq1uh8nLENiIY9X_YkzpxZlKo65p5_vw6i6-7TsFfc2f7TmCKpoNYY71GxwfgjxK3EDF4lFWL1-61gJq77rrhGx9Vw2E8N";
// var fcm = new FCM(serverKey);

// function Notification1(token, messages, dealer_id) {
//   try {
//     var message = {
//       //this may vary according to the message type (single recipient, multicast, topic, et cetera)
//       // user token
//       to: token,
//       // to: "cYMHpy_tSTGiH6372IxKNu:APA91bFfY4fYQOaIEd_cBvZgOynUHEw9pznGqpQNjvSLeVeQLah9HNdCvsy-Q0oTxT41n2QO4KXzxNfP7Ft0Jrmz-r_aRpTVI-OB9am1Re78sHinzuumCLAec95_mJX42ssYhrSMX7j_",
//       collapse_key: "your_collapse_key",
//       // notification: {
//       // title: "Mr. Bike Doctor App",
//       // body: messages,
//       // dealer_id : "this is test",
//       // },

//       // data: {
//       //   //you can send only notification or only data(or include both)
//       //   // user token
//       //   // key : token,
//       //   // key : "cYMHpy_tSTGiH6372IxKNu:APA91bFfY4fYQOaIEd_cBvZgOynUHEw9pznGqpQNjvSLeVeQLah9HNdCvsy-Q0oTxT41n2QO4KXzxNfP7Ft0Jrmz-r_aRpTVI-OB9am1Re78sHinzuumCLAec95_mJX42ssYhrSMX7j_",
//       //     // my_another_key: 'my another value',
//       //     // message:"Notification to user",
//       //     dealerId : dealer_id,

//       //     title: "Mr. Bike Doctor App",
//       //     body: messages,
//       // },

//       notification: {
//         title: "Mr. Bike Doctor App",
//         body: messages,
//       },
//       priority: "high",
//       content_available: true,
//       data: {
//         dealerId: dealer_id,
//       },
//     };

//     fcm.send(message, function (err, response) {
//       if (err) {
//         console.log("Something has gone wrong!", err);
//       } else {
//         console.log("Successfully sent with response: ", response);
//       }
//     });
//   } catch (error) {
//     response = {
//       status: 401,
//       message: "Operation was not successful",
//     };
//     return res.status(201).send(response);
//   }
// }
// // new v1 method
// const admin = require("./firebase/firebaseAdmin");

// function Notification(deviceToken, data, dealer_id) {
//   if (!deviceToken || deviceToken === "" || deviceToken === undefined) {
//     console.log("=== not gaitting device token ===========> ");
//   } else {
//     // const stringData = Object.keys(data).reduce((result, key) => {
//     //   result[key] = String(data[key]);
//     //   return result;
//     // }, {});

//     const message = {
//       token: deviceToken,
//       notification: {
//         title: "Mr. Bike Doctor App",
//         body: data,
//       },

//       // You can also send custom data
//       // data: `{
//       //   title: "Mr. Bike Doctor App",
//       //   body: {
//       //     dealer_id,
//       //     message: data,
//       //   },
//       // }`,
//       // data:
//       //   {
//       //     title: "Mr. Bike Doctor App",
//       //     body: data,
//       //     dealer_id: dealer_id.toString(),
//       //   } || {},

//       data: {
//         title: "Mr. Bike Doctor App",
//         body: data, 
//         dealer_id: dealer_id.toString(), 
//         sound: "notifi", 
//         collapseKey: "com.bikedoctor_provider" 
//       },
//                 android: {
//         priority: "high", 
//         notification: {
//           sound: "notifi",  
//           channel_id: "Provider.channel" 
//         }
//       }
      
//     };

//     admin
//       .messaging()
//       .send(message)
//       .then((response) => {
//         console.log("Successfully sent message:", response);
//       })
//       .catch((error) => {
//         console.error("Error sending message:", error);
//       });
//   }
// }

// // var token = "eIl4iH3eS0-MoSiGhwA_VE:APA91bFkIU5lmnAG4TVALhpa9n5CUnGq3B3P6BAZznx-CI4hlfPjSVuFgJqwKTl_ulZIUdzQsuDmEZFRKGaZ2w2hhgr7cujcs8_KNxaDvCjMHyV8XB_U9Pkuoc1AAQzQRk_YlWYy85FG"

// // Notification(token,"Booking Successfull")

// module.exports = {
//   Notification,
// };

const admin = require("./firebase/firebaseAdmin"); // Firebase Admin SDK
const NotificationModel = require("../models/Notification"); // Adjust the path as needed

// Send and store notification
async function Notification(deviceToken, messageBody, dealer_id) {
  console.log(deviceToken,dealer_id,messageBody,"======>three")
  if (!deviceToken || deviceToken === "" || deviceToken === undefined) {
    console.log("=== not getting device token ===========>");
    return;
  }

  const title = "Mr. Bike Doctor App";
  const body = messageBody;

  const message = {
    token: deviceToken,
    notification: {
      title,
      body,
    },
    data: {
      title,
      body,
      dealer_id: dealer_id.toString(),
      sound: "notifi",
      collapseKey: "com.bikedoctor_provider",
    },
    android: {
      priority: "high",
      notification: {
        sound: "notifi",
        channel_id: "Provider.channel",
      },
    },
  };

  // Step 1: Save notification as 'pending'
  const notificationEntry = new NotificationModel({
    title,
    body,
    data: {
      dealer_id: dealer_id.toString(),
    },
    receiverId: dealer_id,
    receiverType: "dealer",
    status: "pending",
  });

  try {
    const savedNotification = await notificationEntry.save();

    // Step 2: Send FCM notification
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);

    // Step 3: Update status to 'sent'
    savedNotification.status = "sent";
    savedNotification.sentAt = new Date();
    await savedNotification.save();
    console.log("Notification saved to DB with status 'sent'");
  } catch (error) {
    console.error("Notification error:", error);

    // Update DB entry if notification was saved but FCM failed
    if (notificationEntry._id) {
      notificationEntry.status = "failed";
      await notificationEntry.save();
    }
  }
}

module.exports = {
  Notification,
};
