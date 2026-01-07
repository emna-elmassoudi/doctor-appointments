import api from "./axios";

export const getFacilities = () => api.get("/facilities");
