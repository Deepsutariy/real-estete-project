const mongoose = require("mongoose");
const express = require("express");
const sendPropertyDetail = require("../models/sendpropertyDetails.model");
const property_listing = require("../models/property_listing");
const multer = require("multer");
const path = require("path");

const agentReviews = require("../models/agentReview.model");
const sendEnquirys = require("../models/sendEnquiry.model");
const HTTP = require("../../constants/responseCode.constant");
const fs = require('fs');
var bodyParser = require("body-parser");
const { log } = require("console");
const admin_agent = require("../models/admin.agent");
const { findByIdAndUpdate } = require("../models/register");
const app = express()
app.use(express.json())

//====================================================== send property details  ===========================================  PAGE NO> : 5_02  ===================

async function sendPropertyDetails(req, res) {
  try {
    const { reason, first_name, last_name, email, mobile_no, timeframe, address, type, priceRange, remember_details } = req.body;

    if (!reason || !first_name || !last_name || !email || !mobile_no || !timeframe || !address || !type || !priceRange || !remember_details)
      return res.status(HTTP.BAD_REQUEST).send({ status: false, message: "All fields are required!" });

    // priceRange = JSON.parse(priceRange);
    console.log(priceRange);

    const data = await sendPropertyDetail({
      timeframe,
      address,
      type,
      priceRange,
      reason,
      first_name,
      last_name,
      email,
      mobile_no,
      remember_details,
    }).save();
    if (!data) {
      return res.status(HTTP.NOT_FOUND).send({ status: false, message: "Unable to add Property details." });
    }

    return res.status(HTTP.SUCCESS).send({ status: true, message: "Property details sent successfully.", data });
  } catch (e) {
    console.log(e);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

//================================================ agent Review ================================================== PAGE NO. : 8 =========================

async function agentReview(req, res) {
  console.log(req.body, "-----body");
  try {
    var id = req.params.id;
    // id = JSON.stringify(id)
    // console.log(req);
    const { star, review, type, client_address, client_email, client_firstname, client_lastname, client_phoneNumber } = req.body;
    var reviewData = [{star, review, type, client_address,  client_email,  client_firstname, client_lastname, client_phoneNumber}];
    // console.log(reviewData);

    console.log(id, "========= params.id======>>");
    if (!star || !review || !type || !client_email || !client_firstname || !client_lastname || !client_phoneNumber) { return res.status(HTTP.BAD_REQUEST).send({ status: false, "message": "All fields are required!" }) }

    let find = await admin_agent.findByIdAndUpdate(id, { $push: { reviews: reviewData } }, { new: true })
    return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, 'message': "Review Noted", data: find.reviews })

  } catch (e) {
    console.log(e);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

//================= send enquiry =====================================================================PAGE NO. : 4 =======================================

async function sendEnquiry(req, res) {
  try {
    let { massage, email, firstname, lastname, phoneNumber } = req.body;

    if (!massage || !email || !firstname || !lastname || !phoneNumber) {
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "All fields are required!", data: {} });
    }

    if (!email.includes("@")) {
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, message: "Email is invalid!", data: {} });
    }
    const data = await sendEnquirys({ massage, email, firstname, lastname, phoneNumber }).save();

    if (!data)
      return res.status(HTTP.NOT_FOUND).send({ status: false, message: "Unable to send Enquiry" });

    return res.status(HTTP.SUCCESS).send({ status: true, message: "Enquiry sent successfully.", data });
  } catch (e) {
    console.log(e);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

// ==================================================Property Listing =======================================================================================================

async function propertyListing(req, res) {
  try {
    let {
      listing_type,
      property_type,
      status,
      new_or_established_checked,
      lead_agent,
      authority,
      price,
      price_display,
      price_display_checked,
      name,
      email,
      phone_number,
      unit,
      street_address_number,
      street_address_name,
      suburb,
      municipality,
      auction_result,
      maximum_bid,
      Bedrooms,
      Bathrooms,
      Ensuites,
      toilets,
      garage_spaces,
      carport_spaces,
      open_spaces,
      energy_efficiensy_rating,
      living_areas,
      house_size,
      house_size_square,
      land_size,
      land_size_square,
      other_features,

      established_property,
      new_construction,
      show_actual_price,
      show_text_instead_of_price,
      Hide_the_price_and_display_contact_agent,
      send_vendor_the_property_live_email_when_listing_is_published,
      send_vendor_a_weekly_campaign_activity_report_email,
      hide_street_address_on_listing,
      hide_street_view,

      outdoor_deck,
      outdoor_swimming_pool_in_ground,
      outdoor_swimming_pool_above_ground,
      outdoor_tennis_court,
      outdoor_fully_fenced,
      outdoor_shed,
      outdoor_outside_spa,
      outdoor_outdoor_entertainment_area,
      outdoor_secure_parking,
      outdoor_courtyard,
      outdoor_remote_garage,
      outdoor_garage,
      outdoor_balcony,
      indoor_alaram_system,
      indoor_study,
      indoor_workshop,
      indoor_gym,
      indoor_built_in_wardrodes,
      indoor_intercom,
      indoor_ducted_vacuum_system,
      indoor_rumpus_room,
      indoor_inside_spa,
      indoor_floorboards,
      indoor_dishwashera,
      indoor_play_tv_access,
      indoor_broadband_internet_available,
      hc_air_conditioning,
      hc_ducted_heating,
      hc_hydronic_heating,
      hc_ducted_cooling,
      hc_gas_heating,
      hc_open_fireplace,
      hc_split_system_air_conditioning,
      hc_split_system_heating,
      hc_evaporative_cooling,
      hc_reverse_cycle_air_conditioning,
      eff_solar_hot_water,
      eff_water_tank,
      eff_grey_water_system,
      eff_solar_panels,
      cces_air_conditionings,
      cces_solar_hot_water,
      cces_high_energy_efficieny,
      cces_solar_panels,
      cces_heating,
      cces_water_tank,
      heading,
      discription,
      video_url,
      online_tour_1,
      online_tour_2,
      agency_listing_url,
      inspection_times,
    } = req.body;

    inspection_times = JSON.parse(inspection_times);

    var { propertyImg, florePlansImg, frontPageImg, statementOfInfo } = req.files;

    if (!propertyImg || !florePlansImg || !statementOfInfo || !frontPageImg) {
      return res.status(HTTP.SUCCESS).send({ success: false, code: HTTP.NOT_ALLOWED, message: "upload All Images and File", data: {} });
    }

    if (!Bedrooms || !Bathrooms || !property_type || !new_or_established_checked || !lead_agent || !price) {
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "All fields are required!", data: {} });
    }
    console.log(
      req.files.propertyImg, "<<<<<<<<<<<-----------------------------------");

    console.log(req.files, "---------------------------------------->>>>>>>>");
    lead_agent = JSON.parse(lead_agent)
    // inspection_times = JSON.parse(inspection_times);

    var propertyImg = [];

    for (const data of req.files.propertyImg) {
      propertyImg.push("uploads/property_image" + data.filename);
    }

    console.log(propertyImg, "-------------------------------- array of property images -----------------------------------------");


    console.log("=======================>>>>", propertyImg);

    var plan = req.files.florePlansImg.find((item) => item);
    var florePlansImg = "uploads/property_image" + plan.filename;

    var statement = req.files.statementOfInfo.find((item) => item);
    var statementOfInfo = "uploads/property_image" + statement.filename;

    var frontPage = req.files.frontPageImg.find((item) => item);
    var frontPageImg = "uploads/property_image" + frontPage.filename;

    var agencyId_Data = req.Data;


    await new property_listing({
      agency_id: req.Data,
      listing_type,
      property_type,
      status,
      new_or_established_checked,
      lead_agent,
      authority,
      price,
      price_display,
      price_display_checked,
      name,
      email,
      phone_number,
      unit,
      street_address_number,
      street_address_name,
      suburb,
      municipality,
      auction_result,
      maximum_bid,
      Bedrooms,
      Bathrooms,
      Ensuites,
      toilets,
      garage_spaces,
      carport_spaces,
      open_spaces,
      energy_efficiensy_rating,
      living_areas,
      house_size,
      house_size_square,
      land_size,
      land_size_square,
      other_features,

      established_property,
      new_construction,
      show_actual_price,
      show_text_instead_of_price,
      Hide_the_price_and_display_contact_agent,
      send_vendor_the_property_live_email_when_listing_is_published,
      send_vendor_a_weekly_campaign_activity_report_email,
      hide_street_address_on_listing,
      hide_street_view,

      outdoor_deck,
      outdoor_swimming_pool_in_ground,
      outdoor_swimming_pool_above_ground,
      outdoor_tennis_court,
      outdoor_fully_fenced,
      outdoor_shed,
      outdoor_outside_spa,
      outdoor_outdoor_entertainment_area,
      outdoor_secure_parking,
      outdoor_courtyard,
      outdoor_remote_garage,
      outdoor_garage,
      outdoor_balcony,
      indoor_alaram_system,
      indoor_study,
      indoor_workshop,
      indoor_gym,
      indoor_built_in_wardrodes,
      indoor_intercom,
      indoor_ducted_vacuum_system,
      indoor_rumpus_room,
      indoor_inside_spa,
      indoor_floorboards,
      indoor_dishwashera,
      indoor_play_tv_access,
      indoor_broadband_internet_available,
      hc_air_conditioning,
      hc_ducted_heating,
      hc_hydronic_heating,
      hc_ducted_cooling,
      hc_gas_heating,
      hc_open_fireplace,
      hc_split_system_air_conditioning,
      hc_split_system_heating,
      hc_evaporative_cooling,
      hc_reverse_cycle_air_conditioning,
      eff_solar_hot_water,
      eff_water_tank,
      eff_grey_water_system,
      eff_solar_panels,
      cces_air_conditionings,
      cces_solar_hot_water,
      cces_high_energy_efficieny,
      cces_solar_panels,
      cces_heating,
      cces_water_tank,
      heading,
      discription,
      video_url,
      online_tour_1,
      online_tour_2,
      agency_listing_url,
      inspection_times, propertyImg, florePlansImg, frontPageImg, statementOfInfo
    }).save();

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Property listed successfully", data: {} });
  } catch (error) {
    console.log(error);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}

