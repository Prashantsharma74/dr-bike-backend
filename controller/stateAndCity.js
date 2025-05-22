const { State, City } = require("../models/StateAndCity_model");

const getAllStateData = async (req, res) => {
    const allstates = await State.find();
    res.status(201).json(allstates);
  };

  const getCityByState = async (req, res) => {
    const { stateId } = req.params;
    console.log(stateId);
  
    try {
      const cities = await City.find({ state_id: stateId });
      res.status(200).json(cities);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  module.exports = {  getAllStateData, getCityByState };
