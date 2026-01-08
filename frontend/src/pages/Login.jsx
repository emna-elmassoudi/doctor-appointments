// frontend/src/pages/Login.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✨ small fade-in
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const mail = email.trim().toLowerCase();
    if (!mail) return setErr("Email is required");
    if (!password) return setErr("Password is required");

    setLoading(true);
    try {
      const { data } = await loginUser({ email: mail, password });

      login(data);

      const r = data?.user?.role || data?.role;

      if (r === "patient") nav("/patient/appointments", { replace: true });
      else if (r === "admin_facility") nav("/admin/facility/appointments", { replace: true });
      else if (r === "doctor") nav("/doctor/appointments", { replace: true });
      else nav("/home", { replace: true });
    } catch (e2) {
      console.log("LOGIN ERROR:", e2);

      const msg =
        e2?.response?.data?.message ||
        e2?.response?.data?.error ||
        e2?.message ||
        "Login failed";

      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-card auth-anim ${mounted ? "is-in" : ""}`}>
        {/* LEFT */}
        <div className="auth-left">
          <div className="auth-left__top">
            <div className="auth-badge">RDVDoctor</div>
          </div>

          <div className="auth-left__content">
            <h2>Welcome back</h2>
            <p>
              Log in to access your medical space and manage your appointments easily and securely.
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
          <h2 className="auth-title">Login</h2>

          {err && <div className="auth-alert">{err}</div>}

          <form onSubmit={onSubmit}>
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

            {/* Password label */}
            <label className="auth-label" style={{ marginTop: 14 }}>
              Password
            </label>

            {/* 👁 password with toggle */}
            <div className="auth-pass">
              <input
                className="auth-input auth-input--pass"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                required
              />

              <span className="auth-eye" onClick={() => setShowPwd((v) => !v)}>
                {showPwd ? "🙈" : "👁️"}
              </span>
            </div>

            {/* Forgot password under the input */}
            <div className="auth-forgot">
              <button
                type="button"
                className="auth-link auth-link--below"
                onClick={() => setShowForgot(true)}
              >
                Forgot password?
              </button>
            </div>

            <button className="auth-btn" disabled={loading} type="submit">
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="auth-footer">
              Don&apos;t have an account? <Link to="/register">Create one</Link>
            </div>
          </form>
        </div>

        {/* 🔐 Fake modal */}
        {showForgot && (
          <div className="auth-modal" role="dialog" aria-modal="true">
            <div className="auth-modal__card">
              <div className="auth-modal__title">Forgot password</div>
              <div className="auth-modal__text">
                This demo doesn’t send reset emails.
                <br />
                Ask the admin to reset your password, or create a new account.
              </div>

              <div className="auth-modal__actions">
                <button
                  className="auth-btn auth-btn--light"
                  type="button"
                  onClick={() => setShowForgot(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
