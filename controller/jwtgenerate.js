var validation = require('../helper/validation');
const helper = require('../helper/helper');

function tokenGenrate(req, res) {
  
    const id = helper.getRandomInt(2);
    try {

      const token = validation.generateUserToken('info@eccomerce.com', id, helper.currentdate(), 'ecommerce');
      // successMessage.token = token;

      const options = {
        expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        //the browser will reject cookies unless the connection happens over HTTPS.
        // secure:true
      }

      res.status(200).cookie("token",token,options).json({
        success:true,
        token,
        
    });
    }
    catch (error) {
      var responseErr = {
        status : 201,
        message:'Operation was not successful',
      };
      res.json(responseErr);
    }

};

module.exports = tokenGenrate;