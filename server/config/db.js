// config/db.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

const mongoURL = "mongodb+srv://bala:balakeerthi@gate.4elonoq.mongodb.net/?retryWrites=true&w=majority&appName=gate";
if (!mongoURL) {
  throw new Error(
    "MONGO_URI environment variable is not set. Please check your .env file or environment variables."
  );
}
const dbName = "GatePass";

let clientInstance; // To store the connected client

async function connectDB() {
  try {
    clientInstance = new MongoClient(mongoURL);
    await clientInstance.connect();
    console.log("MongoDB connected successfully!");

    // Test the connection
    const db = clientInstance.db(dbName);
    await db.command({ ping: 1 });
    console.log("MongoDB ping successful");

    // Create indexes for better performance (ensure these are idempotent)
    await db
      .collection("RegDetails")
      .createIndex({ status: 1, approvalStage: 1 });
    await db.collection("ApprovedReceipts").createIndex({ approvalId: 1 });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1); // Exit process if database connection fails
  }
}

function getDb() {
  if (!clientInstance) {
    throw new Error("MongoDB client not initialized. Call connectDB first.");
  }
  return clientInstance.db(dbName);
}

// Graceful shutdown of MongoDB connection
process.on("exit", async () => {
  if (clientInstance) {
    await clientInstance.close();
    console.log("MongoDB connection closed.");
  }
});

module.exports = connectDB;
module.exports.getDb = getDb;
