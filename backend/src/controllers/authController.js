// backend/controllers/authController.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const generateToken = require("../utils/generateToken");

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { fullName, password, role, facilityId, specialty } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "fullName, email, password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const finalRole = role || "patient";

    // ✅ validate facilityId if provided
    if (facilityId) {
      if (!mongoose.Types.ObjectId.isValid(facilityId)) {
        return res.status(400).json({ message: "Invalid facilityId" });
      }
    }

    // ✅ create user
    const user = await User.create({
      fullName,
      email,
      password,
      role: finalRole,
      // only admin_facility stores facilityId on user
      facilityId: finalRole === "admin_facility" ? facilityId || null : null,
    });

    // ✅ If doctor => auto create doctor profile
    if (finalRole === "doctor") {
      await Doctor.create({
        user: user._id,
        fullName: user.fullName,
        specialty: specialty || "General",
        facilityId: facilityId || null, // private doctor => null
        createdBy: user._id, // ✅ FIX: required in your Doctor schema
      });
    }

    return res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
      token: generateToken(user._id),
    });
  } catch (err) {
    // ✅ mongoose validation (ex: required fields)
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    // ✅ duplicate key
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }

    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const password = req.body.password;
    const email = req.body.email?.toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    // IMPORTANT: select("+password") if password is select:false in schema
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await user.matchPassword(password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId,
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (Protected)
const me = async (req, res) => {
  res.json(req.user);
};

module.exports = { register, login, me };
