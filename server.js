// Imports the necessary tools (packages)
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected!"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Initialize the application
const app = express();

// 1. MIDDLEWARE
// Enable 'CORS' so frontend can talk to backend
app.use(cors());
// Parse JSON data (allows us to read data sent in POST requests)
app.use(express.json());
// Serve Static Files (CSS, JS, Images) from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// -------------------------------------------------------
// AUTHENTICATION ROUTES (API)
// -------------------------------------------------------

// 1. REGISTER ROUTE (Sign Up)
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user (Plain text password)
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// 2. LOGIN ROUTE
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check password
    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});

const Expense = require("./models/Expense"); // Import the model

// -------------------------------------------------------
// EXPENSE CRUD ROUTES
// -------------------------------------------------------

// 1. CREATE: Add a new expense
app.post("/api/expenses", async (req, res) => {
  try {
    const { userId, description, amount, category, date } = req.body;

    // Validation
    if (!userId || !description || !amount || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newExpense = new Expense({
      userId,
      description,
      amount,
      category,
      date,
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (err) {
    console.error("Error saving expense:", err);
    res.status(500).json({ error: "Failed to save expense" });
  }
});

// 2. READ: Get all expenses for a specific user
app.get("/api/expenses/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const expenses = await Expense.find({ userId }).sort({ date: -1 }); // Newest first
    res.json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// 3. DELETE: Remove an expense
app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

// -------------------------------------------------------
// HTML PAGE ROUTES
// -------------------------------------------------------

// Default Route: Dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// ⚠️ NEW: Login Page Route
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// ⚠️ NEW: Register Page Route
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

// Test Route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is running successfully!" });
});

// -------------------------------------------------------
// START SERVER
// -------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
