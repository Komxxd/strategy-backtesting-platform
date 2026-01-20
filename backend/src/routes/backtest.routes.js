
const express = require("express");
const router = express.Router();
const backtestService = require("../services/backtest.service");

router.post("/run", async (req, res) => {
    try {
        const params = req.body;
        // Validate params minimal
        if (!params.startDate || !params.entryTime) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        const results = await backtestService.run(params);
        res.json(results);
    } catch (error) {
        console.error("Backtest Route Error:", error);
        res.status(500).json({ error: "Backtest execution failed" });
    }
});

module.exports = router;
