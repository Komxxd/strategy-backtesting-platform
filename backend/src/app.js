const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const marketRoutes = require("./routes/market.routes");
const instrumentsRoutes = require("./routes/instruments.routes");
const optionRoutes = require("./routes/options.routes");
const marketSocketRoutes = require("./routes/marketSocket.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/instruments", instrumentsRoutes);
app.use("/api/options", optionRoutes);
app.use("/api/market-socket", marketSocketRoutes);

app.use("/api/health", healthRoutes);

module.exports = app;
