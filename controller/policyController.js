const Policy = require("../models/Policy");

// Create Policy
exports.createPolicy = async (req, res) => {
    try {
        const { type, title, content } = req.body;
        const policy = new Policy({ type, title, content });
        await policy.save();
        res.status(201).json({ message: "Policy created", policy });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get All Policies
exports.getPolicies = async (req, res) => {
    try {
        const policies = await Policy.find();
        res.status(200).json(policies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
