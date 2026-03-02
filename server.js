// Imports the necessary tools (packages)
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

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

// 1. Session Middleware (Required for Passport)
app.use(
  session({
    secret: "budgetbunny_secret_key", // You can move this to .env later
    resave: false,
    saveUninitialized: false,
  })
);

// 2. Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// 3. Serialize & Deserialize (How Passport saves the user in the session)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// 4. The Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user); // User exists, log them in
        }

        // Check if they registered locally with the same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google ID to existing local account
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }

        // If no user exists, create a new one!
        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          // Notice: No password needed!
        });

        await newUser.save();
        done(null, newUser);
      } catch (err) {
        console.error(err);
        done(err, null);
      }
    }
  )
);

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

// --- GOOGLE OAUTH ROUTES ---

// 1. Send the user to Google to authenticate
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// 2. Google sends the user back to this URL
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // SUCCESS! Logged in.
    // Redirect them to the dashboard.
    // We send the user data to the frontend so localStorage can catch it.
    const userData = JSON.stringify({
      id: req.user._id,
      fullname: req.user.fullname,
      email: req.user.email,
    });
    res.send(`
      <script>
        localStorage.setItem('user', '${userData}');
        window.location.href = '/'; // Redirect to your index.html/dashboard
      </script>
    `);
  }
);

// -------------------------------------------------------
// START SERVER
// -------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
