const express = require("express");
const crypto = require('crypto');
const app = express();
const path = require('path');
const http = require('http');
const bodyParser = require("body-parser");
const multer = require('multer');
const apiRouter = require("./routes/index");
const db = require("./models/index");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors")
const errorMiddleware = require("./middlewares/error");
var serveIndex = require('serve-index')
// const fileUpload = require('express-fileupload');


app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type",'Authorization');
  // res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

// view engine setup
/* app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade'); */

// Create Server
var server = http.createServer(app);

// parse requests of content-type - application/json
app.use(cors())
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));
// Use the express-fileupload middleware
// app.use(fileUpload());
/* app.use(
  fileUpload({
      limits: {
          fileSize: 10000000,
      },
      abortOnLimit: true,
  })
); */ // changes

app.use(express.static(path.join(__dirname, 'public')));
// app.use('/images', express.static('images'));
app.use('/image', express.static('image'),serveIndex('image', {'icons': true}));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// app.get('/cashfreepayment', function(req, res, next) {
//   res.render('index', { title: 'Cashfree PG simulator' });
// });


 app.get("/bikedoctor",(req,res)=>{
  res.status(200).json({message:"Bikedoctor API Working"})
});


app.post('/upload', (req, res) => {
  // Log the files to the console
  // console.log(req.files);

  const { image } = req.files;

  if(!image) return res.sendStatus(400);

  if (!/^image/.test(image.mimetype)) return res.sendStatus(400);

  // Move the uploaded image to our upload folder
  image.mv(__dirname + '/upload/' + Date.now() +"_" + image.name.replace(" ",""));

  // All good
  res.sendStatus(200);
  
});

app.use("/bikedoctor", apiRouter);
// --------------------------------------
app.use("/location", require("./routes/stateAndCityRoute"));
// app.use("/dealer", require("./routes/dealerRoutes"));
app.use("/service", require("./routes/serviceRoutes"));

app.use("/bikedoctor",require('./routes/policyRoutes'))
app.use("/testmulter", require("./routes/multerRoute"));



// ---------------------------------------------

// const DB_URL = "mongodb+srv://test:test@cluster0.mzwadhx.mongodb.net/?retryWrites=true&w=majority";


// const DB = "mongodb://0.0.0.0:27017/mechanictesting";
//const DB = process.env.DATABASE_URL || "mongodb://0.0.0.0:27017/BikeDoctor";
const DB = process.env.DATABASE_URL;

db.mongoose
  .connect(DB , {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then((data) => {
    console.log(`Mongodb connected with : ${data.connection.host} server`);
  })
  .catch((err) => {
    console.log("mongodb error", err);
});


const port = process.env.PORT || 8001;
server.listen(8001,()=>{
// server.listen(()=>{
    console.log(`Server is working on port : ${port}`)
    // console.log(`Bike Dcotor API Server is working`)
})


function errHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
      res.json({
          success: 0,
          message: err.message
      })
  }
}


app.use(errHandler);
app.use(errorMiddleware);
