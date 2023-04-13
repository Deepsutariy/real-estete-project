const mongoose = require("mongoose");
var ObjectId = require("mongoose").Types.ObjectId;
const HTTP = require("../../constants/responseCode.constant");
const { genSaltSync, hashSync, compareSync } = require("bcrypt");


// ----- Utsav -----

const UserSession = require("../models/userSession.model");
var bcrypt = require("bcryptjs");
const { formateUserData, createSessionAndJwtToken, sendEmail, sendEmailOTP, sendForgotPasswordLink, } = require("../../public/partials/utils");



const Register = require("../models/register");
const userSession = require("../models/userSession.model")
var bcrypt = require('bcryptjs');



var randomstring = require("randomstring");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const Otp = require("../models/otp.model");
const { log } = require("handlebars");
const property_listing = require("../models/property_listing");
// const serviceID = "VAe2e2e9000916b9296ac0a737e822b587"
// const accountsID = "ACa15e8faf0a240436169630f2712e47b3"
// const authToken = "85302ad861c5fff587d6ab6dc07c381e"
// const client = require('twilio')(accountsID, authToken)

async function signup(req, res) {

    try {
        let { email, password, role,
            firstname = null,
            lastname = null,
            phoneNumber = null,
            status = null,
            token = null,
            isVerified = null, } = req.body
        console.log(req.body, " ---- signup ---- req.body");

        if (!email || !password) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "All fields are required!", data: {} })
        }

        if (!email.includes('@')) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Email is invalid!", data: {} })
        }

        if (password.length < 8 || password.length > 20) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Please enter a strong password", data: {} })
        } else {
            const salt = genSaltSync(10);
            password = hashSync(password, salt);
        }

        //  check Register + verified
        // const RegisterValid = await Register.findOne({ $and: [{ email: email }, { isVerified: false }] })
        // if (RegisterValid) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Register not verified.  ", data: {}, page: "verifyOtp" })

        const RegisterExists = await Register.findOne({ $or: [{ email: email }] })
        if (RegisterExists) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Register Exists. Please Sign In.", data: {}, page: "signin" })


        const RegisterData = await new Register({ email, password, role, firstname, lastname, phoneNumber, status, isVerified }).save()

        if (!RegisterData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Unable to register Register!", data: {} })

        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "Register Registered!", data: {} })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}



//============================================================= login ===========================================================================================




async function Login(req, res) {
    try {
        console.log("🚀 ~ ----------------------- Login ------------------------")
        let { email, password } = req.body
        console.log(req.body, "----- req.body");

        if (!email || !password) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "Provide email and password", data: {} })

        const result = await Register.findOne({ email })
        console.log("🚀 ~ file: Register.controller.js ~ line 324 ~ signin ~ result", result)

        if (!result) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "user does not exist", data: {} })

        // if (!result.isVerified) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Account is not verified", data: {} })

        // check if Register is blocked
        // console.log("🚀 ~ file: Register.controller.js ~ line 339 ~ signin ~ result.status", result.status)
        if (result.status === false /*"Blocked"*/) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Your account has been Blocked by Admin!", data: {} })

        if (!compareSync(password, result.password)) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Password is wrong", data: {} })

        //genrate JWT token and store session data
        const token = await createSessionAndJwtToken(result)
        return res.status(HTTP.SUCCESS).send({
            "status": true, 'code': HTTP.SUCCESS, "message": "You have signed-in successfully.", "data": {
                userData: {
                    id: result._id,

                    email: result.email,
                },
                token: "Bearer " + token
            }
        })
    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}



//===================================================================== forgot password ============================================================================





async function forgotPassword(req, res) {


    try {
        let { email } = req.body
        if (!email) {
            return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.NOT_ALLOWED, "message": "provide email", datalink: {} })
        }

        result = await Register.findOne({ email: req.body.email })
        console.log(" file: admin.controller.js: ~ forgotPassword ~ result", result)

        if (!result) {
            return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.NOT_FOUND, "message": "Record not found", data: {} })
        }
        const id = result._id
        const payload = { id: result._id, email: result.email }
        const secret = process.env.JWT_SECRET + result.password
        const token = jwt.sign(payload, secret)
        const link = `${process.env.REACT_ADMIN_APP_WEB_URL}/${token}/${id}`
        const set_token = await Register.findOneAndUpdate({ email: result.email }, { token }, { new: true })
        console.log(set_token);
        // console.log(result.id, "this is a link result id");
        // console.log(" file: admin.controller.js: ~ forgotPassword ~ link", link)
        // send link ==================================================
        // return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "checking...", 'data': {} })
        var sendMailData = {
            "file_template": './public/EmailTemplates/forgotPassword.html',
            "subject": 'Link to reset the password',
            "to": result.email ? result.email : null,
            "link": link
        }

        sendForgotPasswordLink(sendMailData).then((val) => {
            return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': "Please check your email.", 'data': val })
        }).catch((err) => {
            console.log(err);
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Unable to send email!", data: {} })
        })
        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "Check your email", data: { id: result._id } })
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }


}

