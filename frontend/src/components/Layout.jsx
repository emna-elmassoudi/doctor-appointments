import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  // ✅ fallback: sometimes user is not set but auth exists in localStorage
  let role = user?.role;
  let fullName = user?.fullName;

  try {
    if (!role || !fullName) {
      const raw = localStorage.getItem("auth");
      const a = raw ? JSON.parse(raw) : null;
      role = role || a?.user?.role || a?.role;
      fullName = fullName || a?.user?.fullName || a?.fullName;
    }
  } catch {}

  const goToMyArea = () => {
    if (!isLoggedIn || !role) return navigate("/login", { replace: true });

    if (role === "patient") return navigate("/patient/appointments");
    if (role === "doctor") return navigate("/doctor/appointments");
    if (role === "admin_facility") return navigate("/admin/appointments");

    return navigate("/");
  };

  const safeLogout = () => {
    // clear localStorage مهما كان logout متاع context
    localStorage.removeItem("auth");

    // call context logout if exists
    try {
      if (typeof logout === "function") logout();
    } catch {}

    navigate("/login", { replace: true });
  };

  const myBtnLabel =
    role === "patient"
      ? "My Appointments"
      : role === "doctor"
      ? "My Agenda"
      : role === "admin_facility"
      ? "Facility Appointments"
      : "My Area";

  return (
    <div>
      <header style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
        <Link to="/">Home</Link>{" "}
        {!isLoggedIn ? (
          <>
            | <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <span style={{ marginLeft: 10 }}>
              {fullName || "User"} {role ? `(${role})` : ""}
            </span>

            <button style={{ marginLeft: 10 }} onClick={goToMyArea}>
              {myBtnLabel}
            </button>

            <button style={{ marginLeft: 10 }} onClick={safeLogout}>
              Logout
            </button>
          </>
        )}
      </header>

      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  );
}
