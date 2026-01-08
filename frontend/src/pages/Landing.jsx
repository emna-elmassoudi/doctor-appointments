import { Link } from "react-router-dom";
import "../styles/landing.css";

export default function Landing() {
  return (
    <div className="auth-page landing">
      <div className="auth-card landing-card">
        <div className="landing-hero">
          <div className="landing-left">
            <h1 className="landing-title">
              Book Your Doctor Appointment <br /> Easily & Quickly!
            </h1>

            <p className="landing-sub">
              Manage your medical appointments easily and securely with RDVDoctor.
            </p>

            <div className="landing-heroActions">
              <Link className="auth-btn landing-cta" to="/register">
                Book an appointment
              </Link>
              <Link className="auth-btn auth-btn--light" to="/login">
                Find a doctor
              </Link>
            </div>

            <div className="landing-stats">
              <div className="landing-stat">
                <div className="landing-statNum">40+</div>
                <div className="landing-statTxt">Registered Doctors</div>
              </div>

              <div className="landing-stat">
                <div className="landing-statNum">24/7</div>
                <div className="landing-statTxt">Support Service</div>
              </div>

              <div className="landing-stat">
                <div className="landing-statNum">Fast</div>
                <div className="landing-statTxt">Booking Process</div>
              </div>
            </div>
          </div>

          <div className="landing-right">
            <img className="landing-img" src="/landing-doctors.png" alt="Doctors" />
          </div>
        </div>

        <div className="landing-sections">
          <div className="landing-section">
            <div className="landing-sectionTitle">Why RDVDoctor?</div>

            <div className="landing-cards">
              <div className="landing-miniCard">
                <div className="landing-miniTitle">Easy booking</div>
                <div className="landing-miniText">Pick a doctor, choose a slot, confirm.</div>
              </div>

              <div className="landing-miniCard">
                <div className="landing-miniTitle">Secure access</div>
                <div className="landing-miniText">Private space for patient & doctor roles.</div>
              </div>

              <div className="landing-miniCard">
                <div className="landing-miniTitle">Facility management</div>
                <div className="landing-miniText">Admins confirm/cancel appointments fast.</div>
              </div>
            </div>
          </div>

          <div className="landing-footer">
            <span>© {new Date().getFullYear()} RDVDoctor</span>
            <span className="landing-dot">•</span>
            <span>Contact: support@rdvdoctor.tn</span>
          </div>
        </div>
      </div>
    </div>
  );
}
