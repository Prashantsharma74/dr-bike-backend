var moment = require('moment');
var nodemailer = require('nodemailer');
const crypto = require("crypto");

const getRandomInt = async (length) => {
    var result = '';
    var characters = '123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getRoleCode(role) {
  const map = {
    telecaller: "TEL",
    manager: "MGR",
    admin: "ADM",
    subadmin: "SADM",
    executive: "EXE"
  };
  return map[role.toLowerCase()] || "EMP";  
}

function generateRandomSuffix(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const bytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    const index = bytes[i] % chars.length;
    result += chars.charAt(index);
  }

  return result;
}

const currentdate = async (formate) => {
    let nowtime = moment();
    var result = nowtime.format(formate);
    return result;
}

const sendemails = async (emailAddress, name, otp, type, subject = '') => {
    try {

        if (type == 0) {
            var sub = 'Verification code for app';
            var msg = `Dear ${name}, \n  
            \n Your Verification code is : \n ${otp}  
            \n Best Regards,`;
        } else if (type == 1) {
            var sub = 'New password OTP';
            var msg = `Dear ${name}, \n  
                \n Your Password OTP is : ${otp}  
                \n Best Regards,`;
        } else if (type == 3) {
            var sub = 'New OTP';
            var msg = `Dear ${name}, \n  
                \n Resent OTP is : ${otp}  
                \n Best Regards`;
        } else if (type == 4) {
            var sub = subject;
            var msg = `Dear ${name}, \n  
                \n  ${otp}  
                \n Best Regards`;
        } else {

            var sub = subject;
            var msg = `Dear ${name}, \n  
            \n your account is created,your credential is given below
            \n email - ${emailAddress} 
            \n password -  ${otp}
            \n Best Regards`;

        }

        let client = nodemailer.createTransport({
            // service: 'gmail',
            pool: true,
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // use TLS
            auth: {
                user: 'devitinformatix@gmail.com',
                pass: 'itinfo@2020'
            }

        });
        let mailContent = {
            from: {
                name: 'devitinformatrix',
                address: 'devitinformatix@gmail.com'
            },
            to: emailAddress,
            subject: sub,
            text: msg,

        };
        await client.sendMail(mailContent, function (err, info) {
            if (err) {
                console.log('message send msg', err)

            } else {
                // console.log('message send msg', info);
                // const message = 'Your message has been successfully sent.';

            }
        });
        //console.log("Your message has been successfully sent.");
    } catch (err) {
        //console.log('err: ', err);

        //console.log(err.message);
        // throw new Error(err.message);
    }
}
module.exports = {
    getRandomInt, currentdate, sendemails, getRoleCode, generateRandomSuffix
}