// ======================================================   View Property  =================================================================================================

async function viewProperty(req, res) {
  user_id = req.body.id;
  console.log(user_id);

  if (!user_id)
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "Property not found", data: {} });

  property_listing.findById(user_id, async function (err, doc) {

    //  console.log(doc);

    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Property", data: doc });
  });
}



// ----------------------------------------------------------- update property ----------------------------------------------------------------------------------
async function propertyUpdate(req, res) {
  var _id = req.Data;
  let {
    property_type,
    listing_type,
    status,
    new_or_established_checked,
    lead_agent,
    authority,
    price,
    price_display,
    price_display_checked,
    name,
    email,
    phone_number,
    unit,
    street_address_number,
    street_address_name,
    suburb,
    municipality,
    auction_result,
    maximum_bid,
    Bedrooms,
    Bathrooms,
    Ensuites,
    toilets,
    garage_spaces,
    carport_spaces,
    open_spaces,
    energy_efficiensy_rating,
    living_areas,
    house_size,
    house_size_square,
    land_size,
    land_size_square,
    other_features,

    established_property,
    new_construction,
    show_actual_price,
    show_text_instead_of_price,
    Hide_the_price_and_display_contact_agent,
    send_vendor_the_property_live_email_when_listing_is_published,
    send_vendor_a_weekly_campaign_activity_report_email,
    hide_street_address_on_listing,
    hide_street_view,

    outdoor_deck,
    outdoor_swimming_pool_in_ground,
    outdoor_swimming_pool_above_ground,
    outdoor_tennis_court,
    outdoor_fully_fenced,
    outdoor_shed,
    outdoor_outside_spa,
    outdoor_outdoor_entertainment_area,
    outdoor_secure_parking,
    outdoor_courtyard,
    outdoor_remote_garage,
    outdoor_garage,
    outdoor_balcony,
    indoor_alaram_system,
    indoor_study,
    indoor_workshop,
    indoor_gym,
    indoor_built_in_wardrodes,
    indoor_intercom,
    indoor_ducted_vacuum_system,
    indoor_rumpus_room,
    indoor_inside_spa,
    indoor_floorboards,
    indoor_dishwashera,
    indoor_play_tv_access,
    indoor_broadband_internet_available,
    hc_air_conditioning,
    hc_ducted_heating,
    hc_hydronic_heating,
    hc_ducted_cooling,
    hc_gas_heating,
    hc_open_fireplace,
    hc_split_system_air_conditioning,
    hc_split_system_heating,
    hc_evaporative_cooling,
    hc_reverse_cycle_air_conditioning,
    eff_solar_hot_water,
    eff_water_tank,
    eff_grey_water_system,
    eff_solar_panels,
    cces_air_conditionings,
    cces_solar_hot_water,
    cces_high_energy_efficieny,
    cces_solar_panels,
    cces_heating,
    cces_water_tank,
    heading,
    discription,
    video_url,
    online_tour_1,
    online_tour_2,
    agency_listing_url,
    inspection_times,
  } = req.body;

  let { propertyImg, florePlansImg, statementOfInfo, frontPageImg } = req.files
  var data_id = await property_listing.findOne({ agency_id: req.Data });



  try {
    if (req.files != [] || req.files != undefined) {

      var arrayData = [];
      // console.log(typeof data);

      // for (var i of data) {
      //   arrayData.push("uploads/property_image" + i.filename);
      // }

      // plan = req.files.florePlansImg.find((item) => item);
      // florePlansImg = "uploads/property_image" + plan.filename;

      // statement = req.files.statementOfInfo.find((item) => item);
      // statementOfInfo = "uploads/property_image" + statement.filename;

      // frontPage = req.files.frontPageImg.find((item) => item);
      // frontPageImg = "uploads/property_image" + frontPage.filename;
      console.log(_id);
      var doc = await property_listing.find({ agency_id: _id });
      // console.log(doc, "------------------------- 596 ------------------------->");

      for (da of doc) {
        // console.log(da._id);


      }
      var list_id = da.toString().slice(23, 47);
      // console.log(list_id);



      var first = da.propertyImg;
      var second = doc.florePlansImg;
      var third = doc.statementOfInfo;
      var fourth = doc.frontPageImg;

      var firsts = [first];
      var seconds = [second];
      var thirds = [third];
      var fourths = [fourth];

      // console.log(firsts, "-------------------- array data [ 624 ]-----------------");

      // var firstsData = firsts.toString();
      var secondsData = seconds.toString();
      var thirdsData = thirds.toString();
      var fourthsData = fourths.toString();

      // console.log(firstsData, " ================== String data [ 631 ] =================");

      for (property of firsts) {
        // console.log(property);
      }

      for (pro of property) {
        // console.log(pro,"===============> final data");
      }


      if (req.files.propertyImg != undefined) {

        //  console.log(
        //    "====== maro log ===================)))",
        //    URL.createObjectURL(propertyImg)
        //  );
        for (const data of req.files.propertyImg) {
          outsideImg = "uploads/property_image" + data.filename;
          // console.log("🚀 ~ file: propertyImg.controller.js:646 ~ editBlog ~ outsideImg ----------------------------------------------------------->", outsideImg)

          if (outsideImg) {
            propertyImg = "uploads/property_image" + data.filename;
            // fs.unlinkSync(path.join(__dirname, "..", "..", pro))

          }
          const data_ = await property_listing.findByIdAndUpdate(da._id, { propertyImg: outsideImg }, { new: true })
          if (!data_) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'Unable to update data!', data: {} })
        }
      }

      if (req.files.florePlansImg != undefined) {
        for (const data of req.files.florePlansImg) {
          florePlansImg = "uploads/property_image" + data.filename;
          // console.log("🚀 ~ file: blog.controller.js:642 ~ editBlog ~ outsideImg", florePlansImg)

          if (secondsData) {
            // secondsData = "uploads/property_image" + data.filename;
            // console.log("🚀 ~ file: blog.controller.js:118 ~ editBlog ~ filename_", filename_)
            fs.unlinkSync(path.join(__dirname, "..", "..", secondsData));
          }
          const data_ = await property_listing.findByIdAndUpdate(da._id, { florePlansImg }, { new: true })
          if (!data_) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'Unable to update data!', data: {} })
        }
      }

      if (req.files.statementOfInfo != undefined) {
        for (const data of req.files.statementOfInfo) {
          statementOfInfo = "uploads/property_image" + data.filename;
          // console.log("🚀 ~ file: blog.controller.js:657 ~ editBlog ~ outsideImg", statementOfInfo)

          if (thirdsData) {
            // thirdsData = "uploads/property_image" + data.filename;
            // console.log("🚀 ~ file: blog.controller.js:118 ~ editBlog ~ filename_", filename_)
            fs.unlinkSync(path.join(__dirname, "..", "..", thirdsData));
          }
          const data_ = await property_listing.findByIdAndUpdate(da._id, { statementOfInfo }, { new: true })
          if (!data_) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'Unable to update data!', data: {} })
        }
      }

      if (req.files.frontPageImg != undefined) {
        for (const data of req.files.frontPageImg) {
          frontPageImg = "uploads/property_image" + data.filename;
          // console.log("🚀 ~ file: blog.controller.js:672 ~ editBlog ~ outsideImg", frontPageImg)

          if (fourthsData) {
            // fourthsData = "uploads/property_image" + data.filename;
            // console.log("🚀 ~ file: blog.controller.js:118 ~ editBlog ~ filename_", filename_)
            fs.unlinkSync(path.join(__dirname, "..", "..", fourthsData));
          }
          const data_ = await property_listing.findByIdAndUpdate(da._id, { frontPageImg }, { new: true })
          if (!data_) return res.status(HTTP.SUCCESS).send({ 'status': false, 'code': HTTP.BAD_REQUEST, 'message': 'Unable to update data!', data: {} })
        }
      }


      const updateData = await property_listing.findByIdAndUpdate(list_id, {
        property_type,
        listing_type,
        status,
        new_or_established_checked,
        lead_agent,
        authority,
        price,
        price_display,
        price_display_checked,
        name,
        email,
        phone_number,
        unit,
        street_address_number,
        street_address_name,
        suburb,
        municipality,
        auction_result,
        maximum_bid,
        Bedrooms,
        Bathrooms,
        Ensuites,
        toilets,
        garage_spaces,
        carport_spaces,
        open_spaces,
        energy_efficiensy_rating,
        living_areas,
        house_size,
        house_size_square,
        land_size,
        land_size_square,
        other_features,

        established_property,
        new_construction,
        show_actual_price,
        show_text_instead_of_price,
        Hide_the_price_and_display_contact_agent,
        send_vendor_the_property_live_email_when_listing_is_published,
        send_vendor_a_weekly_campaign_activity_report_email,
        hide_street_address_on_listing,
        hide_street_view,

        outdoor_deck,
        outdoor_swimming_pool_in_ground,
        outdoor_swimming_pool_above_ground,
        outdoor_tennis_court,
        outdoor_fully_fenced,
        outdoor_shed,
        outdoor_outside_spa,
        outdoor_outdoor_entertainment_area,
        outdoor_secure_parking,
        outdoor_courtyard,
        outdoor_remote_garage,
        outdoor_garage,
        outdoor_balcony,
        indoor_alaram_system,
        indoor_study,
        indoor_workshop,
        indoor_gym,
        indoor_built_in_wardrodes,
        indoor_intercom,
        indoor_ducted_vacuum_system,
        indoor_rumpus_room,
        indoor_inside_spa,
        indoor_floorboards,
        indoor_dishwashera,
        indoor_play_tv_access,
        indoor_broadband_internet_available,
        hc_air_conditioning,
        hc_ducted_heating,
        hc_hydronic_heating,
        hc_ducted_cooling,
        hc_gas_heating,
        hc_open_fireplace,
        hc_split_system_air_conditioning,
        hc_split_system_heating,
        hc_evaporative_cooling,
        hc_reverse_cycle_air_conditioning,
        eff_solar_hot_water,
        eff_water_tank,
        eff_grey_water_system,
        eff_solar_panels,
        cces_air_conditionings,
        cces_solar_hot_water,
        cces_high_energy_efficieny,
        cces_solar_panels,
        cces_heating,
        cces_water_tank,
        heading,
        discription,
        video_url,
        online_tour_1,
        online_tour_2,
        agency_listing_url,
        inspection_times
        // propertyImg : arrayData,
        // florePlansImg,
        // statementOfInfo,
        // frontPageImg,
      });
      console.log(updateData);
      console.log(updateData.status);

      if (updateData) {
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Profile update", })
      }
      // else {
      //   return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Profile update" })
      // }
    } else {
      await property_listing.findById(list_id, async function (err, doc) {
        console.log("hello world");
        if (!propertyImg || !florePlansImg || !statementOfInfo || !frontPageImg) {
          let propertyImg = doc.propertyImg;
          let florePlansImg = doc.florePlansImg;
          let statementOfInfo = doc.statementOfInfo;
          let frontPageImg = doc.frontPageImg;

          property_listing.findByIdAndUpdate(list_id, {
            property_type,
            listing_type,
            status,
            new_or_established_checked,
            lead_agent,
            authority,
            price,
            price_display,
            price_display_checked,
            name,
            email,
            phone_number,
            unit,
            street_address_number,
            street_address_name,
            suburb,
            municipality,
            auction_result,
            maximum_bid,
            Bedrooms,
            Bathrooms,
            Ensuites,
            toilets,
            garage_spaces,
            carport_spaces,
            open_spaces,
            energy_efficiensy_rating,
            living_areas,
            house_size,
            house_size_square,
            land_size,
            land_size_square,
            other_features,

            established_property,
            new_construction,
            show_actual_price,
            show_text_instead_of_price,
            Hide_the_price_and_display_contact_agent,
            send_vendor_the_property_live_email_when_listing_is_published,
            send_vendor_a_weekly_campaign_activity_report_email,
            hide_street_address_on_listing,
            hide_street_view,

            outdoor_deck,
            outdoor_swimming_pool_in_ground,
            outdoor_swimming_pool_above_ground,
            outdoor_tennis_court,
            outdoor_fully_fenced,
            outdoor_shed,
            outdoor_outside_spa,
            outdoor_outdoor_entertainment_area,
            outdoor_secure_parking,
            outdoor_courtyard,
            outdoor_remote_garage,
            outdoor_garage,
            outdoor_balcony,
            indoor_alaram_system,
            indoor_study,
            indoor_workshop,
            indoor_gym,
            indoor_built_in_wardrodes,
            indoor_intercom,
            indoor_ducted_vacuum_system,
            indoor_rumpus_room,
            indoor_inside_spa,
            indoor_floorboards,
            indoor_dishwashera,
            indoor_play_tv_access,
            indoor_broadband_internet_available,
            hc_air_conditioning,
            hc_ducted_heating,
            hc_hydronic_heating,
            hc_ducted_cooling,
            hc_gas_heating,
            hc_open_fireplace,
            hc_split_system_air_conditioning,
            hc_split_system_heating,
            hc_evaporative_cooling,
            hc_reverse_cycle_air_conditioning,
            eff_solar_hot_water,
            eff_water_tank,
            eff_grey_water_system,
            eff_solar_panels,
            cces_air_conditionings,
            cces_solar_hot_water,
            cces_high_energy_efficieny,
            cces_solar_panels,
            cces_heating,
            cces_water_tank,
            // propertyImg,
            // florePlansImg,
            // statementOfInfo,
            // frontPageImg,
          }), { new: true }, async function (err, docs) {
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Property updated", data: await docs });
          };
        }
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}


//============================================================= View Property Of Agency ========================================================================================


async function viewAgencyProperty(req, res) {
  try {
    let formattedpropertyData = [];

    const agency_id = req.Data;
    const agentsData = await property_listing.find({ agency_id });
    console.log(agency_id);
    // console.log(agentsData, "----------------->");
    if (!agentsData)
      return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "No Agents available!", data: {} });

    for (const data of agentsData) {

      formattedpropertyData.push({
        lead_agent: data.lead_agent,
        price: data.price,
        Bedrooms: data.Bedrooms,
        Bathrooms: data.Bathrooms,
        garage_spaces: data.garage_spaces,
        property_type: data.property_type,
        frontPageImg: data.frontPageImg,
        createdAt: data.createdAt,
        id: data._id,
        street_address_name: data.street_address_name,
        street_address_number: data.street_address_number,
        email: data.email,
        status: data.status,
      });
    }
    console.log(formattedpropertyData.length);

    // console.log(formattedpropertyData, "==================}}");
    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Property details.", data: formattedpropertyData });
  } catch (err) {
    console.log(err);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });
  }
}


