export default function HowItWorks() {
  return (
    <div className="lp">
      <div className="lp__container">
        <div className="lp__hero">
          <div className="lp__badge">How it works</div>
          <h1 className="lp__title">Book an appointment in 3 simple steps</h1>
          <p className="lp__subtitle">
            Fast, clear, and secure appointment scheduling for patients and doctors.
          </p>
        </div>

        <div className="lp__grid">
          <div className="lp__card">
            <div className="lp__icon">1</div>
            <h3 className="lp__h3">Choose a doctor</h3>
            <p className="lp__p">Browse doctors and pick the right specialty for your needs.</p>
          </div>

          <div className="lp__card">
            <div className="lp__icon">2</div>
            <h3 className="lp__h3">Select a date & time</h3>
            <p className="lp__p">See available slots and select the time that suits you best.</p>
          </div>

          <div className="lp__card">
            <div className="lp__icon">3</div>
            <h3 className="lp__h3">Confirm your appointment</h3>
            <p className="lp__p">You get instant confirmation, and the doctor/admin can validate it.</p>
          </div>
        </div>

        <div className="lp__callout">
          <div>
            <h3 className="lp__h3">Real-time updates</h3>
            <p className="lp__p">
              Status updates (pending / confirmed / canceled) are visible instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
