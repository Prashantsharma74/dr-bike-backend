var express = require('express');
var multer = require('multer');
var fs = require('fs-extra');
const router = express.Router();
const {paymentRequest,GetAllPayment,Cashpayment,GetPayment, paymentResponse,paymentInvoices,payment,GetPaymentOrder,Returnurl, saveCard, getAllCards, deleteCard, paymentNew, ReturnurlNew,Ondemand, onDemandNew, paymentDealer, ReturnurlDealer, createContact,CreateFund,AllFund,AllContact,PhonepaynewPayment,PhonepaycheckStatus , paymentDealerCash, ReturnurlDealerCash, transferFunds, createBeneficiary, getBeneficiary,createOrderForAdd,dealerPayout,approvePayout,bookingPayment,bookingPaymentReturn} = require("../controller/payment");
const { default: axios } = require('axios');
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const Dealer = require("../models/Dealer")
const Wallet = require("../models/Wallet_modal")

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        var path = `./upload/payment`;
        fs.mkdirsSync(path);
        callback(null, path);
    },
    filename(req, file, callback) {
        callback(null, Date.now() + '_' + file.originalname);
    },
});
const upload = multer({ storage });

/* POST users listing. */
router.post('/paymentrequest',paymentRequest);
router.post('/paymentresponse',paymentResponse);
router.get('/Invoices',paymentInvoices);
router.post('/cash',Cashpayment);
router.get('/pay_order/:id',GetPaymentOrder);
router.get('/getall',GetAllPayment);
router.get('/get/:id',GetPayment);

// router.get('/returnurl',Returnurl);



router.post('/ondemand',Ondemand);
router.post('/ondemandNew',onDemandNew);



//for chard
router.post('/saveCard',saveCard);
router.get('/getCardsList',getAllCards);
router.delete('/cards/:id',deleteCard);


////////////////// CASHFREE PAY //////////////////
router.post('/pay',payment);
router.get('/returnurlCash',Returnurl);
router.post('/rechargedealerCash',paymentDealerCash);
router.get('/returndealerCash',ReturnurlDealerCash);
////////////////// RAZORPAY PAY //////////////////
// this apis for the RAZORPAY pay  payment getway.
router.post('/paynew',paymentNew);
router.get('/returnurl',ReturnurlNew);
router.post('/rechargedealer',paymentDealer);
router.get('/returndealer',ReturnurlDealer);

router.post('/create-contact',createContact);
router.post('/create-fund-account',CreateFund)
router.get('/fund-accounts',AllFund)
router.get('/contact-accounts',AllContact)

// // this is for test
const API_KEY_ID = 'rzp_test_TImTSdtCMH1eMv';
const API_KEY_SECRET = '5gpvEPZjQsa8klSeYdu1Ht4N';
// this is for Prod
// const API_KEY_ID = 'rzp_live_djlQ4u7JSmk5vL';
// const API_KEY_SECRET = 'IkJ3qyknx7GzdLKc4ewzPi7e';
// Endpoint to create a contact
// router.post('/create-contact', async (req, res) => {
//     const { name, email, contact } = req.body;
//     try {
//         const response = await axios.post('https://api.razorpay.com/v1/contacts', {
//             name,
//             email,
//             contact
//         }, {
//             auth: {
//                 username: API_KEY_ID,
//                 password: API_KEY_SECRET
//             }
//         });
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json(error.response.data);
//     }
// });
// // Endpoint to create a fund account
// router.post('/create-fund-account', async (req, res) => {
//     const { contact_id, account_type, bank_account } = req.body;
//     try {
//         const response = await axios.post('https://api.razorpay.com/v1/fund_accounts', {
//             contact_id,
//             account_type,
//             bank_account: {
//                 // Include other bank details here
//                 ...bank_account,
//                 account_number: bank_account.account_number,
//               }
//         }, {
//             auth: {
//                 username: API_KEY_ID,
//                 password: API_KEY_SECRET
//             }
//         });
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json(error.response.data);
//     }
// });
router.post('/transfer-payment', async (req, res) => {
    const { fund_account_id, amount, account_number } = req.body;
    // check ammount with delear wallet balance
    try {
        const response = await axios.post('https://api.razorpay.com/v1/payouts', {
            fund_account_id,
            amount: amount * 100, // amount in the smallest currency unit
            currency: 'INR', // assuming currency is INR
            purpose: 'payout',
            mode: 'IMPS',
            account_number
        }, {
            auth: {
                username: API_KEY_ID,
                password: API_KEY_SECRET
            }
        });
        // create log for wallet recharge
        res.json(response.data);
    } catch (error) {
        res.status(500).json(error.response.data);
    }
});

