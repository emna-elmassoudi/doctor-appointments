import api from "./axios";

export const getDoctors = (params = {}) => api.get("/doctors", { params });

export const getDoctorsByFacility = (facilityId) =>
  api.get(`/doctors/facility/${facilityId}`);
