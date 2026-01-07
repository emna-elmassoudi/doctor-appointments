import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5050/api",
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("auth");
    const auth = raw ? JSON.parse(raw) : null;
    const token = auth?.token;

    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

export default api;
