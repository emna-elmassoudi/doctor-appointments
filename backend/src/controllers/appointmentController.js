const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

/**
 * =========================================================
 * CREATE APPOINTMENT (patient)
 * POST /api/appointments
 * =========================================================
 */
const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, date } = req.body;

    if (!doctorId || !date) {
      return res.status(400).json({ message: "doctorId and date are required" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // ✅ Normalize date (avoid seconds/ms + invalid date)
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }
    d.setSeconds(0, 0);

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctor._id,
      facility: doctor.facilityId || null,
      date: d,
      status: "pending",
    });

    return res.status(201).json(appointment);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "This time slot is already booked for this doctor",
      });
    }
    next(err);
  }
};

/**
 * =========================================================
 * GET MY APPOINTMENTS (patient)
 * GET /api/appointments/my
 * =========================================================
 */
const getMyAppointments = async (req, res, next) => {
  try {
    const now = new Date();

    const upcoming = await Appointment.find({
      patient: req.user._id,
      status: { $in: ["pending", "confirmed"] },
      date: { $gte: now },
    })
      .populate("doctor", "fullName specialty")
      .populate("facility", "name")
      .sort({ date: 1 });

    const history = await Appointment.find({
      patient: req.user._id,
      $or: [{ status: "cancelled" }, { date: { $lt: now } }],
    })
      .populate("doctor", "fullName specialty")
      .populate("facility", "name")
      .sort({ date: -1 });

    return res.json({ upcoming, history });
  } catch (err) {
    next(err);
  }
};

/**
 * =========================================================
 * ✅ GET MY APPOINTMENTS (doctor)
 * GET /api/appointments/doctor/my
 * =========================================================
 */
const getMyDoctorAppointments = async (req, res, next) => {
  try {
    const now = new Date();

    // ✅ doctor account must be linked to a Doctor profile
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not linked" });
    }

    // facility doctor => only his facility, private doctor => facility null
    const facilityFilter = doctor.facilityId ? doctor.facilityId : null;

    const upcoming = await Appointment.find({
      doctor: doctor._id,
      facility: facilityFilter,
      status: { $in: ["pending", "confirmed"] },
      date: { $gte: now },
    })
      .populate("patient", "fullName email")
      .populate("facility", "name")
      .sort({ date: 1 });

    const history = await Appointment.find({
      doctor: doctor._id,
      facility: facilityFilter,
      $or: [{ status: "cancelled" }, { date: { $lt: now } }],
    })
      .populate("patient", "fullName email")
      .populate("facility", "name")
      .sort({ date: -1 });

    return res.json({ upcoming, history });
  } catch (err) {
    next(err);
  }
};

/**
 * =========================================================
 * GET FACILITY APPOINTMENTS (admin_facility)
 * GET /api/appointments/facility
 * =========================================================
 */
const getFacilityAppointments = async (req, res, next) => {
  try {
    const facilityId = req.user.facilityId || req.user.facility;
    if (!facilityId) {
      return res.status(400).json({ message: "admin_facility has no facilityId" });
    }

    const appointments = await Appointment.find({ facility: facilityId })
      .populate("doctor", "fullName specialty")
      .populate("patient", "fullName email")
      .sort({ date: 1 });

    return res.json(appointments);
  } catch (err) {
    next(err);
  }
};

/**
 * =========================================================
 * UPDATE STATUS (admin_facility)
 * PATCH /api/appointments/:id/status
 * =========================================================
 */
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const facilityId = req.user.facilityId || req.user.facility;

    // ممنوع يبدّل private appointment
    if (!appointment.facility || String(appointment.facility) !== String(facilityId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    appointment.status = status;
    await appointment.save();

    return res.json(appointment);
  } catch (err) {
    next(err);
  }
};

/**
 * =========================================================
 * UPDATE STATUS (doctor – private & facility)
 * PATCH /api/appointments/:id/doctor-status
 * =========================================================
 */
