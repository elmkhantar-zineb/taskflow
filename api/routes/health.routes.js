const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Liveness: Is the application running?
router.get("/live", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
  });
});

// Readiness: Can the API serve database-dependent requests?
router.get("/ready", (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  res.status(mongoConnected ? 200 : 503).json({
    status: mongoConnected ? "ready" : "not_ready",
    database: mongoConnected ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

module.exports = router;
