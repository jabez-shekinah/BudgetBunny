// Imports the necessary tools (packages)
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const admin = require("firebase-admin");
const multer = require("multer");
const User = require("./models/User");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { body, validationResult } = require("express-validator");

// 1. Load secret key
const serviceAccount = require("./firebase-key.json");

// 2. Initialize Firebase to talk to your specific project
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "budgetbunny-489008.firebasestorage.app",
});

// 3. Create a shortcut variable to your storage bucket
const bucket = admin.storage().bucket();

// 4. Set up Multer to catch uploaded files in the server's RAM (not the hard drive)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB so users don't crash your server!
  },
});

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected!"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Initialize the application
const app = express();
const helmet = require("helmet");

// -------------------------------------------------------
// MIDDLEWARE
// -------------------------------------------------------

// Use Helmet, but turn off the strict CSP so Tailwind and external fonts can load!
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
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

// 4. Auth & RBAC
// Check if the user is logged in
const requireAuth = (req, res, next) => {
  // Because using Passport, req.user will exist if they have an active session
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized: Please log in." });
  }
  next(); // Pass them through to the route!
};

// Check if the user is an Admin (Fulfills the RBAC rubric requirement)
const requireAdmin = (req, res, next) => {
  // First check if they exist, then check their role
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required." });
  }
  next();
};

// 5. The Google Strategy
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
app.post(
  "/api/expenses",
  requireAuth, //
  [
    // INPUT VALIDATION
    body("description").notEmpty().withMessage("Description is required").trim().escape(),
    body("amount").isNumeric().withMessage("Amount must be a valid number"),
    body("category").notEmpty().withMessage("Category is required").trim().escape(),
  ],

  async (req, res) => {
    try {
      // NEW: Added receiptUrl to the list of things to grab from the frontend
      const { userId, description, amount, category, date, receiptUrl } = req.body;

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
        receiptUrl, // NEW: Added receiptUrl here so Mongoose actually saves it!
      });

      const savedExpense = await newExpense.save();
      res.status(201).json(savedExpense);
    } catch (err) {
      console.error("Error saving expense:", err);
      res.status(500).json({ error: "Failed to save expense" });
    }
  }
);

// 2. READ: Get all expenses for a specific user
app.get("/api/expenses/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find expenses where userId matches the ID from the URL
    const expenses = await Expense.find({ userId }).sort({ date: -1 });

    res.json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// 2. UPDATE: Edit an existing expense
app.put("/api/expenses/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, category, date, receiptUrl } = req.body;

    // 1. Find the existing expense to check for an old photo
    const existingExpense = await Expense.findById(id);
    if (!existingExpense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // 2. AUTO-OVERWRITE LOGIC:
    // If a NEW receiptUrl was sent, AND it's different from the old one, AND an old one actually exists...
    if (
      receiptUrl &&
      existingExpense.receiptUrl &&
      receiptUrl !== existingExpense.receiptUrl
    ) {
      try {
        const oldFilePath = getFilePathFromUrl(existingExpense.receiptUrl);
        if (oldFilePath) {
          // Trash the old file from Firebase!
          await bucket.file(oldFilePath).delete();
          console.log("Auto-deleted old receipt from Firebase:", oldFilePath);
        }
      } catch (firebaseErr) {
        console.error("Warning: Failed to delete old image from Firebase:", firebaseErr);
      }
    }

    // 3. Update MongoDB
    // If receiptUrl is null/undefined (user didn't pick a new file), we keep the old one.
    const updatedData = {
      description,
      amount,
      category,
      date,
      receiptUrl: receiptUrl || existingExpense.receiptUrl,
    };

    const updatedExpense = await Expense.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    res.json(updatedExpense);
  } catch (err) {
    console.error("Error updating expense:", err);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

// 4. DELETE: Remove an expense
app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the expense FIRST to see if it has a receipt attached
    const expenseToDelete = await Expense.findById(id);

    if (!expenseToDelete) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // 2. If it has a receiptUrl, delete the file from Firebase Storage!
    if (expenseToDelete.receiptUrl) {
      try {
        // Extract the exact file path from the long public URL
        const decodedUrl = decodeURIComponent(expenseToDelete.receiptUrl);
        const startIndex = decodedUrl.indexOf("/o/") + 3;
        const endIndex = decodedUrl.indexOf("?alt=media");
        const filePath = decodedUrl.substring(startIndex, endIndex);

        // Tell the Firebase Admin SDK to trash the file
        await bucket.file(filePath).delete();
        console.log("Successfully deleted receipt from Firebase!");
      } catch (firebaseErr) {
        console.error("Warning: Failed to delete image from Firebase:", firebaseErr);
        // We log the error but keep going so the user isn't stuck with an undeletable expense
      }
    }

    // 3. Now delete the actual expense document from MongoDB
    await Expense.findByIdAndDelete(id);

    res.json({ message: "Expense and receipt deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

// -------------------------------------------------------
// --- FIREBASE UPLOAD ROUTE ---
// -------------------------------------------------------

app.post("/api/upload", upload.single("receipt"), async (req, res) => {
  try {
    // 1. Check if a file actually made it to the server
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // 2. Create a unique file name
    const originalName = req.file.originalname.replace(/\s+/g, "_");
    const fileName = `receipts/${Date.now()}-${originalName}`;

    // 3. Create a reference to this new file in your bucket
    const file = bucket.file(fileName);

    // 4. Upload the file from the server's RAM directly to Google Cloud
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    // 5. Construct the public URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

    // 6. Send the URL back to the frontend
    res.status(200).json({
      message: "Upload successful!",
      imageUrl: publicUrl,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "Failed to upload image." });
  }
});

// Helper to extract the exact file path from a Firebase Storage URL
const getFilePathFromUrl = (url) => {
  if (!url) return null;
  const decodedUrl = decodeURIComponent(url);
  const startIndex = decodedUrl.indexOf("/o/") + 3;
  const endIndex = decodedUrl.indexOf("?alt=media");
  return decodedUrl.substring(startIndex, endIndex);
};

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
      name: req.user.name,
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
// -------------------------------------------------------
// CENTRALIZED ERROR HANDLING MIDDLEWARE
// -------------------------------------------------------
// Catch-all for any unhandled errors in the app
app.use((err, req, res, next) => {
  console.error("🔥 Global Server Error Caught:", err.stack);

  // Determine the status code (default to 500 Internal Server Error)
  const statusCode = err.status || 500;

  // Send a clean, standardized JSON response
  res.status(statusCode).json({
    success: false,
    error: err.message || "An unexpected error occurred on the server.",
    // Never expose stack traces in production!
    stack: process.env.NODE_ENV === "development" ? err.stack : {},
  });
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
