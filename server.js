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
  res.header("Access-Control-Allow-Headers", "Content-Type", 'Authorization');
  next();
});

var server = http.createServer(app);

app.use(cors())
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/image', express.static('image'), serveIndex('image', { 'icons': true }));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('API is running...');
});


app.get("/bikedoctor", (req, res) => {
  res.status(200).json({ message: "Bikedoctor API Working" })
});


app.post('/upload', (req, res) => {

  const { image } = req.files;

  if (!image) return res.sendStatus(400);

  if (!/^image/.test(image.mimetype)) return res.sendStatus(400);

  image.mv(__dirname + '/upload/' + Date.now() + "_" + image.name.replace(" ", ""));

  res.sendStatus(200);

});

app.use("/bikedoctor", apiRouter);
// --------------------------------------
app.use("/location", require("./routes/stateAndCityRoute"));
// app.use("/dealer", require("./routes/dealerRoutes"));
app.use("/service", require("./routes/serviceRoutes"));

app.use("/bikedoctor", require('./routes/policyRoutes'))
app.use("/testmulter", require("./routes/multerRoute"));



// ---------------------------------------------

// const DB_URL = "mongodb+srv://test:test@cluster0.mzwadhx.mongodb.net/?retryWrites=true&w=majority";


// const DB = "mongodb://0.0.0.0:27017/mechanictesting";
//const DB = process.env.DATABASE_URL || "mongodb://0.0.0.0:27017/BikeDoctor";
const DB = process.env.DATABASE_URL;

db.mongoose
  .connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then((data) => {
    console.log(`Mongodb connected with : ${data.connection.host} server`);
  })
  .catch((err) => {
    console.log("mongodb error", err);
  });

// test

const port = process.env.PORT || 8001;
server.listen(8001, () => {
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
