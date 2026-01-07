const router = require("express").Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createAppointment,
  getMyAppointments,
  getFacilityAppointments,
  updateAppointmentStatus,
  updateAppointmentStatusByDoctor,
  getMyDoctorAgendaRange,     // ✅ only range agenda
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

// ✅ Agenda with range + status filter
// مثال:
// /api/appointments/doctor/agenda-range?from=2026-01-10&to=2026-01-17&status=active
// status: active | pending | confirmed | cancelled  (و تنجم تزيد all إذا backend يدعمو)
router.get(
  "/doctor/agenda-range",
  protect,
  authorize("doctor"),
  getMyDoctorAgendaRange
);

// ✅ Doctor availability (doctor himself)
router.get(
  "/doctor/availability",
  protect,
  authorize("doctor"),
  getDoctorAvailability
);

// ✅ Doctor confirm/cancel (private & facility)
router.patch(
  "/:id/doctor-status",
  protect,
  authorize("doctor"),
  updateAppointmentStatusByDoctor
);

module.exports = router;
