const router = require("express").Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createAppointment,
  getMyAppointments,
  getMyDoctorAppointments, // ✅ NEW
  getFacilityAppointments,
  updateAppointmentStatus,
  updateAppointmentStatusByDoctor,
  getMyDoctorAgendaRange,
  getDoctorAvailability,
  getAvailabilityForPatient,
} = require("../controllers/appointmentController");

console.log("✅ appointmentRoutes LOADED");

// PUBLIC
router.get("/ping", (req, res) => res.json({ ok: true }));

// =========================================================
// PATIENT
// =========================================================
router.post("/", protect, authorize("patient"), createAppointment);
router.get("/my", protect, authorize("patient"), getMyAppointments);
router.get("/availability", protect, authorize("patient"), getAvailabilityForPatient);

// =========================================================
// ADMIN FACILITY
// =========================================================
router.get("/facility", protect, authorize("admin_facility"), getFacilityAppointments);
router.patch("/:id/status", protect, authorize("admin_facility"), updateAppointmentStatus);

// =========================================================
// DOCTOR
// =========================================================

// ✅ simple doctor upcoming/history (LIKE PATIENT)
router.get("/doctor/my", protect, authorize("doctor"), getMyDoctorAppointments);

// ✅ Agenda with range + status filter
router.get("/doctor/agenda-range", protect, authorize("doctor"), getMyDoctorAgendaRange);

// ✅ Doctor availability (doctor himself)
router.get("/doctor/availability", protect, authorize("doctor"), getDoctorAvailability);

// ✅ Doctor confirm/cancel (private & facility)
router.patch("/:id/doctor-status", protect, authorize("doctor"), updateAppointmentStatusByDoctor);

module.exports = router;
