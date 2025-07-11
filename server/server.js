const app = require("./app");
const connectDB = require("./config/db");

const port = process.env.PORT || 3002

async function startServer() {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`✅ Server running on http://localhost:${port}`);
      console.log(
        `🔍 Health check available at http://localhost:${port}/health`
      );
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT. Graceful shutdown...");
  // The client.close() is now handled within the db.js module's exit handler
  process.exit(0);
});
