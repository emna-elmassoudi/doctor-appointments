import { Link } from "react-router-dom";


export default function Home() {
  return (
    <div className="landingPage">
      <div className="landingWrap">
        {/* Topbar (نفس روح auth pages) */}
        <header className="landingTop">
          <div className="landingBrand">
            <span className="landingDot" />
            <span className="landingName">MedApp</span>
          </div>

          <nav className="landingActions">
            <Link className="landingBtn landingBtn--ghost" to="/login">
              Login
            </Link>
            <Link className="landingBtn landingBtn--primary" to="/register">
              Register
            </Link>
          </nav>
        </header>

        {/* Hero Card */}
        <section className="landingCardHero">
          {/* Left */}
          <div className="landingLeft">
            <div className="landingBadge">RDVDoctor • Appointments made simple</div>

            <h1 className="landingTitle">
              Book your doctor appointment <span className="landingGrad">easily</span> &{" "}
              <span className="landingGrad2">quickly</span>.
            </h1>

            <p className="landingSubtitle">
              A modern platform for <b>Patients</b>, <b>Doctors</b> and <b>Facility Admins</b> to
              manage appointments securely.
            </p>

            <div className="landingCta">
              <Link className="landingBtn landingBtn--primary" to="/register">
                Create an account
              </Link>
              <Link className="landingBtn landingBtn--ghost" to="/login">
                Book an appointment
              </Link>
            </div>

            <div className="landingStats">
              <div className="landingStat">
                <div className="landingStatNum">40+</div>
                <div className="landingStatTxt">Professional doctors</div>
              </div>
              <div className="landingStat">
                <div className="landingStatNum">24/7</div>
                <div className="landingStatTxt">Booking support</div>
              </div>
              <div className="landingStat">
                <div className="landingStatNum">3</div>
                <div className="landingStatTxt">Roles supported</div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="landingRight">
            <div className="landingImageWrap">
              <img
                src="/landing-doctors.png"
                alt="Doctors"
                className="landingImage"
              />
            </div>
          </div>
        </section>

        {/* Roles (small clean section) */}
        <section className="landingRoles">
          <h2 className="landingH2">Made for every role</h2>
          <p className="landingMuted">Each role has its own protected space.</p>

          <div className="landingGrid">
            <div className="roleCardX">
              <div className="roleIconX">🧑‍🦱</div>
              <div className="roleTitleX">Patient</div>
              <div className="landingMuted">
                Book appointments and follow your history.
              </div>
            </div>

            <div className="roleCardX">
              <div className="roleIconX">🩺</div>
              <div className="roleTitleX">Doctor</div>
              <div className="landingMuted">
                View your agenda and manage daily bookings.
              </div>
            </div>

            <div className="roleCardX">
              <div className="roleIconX">🏥</div>
              <div className="roleTitleX">Admin Facility</div>
              <div className="landingMuted">
                Confirm/cancel appointments for your facility.
              </div>
            </div>
          </div>
        </section>

        <footer className="landingFooter">
          <span className="landingMuted">© {new Date().getFullYear()} MedApp — RDVDoctor</span>
        </footer>
      </div>
    </div>
  );
}