//==============================================================   Set new password ==========================================================================




async function setNewPassword(req, res) {
    // try {
    //   var find_token = await User.findOne({ _id: req.body.id });
    //   console.log(find_token);

    try {
        var find_token = await Register.findOne({ _id: req.body.id })
        console.log(find_token);

        //check password
        if (password != confirmPassword)
            return res.status(HTTP.SUCCESS).send({
                status: false,
                code: HTTP.NOT_ALLOWED,
                message: "Password and confirm password does not match",
                data: {},
            });



        //check password   
        if (password != confirmPassword) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Password and confirm password does not match', data: {} })

        if (password.trim().length < 8 || password.trim().length > 16) {
            return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Password must be between of 8 to 16 characters!', data: {} })
        }


        const RegisterData = await Register.findOne({ _id: req.body.id })
        if (!RegisterData) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Register does not exists!', data: {} })

        console.log(req.body.id);

        const isNewPassword = compareSync(password, RegisterData.password)
        if (isNewPassword || isNewPassword === undefined) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'New password cannot be same as current password !', data: {} })

        // for (const data of RegisterData) {

        //     const isNewPassword = compareSync(password, data.password)
        //     if (isNewPassword || isNewPassword === undefined) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'New password cannot be same as current password !', data: {} })

        // }

        var bpass = await bcrypt.hash(password, 10)

        const result = await Register.findOneAndUpdate({ _id: find_token.id }, { password: bpass, token: "" }, { new: true })
        if (!result) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Unable to set new password!', data: {} })


        return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": `New Password has been set`, data: {} })

    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }

}

// for (const data of userData) {

//     const isNewPassword = compareSync(password, data.password)
//     if (isNewPassword || isNewPassword === undefined) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'New password cannot be same as current password !', data: {} })

// }





//Logout user session
// async function logout(req, res) {
//     try {
//         if (!req.user.sessionId) return res.status(HTTP.BAD_REQUEST).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Please authenticate", data: {} })

//         const userData = await UserSession.findOneAndUpdate({ _id: req.user.sessionId, userid: req.user.id, isActive: true }, { isActive: false }, { new: true })
//         if (!userData) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'User session is invalid', data: {} })
//Logout Register session
async function logout(req, res) {
    try {
        console.log("<><><><><><<<>>>>>", req.user.sessionId);
        if (!req.user.sessionId) return res.status(HTTP.BAD_REQUEST).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Please authenticate", data: {} })

        const RegisterData = await userSession.findOneAndUpdate({ _id: req.user.sessionId, userid: req.user.id, isActive: true }, { isActive: false }, { new: true })
        if (!RegisterData) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'user session is invalid', data: {} })

        // res.clearCookie("jwttoken");
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'User logged out successfully', data: {} })
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

//======================================================== log out from all ==============================================================================


async function logoutFromAll(req, res) {
   try {
       console.log(req.user);
       
       req.user.token = ""
       res.clearCookie("jwt")
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'User logged out successfully', data: {} })
   } catch (error) {
       console.log(error);
       return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
   }
}




//======================================================== get user profile  =============================================================================
async function getUserProfile(req, res) {
    try {
        console.log("req.user.id---------------", req.user.id);
        let result = await User.findById(req.user.id);
        if (!result)
            return res.status(HTTP.SUCCESS).send({
                status: false,
                code: HTTP.NOT_FOUND,
                message: "Record not found",
                data: {},
            });

        return res.status(HTTP.SUCCESS).send({
            status: true,
            code: HTTP.SUCCESS,
            message: "User Profile",
            data: await formateUserData(result),
        });
    } catch (err) {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({
            status: false,
            code: HTTP.INTERNAL_SERVER_ERROR,
            message: "Something went wrong!",
            data: {},
        });
    }
}



//================================================================= update Register profile =====================================================================



