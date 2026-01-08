// frontend/src/pages/Register.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../api/auth";
import { getFacilities } from "../api/facilities";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { login } = useAuth(); // ✅ IMPORTANT: AuthContext عندك فيه login مش setAuth

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("patient"); // patient | doctor | admin_facility
  const [specialty, setSpecialty] = useState("General"); // doctor only
  const [facilityId, setFacilityId] = useState(""); // admin_facility required, doctor optional

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
    } else if (role === "admin_facility") {
      setSpecialty("General");
      // facility required => keep user selection
    } else if (role === "doctor") {
      setSpecialty((s) => (s?.trim() ? s : "General"));
      // facility optional
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

    const payload = { fullName: name, email: mail, password, role };

    // ✅ doctor extras
    if (role === "doctor") {
      payload.specialty = specialty?.trim() || "General";
      if (facilityId) payload.facilityId = facilityId; // optional
    }

    // ✅ admin facility needs facilityId
    if (role === "admin_facility") {
      payload.facilityId = facilityId; // required
    }

    setLoading(true);
    try {
      // 1) register
      await registerUser(payload);

      // 2) auto login
      const { data } = await loginUser({ email: mail, password });

      // ✅ store auth using AuthContext method
      login(data);

      // role can be in root or inside user
      const r = data?.user?.role || data?.role;

      if (r === "patient") nav("/patient/appointments", { replace: true });
      else if (r === "admin_facility") nav("/admin/facility/appointments", { replace: true });
      else if (r === "doctor") nav("/doctor/appointments", { replace: true });
      else nav("/", { replace: true });
    } catch (e2) {
      console.log("REGISTER ERROR:", e2);

      const msg =
        e2?.response?.data?.message ||
        e2?.response?.data?.error ||
        e2?.message ||
        "Register failed";

      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* LEFT */}
        <div className="auth-left">
          <div className="auth-left__top">
            <div className="auth-badge">RDVDoctor</div>
          </div>

          <div className="auth-left__content">
            <h2>We at RDVDoctor</h2>
            <p>
              are always fully focused on helping you manage your medical appointments easily and
              securely.
            </p>

            <div className="auth-illu">
              <img
                src="/auth-illustration.png"
                alt="Medical illustration"
                className="auth-illu__img"
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="auth-right">
          <h2 className="auth-title">Create Account</h2>

          {err && <div className="auth-alert">{err}</div>}

          <form onSubmit={onSubmit}>
            <label className="auth-label">Full name</label>
            <input
              className="auth-input"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />

            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />

            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
            />

            <label className="auth-label">Role</label>
            <select className="auth-input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin_facility">Admin Facility</option>
            </select>

            {/* Doctor specialty */}
            {role === "doctor" && (
              <>
                <label className="auth-label">Specialty</label>
                <input
                  className="auth-input"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="General, Cardiology..."
                />
              </>
            )}

            {/* Facility selector */}
            {(role === "admin_facility" || role === "doctor") && (
              <>
                <label className="auth-label">
                  Facility{" "}
                  <span className="auth-label__hint">
                    {role === "admin_facility" ? "(required)" : "(optional)"}
                  </span>
                </label>

                <select
                  className="auth-input"
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                >
                  <option value="">
                    {role === "admin_facility"
                      ? "-- choose facility --"
                      : "-- none (private doctor) --"}
                  </option>

                  {facilities.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            <button className="auth-btn" disabled={loading} type="submit">
              {loading ? "Creating..." : "Create Account"}
            </button>

            <div className="auth-footer">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
