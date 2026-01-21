// Imports the necessary tools (packages)
const express = require("express");
const path = require("path");
const cors = require("cors");

// Initialize the application
const app = express();

// Enable 'CORS' so frontend can talk to backend without security errors
app.use(cors());

// Middleware to parse JSON data (allows us to read data sent in POST requests)
app.use(express.json());

// -------------------------------------------------------
// SERVE STATIC FILES
// This connects existing HTML/CSS/JS to the server.
// -------------------------------------------------------
app.use(express.static(path.join(__dirname, ".")));

// -------------------------------------------------------
// ROUTES
// -------------------------------------------------------

// Default Route: Serve the index.html when someone visits the homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Test Route: Check if the API is working
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is running successfully!" });
});

// -------------------------------------------------------
// START SERVER
// -------------------------------------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
