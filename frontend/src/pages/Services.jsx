import React from "react";

export default function Services() {
  const items = [
    { title: "Appointment booking", desc: "Patients can book appointments in a few clicks." },
    { title: "Doctor agenda", desc: "Doctors can manage their schedule and availability." },
    { title: "Facility management", desc: "Admin facility validates and manages appointments." },
    { title: "Notifications", desc: "Optional sound alerts + auto refresh for new updates." },
    { title: "Secure authentication", desc: "JWT-based auth with role-based access." },
    { title: "History & upcoming", desc: "Clear separation of upcoming and past appointments." },
  ];

  return (
    <div className="lp">
      <div className="lp__container">
        <div className="lp__hero">
          <div className="lp__badge">Services</div>
          <h1 className="lp__title">Everything you need to manage appointments</h1>
          <p className="lp__subtitle">
            A full workflow for patients, doctors, and facilities.
          </p>
        </div>

        <div className="lp__grid lp__grid--2">
          {items.map((it) => (
            <div className="lp__card" key={it.title}>
              <h3 className="lp__h3">{it.title}</h3>
              <p className="lp__p">{it.desc}</p>
            </div>
          ))}
        </div>

        <div className="lp__callout">
          <div>
            <h3 className="lp__h3">Built for clarity</h3>
            <p className="lp__p">
              Simple UI, professional look, and clean navigation across the app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
