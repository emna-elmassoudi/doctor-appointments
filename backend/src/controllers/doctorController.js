const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const Facility = require("../models/Facility");

// POST /api/doctors (admin_facility only)
const createDoctor = async (req, res, next) => {
  try {
    const { fullName, specialty } = req.body;

    if (!fullName || !specialty) {
      return res.status(400).json({ message: "fullName and specialty are required" });
    }

    if (!req.user.facilityId) {
      return res
        .status(400)
        .json({ message: "This admin has no facility yet. Create a facility first." });
    }

    const facility = await Facility.findById(req.user.facilityId);
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    const doctor = await Doctor.create({
      fullName,
      specialty,
      facilityId: req.user.facilityId,
      createdBy: req.user._id,
    });

    res.status(201).json(doctor);
  } catch (err) {
    next(err);
  }
};

// GET /api/doctors
// supports query:
// - ?type=private
// - ?type=facility
// - ?facilityId=...
const getAllDoctors = async (req, res, next) => {
  try {
    const { type, facilityId } = req.query;

    const filter = {};

    if (type === "private") {
      filter.facilityId = null;
    }

    if (type === "facility") {
      filter.facilityId = { $ne: null };
    }

    if (facilityId) {
      if (!mongoose.Types.ObjectId.isValid(facilityId)) {
        return res.status(400).json({ message: "Invalid facilityId" });
      }
      filter.facilityId = facilityId;
    }

    const doctors = await Doctor.find(filter)
      .populate("facilityId", "name type address phone")
      .sort({ fullName: 1 });

    res.json(doctors);
  } catch (err) {
    next(err);
  }
};

// GET /api/doctors/facility/:facilityId
const getDoctorsByFacility = async (req, res, next) => {
  try {
    const { facilityId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(facilityId)) {
      return res.status(400).json({ message: "Invalid facilityId" });
    }

    const doctors = await Doctor.find({ facilityId })
      .populate("facilityId", "name type address phone")
      .sort({ fullName: 1 });

    res.json(doctors);
  } catch (err) {
    next(err);
  }
};

// GET /api/doctors/my-facility (admin_facility)
const getMyFacilityDoctors = async (req, res, next) => {
  try {
    if (!req.user.facilityId) {
      return res.status(404).json({ message: "No facility found for this admin" });
    }

    const doctors = await Doctor.find({ facilityId: req.user.facilityId })
      .populate("facilityId", "name type address phone")
      .sort({ fullName: 1 });

    res.json(doctors);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDoctor,
  getAllDoctors,
  getDoctorsByFacility,
  getMyFacilityDoctors,
};
