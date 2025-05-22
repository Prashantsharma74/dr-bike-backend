const fetch = require("node-fetch");
const jwt_decode = require("jwt-decode");

async function getAllState(req, res) {
    try{
        await fetch("https://github.com/AnilNITT/All-State-City-of-INDIA/raw/master/states_n_city.json")
        .then(res=>res.json())
        .then(data=>{
            let cities =[]
            data.forEach(datas=>{
                cities.push(datas.state)
                return cities
            })
            var responsess = {
                status: 200,
                message: "successfull",
                data: cities,
            };
            return res.status(200).send(responsess);
        })
        .catch(err=>{
            return res.status(401).send(err);
        })
    } catch (error) {
        console.log("error", error);
        response = {
          status: 201,
          message: "Operation was not successful",
        };
    
        return res.status(201).send(response);
      }
}


async function getAllcity(req, res) {
    try{
        const {state} = req.body;
        await fetch("https://github.com/AnilNITT/All-State-City-of-INDIA/raw/master/states_n_city.json")
        .then(res=>res.json())
        .then(data=>{
            let cities =[]
            data.forEach(datas=>{
                if(datas.state == state){
                    cities = datas.districts
                    return cities
                }
            })
            var responsess = {
                status: 200,
                message: "successfull",
                data: cities,
            };
            return res.status(200).send(responsess);
        })
        .catch(err=>{
            return res.status(401).send(err);
        })
    } catch (error) {
        console.log("error", error);
        response = {
          status: 201,
          message: "Operation was not successful",
        };
    
        return res.status(201).send(response);
      }
}


module.exports ={getAllState, getAllcity}