const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/user.controller')
const userdetaislControllers = require('../controllers/userdetails.controller')
const propertyControllers = require('../controllers/property.controller')

const { verifyToken, verifyResetPasswordToken } = require('../middlewares/verifyToken_U')
const { authUser } = require("../middlewares/verifyToken_U")


//=============================== Authentication ===================================
// signup 
router.post('/signup', userControllers.signup)


//signin user
router.post('/signin',userControllers.Login)
router.post('/forgotPassword', userControllers.forgotPassword)

router.post('/setNewPassword', userControllers.setNewPassword)

// router.post('/logout', authUser, userControllers.logout)


router.post('/logout', authUser, userControllers.logout)
router.post("/logoutFromAll", authUser, userControllers.logoutFromAll);

//=================== User Details ======================================

// router.post('/userData', userdetaislControllers.userData)
// router.post('/verifyOtp', userdetaislControllers.verifyOtp)
// router.post('/resendOtp', userdetaislControllers.resendOtp)
router.get('/search/:key', userdetaislControllers.searchUser)


//=================== Manage user profile ================================

router.get('/getUserProfile', authUser, userControllers.getUserProfile)
router.put('/updateProfile', authUser, userControllers.updateProfile)
router.post('/verifyMail', authUser, userControllers.verifyMail)


// =================== Property Details===================================

router.post('/sendPropertyDetails', propertyControllers.sendPropertyDetails)
router.post('/agentReview/:id',  propertyControllers.agentReview)
router.post('/sendEnquiry', authUser, propertyControllers.sendEnquiry)
// router.post('/inspection', propertyControllers.inspection)
router.post("/addToFavorites", authUser, userControllers.addToFavorites);
router.post("/savedProperty", authUser, userControllers.savedProperty);





module.exports = router