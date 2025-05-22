const express = require("express");
const { createPolicy, getPolicies } = require("../controller/policyController");

const router = express.Router();

router.post("/policy", createPolicy);
router.get("/policies", getPolicies);

module.exports = router;

