require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

// ⬇️ أضيفي هذا
const mongoose = require("mongoose");
const Appointment = require("./src/models/Appointment");

connectDB();

// ⬇️ بعد ما Mongo يتفتح، نبني الـ indexes
mongoose.connection.once("open", async () => {
  try {
    await Appointment.syncIndexes();
    console.log("✅ Appointment indexes synced");
  } catch (error) {
    console.error("❌ Error syncing appointment indexes:", error);
  }
});

const PORT = Number(process.env.PORT) || 5050;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
