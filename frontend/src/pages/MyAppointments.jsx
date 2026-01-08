import { useEffect, useMemo, useRef, useState } from "react";
import { getMyAppointments } from "../api/appointments";
import { playBeep } from "../utils/sound";
import "../styles/patient.css";


export default function MyAppointments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [appointments, setAppointments] = useState([]);

  // 🔔 enable sound
  const [soundEnabled, setSoundEnabled] = useState(false);
  const prevStatusMapRef = useRef(new Map());

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
        prevStatusMapRef.current = new Map(list.map((a) => [a._id, a.status]));
      }
    } catch (e) {
      if (!silent) setError(e?.response?.data?.message || "Failed to load appointments");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    loadAppointments();
  }, []);

  // auto refresh
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

    pollTimerRef.current = setTimeout(tick, 5000);

    return () => {
      stopped = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const enableSound = () => {
    setSoundEnabled(true);
    playBeep();
  };

  return (
    <div className="page">
      <div className="container">
        <div className="topbar">
          <h2 className="title">My Appointments</h2>

          <div className="toolbar">
            <button className="btn" onClick={() => loadAppointments()} disabled={loading}>
              Refresh
            </button>
            <button className="btn btn-primary" onClick={enableSound} disabled={soundEnabled}>
              {soundEnabled ? "Sound ON" : "Enable Sound"}
            </button>
          </div>
        </div>

        <section className="panel">
          {loading && <p className="empty">Loading...</p>}
          {error && <div className="alert">{error}</div>}

          {!loading && !error && (
            <>
              <h3 className="sectionTitle">Upcoming</h3>
              {upcoming.length === 0 ? (
                <p className="empty">No upcoming appointments</p>
              ) : (
                <div className="list">
                  {upcoming.map((a) => (
                    <div key={a._id} className="item">
                      <div className="kv">
                        <div className="k">Date</div>
                        <div>{new Date(a.date).toLocaleString()}</div>

                        <div className="k">Doctor</div>
                        <div>{a.doctor?.fullName} ({a.doctor?.specialty})</div>

                        <div className="k">Facility</div>
                        <div>{a.facility?.name || "—"}</div>

                        <div className="k">Status</div>
                        <div className={`status ${a.status}`}>{a.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="sectionTitle" style={{ marginTop: 16 }}>History</h3>
              {history.length === 0 ? (
                <p className="empty">No history</p>
              ) : (
                <div className="list">
                  {history.map((a) => (
                    <div key={a._id} className="item">
                      <div className="kv">
                        <div className="k">Date</div>
                        <div>{new Date(a.date).toLocaleString()}</div>

                        <div className="k">Doctor</div>
                        <div>{a.doctor?.fullName} ({a.doctor?.specialty})</div>

                        <div className="k">Facility</div>
                        <div>{a.facility?.name || "—"}</div>

                        <div className="k">Status</div>
                        <div className={`status ${a.status}`}>{a.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
