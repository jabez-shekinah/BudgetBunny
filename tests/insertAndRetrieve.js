// scripts/insertAndRetrieve.js

// 1. Load the secret variables from the .env file
require("dotenv").config();

const { MongoClient } = require("mongodb");

// 2. Use the variable instead of typing the password here
const uri = process.env.MONGO_URI;

// Safety Check: Print an error if the .env file isn't found
if (!uri) {
  console.error("❌ Error: MONGO_URI not found in .env file!");
  process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
  try {
    console.log("Attempting to connect...");
    await client.connect();
    console.log("Connected to MongoDB Atlas via .env!");

    const database = client.db("testDB");
    const usersCollection = database.collection("Users");

    const userProfile = {
      user_id: "102", // Changed ID to 102 so we don't get a duplicate error if you run it again
      name: "Bob",
      email: "bob@example.com",
      role: "User",
      date_joined: new Date().toISOString(),
    };

    const result = await usersCollection.insertOne(userProfile);
    console.log(`User inserted with ID: ${result.insertedId}`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

run();
