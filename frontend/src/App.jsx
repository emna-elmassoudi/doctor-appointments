import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";

import PatientAppointments from "./pages/PatientAppointments";
import DoctorAppointments from "./pages/DoctorAppointments";
import AdminFacilityAppointments from "./pages/AdminFacilityAppointments";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Routes>
      {/* Layout يلفّ الصفحات الكل */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= PATIENT ================= */}
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute roles={["patient"]}>
              <PatientAppointments />
            </ProtectedRoute>
          }
        />

        {/* ================= DOCTOR ================= */}
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute roles={["doctor"]}>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN FACILITY ================= */}
        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute roles={["admin_facility"]}>
              <AdminFacilityAppointments />
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
