const jwt = require("jsonwebtoken");
const HTTP = require("../../constants/responseCode.constant");
const { admin_agency } = require('../models/admin.model')
const passport = require("passport")


function authadmin(req, res, next) {
    console.log("-----------------checkdata---------------------");
    passport.authenticate('jwt', { session: false }, async function (err, userData) {
        console.log("----->>>>adminssssssssss", userData);
        try {
            if (err || userData === false) {
                return res.send({
                    "message": "invalid token."
                })
            }
            req.user = userData
            return next()
        }
        catch {
            console.log("something went wrong");
        }
    })(req, res, next)
}


module.exports = authadmin
