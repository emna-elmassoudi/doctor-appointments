import { useMemo, useState } from "react";
import api from "../api/axios";

export default function AIChat() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hi! I’m your assistant. I can help with booking steps, app usage, and general guidance (no medical diagnosis).",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    setErr("");
    setLoading(true);
    setMessages((m) => [...m, { from: "me", text: userMsg }]);

    try {
      const { data } = await api.post("/ai/chat", {
        message: userMsg,
        role: "patient",
      });

      setMessages((m) => [...m, { from: "ai", text: data?.reply || "No reply." }]);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h2 style={{ marginBottom: 10 }}>AI Assistant</h2>

      <div
        style={{
          border: "1px solid rgba(255,255,255,.18)",
          borderRadius: 16,
          padding: 16,
          minHeight: 360,
          background: "rgba(255,255,255,.06)",
          backdropFilter: "blur(10px)",
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start", margin: "10px 0" }}>
            <div
              style={{
                maxWidth: "78%",
                padding: "10px 12px",
                borderRadius: 14,
                background: m.from === "me" ? "rgba(120,255,235,.18)" : "rgba(255,255,255,.10)",
                border: "1px solid rgba(255,255,255,.16)",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div style={{ opacity: 0.7, marginTop: 8 }}>Typing…</div>}
      </div>

      {err && <div style={{ color: "crimson", marginTop: 10 }}>{err}</div>}

      <form onSubmit={send} style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me something…"
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.22)",
            background: "rgba(10,20,35,.25)",
            color: "inherit",
          }}
        />
        <button
          disabled={!canSend}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: 0,
            cursor: canSend ? "pointer" : "not-allowed",
            opacity: canSend ? 1 : 0.6,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
