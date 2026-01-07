import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ changed (was setAuth)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      // ✅ store {token, user} in localStorage via AuthContext
      login(data);

      // ✅ backend returns role in root (NOT data.user)
      const role = data?.role;

      if (role === "patient") navigate("/patient/appointments", { replace: true });
      else if (role === "admin_facility") navigate("/admin/appointments", { replace: true });
      else if (role === "doctor") navigate("/doctor/appointments", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 380, margin: "60px auto" }}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div style={{ marginTop: 16, fontSize: 13, color: "#666" }}>
        <p>
          <b>Comptes test:</b>
        </p>
        <p>patient@test.com / 123456</p>
        <p>adminfacility@test.com / 123456</p>
        <p>doctor@test.com / 123456</p>
      </div>
    </div>
  );
}
