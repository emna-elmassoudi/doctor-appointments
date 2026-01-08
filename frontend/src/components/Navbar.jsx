import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const nav = useNavigate();
  const authCtx = useAuth();

  const auth = authCtx?.auth ?? (authCtx?.isLoggedIn ? { user: authCtx.user } : null);
  const role = auth?.user?.role || auth?.role || authCtx?.user?.role;

  const fullName =
    auth?.user?.fullName || auth?.fullName || auth?.email || authCtx?.user?.fullName;

  const safeLogout = () => {
    localStorage.removeItem("auth");
    try {
      if (typeof authCtx?.logout === "function") authCtx.logout();
      if (typeof authCtx?.setAuth === "function") authCtx.setAuth(null);
    } catch {}
    nav("/login", { replace: true });
  };

  const linkStyle = ({ isActive }) => ({
    padding: "8px 12px",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 800,
    color: isActive ? "#0f172a" : "rgba(15,23,42,.72)",
    background: isActive ? "rgba(56,189,248,.22)" : "transparent",
    border: isActive ? "1px solid rgba(56,189,248,.30)" : "1px solid transparent",
    transition: "all .15s ease",
  });

  // ✅ AI button style (separate from linkStyle)
  const aiStyle = ({ isActive }) => ({
    padding: "8px 12px",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 950,
    color: "#0f172a",
    background: isActive
      ? "linear-gradient(90deg, rgba(99,102,241,.28), rgba(56,189,248,.26))"
      : "linear-gradient(90deg, rgba(99,102,241,.20), rgba(56,189,248,.18))",
    border: "1px solid rgba(56,189,248,.35)",
    boxShadow: isActive ? "0 10px 22px rgba(15,23,42,.10)" : "none",
    transition: "all .15s ease",
  });

  const btnStyle = {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(56,189,248,.30)",
    background: "linear-gradient(90deg, rgba(99,102,241,.22), rgba(56,189,248,.18))",
    color: "#0f172a",
    backdropFilter: "blur(12px)",
    fontWeight: 900,
    cursor: "pointer",
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,.72)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(15,23,42,.10)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 14px",
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <NavLink to="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(15,23,42,.10)",
              background: "rgba(255,255,255,.80)",
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            RDVDoctor
          </span>
        </NavLink>

        <NavLink to="/home" style={linkStyle}>
          Home
        </NavLink>
        <NavLink to="/how-it-works" style={linkStyle}>
          How it works
        </NavLink>
        <NavLink to="/services" style={linkStyle}>
          Services
        </NavLink>
        <NavLink to="/contact" style={linkStyle}>
          Contact
        </NavLink>

        <div style={{ flex: 1 }} />

        {!auth ? (
          <>
            <NavLink to="/login" style={linkStyle}>
              Login
            </NavLink>
            <NavLink to="/register" style={linkStyle}>
              Register
            </NavLink>
          </>
        ) : (
          <>
            <span style={{ color: "rgba(15,23,42,.65)", fontWeight: 800 }}>
              {fullName || "User"} {role ? `(${role})` : ""}
            </span>

            {role === "patient" && (
              <>
                {/* ✅ NEW: AI Assistant */}
                <NavLink to="/patient/ai" style={aiStyle}>
                  AI Assistant
                </NavLink>

                <NavLink to="/patient/booking" style={linkStyle}>
                  Book
                </NavLink>
                <NavLink to="/patient/appointments" style={linkStyle}>
                  My Appointments
                </NavLink>
              </>
            )}

            {role === "doctor" && (
              <NavLink to="/doctor/appointments" style={linkStyle}>
                My Agenda
              </NavLink>
            )}

            {role === "admin_facility" && (
              <NavLink to="/admin/facility/appointments" style={linkStyle}>
                Facility Appointments
              </NavLink>
            )}

            <button onClick={safeLogout} style={btnStyle}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
