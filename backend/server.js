const express = require("express");
const scanRouter = require("./routes/scan");
const path = require("path");
const cors = require("cors");

const app = express();

// Allow CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Route
app.use("/api/scan", scanRouter);

// Root Test Route (IMPORTANT FOR 502 FIX!)
app.get("/", (req, res) => {
  res.send("⚡ Resistor Scanner Backend is running!");
});

// Serve uploads for debugging
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Railway Port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
