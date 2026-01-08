import { useEffect, useState } from "react";
import "../styles/patient.css";

import {
  createAppointment,
  getDoctorAvailabilityForPatient,
} from "../api/appointments";
import { getFacilities } from "../api/facilities";
import { getDoctors, getDoctorsByFacility } from "../api/doctors";

function pad(n) {
  return String(n).padStart(2, "0");
}
function formatYMD(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function Booking() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

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

  // load facilities once
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

  // load doctors when mode changes
  useEffect(() => {
    setError("");
    setMsg("");
    setDoctorId("");
    setSlots([]);
    setTime("");

    if (mode === "private") {
      setFacilityId("");
      (async () => {
        try {
          const res = await getDoctors({ type: "private" });
          setDoctors(Array.isArray(res.data) ? res.data : []);
        } catch {
          setDoctors([]);
        }
      })();
    } else {
      setDoctors([]);
    }
  }, [mode]);

  // load facility doctors
  useEffect(() => {
    if (mode !== "facility") return;

    setError("");
    setMsg("");
    setDoctorId("");
    setSlots([]);
    setTime("");

    if (!facilityId) {
      setDoctors([]);
      return;
    }

    (async () => {
      try {
        const res = await getDoctorsByFacility(facilityId);
        setDoctors(Array.isArray(res.data) ? res.data : []);
      } catch {
        setDoctors([]);
      }
    })();
  }, [facilityId, mode]);

  // clear slots when doctor/date changes
  useEffect(() => {
    setSlots([]);
    setTime("");
  }, [doctorId, date]);

  const loadSlots = async () => {
    setError("");
    setMsg("");
    setSlots([]);
    setTime("");

    if (!doctorId) return setError("Choose a doctor first");

    try {
      const res = await getDoctorAvailabilityForPatient(doctorId, date);
      const available = res.data?.available || [];
      setSlots(Array.isArray(available) ? available : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load slots");
    }
  };

  const book = async () => {
    setError("");
    setMsg("");

    if (!doctorId) return setError("Choose a doctor");
    if (!date) return setError("Choose a date");
    if (!time) return setError("Choose a time");

    const iso = new Date(`${date}T${time}:00`).toISOString();

    setCreating(true);
    try {
      await createAppointment({ doctorId, date: iso });
      setTime("");
      setSlots([]);
      setMsg("✅ Appointment created (pending)");
    } catch (e) {
      setError(e?.response?.data?.message || "Booking failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="topbar">
          <h2 className="title">Book an appointment</h2>
        </div>

        <section className="panel">
          <div className="row">
            <label className="radio">
              <input
                type="radio"
                name="mode"
                checked={mode === "private"}
                onChange={() => setMode("private")}
              />
              Private doctor
            </label>

            <label className="radio">
              <input
                type="radio"
                name="mode"
                checked={mode === "facility"}
                onChange={() => setMode("facility")}
              />
              Facility
            </label>
          </div>

          <div className="formGrid">
            {mode === "facility" && (
              <div className="field">
                <div>Facility</div>
                <select className="select" value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
                  <option value="">-- choose facility --</option>
                  {facilities.map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="field">
              <div>Doctor</div>
              <select
                className="select"
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
            </div>

            <div className="field">
              <div>Date</div>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="actionsRow">
              <button className="btn" type="button" onClick={loadSlots} disabled={!doctorId || creating}>
                Load slots
              </button>

              <div className="field fieldTime">
                <div>Time</div>
                <select
                  className="select"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={slots.length === 0 || creating}
                >
                  <option value="">{slots.length ? "-- choose time --" : "No available slots"}</option>
                  {slots.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary" type="button" onClick={book} disabled={creating || !doctorId || !time}>
                {creating ? "Booking..." : "Book"}
              </button>
            </div>

            {msg && <div className="success">{msg}</div>}
            {error && <div className="alert">{error}</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
