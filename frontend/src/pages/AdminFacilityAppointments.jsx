import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import { playBeep } from "../utils/sound";

import "../styles/patient.css";
import "../styles/AdminFacilityAppointments.css"; 

export default function AdminFacilityAppointments() {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [soundEnabled, setSoundEnabled] = useState(false);
  const prevStatusMapRef = useRef(new Map());

  const [appointments, setAppointments] = useState([]);

  const msgTimerRef = useRef(null);
  const flashMsg = (text, ms = 2500) => {
    setMsg(text);
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMsg(""), ms);
  };

  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    };
  }, []);

  const normalizeAppointments = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.appointments)) return data.appointments;
    if (Array.isArray(data?.upcoming) || Array.isArray(data?.history)) {
      return [...(data.upcoming || []), ...(data.history || [])];
    }
    return [];
  };

  // polling
  const pollDelayRef = useRef(15000);
  const pollTimerRef = useRef(null);
  const pollingStoppedRef = useRef(false);

  const stopPolling = () => {
    pollingStoppedRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
  };

  const load = async ({ silent = false } = {}) => {
    if (pollingStoppedRef.current) return;

    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      // ✅ ADMIN FACILITY endpoint
      const res = await api.get("/appointments/facility");
      const list = normalizeAppointments(res?.data);
      setAppointments(list);

      // 🔔 beep on status change
      if (soundEnabled) {
        const prev = prevStatusMapRef.current;
        const curr = new Map(list.map((a) => [a._id, a.status]));
        let changed = false;

        for (const [id, st] of curr.entries()) {
          const old = prev.get(id);
          if (old && old !== st) {
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
      const status = e?.response?.status;
      if (status === 401 || status === 403) stopPolling();

      if (!silent) {
        setError(e?.response?.data?.message || "Failed to load facility appointments");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const hasPending = (appointments || []).some((a) => a.status === "pending");
    pollDelayRef.current = hasPending ? 5000 : 15000;
  }, [appointments]);

  useEffect(() => {
    load();
    let stopped = false;

    const tick = async () => {
      if (stopped || pollingStoppedRef.current) return;
      await load({ silent: true });
      if (stopped || pollingStoppedRef.current) return;
      pollTimerRef.current = setTimeout(tick, pollDelayRef.current);
    };

    pollTimerRef.current = setTimeout(tick, 5000);

    return () => {
      stopped = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enableSound = () => {
    setSoundEnabled(true);
    playBeep();
    flashMsg("🔔 Sound enabled", 1500);
  };

  // ✅ ADMIN FACILITY PATCH
  const setStatus = async (id, status) => {
    setError("");
    setMsg("");
    setBusyId(id);

    try {
      await api.patch(`/appointments/${id}/status`, { status });
      flashMsg(`✅ Updated: ${status}`);
      await load({ silent: true });
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401 || code === 403) stopPolling();
      setError(e?.response?.data?.message || "Failed to update status");
    } finally {
      setBusyId("");
    }
  };

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

  const StatusPill = ({ status }) => (
    <span className={`status ${status || "pending"}`}>{status || "pending"}</span>
  );

  const Card = ({ a }) => {
    const canConfirm = a.status === "pending";
    const canCancel = a.status !== "cancelled";

    return (
      <div className="item">
        <div className="kv">
          <div className="k">Date</div>
          <div>{new Date(a.date).toLocaleString()}</div>

          <div className="k">Patient</div>
          <div>{a.patient?.fullName || a.patient?.email || "—"}</div>

          <div className="k">Doctor</div>
          <div>{a.doctor?.fullName || a.doctor?.email || "—"}</div>

          <div className="k">Facility</div>
          <div>{a.facility?.name || "—"}</div>

          <div className="k">Status</div>
          <div>
            <StatusPill status={a.status} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            disabled={!canConfirm || busyId === a._id}
            onClick={() => setStatus(a._id, "confirmed")}
          >
            {busyId === a._id ? "..." : "Confirm"}
          </button>

          <button
            className="btn btn-danger"
            disabled={!canCancel || busyId === a._id}
            onClick={() => setStatus(a._id, "cancelled")}
          >
            {busyId === a._id ? "..." : "Cancel"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="container">
        <div className="topbar">
          <h1 className="title">Admin Facility</h1>

          <div className="toolbar">
            <button className="btn" onClick={() => load()} disabled={loading || !!busyId}>
              Refresh
            </button>

            <button
              className="btn btn-primary"
              onClick={enableSound}
              disabled={soundEnabled || !!busyId}
            >
              {soundEnabled ? "Sound ON" : "Enable Sound"}
            </button>
          </div>
        </div>

        {msg && <div className="success">{msg}</div>}
        {error && <div className="alert">{error}</div>}

        <div className="panel" style={{ marginTop: 12 }}>
          <div className="sectionTitle">Upcoming</div>

          {loading ? (
            <div className="empty">Loading...</div>
          ) : upcoming.length === 0 ? (
            <div className="empty">No upcoming appointments</div>
          ) : (
            <div className="list">{upcoming.map((a) => <Card key={a._id} a={a} />)}</div>
          )}

          <div className="sectionTitle" style={{ marginTop: 16 }}>
            History
          </div>

          {loading ? null : history.length === 0 ? (
            <div className="empty">No history</div>
          ) : (
            <div className="list">{history.map((a) => <Card key={a._id} a={a} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
