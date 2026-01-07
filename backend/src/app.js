const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const facilityRoutes = require("./routes/facilityRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const healthRoutes = require("./routes/healthRoutes");
const testRoutes = require("./routes/testRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes); // ✅ هذا هو اللي ناقص عندك
app.use("/api/health", healthRoutes);
app.use("/api/test", testRoutes);

// middlewares errors
app.use(notFound);
app.use(errorHandler);

module.exports = app;
