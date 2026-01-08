import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Booking from "./pages/Booking";
import MyAppointments from "./pages/MyAppointments";
import DoctorAppointments from "./pages/DoctorAppointments";
import AdminFacilityAppointments from "./pages/AdminFacilityAppointments";

import HowItWorks from "./pages/HowItWorks";
import Services from "./pages/Services";
import Contact from "./pages/Contact";

import AIChat from "./pages/AIChat"; // ✅ NEW

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import AuthLayout from "./components/AuthLayout";

export default function App() {
  return (
    <Routes>
      {/* ✅ Landing public */}
      <Route path="/" element={<Landing />} />

      {/* ✅ login/register without navbar */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* ✅ everything else with navbar */}
      <Route element={<Layout />}>
        <Route path="/home" element={<Landing />} />

        {/* Public pages */}
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />

        {/* ✅ AI Assistant (Patient) */}
        <Route
          path="/patient/ai"
          element={
            <ProtectedRoute roles={["patient"]}>
              <AIChat />
            </ProtectedRoute>
          }
        />

        {/* Patient */}
        <Route
          path="/patient/booking"
          element={
            <ProtectedRoute roles={["patient"]}>
              <Booking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute roles={["patient"]}>
              <MyAppointments />
            </ProtectedRoute>
          }
        />

        {/* Doctor */}
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute roles={["doctor"]}>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />

        {/* Admin facility */}
        <Route
          path="/admin/facility/appointments"
          element={
            <ProtectedRoute roles={["admin_facility"]}>
              <AdminFacilityAppointments />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ✅ global fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