//////////////////  PHONE PAY //////////////////
// this apis for the phone pay  payment getway.
router.post("/payment2",PhonepaynewPayment);
router.post('/status2/:txnId',PhonepaycheckStatus);

// This is for test
function generatedTranscId() {
    return 'T' + Date.now();
}
// deployed
router.post("/payment", async (req, res) => {
    console.log(req.body);
  
    try {
        const price = parseFloat(req.body.price);
        const { user_id, phone, name, email, tempId } = req.body;
  
        // Set the values to variables for later use
        this.name = name;
        this.email = email;
        this.user = user_id;
        this.phone = phone;
        this.tempId = tempId; 
        this.price=price;
  
        const data = {
            merchantId: "M22QPAB8V1OYHUAT",
            merchantTransactionId: generatedTranscId(),
            merchantUserId: 'MUID' + user_id,
            name: name,
            amount: price * 100,
            redirectUrl: `http://localhost:3001/api/v1/orders/status/${generatedTranscId()}`,
            redirectMode: "POST",
            mobileNumber: phone,
            paymentInstrument: {
                type: "PAY_PAGE",
            },
        };
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
                const phonePeTransactionId = response.data.transactionId;
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
});
  
router.post('/status/:txnId', async (req, res) => {
      try {
          const merchantTransactionId = req.params.txnId;
          const merchantUserId = "M22QPAB8V1OYHUAT";  // Update with your merchant ID
          const key = "0f0a921e-a289-4353-888d-3169a8c73eb7";  // Update with your API key
  
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
  
              if (response.data.data.responseCode === 'SUCCESS') {
                 
                  res.send({msg:"success",data:response.data.data})
                  // Create a new order instance
                  // const newOrder = new Order({
                  //     name: this.name,  
                  //     phone: this.phone,  
                  //     email: this.email,  
                  //     transactionId: merchantTransactionId,
                  //     paymentStatus: response.data.data.responseCode,
                  //     price: this.price,  
                  //     user: this.user, 
                  //     dateOrdered: Date.now(),
                  // });
  
                  // Save the new order to the database
                  // await newOrder.save();
  
                  // Redirect to the success URL
                  const url = "http://localhost:4200/success";
                  return res.redirect(url);
              } else {
                  // Redirect to the failure URL
                  const url = `http://localhost:4200/failure`;
                  return res.redirect(url);
              }
          } catch (error) {
              console.error("Status API Error:", error.message);
              console.error("Status API Error Response:", error.response.data);
              res.status(500).json({ msg: "Error checking payment status", status: "error", error: error.message });
          }
      } catch (error) {
          console.error("Internal Server Error:", error.message);
          res.status(500).json({ msg: "Internal Server Error", status: "error", error: error.message });
      }
});

// ////////// ////////// ////////// payout ceshfree ////////// ////////// //