// ===========================================================View All Property ================================================================================================



async function viewAllProperty(req, res) {
  try {
    console.log(req.body.status);
    listings = []
    let search = await property_listing.find({
      $or: [
        { status: { $regex: req.body.status } },
      ],
    });

    console.log(listings, "------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

    for (const data of search) {
      listings.push({
        lead_agent: data.lead_agent,
        price: data.price,
        Bedrooms: data.Bedrooms,
        Bathrooms: data.Bathrooms,
        garage_spaces: data.garage_spaces,
        property_type: data.property_type,
        frontPageImg: data.frontPageImg,
        createdAt: data.createdAt,
        id: data._id,
        street_address_name: data.street_address_name,
        street_address_number: data.street_address_number,
        email: data.email,
        status: data.status,
      });
    }
    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Property details.", data: listings });

    // let { status, property_type, lead_agent } = req.body;
    // let search = req.body.key

    // let listings = [];

    // if (search) {
    //   search = await property_listing.find({
    //     $or: [
    //       { street_address_number: { $regex: req.body.key } },
    //       { street_address_name: { $regex: req.body.key } },
    //       // { suburb: { $regex: req.body.search } },
    //       // { id: { $regex: req.body.search } },
    //     ],
    //   });

    //   for (const data of search) {
    //     listings.push({
    //       lead_agent: data.lead_agent,
    //       price: data.price,
    //       Bedrooms: data.Bedrooms,
    //       Bathrooms: data.Bathrooms,
    //       garage_spaces: data.garage_spaces,
    //       property_type: data.property_type,
    //       frontPageImg: data.frontPageImg,
    //       createdAt: data.createdAt,
    //       id: data._id,
    //       street_address_name: data.street_address_name,
    //       street_address_number: data.street_address_number,
    //       email: data.email,
    //       status: data.status,
    //     });
    //   }

    //   return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Property details.", data: listings });
    // } else if (property_type & status & lead_agent) {
    //   let result = await property_listing.find({
    //     $and: [
    //       { property_type: { $regex: req.body.key } },
    //       { status: { $regex: req.body.key } },
    //       { lead_agent: { $regex: req.body.key } },
    //     ],
    //   });
    //   res.status(200).send(result);
    // } else {
    //   const propertyData = await property_listing.find({ role: "property" });
    //   if (!propertyData)
    //     return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.NOT_FOUND, message: "No Agents available!", data: {} });

    //   for (const data of propertyData) {
    //     listings.push({
    //       lead_agent: data.lead_agent,
    //       price: data.price,
    //       Bedrooms: data.Bedrooms,
    //       Bathrooms: data.Bathrooms,
    //       garage_spaces: data.garage_spaces,
    //       property_type: data.property_type,
    //       frontPageImg: data.frontPageImg,
    //       createdAt: data.createdAt,
    //       id: data._id,
    //       street_address_name: data.street_address_name,
    //       street_address_number: data.street_address_number,
    //       email: data.email,
    //       status: data.status,
    //     });
    //   }
    // }

    // return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: "Property details.", data: listings });
  } catch (err) {
    console.log(err);
    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, message: "Something went wrong!", data: {} });;
  }
}

module.exports = {
  sendPropertyDetails,
  agentReview,
  sendEnquiry,

  // inspection

  // Agency Listing ---------------->
  propertyListing,
  viewProperty,
  viewAgencyProperty,
  propertyUpdate,
  viewAllProperty,
};