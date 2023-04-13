const express = require("express");
const admin = require("../models/admin.model");
const jwt = require("jsonwebtoken");
const { hashSync } = require("bcrypt");
const HTTP = require("../../constants/responseCode.constant");
const { sendForgotPasswordLink, tokenforAgency } = require("../../public/partials/utils");
const bcrypt = require("bcrypt");
const admin_agent = require("../models/admin.agent");
const property_listing = require("../models/property_listing");
const Register = require("../models/register");
const { log } = require("handlebars");
const { ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");
const { findByIdAndUpdate } = require("../models/property_listing");
const AVATAR_PATH = "/uploads/agency_image";

//Add default admin
(async function deafultAdminsignup(req, res) {
  try {
    const adminData = {
      username: "admin",
      email: "larosa.admin@yopmail.com",
      role: "admin",
    };
    const password = "larosaadmin@123";
    // const encData = await encryptUserModel(adminData)
    const existsAdmin = await Register.findOne({
      email: adminData.email,
      role: adminData.role,
    });

    //Admin exist
    if (existsAdmin) return;

    const userData = await new Register({
      ...adminData,
      password: hashSync(password.trim(), 8),
      isVerified: true,
    }).save();
    if (!userData) console.log("Unable to add default admin");

    return;
  } catch (e) {
    console.log(e);
    return;
  }
})();

// admin sign in
async function signin(req, res) {
  try {
    let { email, password, role } = req.body;

    console.log(" file: admin.controller.js : - 55 ~ signin ~ req.body", req.body);

    if (!req.body || !password || !email) {
      return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.NOT_ALLOWED, message: "email or password is invalid", data: {} });
    }
    // const encData = await encryptUserModel({ email })

    const adminExists = await Register.findOne({ email: req.body.email });

    if (!adminExists) {
      return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.NOT_ALLOWED, message: "email is incorrect", data: {} });
    }

    if (adminExists.role !== "admin")
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "Invalid credentials.", data: {} });

    if (!bcrypt.compareSync(password, adminExists.password)) {
      return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.BAD_REQUEST, message: "Password is incorrect", data: {} });
    }

    const token = jwt.sign({ id: adminExists._id, email: adminExists.email }, 'hello@user');
    console.log(" file: admin.controller.js: 77 ~ signin ~ token", token);

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Logged in successfully!", data: token });
  } catch (error) {
    console.log(error);
    return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

// admin forgot password
async function forgotPassword(req, res) {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.NOT_ALLOWED, message: "provide email", data: {} });
    }

    result = await Register.findOne({ email: req.body.email });
    if (!result) {
      return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.NOT_FOUND, message: "Record not found", data: {} });
    }

    const token = jwt.sign({ id: result._id, email: result.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const link = `${process.env.REACT_ADMIN_APP_WEB_URL}/${result.id}/${token}`;
    console.log(result.id, "this is a link result id");

    console.log(" file: admin.controller.js: ~ forgotPassword ~ link", link);

    var sendMailData = {
      file_template: "./public/emailTemplates/forgotPassword.html",
      subject: "Link to reset the password",
      to: result.email ? result.email : null,
      link: link,
    };

    sendForgotPasswordLink(sendMailData)
      .then((val) => {
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Please check your email.", data: val });
      })
      .catch((err) => {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "Unable to send email!", data: {} });
      });

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Admin detail is valid!", data: { token: "Bearer " + token } });
  } catch (err) {
    console.log(err);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

//set New Password
async function setNewPassword(req, res) {
  try {
    let { password, cpassword } = req.body;
    console.log(" ~ file: admin.controller.js ~ setNewPassword ~ req.body", req.body);
    if (req.body && password && cpassword) {
      //check password
      if (password != cpassword) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, message: "Password and confirm password does not match", data: {} });
      }
      // add other validations
      if (password.length < 8 || password.length > 16) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, message: "Password must be between of 8 to 16 characters!", data: {} });
      }

      password = hashSync(password.trim(), 10);

      const result = await Register.findOneAndUpdate({ role: "admin" }, { password }, { new: true });
      if (!result) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, message: "Unable to update password", data: {} });
      }

      return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "New Password has been set", data: {} });
    } else {
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, message: "New password and confirm password is required", data: {} });
    }
  } catch (err) {
    console.log(" ~ file: admin.controller.js ~ setNewPassword ~ err", err);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

// ==================================================================================================================================
// add agency
async function agencySignup(req, res) {
  try {
    let {
      email,
      password,
      role,
      street = null,
      suburb_area = null,
      postcode = null,
      state_region = null,
      country = null,
      mailing_address_street = null,
      mailing_address_suburb_area = null,
      mailing_address_postcode = null,
      mailing_address_state_region = null,
      mailing_address_country = null,
      fax = null,
      phone = null,
      web = null,
      facebook_page = null,
      twitter_profile_url = null,
      principal_name = null,
      display_email = null,
      office_description = null,
      agencySmallLogo = null,
      agencyMediumLogo = null,
      agencyLargeLogo = null,
      commercialAgencySmallLogo = null,
      commercialAgencyMediumLogo = null,
      commercialAgencyLargeLogo = null,
      commercialAgencyExtraLargeLogo = null,
      heroImg = null,
      primary_color = null,
      secondary_color = null,
      text_color = null,
      publish = null,
    } = req.body;
    console.log("hello");

    if (!email || !password) {
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "All fields are required!", data: {} });
    }

    if (!email.includes("@")) {
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "email is invalid!", data: {} });
    }

    if (password.length < 8 || password.length > 16) {
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "Please enter a strong password", data: {} });
    } else {
      password = hashSync(password.trim(), 8);
    }

    const agencyExists = await Register.findOne({ $or: [{ email: email }], });
    if (agencyExists)
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "agency Exists. Please Sign In.", data: {}, page: "signin" });

    const userData = new Register({
      email,
      password,
      role,
      street,
      suburb_area,
      postcode,
      state_region,
      country,
      mailing_address_street,
      mailing_address_suburb_area,
      mailing_address_postcode,
      mailing_address_state_region,
      mailing_address_country,
      fax,
      phone,
      web,
      facebook_page,
      twitter_profile_url,
      principal_name,
      display_email,
      office_description,
      agencySmallLogo,
      agencyMediumLogo,
      agencyLargeLogo,
      commercialAgencySmallLogo,
      commercialAgencyMediumLogo,
      commercialAgencyLargeLogo,
      commercialAgencyExtraLargeLogo,
      heroImg,
      primary_color,
      secondary_color,
      text_color,
    }).save();

    if (!userData)
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "Unable to register agency!", data: {} });

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "agency Registered.", data: {} });
  } catch (e) {
    console.log(e);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

//agency signin

async function agencySignin(req, res) {
  try {
    let { email, password, role } = req.body;

    console.log("file: admin.controller.js : -422 ~ signin ~ req.body", req.body);

    if (!req.body || !password || !email) {
      return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.NOT_ALLOWED, message: "email or password is invalid", data: {} });
    }

    const adminExists = await Register.findOne({ email: req.body.email });

    // if (!adminExists) {
    //   return res.status(HTTP.SUCCESS).send({
    //     success: false,
    //     code: HTTP.NOT_ALLOWED,
    //     message: "agency email is exist",
    //     data: {},
    //   });
    // }

    if (adminExists.role !== "agency")

      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "Invalid credentials.", data: {} });

    if (!bcrypt.compareSync(password, adminExists.password)) {
      return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.BAD_REQUEST, message: "Password is incorrect", data: {} });
    }

    const token = jwt.sign({ id: adminExists._id }, process.env.JWT_SECRET);
    console.log(" file: admin.controller.js: -295 ~ signin ~ token", token);

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Logged in successfully!", data: { token: token } });
  } catch (error) {
    console.log(error);
    return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

//agency forgot password
async function agencyFpassword(req, res) {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.NOT_ALLOWED, message: "provide email", data: {} });
    }

    result = await Register.findOne({ email: req.body.email });
    if (!result) {
      return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.NOT_FOUND, message: "Record not found", data: {} });
    }

    const token = jwt.sign({ id: result._id, email: result.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const link = `${process.env.REACT_ADMIN_APP_WEB_URL}/${result.id}/${token}`;
    console.log(result.id, "this is a link result id");

    console.log(" file: admin.controller.js: ~ forgotPassword ~ link", link);

    var sendMailData = {
      file_template: "./public/emailTemplates/forgotPassword.html",
      subject: "Link to reset the password",
      to: result.email ? result.email : null,
      link: link,
    };

    sendForgotPasswordLink(sendMailData)
      .then((val) => {
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Please check your email.", data: val });
      })
      .catch((err) => {
        console.log(err);
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "Unable to send email!", data: {} });
      });

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Admin detail is valid!", data: { token: "Bearer " + token } });
  } catch (err) {
    console.log(err);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

// agency set new password
async function agencySetpassword(req, res) {
  try {
    let { password, cpassword } = req.body;
    console.log("~ file: admin.controller.js: 351 ~ setNewPassword ~ req.body", req.body);
    if (req.body && password && cpassword) {
      //check password
      if (password != cpassword) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, message: "Password and confirm password does not match", data: {} });
      }
      // add other validations
      if (password.length < 8 || password.length > 20) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, message: "Password must be between of 8 to 16 characters!", data: {} });
      }

      password = hashSync(password.trim(), 10);

      const result = await Register.findOneAndUpdate({ role: "agency" }, { password }, { new: true });
      if (!result) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, message: "Unable to update password", data: {} });
      }

      return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "New Password has been set", data: {} });
    } else {
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_ALLOWED, message: "New password and confirm password is required", data: {} });
    }
  } catch (err) {
    console.log(" ~ file: admin.controller.js ~ setNewPassword ~ err", err);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

//======================================================== agency view Profile ==============================================================



async function agencyViewProfile(req, res) {
  var id = req.Data
  if (req.body)
    Register.findById(id, async function (err, doc) {
      try {
        if (!doc) {
          return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "Record not found", data: {} });
        }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "agency Profile", data: await doc });
      } catch (err) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
      }
    });
}



