const express = require("express");
const cors = require("cors");
const backtestRoutes = require("./routes/backtest.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/backtest", backtestRoutes);
app.use("/api/health", (req, res) => res.json({ status: "ok" }));

module.exports = app;
