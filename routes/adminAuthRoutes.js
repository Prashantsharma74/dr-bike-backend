const express = require('express');
const { suadminLogin,AdminPermission,updateAdminPermission, suadminsignup, getAllAdmin, deleteAdmin, subadminsignup, updateProfilePicture,getProfilePicture,changePassword,singleadmin,getSingleRole} = require('../controller/adminAuth');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../helper/verifyAuth'); 

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './image');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

/* POST users listing. */
router.post('/suadminLogin', suadminLogin);
router.post('/subadminsignup', verifyToken, subadminsignup);
router.post('/suadminsignup', verifyToken, suadminsignup);
router.get('/getalladmin', verifyToken, getAllAdmin);
router.delete('/deleteadmin', verifyToken, deleteAdmin);
router.post('/Changepassword/:id', verifyToken, changePassword);
router.post('/profile', verifyToken, upload.single('images'), updateProfilePicture);
router.get('/profile', verifyToken, getProfilePicture);
router.get('/singleAdmin/:id', verifyToken, singleadmin);
router.post('/AdminPermission/:id', verifyToken,AdminPermission);
router.post('/updatePermission/:id', verifyToken,updateAdminPermission);
router.get('/SinglePermission/:id', verifyToken,getSingleRole);

module.exports = router;
