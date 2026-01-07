import api from "./axios";

/* PATIENT */
export const createAppointment = (payload) => api.post("/appointments", payload);
export const getMyAppointments = () => api.get("/appointments/my");

export const getDoctorAvailabilityForPatient = (doctorId, date) =>
  api.get("/appointments/availability", { params: { doctorId, date } });

/* DOCTOR */
export const getMyDoctorAgenda = (date, filter = "active") =>
  api.get("/appointments/doctor/agenda", { params: { date, filter } });

export const getMyDoctorAgendaRange = (from, to, status = "active") =>
  api.get("/appointments/doctor/agenda-range", {
    params: { from, to, status },
  });

export const updateDoctorAppointmentStatus = (id, status) =>
  api.patch(`/appointments/${id}/doctor-status`, { status });

/* ADMIN FACILITY */
export const getFacilityAppointments = () => api.get("/appointments/facility");
export const updateFacilityAppointmentStatus = (id, status) =>
  api.patch(`/appointments/${id}/status`, { status });