//============================================= agency veiw profile user side ===================================================



async function agencyViewProfile_U(req, res) {
  var id = req.body.id;

  try {
    Register.findById(id, async function (err, doc) {
      if (!doc) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "Record not found", data: {} });
      }
      return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "agency Profile", data: await doc });
    });
  } catch (err) {
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

//=========================================== agency profile update ==================================================================



async function agencyUpdateProfile(req, res) {
  console.log(req.body);
  try {
    if (req.Data) console.log(req.Data);
    Register.findByIdAndUpdate(req.Data, { $set: req.body }, { new: true }, async function (err, docs) {
      return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "agency Profile update", data: {} });
    })
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

// ===========================================   View All Agency ====================================================================================

async function viewAllAgency(req, res) {
  try {
    let formattedAgencyData = [];
    const usersData = await Register.find({ role: "agency" });
    if (!usersData)
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "No Agency available!", data: {} });

    for (const data of usersData) {
      formattedAgencyData.push({ id: data._id, name: data.name, agencyLargeLogo: data.agencyLargeLogo, street: data.street, suburb_area: data.suburb_area, postcode: data.postcode })
    }

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Agency details.", data: formattedAgencyData });
  } catch (err) {
    console.log(err);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

// ================================================== agency delete profile ===================================================
async function agencyDelete(req, res) {
  console.log(req.Data);

  try {
    Register.findByIdAndDelete(req.Data, async function (err, data) {
      if (err) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
      }
      return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "agency Profile delete", data: {} });
    });
  } catch (error) {
    console.log(error);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

// ===============================================================================================
//Agency branding and images
// async function Agency_Branding_img(req, res) {
//     console.log("hello world", "---------------------------------------------------------------------->");
//     try {

//         let { Primary_Color, Secondary_Color, text_colour, role } = req.body

//         var agency = req.files.agencySmallLogo.find((item) => item)
//         var agencySmallLogo = agency.filename

//         var Medium = req.files.agencyMediumLogo.find((item) => item)
//         var agencyMediumLogo = Medium.filename

//         var Large = req.files.agencyLargeLogo.find((item) => item)
//         var agencyLargeLogo = Large.filename

//         var CSmall = req.files.commercialAgencySmallLogo.find((item) => item)
//         var commercialAgencySmallLogo = CSmall.filename

//         var CMedium = req.files.commercialAgencyMediumLogo.find((item) => item)
//         var commercialAgencyMediumLogo = CMedium.filename

//         var CLarge = req.files.commercialAgencyLargeLogo.find((item) => item)
//         var commercialAgencyLargeLogo = CLarge.filename

//         var Cextrahero = req.files.commercialAgencyExtraLargeLogo.find((item) => item)
//         var commercialAgencyExtraLargeLogo = Cextrahero.filename

//         var hero = req.files.heroImg.find((item) => item)
//         var heroImg = hero.filename

//         const agencyData = await new Register({ agencySmallLogo, agencyMediumLogo, agencyLargeLogo, commercialAgencySmallLogo, commercialAgencyMediumLogo, commercialAgencyLargeLogo, commercialAgencyExtraLargeLogo, heroImg, Primary_Color, Secondary_Color, text_colour, role }).save()
//         if (!agencyData) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Unable to register user!", data: {} })

//         const token = jwt.sign({ id: agencyData._id }, process.env.JWT_SECRET)
//         console.log(" file: admin.controller.js: -435 ~ signin ~ token", token)

//         return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "Agency branding image set", data: { token : "bearer "+ token } })

//     } catch (error) {
//         return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
//     }
// }

// Agency branding and images view
// async function Agency_Branding_View(req, res) {
//     console.log(req.Data);
//     try {
//         if (!req.Data) {
//             return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Please provide token", data: {} })
//         }

//         Register.findById(req.Data, async function (err, docs) {
//             return res.status(HTTP.SUCCESS).send({ "status": true, 'code': HTTP.SUCCESS, "message": "view profile", data: { docs } })
//         })

//     } catch (error) {
//         return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
//     }
// }


// Agency branding and images update
async function Agency_Branding_Update(req, res) {
  var id = req.Data;
  try {
    if (req.body) {
      console.log(id);
      await Register.findByIdAndUpdate(id, { $set: req.body }, { new: true }, async function (err, docs) { });
    }

    await Register.findById(id, async function (err, doc) {
      if (req.files.agencySmallLogo) {
        if (req.files.agencySmallLogo !== null) {
          console.log(doc, "-------------------->");
          if (doc.agencySmallLogo) {
            fs.unlinkSync(path.join(__dirname, "..", "..", doc.agencySmallLogo)
            );
          }
          for (data of req.files.agencySmallLogo) {
            agencySmallLogo = "uploads/agency_image/" + data.filename;
            console.log("🚀 ~ file: blog.controller.js:556 ~ editBlog ~ outsideImg", agencySmallLogo);
            await Register.findByIdAndUpdate(doc.id, { agencySmallLogo: agencySmallLogo }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        } else {
          console.log(doc, "--------------------><------------------------");
          var imagePath = "";
          if (doc.agencySmallLogo) {
            imagePath = doc.agencySmallLogo;
          }
          for (data of req.files.agencySmallLogo) {
            await Register.findByIdAndUpdate(id, { agencySmallLogo: imagePath }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        }
      }
      if (req.files.agencyMediumLogo) {
        if (req.files.agencyMediumLogo !== null) {
          console.log(doc.agencySmallLogo, "-------------------->123");
          if (doc.agencyMediumLogo) {
            fs.unlinkSync(
              path.join(__dirname, "..", "..", doc.agencyMediumLogo)
            );
          }
          for (data of req.files.agencyMediumLogo) {
            agencyMediumLogo = "uploads/agency_image/" + data.filename;
            console.log("🚀 ~ file: blog.controller.js:589 ~ editBlog ~ outsideImg", agencyMediumLogo);
            await Register.findByIdAndUpdate(doc.id, { agencyMediumLogo: agencyMediumLogo }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        } else {
          console.log(doc, "--------------------><--------------------");
          var imagePath = "";
          if (doc.agencyMediumLogo) {
            imagePath = doc.agencyMediumLogo;
          }
          for (data of req.files.agencyMediumLogo) {
            await Register.findByIdAndUpdate(id, { agencyMediumLogo: imagePath }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        }
      }

      if (req.files.agencyLargeLogo) {
        if (req.files.agencyLargeLogo !== null) {
          console.log(doc, "-------------------->");
          if (doc.agencyLargeLogo) {
            fs.unlinkSync(path.join(__dirname, "..", "..", doc.agencyLargeLogo)
            );
          }
          for (data of req.files.agencyLargeLogo) {
            agencyLargeLogo = "uploads/agency_image/" + data.filename;
            console.log("🚀 ~ file: blog.controller.js:621 ~ editBlog ~ outsideImg", agencyLargeLogo);
            await Register.findByIdAndUpdate(id, { agencyLargeLogo: agencyLargeLogo }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        } else {
          console.log(doc, "-------------------->");
          var imagePath = "";
          if (doc.agencyLargeLogo) {
            imagePath = doc.agencyLargeLogo;
          }
          for (data of req.files.agencyLargeLogo) {
            await Register.findByIdAndUpdate(id, { agencyLargeLogo: imagePath }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        }
      }
      if (req.files.commercialAgencySmallLogo) {
        if (req.files.commercialAgencySmallLogo !== null) {
          console.log(doc, "-------------------->");
          if (doc.commercialAgencySmallLogo) {
            fs.unlinkSync(path.join(__dirname, "..", "..", doc.commercialAgencySmallLogo));
          }
          for (data of req.files.commercialAgencySmallLogo) {
            commercialAgencySmallLogo = "uploads/agency_image/" + data.filename;
            await Register.findByIdAndUpdate(id, { commercialAgencySmallLogo: commercialAgencySmallLogo }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        } else {
          console.log(doc, "-------------------->");
          var imagePath = "";
          if (doc.commercialAgencySmallLogo) {
            imagePath = doc.commercialAgencySmallLogo;
          }
          for (data of req.files.commercialAgencySmallLogo) {
            await Register.findByIdAndUpdate(id, { commercialAgencySmallLogo: imagePath }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        }
      }
      if (req.files.commercialAgencyMediumLogo) {
        if (req.files.commercialAgencyMediumLogo !== null) {
          console.log(doc, "-------------------->");
          if (doc.commercialAgencyMediumLogo) {
            fs.unlinkSync(path.join(__dirname, "..", "..", doc.commercialAgencyMediumLogo));
          }
          for (data of req.files.commercialAgencyMediumLogo) {
            commercialAgencyMediumLogo = "uploads/agency_image/" + data.filename;
            await Register.findByIdAndUpdate(id, { commercialAgencyMediumLogo: commercialAgencyMediumLogo }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        } else {
          console.log(doc, "-------------------->");
          var imagePath = "";
          if (doc.commercialAgencyMediumLogo) {
            imagePath = doc.commercialAgencyMediumLogo;
          }
          for (data of req.files.commercialAgencyMediumLogo) {
            await Register.findByIdAndUpdate(id, { commercialAgencyMediumLogo: imagePath }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        }
      }
      if (req.files.commercialAgencyLargeLogo) {
        if (req.files.commercialAgencyLargeLogo !== null) {
          console.log(doc, "-------------------->");
          if (doc.commercialAgencyLargeLogo) {
            fs.unlinkSync(path.join(__dirname, "..", "..", doc.commercialAgencyLargeLogo));
          }
          for (data of req.files.commercialAgencyLargeLogo) {
            commercialAgencyLargeLogo = "uploads/agency_image/" + data.filename; 
            await Register.findByIdAndUpdate(id, { commercialAgencyLargeLogo: commercialAgencyLargeLogo }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        } else {
          console.log(doc, "-------------------->");
          var imagePath = "";
          if (doc.commercialAgencyLargeLogo) {
            imagePath = doc.commercialAgencyLargeLogo;
          }
          for (data of req.files.commercialAgencyLargeLogo) {
            await Register.findByIdAndUpdate(id, { commercialAgencyLargeLogo: imagePath }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        }
      }
      if (req.files.commercialAgencyExtraLargeLogo) {
        if (req.files.commercialAgencyExtraLargeLogo !== null) {
          console.log(doc, "-------------------->");
          if (doc.commercialAgencyExtraLargeLogo) {
            fs.unlinkSync(path.join(__dirname, "..", "..", doc.commercialAgencyExtraLargeLogo));
          }
          for (data of req.files.commercialAgencyExtraLargeLogo) {
            commercialAgencyExtraLargeLogo = "uploads/agency_image/" + data.filename;
            await Register.findByIdAndUpdate(id, { commercialAgencyExtraLargeLogo: commercialAgencyExtraLargeLogo }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        } else {
          console.log(doc, "-------------------->");
          var imagePath = "";
          if (doc.commercialAgencyExtraLargeLogo) {
            imagePath = doc.commercialAgencyExtraLargeLogo;
          }
          for (data of req.files.commercialAgencyExtraLargeLogo) {
            await Register.findByIdAndUpdate(id, { commercialAgencyExtraLargeLogo: imagePath }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        }
      }
      if (req.files.heroImg) {
        if (req.files.heroImg !== null) {
          console.log(doc, "-------------------->");
          if (doc.heroImg) {
            fs.unlinkSync(path.join(__dirname, "..", "..", doc.heroImg));
          }
          for (data of req.files.heroImg) {
            heroImg = "uploads/agency_image/" + data.filename;
            await Register.findByIdAndUpdate(id, { heroImg: heroImg }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        } else {
          console.log(doc, "-------------------->");
          var imagePath = "";
          if (doc.heroImg) {
            imagePath = doc.heroImg;
          }
          for (data of req.files.heroImg) {
            await Register.findByIdAndUpdate(id, { heroImg: imagePath }, { new: true }), function (err, docs) {
              if (err) {
                console.log(err);
              }
            };
          }
        }
      }
      return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Agent registered.", data: {} });
    }).clone();
  } catch (err) {
    console.log(err);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

// =================================================================================================
// agent profile register

async function agentregister(req, res) {
  try {
    let {
      job_title,
      email,
      confirm_email,
      mobile_number,
      business_number,
      first_name,
      last_name,
      start_year_in_industry,
      license_number,
      about_me,
      taglines,
      awards,
      specialties,
      community_involvement,
      video_title,
      video_URL,
      twitter_profile_URL,
      facebook_profile_URL,
      linkedIn_profile_URL,
      role,
      residential_sales,
      residential_property_management,
      weakly_update,
      agency_id,
      reviews

    } = req.body;



    var name = first_name + " " + last_name;

    if (email !== confirm_email)
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "Email and confirm email does not match" });

    var photo = req.files.profileImg.find((item) => item);
    var profileImg = "uploads/agent/" + photo.filename;

    var profile = req.files.coverProfileImg.find((item) => item);
    var coverProfileImg = "uploads/agent/" + profile.filename;

    if (!start_year_in_industry || !license_number) {
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "All fields are required!", data: {} });
    }

    if (!email.includes("@")) {
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "email is invalid!", data: {} });
    }

    const userExists = await admin_agent.findOne({ $or: [{ email: req.body.email }] });
    if (userExists)
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "Agent with this email is already exist", data: {} });

    console.log(req.Data, " ----------------------------------------");

    var agencyId_Data = req.Data;
    console.log(agencyId_Data, "------------ line:- 929---------------------->");

    console.log(req.body)


    await new admin_agent({
      job_title,
      email,
      confirm_email,
      mobile_number,
      business_number,
      profileImg,
      first_name,
      last_name,
      name,
      start_year_in_industry,
      license_number,
      about_me,
      taglines,
      awards,
      specialties,
      community_involvement,
      coverProfileImg,
      video_title,
      video_URL,
      twitter_profile_URL,
      facebook_profile_URL,
      linkedIn_profile_URL,
      role,
      residential_sales,
      residential_property_management,
      weakly_update,
      agency_id: agencyId_Data,
      reviews
    }).save();

    admin_agent
      .find()
      .populate("Register")
      .then((p) => console.log(p))
      .catch((error) => console.log(error));

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Agent registered.", });
  } catch (e) {
    console.log(e);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

//=================================================== agent view profile===============================================================================================



async function agentViewProfile(req, res) {
  var id = req.body.id;
  try {
    console.log(id, "line No : - 988");
    if (!id)
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "user is not found", data: {} });

    admin_agent.findById(id, async function (err, doc) {
      return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "agent Profile", data: await doc });
    });
  } catch (error) {
    console.log(error);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "user is not found", data: {} });
  }
}



//=============================================================== agent Delete Profile ===================================================================================



async function agentDelete(req, res) {
  var data_id = req.body.id;
  console.log(data_id);

  // var id = data_id.toString().slice(0, 27);

  admin_agent.findByIdAndDelete(data_id, async function (err, data) {
    if (err) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.INTERNAL_SERVER_ERROR,
        message: "Something went wrong!",
        data: {},
      });
    }
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "agent Profile delete",
      data: {},
    });
  });
}


// ============================================================  agent update profile =============================================================================================
async function agentUpdateProfile(req, res) {
  var id = req.body.id;

  console.log(id);
  var {
    job_title,
    email,
    confirm_email,
    mobile_number,
    profileImg,
    business_number,
    first_name,
    last_name,
    start_year_in_industry,
    license_number,
    about_me,
    taglines,
    awards,
    specialties,
    community_involvement,
    video_title,
    video_URL,
    twitter_profile_URL,
    facebook_profile_URL,
    linkedIn_profile_URL,
    role,
    residential_sales,
    residential_property_management,
    weakly_update,
  } = req.body;

  var { coverProfileImg, profileImg } = req.files;

  try {
    if (!id)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.NOT_FOUND,
        message: "agent_id not provided",
        data: {},
      });
    if (email != confirm_email)
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.NOT_ALLOWED,
        message: "email and confirm email does not match",
        data: {},
      });
    var name = first_name + " " + last_name;

    var dataRecords = { ...req.body };

    console.log("=========  req.body =========", dataRecords);

    await admin_agent.findById(id, async function (err, doc) {
      await admin_agent.findByIdAndUpdate(id, {
        job_title,
        email,
        confirm_email,
        mobile_number,
        profileImg,
        business_number,
        first_name,
        last_name,
        name,
        start_year_in_industry,
        license_number,
        about_me,
        taglines,
        awards,
        specialties,
        community_involvement,
        video_title,
        video_URL,
        twitter_profile_URL,
        facebook_profile_URL,
        linkedIn_profile_URL,
        role,
        residential_sales,
        residential_property_management,
        weakly_update,
      }, { new: true }, async function (err, docs) { });

      if (req.files.profileImg) {
        if (req.files.profileImg !== null) {
          // console.log(doc, "-------------------->");
          if (doc.profileImg) {
            fs.unlinkSync(path.join(__dirname, "..", "..", doc.profileImg));
          }
          for (data of req.files.profileImg) {
            profileImg = "uploads/agent" + data.filename;
            console.log(
              "🚀 ~ file: blog.controller.js:556 ~ editBlog ~ outsideImg",
              profileImg
            );
            await admin_agent.findByIdAndUpdate(
              id,
              { profileImg },
              { new: true }
            ),
              function (err, docs) {
                if (err) {
                  console.log(err);
                }
              };
          }
        } else {
          //console.log(doc, "--------------------><------------------------");
          var imagePath = "";
          if (doc.profileImg) {
            imagePath = doc.profileImg;
          }
          for (data of req.files.profileImg) {
            await admin_agent.findByIdAndUpdate(
              id,
              { profileImg: imagePath },
              { new: true }
            ),
              function (err, docs) {
                if (err) {
                  console.log(err);
                }
              };
          }
        }
      }
      if (req.files.coverProfileImg) {
        if (req.files.coverProfileImg !== null) {
          console.log(doc.coverProfileImg, "-------------------->123");
          if (doc.coverProfileImg) {
            fs.unlinkSync(
              path.join(__dirname, "..", "..", doc.coverProfileImg)
            );
          }
          for (data of req.files.coverProfileImg) {
            coverProfileImg = "uploads/agent" + data.filename;
            console.log(
              "🚀 ~ file: blog.controller.js:589 ~ editBlog ~ outsideImg",
              coverProfileImg
            );
            await admin_agent.findByIdAndUpdate(
              id,
              { coverProfileImg: coverProfileImg },
              { new: true }
            ),
              function (err, docs) {
                if (err) {
                  console.log(err);
                }
              };
          }
        } else {
          // console.log(doc, "--------------------><--------------------");
          var imagePath = "";
          if (doc.coverProfileImg) {
            imagePath = doc.coverProfileImg;
          }
          for (data of req.files.coverProfileImg) {
            await admin_agent.findByIdAndUpdate(
              id,
              { coverProfileImg: imagePath },
              { new: true }
            ),
              function (err, docs) {
                if (err) {
                  console.log(err);
                }
              };
          }
        }
      }

      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        message: "Agent updated.",
        data: {},
      });
    }).clone();
  } catch (error) {
    console.log(error);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      message: "Something went wrong!",
      data: {},
    });
  }
}
//================================================================== viewAll Agents Of Agency ============================================================================

async function viewAllAgentsOfAgency(req, res) {
  try {
    let formattedAgentsData = [];
    console.log(req.Data, "===========================>>>>> line No :- 1131 !!!!");
    const agency_id = req.Data
    const agentsData = await admin_agent.find({ $or: [{ agency_id }] });
    console.log(agentsData);
    // var data = await admin_agent.findOne({ _id : usersData._id });
    // console.log(data,"---------------------------->");
    if (!agentsData)
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "No Agents available!", data: {} });

    // console.log(typeof agentsData , "________________________");

    for (const data of agentsData) {
      formattedAgentsData.push({ name: data.name, email: data.email, profileImg: data.profileImg, createdAt: data.createdAt, id: data._id });
    }

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Agents details.", data: agentsData });
  } catch (err) {
    console.log(err);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}


//==================================================================== view all agents of agency user side ==========================================================================



async function viewAllAgentsOfAgency_U(req, res) {
  try {
    let formattedAgentsData = [];

    console.log(req.body.id, "===========================>>>>>");
    agency_id = req.body.id

    const agentsData = await admin_agent.find({ agency_id })

    console.log(agentsData);
    if (!agentsData)
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "No Agents available!", data: {} });

    for (const data of agentsData) {
      formattedAgentsData.push({
        name: data.name,
        email: data.email,
        profileImg: data.profileImg,
        createdAt: data.createdAt,
        id: data._id,
      });
    }

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Agents details.", data: agentsData });
  } catch (err) {
    console.log(err);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

// ====================================================================== Viwe All Agent============================================================================================

async function viewAllAgents(req, res) {
  try {
    let formattedUserData = [];
    const usersData = await admin_agent.find({ role: "agent" })

    if (!usersData)
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "No Agents available!", data: {} });

    for (const data of usersData) {
      formattedUserData.push({
        name: data.name,
        email: data.email,
        profileImg: data.profileImg,
        createdAt: data.createdAt,
        id: data._id,
        agencySmallLogo: data.agencySmallLogo
      });
    }

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Agents details.", data: formattedUserData });
  } catch (err) {
    console.log(err);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

// ===================================================== AgencyListing ===============================================================================================

module.exports = {
  // la_Rosa Admin --------------->
  //admin
  signin,
  forgotPassword,
  setNewPassword,

  // agency admin ---------------->
  agencySignup,
  agencySignin,
  agencyFpassword,
  agencySetpassword,

  // agency profile Manage ---------------->
  // AgencyProfileRagister,
  agencyViewProfile,
  agencyViewProfile_U,
  agencyUpdateProfile,
  viewAllAgency,
  agencyDelete,

  // Agency branding and images
  // Agency_Branding_img,
  // Agency_Branding_View,
  Agency_Branding_Update,

  // agent profile Manage --------------->
  agentregister,
  agentViewProfile,
  agentUpdateProfile,
  agentDelete,
  viewAllAgentsOfAgency,
  viewAllAgentsOfAgency_U,
  viewAllAgents,
};