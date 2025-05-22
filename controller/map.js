const axios = require('axios');
var mongoose = require('mongoose'); // ES5 or below



async function geocode(req, res) {

  const place = req.body.place || "";
  const apiKey = process.env.MAPKEY; 
  const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?key=${apiKey}&address=${place}&sensor=false`;

  try {
    const response = await axios.get(apiUrl);

    if (response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return res.json({ lat: location.lat, lng: location.lng });
    } else {
      return res.json({ lat: "", lng: "" });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


async function geo_place(req, res){
  const place = req.body.place || "";
  const apiKey = process.env.MAPKEY; 
  const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${place}&language=en&sensor=true&key=${apiKey}`;

  try {
    const response = await axios.get(apiUrl);
    return res.json(response.data);
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}





module.exports = {
  geocode,
  geo_place
}
