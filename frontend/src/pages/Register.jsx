// frontend/src/pages/Register.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../api/auth";
import { getFacilities } from "../api/facilities";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { setAuth } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("patient"); // patient | doctor | admin_facility
  const [specialty, setSpecialty] = useState("General"); // for doctor
  const [facilityId, setFacilityId] = useState(""); // for admin_facility (required) + doctor (optional)

  const [facilities, setFacilities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getFacilities();
        setFacilities(Array.isArray(res.data) ? res.data : []);
      } catch {
        setFacilities([]);
      }
    })();
  }, []);

  // reset fields when role changes
  useEffect(() => {
    setErr("");

    if (role === "patient") {
      setFacilityId("");
      setSpecialty("General");
    }

    if (role === "admin_facility") {
      setSpecialty("General");
    }

    if (role === "doctor") {
      // facility optional for doctor
      if (!specialty) setSpecialty("General");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const name = fullName.trim();
    const mail = email.trim().toLowerCase();

    if (!name) return setErr("Full name is required");
    if (!mail) return setErr("Email is required");
    if (!password) return setErr("Password is required");
    if (password.length < 6) return setErr("Password must be at least 6 characters");

    // ✅ admin_facility must choose facility
    if (role === "admin_facility" && !facilityId) {
      return setErr("Please choose a facility");
    }

    const payload = {
      fullName: name,
      email: mail,
      password,
      role,
    };

    // ✅ doctor extras
    if (role === "doctor") {
      payload.specialty = specialty?.trim() || "General";
      // facility optional (private doctor => empty)
      if (facilityId) payload.facilityId = facilityId;
    }

    // ✅ admin facility needs facilityId
    if (role === "admin_facility") {
      payload.facilityId = facilityId;
    }

    setLoading(true);
    try {
      // 1) register
      await registerUser(payload);

      // 2) auto login
      const { data } = await loginUser({ email: mail, password });
      setAuth(data);

      const r = data?.user?.role || data?.role;

      if (r === "patient") nav("/patient/appointments", { replace: true });
      else if (r === "admin_facility") nav("/admin/facility/appointments", { replace: true });
      else if (r === "doctor") nav("/doctor/appointments", { replace: true });
      else nav("/", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "30px auto" }}>
      <h2>Register</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          Full name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>

        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </label>

        <label>
          Password (min 6)
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </label>

        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="patient">patient</option>
            <option value="doctor">doctor</option>
            <option value="admin_facility">admin_facility</option>
          </select>
        </label>

        {/* ✅ Doctor specialty */}
        {role === "doctor" && (
          <label>
            Specialty
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="General, Cardiology..."
            />
          </label>
        )}

        {/* ✅ Facility selector:
            - admin_facility: required
            - doctor: optional (private doctor => keep empty)
        */}
        {(role === "admin_facility" || role === "doctor") && (
          <label>
            Facility {role === "admin_facility" ? "(required)" : "(optional for private doctor)"}
            <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
              <option value="">
                {role === "admin_facility" ? "-- choose facility --" : "-- none (private doctor) --"}
              </option>
              {facilities.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <button disabled={loading} type="submit">
          {loading ? "Creating..." : "Create account"}
        </button>

        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
    </div>
  );
}
