import React, { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="lp">
      <div className="lp__container">
        <div className="lp__hero">
          <div className="lp__badge">Contact</div>
          <h1 className="lp__title">Get in touch</h1>
          <p className="lp__subtitle">
            If you have questions, feedback, or support needs, send us a message.
          </p>
        </div>

        <div className="lp__grid lp__grid--2">
          <div className="lp__card">
            <h3 className="lp__h3">Contact info</h3>
            <p className="lp__p">
              <strong>Email:</strong> support@clinic-app.tn <br />
              <strong>Phone:</strong> +216 XX XXX XXX <br />
              <strong>Location:</strong> Tunis, Tunisia
            </p>

            <div className="lp__divider" />

            <p className="lp__p">Working hours: Mon–Fri, 09:00–17:00</p>
          </div>

          <form className="lp__card" onSubmit={onSubmit}>
            <h3 className="lp__h3">Send a message</h3>

            <label className="lp__label">Name</label>
            <input
              className="lp__input"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Your name"
              required
            />

            <label className="lp__label">Email</label>
            <input
              className="lp__input"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@email.com"
              required
            />

            <label className="lp__label">Message</label>
            <textarea
              className="lp__textarea"
              name="message"
              value={form.message}
              onChange={onChange}
              placeholder="Write your message..."
              rows={5}
              required
            />

            <button className="lp__btn" type="submit">
              Send
            </button>

            {sent && <div className="lp__toast">✅ Message sent (demo)</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
