const router = require("express").Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createDoctor,
  getAllDoctors,
  getDoctorsByFacility,
  getMyFacilityDoctors,
} = require("../controllers/doctorController");

router.get("/", getAllDoctors);

router.get("/facility/:facilityId", getDoctorsByFacility);

router.get(
  "/my-facility",
  protect,
  authorize("admin_facility"),
  getMyFacilityDoctors
);

router.post(
  "/",
  protect,
  authorize("admin_facility"),
  createDoctor
);

module.exports = router;
