const express = require("express");
const admin_agent = require("../models/admin.agent");
const admin = require("../models/admin.model");
const adminagencyController = require("./admin_agency_controller");
const agency_listing = require("../models/property_listing");
const property_listing = require("../models/property_listing");

async function searchAgent(req, res) {
  console.log(req.body.key);
  let search = await admin_agent.find({
    $or: [
      { first_name: { $regex: req.body.key } },
      { last_name: { $regex: req.body.key } },
      { job_title: { $regex: req.body.key } },
    ],
  });

  res.status(200).send(search);
}

async function searchProperty(req, res) {
  console.log(req.body.key);
  search = await property_listing.find({
    $or: [
      { street_address_number: { $regex: req.body.key } },
      { street_address_name: { $regex: req.body.key } },
      { suburb: { $regex: req.body.key } },
      { id: { $regex: req.body.key } },
    ],
  });
  res.status(200).send(search);
}

module.exports = {
  searchAgent,
  searchProperty,
};
