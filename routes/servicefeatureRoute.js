var express = require('express');
var multer = require('multer');
var fs = require('fs-extra');
const router = express.Router();
var {addfeature, getfeature, deletefeature, editfeature,getAllfeature} = require("../controller/service_features")

// Store data
const storage = multer.diskStorage({
    destination : function ( req , file , callback ){
        var path = `./image`;
        fs.mkdirsSync(path);
        //callback(null, 'uploads')
        callback(null, path);
    },
    filename : function (req, file , callback){
        // image.jpg
        var ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
        return callback(null, file.fieldname + '-' + Date.now() + ext)
        //callback(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
        //callback(null, file.originalname)
        // save file as original name
        // callback(null, file.originalname + ext)
    }
  })
  
  const upload = multer({ 
    storage : storage,
    limits: {
        fileSize: 20*1048576,  // 20MB
    }
})

router.post('/addfeature',upload.single("images"), addfeature);
router.get('/getfeature/:id',getfeature);
router.get('/getallfeature',getAllfeature);
router.delete('/deletefeature',deletefeature);
router.put('/updatefeature/:id',editfeature);


module.exports = router;

