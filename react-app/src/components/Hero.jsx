/**
 * Hero Component
 * Demonstrates:
 * - Clean JSX structure and semantic markup
 * - Component styling with stadium-inspired linear gradient
 * - Reusable call-to-action buttons
 */
export default function Hero({ onViewSchedule, onBookTicket }) {
  return (
    <section id="hero" className="hero-section">
      <div className="hero-content">
        <h1>Experience The Stadium Energy Live!</h1>
        <p>Get your official tickets for IPL 2026 matches today.</p>
        <div className="hero-actions">
          <a href="#matches" onClick={onViewSchedule}>
            <button type="button" className="btn-primary">View Schedule</button>
          </a>
          <a href="#book-ticket" onClick={onBookTicket}>
            <button type="button" className="btn-secondary">Book Ticket</button>
          </a>
        </div>
      </div>
    </section>
  );
}

