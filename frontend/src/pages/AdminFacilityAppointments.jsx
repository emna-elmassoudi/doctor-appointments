import { useEffect, useMemo, useRef, useState } from "react";
import axios from "../api/axios";
import { playBeep } from "../utils/sound";

const badgeStyle = {
  fontSize: 12,
  marginLeft: 10,
  padding: "2px 8px",
  borderRadius: 12,
  background: "#e6f7e6",
  color: "#2e7d32",
  border: "1px solid #a5d6a7",
};

export default function AdminFacilityAppointments() {
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [status, setStatus] = useState("active"); // active | pending | confirmed | cancelled | all
  const [appointments, setAppointments] = useState([]);

  // 🔔 sound enable
  const [soundEnabled, setSoundEnabled] = useState(false);

  // 🔔 detect new appointments
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
  // Load facility appointments
  // GET /api/appointments/facility  (admin_facility)
  // =========================================================
  const loadFacilityAppointments = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const res = await axios.get("/appointments/facility");
      let list = Array.isArray(res?.data) ? res.data : [];

      // ✅ local filtering by status (backend returns full list)
      if (status === "active") {
        list = list.filter((a) => a.status === "pending" || a.status === "confirmed");
      } else if (status !== "all") {
        list = list.filter((a) => a.status === status);
      }

      // sort by date
      list.sort((a, b) => new Date(a.date) - new Date(b.date));

      setAppointments(list);

      // 🔔 sound on NEW appointment
      if (soundEnabled) {
        if (prevCountRef.current !== null && list.length > prevCountRef.current) {
          playBeep();
        }
        prevCountRef.current = list.length;
      }
    } catch (e) {
      setAppointments([]);
      if (!silent) setError(e?.response?.data?.message || "Failed to load facility appointments");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    loadFacilityAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // Auto-refresh speed
  // =========================================================
  useEffect(() => {
    const fast = status === "pending" || status === "active" || status === "all";
    pollDelayRef.current = fast ? 5000 : 15000;
  }, [status]);

  // Auto-refresh loop
  useEffect(() => {
    let stopped = false;

    const tick = async () => {
      if (stopped) return;

      // avoid flicker while updating
      if (!updatingId) {
        await loadFacilityAppointments({ silent: true });
      }

      if (stopped) return;
      pollTimerRef.current = setTimeout(tick, pollDelayRef.current);
    };

    // first refresh quickly
    pollTimerRef.current = setTimeout(tick, 5000);

    return () => {
      stopped = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, updatingId, soundEnabled]);

  // =========================================================
  // Update appointment status (admin_facility)
  // PATCH /api/appointments/:id/status  body: { status }
  // =========================================================
  const onUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    setError("");
    setMsg("");

    try {
      await axios.patch(`/appointments/${id}/status`, { status: newStatus });
      flashMsg(`✅ Updated to ${newStatus}`, 2500);
      await loadFacilityAppointments({ silent: true });
    } catch (e) {
      setError(e?.response?.data?.message || "Update failed");
    } finally {
      setUpdatingId("");
    }
  };

  // memo sorted (already sorted, but safe)
  const list = useMemo(() => {
    const copy = [...appointments];
    copy.sort((a, b) => new Date(a.date) - new Date(b.date));
    return copy;
  }, [appointments]);

  const enableSound = () => {
    setSoundEnabled(true);
    playBeep(); // test
    flashMsg("🔔 Sound enabled", 1500);
  };

  return (
    <div style={{ maxWidth: 1000, margin: "30px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>
          Admin Facility – Appointments <span style={badgeStyle}>Auto-refresh ON</span>
        </h2>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => loadFacilityAppointments()} disabled={loading || !!updatingId}>
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

          <button onClick={() => loadFacilityAppointments()} disabled={loading || !!updatingId}>
            Apply
          </button>
        </div>

        {msg && <p style={{ color: "green", marginTop: 10 }}>{msg}</p>}
        {error && <p style={{ color: "crimson", marginTop: 10 }}>{error}</p>}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : list.length === 0 ? (
        <p>No facility appointments.</p>
      ) : (
        list.map((a) => (
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
                  <b>Doctor:</b> {a.doctor?.fullName} ({a.doctor?.specialty})
                </div>

                <div>
                  <b>Patient:</b> {a.patient?.fullName} ({a.patient?.email})
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
