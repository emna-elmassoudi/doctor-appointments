import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const role = user?.role;

  const goToAgenda = () => {
    if (!isLoggedIn || !role) return navigate("/login");

    if (role === "patient") return navigate("/patient/appointments");
    if (role === "doctor") return navigate("/doctor/appointments");
    if (role === "admin_facility") return navigate("/admin/appointments");

    return navigate("/");
  };

  return (
    <div style={{ maxWidth: 700, margin: "60px auto", textAlign: "center" }}>
      <h1>Welcome 👋</h1>

      <p style={{ marginTop: 10 }}>
        Simple appointments system: <b>Patient</b> / <b>Doctor</b> /{" "}
        <b>Admin Facility</b>.
      </p>

      {isLoggedIn ? (
        <p style={{ marginTop: 10 }}>
          Logged in as: <b>{user?.fullName}</b> ({role})
        </p>
      ) : (
        <p style={{ marginTop: 10 }}>You are not logged in.</p>
      )}

      <button
        onClick={goToAgenda}
        style={{
          marginTop: 30,
          padding: "10px 22px",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Go to My Agenda
      </button>
    </div>
  );
}