const APP_ID_P = process.env.APP_ID_P;
const SECRET_KEY_P = process.env.SECRET_KEY_P
// ============================================
router.post('/getToken', async (req, res) => {
    console.log("check---------------");
    try {
      const response = await axios.post(
        'https://payout-gamma.cashfree.com/payout/v1/authorize',
        {},  // Empty body for the POST request
        {
          headers: {
            'X-Client-Id': APP_ID_P,
            'X-Client-Secret': SECRET_KEY_P,
            'Content-Type': 'application/json'
          }
        }
      );
  
      // Check if the response contains the expected data
      if (response.data && response.data.status === 'SUCCESS') {
        res.status(200).json({ status: true, token: response.data });
      } else {
        res.status(400).json({ status: false, error: response.data });
      }
    } catch (error) {
      console.error(error);
      
    }
});
// for add benifishly
router.post('/addBeneficiary', async (req, res) => {
    try {
      const beneId = crypto.randomBytes(10).toString("hex");
      const { 
        name, 
        email, 
        phone, 
        bankAccount, 
        ifsc, 
        address1, 
        city, 
        state, 
        pincode 
    } = req.body
      const token = req.headers['authorization']; 
  
      if (token && token.startsWith('Bearer ')) {
        const response = await axios.post(
          'https://payout-gamma.cashfree.com/payout/v1/addBeneficiary',
          {
            beneId: beneId,
            name, 
            email, 
            phone, 
            bankAccount, 
            ifsc, 
            address1, 
            city, 
            state, 
            pincode 
          },
          {
            headers: {
              // 'Authorization': token,
              'Content-Type': 'application/json',
              'X-Client-Id': APP_ID_P,
              'X-Client-Secret': SECRET_KEY_P,
            }
          }
        );
       if(response.data.status == "SUCCESS"){
        res.status(200).json({ status: true, data: response.data });
       }else{
        res.status(404).json({ status: false, data: response.data });
       }
      } else {
        res.status(400).json({ status: false, error: 'Invalid or missing token' });
      }
    } catch (error) {
      res.status(error.response ? error.response.status : 500).json({
        status: false,
        error: error.response ? error.response.data : error.message
      });
    }
});
//  get Beneficiary using bank account for id
router.get('/getaddBeneficiary', async (req, res) => {
    try {
      const token = req.headers['authorization']; 

      const { bankAccount, ifsc } = req.query;
      console.log(req.params)
  
      if (token && token.startsWith('Bearer ')) {

        const getResponse = await axios.get('https://payout-gamma.cashfree.com/payout/v1/getBeneId', {
          params: {
            bankAccount,
            ifsc
          },
          headers: {
            'Authorization': token
          }
        });
  

        if (getResponse.data.status === "SUCCESS") {
          res.status(200).json({ status: true, data: getResponse.data });
        } else {

            res.status(404).json({ status: false, message: getResponse.data });
        }
      } else {
        res.status(400).json({ status: false, error: 'Invalid or missing token' });
      }
    } catch (error) {
      res.status(error.response ? error.response.status : 500).json({
        status: false,
        error: error.response ? error.response.data : error.message
      });
    }
});
//  get Beneficiary using bank account for full information
router.get('/getBeneficiaryInfo', async (req, res) => {
    try {
      const token = req.headers['authorization']; 

      const { beneId } = req.query;
      console.log(req.params)
  
      if (token && token.startsWith('Bearer ')) {

        const getResponse = await axios.get(`https://payout-gamma.cashfree.com/payout/v1/getBeneficiary/${beneId}`, {
      
          headers: {
            'Authorization': token
          }
        });
  

        if (getResponse.data.status === "SUCCESS") {
          res.status(200).json({ status: true, data: getResponse.data });
        } else {

            res.status(404).json({ status: false, message: getResponse.data });
        }
      } else {
        res.status(400).json({ status: false, error: 'Invalid or missing token' });
      }
    } catch (error) {
      res.status(error.response ? error.response.status : 500).json({
        status: false,
        error: error.response ? error.response.data : error.message
      });
    }
});






// create without token
router.post('/createBeneficiary', createBeneficiary );
// get fund account
router.get('/getBeneficiary',getBeneficiary);
//  for fund transfer
router.post('/transferFunds', transferFunds );
router.post('/createOrderForAdd', createOrderForAdd );
router.post("/dealerPayout", dealerPayout);
router.post("/approvePayout", approvePayout);

router.post("/book/payment", bookingPayment);
router.get("/payment-return", bookingPaymentReturn);

module.exports = router;





