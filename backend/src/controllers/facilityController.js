const Facility = require("../models/Facility");
const User = require("../models/User");

// POST /api/facilities (admin_facility only)
const createFacility = async (req, res, next) => {
  try {
    const { name, type, address, phone } = req.body;

    // 1️⃣ Validation
    if (!name || !type || !address) {
      res.status(400);
      throw new Error("name, type, address are required");
    }

    // 2️⃣ منع admin يعمل أكثر من facility
    if (req.user.facilityId) {
      res.status(400);
      throw new Error("This admin already has a facility");
    }

    // 3️⃣ Create Facility
    const facility = await Facility.create({
      name,
      type,
      address,
      phone: phone || "",
      createdBy: req.user._id,
    });

    // 4️⃣ تحديث admin.facilityId (أهم خطوة)
    req.user.facilityId = facility._id;
    await req.user.save();

    // 5️⃣ Response
    res.status(201).json({
      message: "Facility created successfully",
      facility,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/facilities (public)
const getFacilities = async (req, res, next) => {
  try {
    const facilities = await Facility.find().sort({ createdAt: -1 });
    res.json(facilities);
  } catch (err) {
    next(err);
  }
};

module.exports = { createFacility, getFacilities };
