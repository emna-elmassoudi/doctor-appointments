import { useEffect, useMemo, useRef, useState } from "react";
import {
  getMyAppointments,
  createAppointment,
  getDoctorAvailabilityForPatient,
} from "../api/appointments";
import { getFacilities } from "../api/facilities";
import { getDoctors, getDoctorsByFacility } from "../api/doctors";
import { playBeep } from "../utils/sound";

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatYMD(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

export default function PatientAppointments() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // 🔔 enable sound (needs user click once)
  const [soundEnabled, setSoundEnabled] = useState(false);

  // track previous status per appointment for beep on confirm/cancel
  const prevStatusMapRef = useRef(new Map());

  // ✅ Toast message helper
  const msgTimerRef = useRef(null);
  const flashMsg = (text, ms = 3000) => {
    setMsg(text);
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMsg(""), ms);
  };

  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    };
  }, []);

  const [appointments, setAppointments] = useState([]);

  const [mode, setMode] = useState("private"); // private | facility
  const [facilities, setFacilities] = useState([]);
  const [facilityId, setFacilityId] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");

  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatYMD(d);
  });

  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState("");

  // =========================================================
  // Loaders
  // =========================================================
  const normalizeAppointments = (data) => {
    let list = [];
    if (Array.isArray(data)) list = data;
    else if (Array.isArray(data?.appointments)) list = data.appointments;
    else if (Array.isArray(data?.upcoming) || Array.isArray(data?.history)) {
      list = [...(data.upcoming || []), ...(data.history || [])];
    }
    return list;
  };

  const loadAppointments = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const res = await getMyAppointments();
      const list = normalizeAppointments(res?.data);
      setAppointments(list);

      // 🔔 sound on status change (pending -> confirmed/cancelled etc.)
      if (soundEnabled) {
        const prev = prevStatusMapRef.current;
        const curr = new Map(list.map((a) => [a._id, a.status]));

        let changed = false;
        for (const [id, newStatus] of curr.entries()) {
          const oldStatus = prev.get(id);
          if (oldStatus && oldStatus !== newStatus) {
            changed = true;
            break;
          }
        }

        if (changed) playBeep();
        prevStatusMapRef.current = curr;
      } else {
        // keep map updated even if sound disabled
        prevStatusMapRef.current = new Map(list.map((a) => [a._id, a.status]));
      }
    } catch (e) {
      if (!silent) setError(e?.response?.data?.message || "Failed to load appointments");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadFacilities = async () => {
    try {
      const res = await getFacilities();
      setFacilities(Array.isArray(res.data) ? res.data : []);
    } catch {
      setFacilities([]);
    }
  };

  const loadDoctorsPrivate = async () => {
    try {
      const res = await getDoctors({ type: "private" });
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDoctors([]);
    }
  };

  const loadDoctorsByFacility = async (fid) => {
    if (!fid) {
      setDoctors([]);
      return;
    }
    try {
      const res = await getDoctorsByFacility(fid);
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDoctors([]);
    }
  };

  // =========================================================
  // Initial load
  // =========================================================
  useEffect(() => {
    loadAppointments();
    loadFacilities();
  }, []);

  // =========================================================
  // ✅ Auto-refresh (doctor/admin confirm/cancel)
  // - 5s when there is pending, else 15s
  // =========================================================
  const pollDelayRef = useRef(15000);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    const hasPending = (appointments || []).some((a) => a.status === "pending");
    pollDelayRef.current = hasPending ? 5000 : 15000;
  }, [appointments]);

  useEffect(() => {
    let stopped = false;

    const tick = async () => {
      if (stopped) return;

      await loadAppointments({ silent: true });

      if (stopped) return;
      pollTimerRef.current = setTimeout(tick, pollDelayRef.current);
    };

    // ✅ start fast
    pollTimerRef.current = setTimeout(tick, 5000);

    return () => {
      stopped = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // Mode / Facility changes
  // =========================================================
  useEffect(() => {
    setError("");
    setMsg("");
    setDoctorId("");
    setSlots([]);
    setTime("");

    if (mode === "private") {
      setFacilityId("");
      loadDoctorsPrivate();
    } else {
      setDoctors([]);
    }
  }, [mode]);

  useEffect(() => {
    setError("");
    setMsg("");
    setDoctorId("");
    setSlots([]);
    setTime("");

    if (mode === "facility") {
      loadDoctorsByFacility(facilityId);
    }
  }, [facilityId, mode]);

  useEffect(() => {
    setSlots([]);
    setTime("");
    setMsg("");
    setError("");
  }, [doctorId, date]);

  // =========================================================
  // Upcoming / History
  // =========================================================
  const now = new Date();
  const { upcoming, history } = useMemo(() => {
    const up = [];
    const hist = [];
    for (const a of appointments || []) {
      const d = new Date(a.date);
      if (d >= now) up.push(a);
      else hist.push(a);
    }
    up.sort((a, b) => new Date(a.date) - new Date(b.date));
    hist.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { upcoming: up, history: hist };
  }, [appointments]);

  // =========================================================
  // Slots
  // =========================================================
  const loadSlots = async ({ keepMsg = false, silent = false } = {}) => {
    if (!keepMsg) setMsg("");
    if (!silent) setError("");

    setSlots([]);
    setTime("");

    if (!doctorId) {
      if (!silent) setError("Choose a doctor first");
      return;
    }

    try {
      const res = await getDoctorAvailabilityForPatient(doctorId, date);
      const available = res.data?.available || [];
      setSlots(Array.isArray(available) ? available : []);
    } catch (e) {
      if (!silent) setError(e?.response?.data?.message || "Failed to load slots");
    }
  };

  // ✅ auto-refresh slots if slots are visible
  useEffect(() => {
    if (!doctorId || slots.length === 0) return;

    const id = setInterval(() => {
      loadSlots({ keepMsg: true, silent: true });
    }, 10000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date, slots.length]);

  // =========================================================
  // Booking
  // =========================================================
  const book = async () => {
    setMsg("");
    setError("");

    if (!doctorId) return setError("Choose a doctor");
    if (!date) return setError("Choose a date");
    if (!time) return setError("Choose a time");

    const iso = new Date(`${date}T${time}:00`).toISOString();

    setCreating(true);
    try {
      await createAppointment({ doctorId, date: iso });

      await loadAppointments({ silent: true });
      await loadSlots({ keepMsg: true, silent: true });

      setTime("");
      flashMsg("✅ Appointment created (pending)", 3000);
    } catch (e) {
      setError(e?.response?.data?.message || "Booking failed");
    } finally {
      setCreating(false);
    }
  };

  const enableSound = () => {
    setSoundEnabled(true);
    playBeep(); // test
    flashMsg("🔔 Sound enabled", 1500);
  };

  return (
    <div style={{ maxWidth: 900, margin: "30px auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>
          Patient - My Appointments <span style={badgeStyle}>Auto-refresh ON</span>
        </h2>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => loadAppointments()} disabled={loading || creating}>
            Refresh
          </button>

          <button onClick={enableSound} disabled={soundEnabled || creating}>
            {soundEnabled ? "Sound ON" : "Enable Sound"}
          </button>
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 12, marginBottom: 16, borderRadius: 10 }}>
        <h3 style={{ marginTop: 0 }}>Book an appointment</h3>

        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="radio"
              name="mode"
              value="private"
              checked={mode === "private"}
              onChange={() => setMode("private")}
            />
            Private doctor
          </label>

          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="radio"
              name="mode"
              value="facility"
              checked={mode === "facility"}
              onChange={() => setMode("facility")}
            />
            Facility
          </label>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12, maxWidth: 520 }}>
          {mode === "facility" && (
            <label>
              Facility:{" "}
              <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
                <option value="">-- choose facility --</option>
                {facilities.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Doctor:{" "}
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              disabled={mode === "facility" && !facilityId}
            >
              <option value="">-- choose doctor --</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.fullName} ({d.specialty})
                </option>
              ))}
            </select>
          </label>

          <label>
            Date: <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={() => loadSlots()} disabled={!doctorId || creating}>
              Load slots
            </button>

            <label>
              Time:{" "}
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={slots.length === 0 || creating}
              >
                <option value="">{slots.length ? "-- choose time --" : "No available slots"}</option>
                {slots.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" onClick={book} disabled={creating || !doctorId || !time}>
              {creating ? "Booking..." : "Book"}
            </button>
          </div>

          {msg && <div style={{ color: "green" }}>{msg}</div>}
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && !error && (
        <>
          <h3>Upcoming</h3>
          {upcoming.length === 0 ? (
            <p>No upcoming appointments</p>
          ) : (
            upcoming.map((a) => (
              <div key={a._id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 10 }}>
                <div>
                  <b>Date:</b> {new Date(a.date).toLocaleString()}
                </div>
                <div>
                  <b>Doctor:</b> {a.doctor?.fullName} ({a.doctor?.specialty})
                </div>
                <div>
                  <b>Facility:</b> {a.facility?.name || "—"}
                </div>
                <div>
                  <b>Status:</b> {a.status}
                </div>
              </div>
            ))
          )}

          <h3>History</h3>
          {history.length === 0 ? (
            <p>No history</p>
          ) : (
            history.map((a) => (
              <div key={a._id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 10 }}>
                <div>
                  <b>Date:</b> {new Date(a.date).toLocaleString()}
                </div>
                <div>
                  <b>Doctor:</b> {a.doctor?.fullName} ({a.doctor?.specialty})
                </div>
                <div>
                  <b>Facility:</b> {a.facility?.name || "—"}
                </div>
                <div>
                  <b>Status:</b> {a.status}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
