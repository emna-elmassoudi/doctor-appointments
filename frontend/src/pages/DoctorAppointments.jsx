import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios"; // ✅ important: interceptor adds token
import { playBeep } from "../utils/sound";

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatYMD(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDaysYMD(ymd, days) {
  const [Y, M, D] = ymd.split("-").map(Number);
  const dt = new Date(Y, M - 1, D);
  dt.setDate(dt.getDate() + days);
  return formatYMD(dt);
}

const badgeStyle = {
  fontSize: 12,
  marginLeft: 10,
  padding: "2px 8px",
  borderRadius: 12,
  background: "#e6f7e6",
  color: "#2e7d32",
  border: "1px solid #a5d6a7",
};

export default function DoctorAppointments() {
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [from, setFrom] = useState(() => formatYMD(new Date()));
  const [to, setTo] = useState(() => addDaysYMD(formatYMD(new Date()), 7));
  const [status, setStatus] = useState("active"); // active | pending | confirmed | cancelled | all

  const [agenda, setAgenda] = useState([]);

  // 🔔 sound enable (needs user click once)
  const [soundEnabled, setSoundEnabled] = useState(false);

  // 🔔 detect new appointments (by count)
  const prevCountRef = useRef(null);

  // ⏱ auto-refresh timer
  const pollDelayRef = useRef(15000);
  const pollTimerRef = useRef(null);

  // ✅ toast helper
  const msgTimerRef = useRef(null);
  const flashMsg = (text, ms = 2500) => {
    setMsg(text);
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMsg(""), ms);
  };

  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // =========================================================
  // Load agenda
  // =========================================================
  const loadAgenda = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const res = await api.get("/appointments/doctor/agenda-range", {
        params: { from, to, status },
      });

      const list = Array.isArray(res?.data?.agenda) ? res.data.agenda : [];
      setAgenda(list);

      // 🔔 sound on NEW appointment (count increased)
      if (soundEnabled) {
        if (prevCountRef.current !== null && list.length > prevCountRef.current) {
          playBeep();
        }
        prevCountRef.current = list.length;
      } else {
        // keep ref updated
        prevCountRef.current = list.length;
      }
    } catch (e) {
      setAgenda([]);

      const m = e?.response?.data?.message || "Failed to load agenda";

      // ✅ nicer message for common cases
      if (e?.response?.status === 403) {
        if (!silent) setError("Forbidden (token/role problem). Please login again as doctor.");
      } else if (m.toLowerCase().includes("profile") || m.toLowerCase().includes("linked")) {
        if (!silent) setError("Doctor profile not linked. Create Doctor document linked to this user.");
      } else {
        if (!silent) setError(m);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    loadAgenda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when filters change, reset "new appointment" detector (avoid false beep)
  useEffect(() => {
    prevCountRef.current = null;
  }, [from, to, status]);

  // =========================================================
  // Auto-refresh speed
  // =========================================================
  useEffect(() => {
    const fast = status === "pending" || status === "active" || status === "all";
    pollDelayRef.current = fast ? 5000 : 15000;
  }, [status]);

  // Auto-refresh loop (respects filters)
  useEffect(() => {
    let stopped = false;

    const tick = async () => {
      if (stopped) return;

      if (!updatingId) {
        await loadAgenda({ silent: true });
      }

      if (stopped) return;
      pollTimerRef.current = setTimeout(tick, pollDelayRef.current);
    };

    pollTimerRef.current = setTimeout(tick, 5000);

    return () => {
      stopped = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, status, updatingId, soundEnabled]);

  // =========================================================
  // Update status (doctor)
  // =========================================================
  const onUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    setError("");
    setMsg("");

    try {
      await api.patch(`/appointments/${id}/doctor-status`, { status: newStatus });
      flashMsg(`✅ Updated to ${newStatus}`, 2500);
      await loadAgenda({ silent: true });
    } catch (e) {
      setError(e?.response?.data?.message || "Update failed");
    } finally {
      setUpdatingId("");
    }
  };

  const sortedAgenda = useMemo(() => {
    const copy = [...agenda];
    copy.sort((a, b) => new Date(a.date) - new Date(b.date));
    return copy;
  }, [agenda]);

  const enableSound = () => {
    setSoundEnabled(true);
    playBeep(); // test
    flashMsg("🔔 Sound enabled", 1500);
  };

  return (
    <div style={{ maxWidth: 950, margin: "30px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>
          Doctor – Agenda <span style={badgeStyle}>Auto-refresh ON</span>
        </h2>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => loadAgenda()} disabled={loading || !!updatingId}>
            Refresh
          </button>

          <button onClick={enableSound} disabled={soundEnabled}>
            {soundEnabled ? "Sound ON" : "Enable Sound"}
          </button>
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Filters</h3>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label>
            From:{" "}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              disabled={loading || !!updatingId}
            />
          </label>

          <label>
            To:{" "}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={loading || !!updatingId}
            />
          </label>

          <label>
            Status:{" "}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading || !!updatingId}
            >
              <option value="active">active (pending + confirmed)</option>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="cancelled">cancelled</option>
              <option value="all">all</option>
            </select>
          </label>

          <button onClick={() => loadAgenda()} disabled={loading || !!updatingId}>
            Apply
          </button>
        </div>

        {msg && <p style={{ color: "green", marginTop: 10 }}>{msg}</p>}
        {error && <p style={{ color: "crimson", marginTop: 10 }}>{error}</p>}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : sortedAgenda.length === 0 ? (
        <p>No appointments in this range.</p>
      ) : (
        sortedAgenda.map((a) => (
          <div
            key={a._id}
            style={{ border: "1px solid #ddd", padding: 14, borderRadius: 10, marginBottom: 12 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div>
                  <b>Date:</b> {new Date(a.date).toLocaleString()}
                </div>

                <div>
                  <b>Patient:</b> {a.patient?.fullName} ({a.patient?.email})
                </div>

                <div>
                  <b>Facility:</b> {a.facility?.name || "—"}
                </div>

                <div>
                  <b>Status:</b> {a.status}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <button
                  onClick={() => onUpdateStatus(a._id, "confirmed")}
                  disabled={!!updatingId || a.status === "confirmed" || a.status === "cancelled"}
                >
                  {updatingId === a._id ? "..." : "Confirm"}
                </button>

                <button
                  onClick={() => onUpdateStatus(a._id, "cancelled")}
                  disabled={!!updatingId || a.status === "cancelled"}
                >
                  {updatingId === a._id ? "..." : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
