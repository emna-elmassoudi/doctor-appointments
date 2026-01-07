// frontend/src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const nav = useNavigate();
  const { auth, setAuth } = useAuth();

  // backend يرجّع role في root عادة: data.role
  // لكن نخليها تدعم الاثنين
  const role = auth?.user?.role || auth?.role;

  const logout = () => {
    localStorage.removeItem("auth");
    setAuth(null);
    nav("/login", { replace: true });
  };

  return (
    <div style={{ padding: "12px 14px", borderBottom: "1px solid #ddd" }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <Link to="/" style={{ fontWeight: 700 }}>
          Home
        </Link>

        {!auth ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <span style={{ color: "#555" }}>
              {auth?.fullName || auth?.user?.fullName || auth?.email}{" "}
              {role ? `(${role})` : ""}
            </span>

            {/* ✅ paths مطابقة لـ App.jsx */}
            {role === "patient" && <Link to="/patient/appointments">My Appointments</Link>}

            {role === "doctor" && <Link to="/doctor/appointments">My Agenda</Link>}

            {role === "admin_facility" && (
              <Link to="/admin/appointments">Facility Appointments</Link>
            )}

            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </div>
  );
}