const updateAppointmentStatusByDoctor = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not linked" });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    // لازم appointment يكون متاع نفس doctor
    if (String(appointment.doctor) !== String(doctor._id)) {
      return res.status(403).json({ message: "Not your appointment" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    appointment.status = status;
    await appointment.save();

    return res.json(appointment);
  } catch (err) {
    next(err);
  }
};

/**
 * =========================================================
 * DOCTOR AGENDA RANGE
 * GET /api/appointments/doctor/agenda-range?from=YYYY-MM-DD&to=YYYY-MM-DD&status=active|pending|confirmed|cancelled|all
 * =========================================================
 */
const getMyDoctorAgendaRange = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const status = req.query.status || "active";

    if (!from || !to) {
      return res.status(400).json({ message: "from and to are required" });
    }

    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59.999`);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not linked" });
    }

    let statusFilter;
    if (status === "all") statusFilter = { $in: ["pending", "confirmed", "cancelled"] };
    else if (status === "pending") statusFilter = "pending";
    else if (status === "confirmed") statusFilter = "confirmed";
    else if (status === "cancelled") statusFilter = "cancelled";
    else statusFilter = { $in: ["pending", "confirmed"] }; // active

    const query = {
      doctor: doctor._id,
      date: { $gte: start, $lte: end },
      status: statusFilter,
    };

    // facility doctor => only his facility, private doctor => facility null
    query.facility = doctor.facilityId ? doctor.facilityId : null;

    const agenda = await Appointment.find(query)
      .populate("patient", "fullName email")
      .populate("facility", "name")
      .sort({ date: 1 });

    return res.json({
      from,
      to,
      status,
      total: agenda.length,
      agenda,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * =========================================================
 * DOCTOR AVAILABILITY (doctor himself)
 * GET /api/appointments/doctor/availability?date=YYYY-MM-DD
 * =========================================================
 */
const getDoctorAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) return res.status(400).json({ message: "date is required (YYYY-MM-DD)" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "date must be in format YYYY-MM-DD" });
    }

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not linked" });

    return buildAvailabilityResponse(res, doctor._id, date);
  } catch (err) {
    next(err);
  }
};

/**
 * =========================================================
 * PATIENT AVAILABILITY (by doctorId)
 * GET /api/appointments/availability?doctorId=...&date=YYYY-MM-DD
 * =========================================================
 */
const getAvailabilityForPatient = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: "doctorId and date are required" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "date must be in format YYYY-MM-DD" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    return buildAvailabilityResponse(res, doctor._id, date);
  } catch (err) {
    next(err);
  }
};

/**
 * =========================================================
 * AVAILABILITY HELPER (LOCAL TIME)
 * Returns: { available: ["09:00", ...], booked: [...] }
 * =========================================================
 */
const buildAvailabilityResponse = async (res, doctorObjectId, dateYMD) => {
  const slotMinutes = 30;
  const workStart = "09:00";
  const workEnd = "17:00";

  const buildLocalDate = (ymd, hhmm) => {
    const [Y, M, D] = ymd.split("-").map(Number);
    const [h, m] = hhmm.split(":").map(Number);
    return new Date(Y, M - 1, D, h, m, 0, 0);
  };

  const startDay = buildLocalDate(dateYMD, "00:00");
  const endDay = buildLocalDate(dateYMD, "23:59");

  const appointments = await Appointment.find({
    doctor: doctorObjectId,
    status: { $in: ["pending", "confirmed"] },
    date: { $gte: startDay, $lte: endDay },
  }).select("date");

  const booked = new Set(
    appointments.map((a) => {
      const d = new Date(a.date);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    })
  );

  const slots = [];
  let cursor = buildLocalDate(dateYMD, workStart);
  const end = buildLocalDate(dateYMD, workEnd);

  while (cursor < end) {
    const hh = String(cursor.getHours()).padStart(2, "0");
    const mm = String(cursor.getMinutes()).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
    cursor = new Date(cursor.getTime() + slotMinutes * 60 * 1000);
  }

  const available = slots.filter((s) => !booked.has(s));

  return res.json({
    date: dateYMD,
    doctorId: String(doctorObjectId),
    slotMinutes,
    workStart,
    workEnd,
    booked: Array.from(booked),
    available,
  });
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getMyDoctorAppointments, // ✅ NEW
  getFacilityAppointments,
  updateAppointmentStatus,
  updateAppointmentStatusByDoctor,
  getMyDoctorAgendaRange,
  getDoctorAvailability,
  getAvailabilityForPatient,
};
