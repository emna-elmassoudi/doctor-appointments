const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Doctor = require("../models/Doctor"); // ✅ NEW

const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Not authorized, user not found" });
    }

    // ✅ default
    req.user = user;

    // ✅ Admin facility: نثبت facilityId
    if (user.role === "admin_facility") {
      // حسب الموديل متاعك: facilityId ولا facility
      req.user.facilityId = user.facilityId || user.facility || null;
    }

    // ✅ Doctor: نجيب doctor document المرتبط بالـ user
    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ user: user._id });

      if (!doctor) {
        return res
          .status(403)
          .json({ message: "Doctor profile not found for this user" });
      }

      req.user.doctorId = doctor._id;
      req.user.doctorFacilityId = doctor.facilityId || null; // null => doctor privé
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: access denied" });
    }
    next();
  };
};

module.exports = { protect, authorize };
