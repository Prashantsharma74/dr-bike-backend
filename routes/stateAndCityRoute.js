const express = require("express");
const { getAllStateData, getCityByState } = require("../controller/stateAndCity");
const router = express.Router();

// router.post("/states", insertStateData);
router.get("/getAllStateData", getAllStateData);
router.get("/getCityByState/:stateId", getCityByState);
// router.get("/countries", getAllCountryData);
// router.get("/countries/:stateId/cities", getAllCityData);
// router.get("/countries/:countryId/states", getAllStateData);

module.exports = router;