const router = require("express").Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createFacility,
  getFacilities,
} = require("../controllers/facilityController");

// ✅ GET all facilities (public) - for patient booking UI
router.get("/", getFacilities);

// ✅ CREATE facility (admin_facility only)
router.post("/", protect, authorize("admin_facility"), createFacility);

module.exports = router;
