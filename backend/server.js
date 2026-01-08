require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const mongoose = require("mongoose");
const Appointment = require("./src/models/Appointment");

connectDB();

// ✅ Sync mongoose indexes once DB is connected
mongoose.connection.once("open", async () => {
  try {
    await Appointment.syncIndexes();
    console.log("✅ Appointment indexes synced");
  } catch (error) {
    console.error(" Error syncing appointment indexes:", error);
  }
});

// ✅ Optional: log Mongo errors
mongoose.connection.on("error", (err) => {
  console.error(" MongoDB connection error:", err);
});

// ✅ Mount AI routes here (if you prefer to keep it in app.js, you can remove this)
try {
  // this requires that you created: ./src/routes/aiRoutes.js
  app.use("/api/ai", require("./src/routes/aiRoutes"));
  console.log(" AI routes mounted at /api/ai");
} catch (e) {
  // If aiRoutes not created yet, backend still runs
  console.log(" AI routes not mounted (aiRoutes.js not found yet)");
}

// ✅ Start server
const PORT = Number(process.env.PORT) || 5050;
const server = app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});

// ✅ Graceful shutdown (CTRL+C)
process.on("SIGINT", async () => {
  console.log("\n SIGINT received, shutting down...");
  server.close(async () => {
    try {
      await mongoose.connection.close(false);
      console.log("✅ MongoDB connection closed");
    } catch (err) {
      console.error(" Error closing MongoDB:", err);
    }
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  console.log("\n SIGTERM received, shutting down...");
  server.close(async () => {
    try {
      await mongoose.connection.close(false);
      console.log(" MongoDB connection closed");
    } catch (err) {
      console.error(" Error closing MongoDB:", err);
    }
    process.exit(0);
  });
});