async function updateProfile(req, res) {
    try {
        let { email, password } = req.body;

        if (Object.keys(req.body).length === 0)
            return res.status(HTTP.SUCCESS).send({
                status: false,
                code: HTTP.NOT_ALLOWED,
                message: "No changes are available for update",
                data: {},
            });

        const isValidUpdate = Object.keys(req.body).every((key) => {
            if (["password", "email"].includes(key)) return true;
            return false;
        });

        if (!isValidUpdate)
            return res.status(HTTP.SUCCESS).send({
                status: false,
                code: HTTP.NOT_ALLOWED,
                message: "Update is not allowed!",
                data: {},
            });

        console.log("🚀 ~ file: Register.controller.js ~ line 549 ~ updateProfile ~ req.Register._id ~~~~~~~~~~~~~~~~~~~~~~~", req.Register._id)
        let userData = await Register.findById(req.user._id)
        if (!userData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_FOUND, "message": "user does not exists!", data: {} })


        if (email && email != userData.email) {
            const checkusername = await Register.findOne({ email: email })
            if (checkusername) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "username already exists", data: {} })
            userData.email = email
        }

        if (password) {
            if (password.trim().length < 8 || password.trim().length > 16) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'Password length must be between 8 to 16', data: {} })

            const isNewPassword = compareSync(password, userData.password)
            if (isNewPassword || isNewPassword === undefined) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.NOT_ALLOWED, 'message': 'New password cannot be same as current password !', data: {} })

            const salt = genSaltSync(10);
            userData.password = hashSync(password, salt);
        }


    } catch (err) {
        console.log(err)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }

}

// ========================================================================= verifyMail ==========================================================================




async function verifyMail(req, res) {
    try {
        const { email, newEmail } = req.body
        if (!email.includes('@') || !newEmail.includes('@')) {
            return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Email is invalid!", data: {} })
        }

        const RegisterData = await Register.findOne({ email })
        if (!RegisterData) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'Register not found!', data: {} })


        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'Email updated', data: await formateUserData(updateEmail) })
    } catch (err) {
        console.log(err)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }



}


//======================================================= Add property to Whishlist ==============================================================================================


async function addToFavorites(req, res) {
  
    const _id = ObjectId(req.user._id).toString()
    const proID = req.body.id
    console.log("=========ID=========>" ,_id );
    console.log("==========PROID========>",proID);
    try {

        const user = await Register.findById(_id) 
        const Exists = user.wishlist.find((id) => id.toString() === proID)
        // console.log("========USER========>", user);
        
        if (Exists) {
            let user = await Register.findByIdAndUpdate(
                _id,
                { $pull: {wishlist: proID } },
                { new: true }
                )
                 return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'This Property is removed from your wishlist', data: user.wishlist })
            } else {
                let user =await Register.findByIdAndUpdate(
                    _id,
                    { $push: {wishlist: proID } },
                    { new: true }
                    );
                    return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'This Property is added to your wishlist', data: user.wishlist })
                }
        // console.log("=========user===========>", user);
    //     let result = []
    //     for (const data of user.wishlist) {

    //         const proDetails = await property_listing.find()
    //         for (const _data of proDetails) {
    //             console.log( (data) , "======data=>");
    //             console.log( (_data._id), "------>");

    //             if (
    //               ObjectId(data).toString() == ObjectId(_data._id).toString()
    //             ) {
    //               console.log("match");
    //             } else {
    //               console.log("is not match");
    //             }
    //         }
    //    }
        
    } catch (error) {

         console.log(error);
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
        
    }

}

//===================================================== saved Property ===========================================================================================================


async function savedProperty(req, res) {

try {
   const _id = ObjectId(req.user._id).toString();

  const user = await Register.findById({ _id });
  console.log("--------->", user);

  let result = [];
  for (const data of user.wishlist) {
      const proDetails = await property_listing.find({
        $or: [{ status: { $regex: req.body.status } }],
      });
    for (const _data of proDetails) {
    //   console.log(data, "======data=>");
    //   console.log(_data._id, "------>");

      if (ObjectId(data).toString() == ObjectId(_data._id).toString()) {
        console.log("match");
          result.push({
            _id: _data._id,
            frontPageImg: _data.frontPageImg,
            lead_agent: _data.lead_agent,
            price: _data.price,
            street_address_number: _data.street_address_number,
            street_address_name: _data.street_address_name,
            suburb: _data.suburb,
            bedroomCount: _data.Bedrooms,
            showerCount: _data.Bathrooms,
            carCount: _data.carport_spaces,
            isFavorite: true,
          });
      }
    }
  }
    console.log("----------RESULT----------------->>>>>>>>>", result.length);
     return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': 'savedProperty', data: result })
} catch (error) {
    console.log(error);
}
    
}


//============================================================  Inspecion Time(Newest -- oldest)  ============================================================================



async function inspection(req, res) {
    
    try {
        const listing = await property_listing.find({
          $or: [{ inspection_times: { $regex: req.body.inspection_times } }],
        });
    } catch (error) {
        console.log(error);
        
    }


}









//===============================================================================================================================================================================


module.exports = {
  signup,
  Login,
  forgotPassword,
  setNewPassword,
  getUserProfile,
  updateProfile,
  verifyMail,
  logout,
  logoutFromAll,
  addToFavorites,
  savedProperty,
  inspection,
};
