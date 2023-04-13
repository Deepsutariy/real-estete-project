const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const propertySchema = new Schema(
  {
    agency_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Register",
    },
    role: {
      type: String,
      default: "property",
    },
    property_type: {
      type: String,
    },
    status: {
      type: String,
    },
    new_or_established_checked: {
      type: String,
    },
    lead_agent: {
      type: Object,
    },
    authority: {
      type: String,
    },
    price: {
      type: String,
    },
    price_display: {
      type: String,
    },
    price_display_checked: {
      type: String,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    phone_number: {
      type: String,
    },
    unit: {
      type: String,
    },
    street_address_number: {
      type: String,
    },
    street_address_name: {
      type: String,
    },
    suburb: {
      type: String,
    },
    municipality: {
      type: String,
    },
    auction_result: {
      type: String,
    },
    maximum_bid: {
      type: String,
    },
    Bedrooms: {
      type: String,
    },
    Bathrooms: {
      type: String,
    },
    Ensuites: {
      type: String,
    },
    toilets: {
      type: String,
    },
    garage_spaces: {
      type: String,
    },
    carport_spaces: {
      type: String,
    },
    open_spaces: {
      type: String,
    },
    energy_efficiensy_rating: {
      type: String,
    },
    living_areas: {
      type: String,
    },
    house_size: {
      type: String,
    },
    house_size_square: {
      type: String,
    },
    land_size: {
      type: String,
    },
    land_size_square: {
      type: String,
    },
    other_features: {
      type: String,
    },
    established_property: {
      type: Boolean,
    },
    new_construction: {
      type: Boolean,
    },
    show_actual_price: {
      type: Boolean,
    },
    show_text_instead_of_price: {
      type: Boolean,
    },
    Hide_the_price_and_display_contact_agent: {
      type: Boolean,
    },
    send_vendor_the_property_live_email_when_listing_is_published: {
      type: Boolean,
    },
    send_vendor_a_weekly_campaign_activity_report_email: {
      type: Boolean,
    },
    hide_street_address_on_listing: {
      type: Boolean,
    },
    hide_street_view: {
      type: Boolean,
    },
    outdoor_deck: {
      type: Boolean,
    },
    outdoor_swimming_pool_in_ground: {
      type: Boolean,
    },
    outdoor_swimming_pool_above_ground: {
      type: Boolean,
    },
    outdoor_tennis_court: {
      type: Boolean,
    },
    outdoor_fully_fenced: {
      type: Boolean,
    },
    outdoor_shed: {
      type: Boolean,
    },
    outdoor_outside_spa: {
      type: Boolean,
    },
    outdoor_outdoor_entertainment_area: {
      type: Boolean,
    },
    outdoor_secure_parking: {
      type: Boolean,
    },
    outdoor_courtyard: {
      type: Boolean,
    },

    outdoor_remote_garage: {
      type: Boolean,
    },
    outdoor_garage: {
      type: Boolean,
    },
    outdoor_balcony: {
      type: Boolean,
    },
    indoor_alaram_system: {
      type: Boolean,
    },
    indoor_study: {
      type: Boolean,
    },
    indoor_workshop: {
      type: Boolean,
    },
    indoor_gym: {
      type: Boolean,
    },
    indoor_built_in_wardrodes: {
      type: Boolean,
    },
    indoor_intercom: {
      type: Boolean,
    },
    indoor_ducted_vacuum_system: {
      type: Boolean,
    },
    indoor_rumpus_room: {
      type: Boolean,
    },
    indoor_inside_spa: {
      type: Boolean,
    },
    indoor_floorboards: {
      type: Boolean,
    },
    indoor_dishwashera: {
      type: Boolean,
    },
    indoor_play_tv_access: {
      type: Boolean,
    },
    indoor_broadband_internet_available: {
      type: Boolean,
    },
    hc_air_conditioning: {
      type: Boolean,
    },
    hc_ducted_heating: {
      type: Boolean,
    },
    hc_hydronic_heating: {
      type: Boolean,
    },
    hc_ducted_cooling: {
      type: Boolean,
    },
    hc_gas_heating: {
      type: Boolean,
    },
    hc_open_fireplace: {
      type: Boolean,
    },
    hc_split_system_air_conditioning: {
      type: Boolean,
    },
    hc_split_system_heating: {
      type: Boolean,
    },
    hc_evaporative_cooling: {
      type: Boolean,
    },
    hc_reverse_cycle_air_conditioning: {
      type: Boolean,
    },
    eff_solar_hot_water: {
      type: Boolean,
    },
    eff_water_tank: {
      type: Boolean,
    },
    eff_grey_water_system: {
      type: Boolean,
    },
    eff_solar_panels: {
      type: Boolean,
    },
    cces_air_conditionings: {
      type: Boolean,
    },
    cces_solar_hot_water: {
      type: Boolean,
    },
    cces_high_energy_efficieny: {
      type: Boolean,
    },
    cces_solar_panels: {
      type: Boolean,
    },
    cces_heating: {
      type: Boolean,
    },
    cces_water_tank: {
      type: Boolean,
    },
    heading: {
      type: String,
    },
    discription: {
      type: String,
    },
    // propertyImages: {
    //   type: Array,
    // },
    propertyImg: {
      type: Array,
    },
    florePlansImg: {
      type: Array,
    },
    statementOfInfo: {
      type: Array,
    },
    frontPageImg: {
      type: Array,
    },
    video_url: {
      type: String,
    },
    online_tour_1: {
      type: String
    },
    online_tour_2: {
      type: String
    },
    agency_listing_url: {
      type: String
    },
    inspection_times: {
      type: Array,
    },
    agency_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "agency_Register",
      require: true,
    }     
  },
  { timestamps: true }
);

const property_listing = mongoose.model("property_listing", propertySchema);
module.exports = property_listing;