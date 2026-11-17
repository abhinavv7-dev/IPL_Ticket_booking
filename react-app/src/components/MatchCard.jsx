/**
 * MatchCard Component
 * Demonstrates:
 * - Receiving and destructuring props (`match`, `onBook`)
 * - JSX syntax for dynamic expressions: {match.matchNo}, {match.teams}
 * - Formatting numbers using JavaScript methods inside JSX expressions
 * - Event handling via prop callback: onClick={() => onBook(match)}
 */
export default function MatchCard({ match, onBook }) {
  const {
    matchNo,
    teams,
    teamFullNames,
    dateTime,
    venue,
    prices = {}
  } = match;

  return (
    <div className="match-card" data-match-id={matchNo}>
      {/* Card Header: Match Badge & Date */}
      <div className="match-card-header">
        <span className="match-badge">{matchNo}</span>
        <span className="match-date">{dateTime}</span>
      </div>

      {/* Teams Information */}
      <div className="match-teams">
        <h3>
          {teams.split(' vs ')[0]}{' '}
          <span className="vs">vs</span>{' '}
          {teams.split(' vs ')[1]}
        </h3>
        <p className="teams-full">{teamFullNames}</p>
      </div>

      {/* Venue Information */}
      <div className="match-venue">
        <span className="venue-icon">📍</span>
        <span>{venue}</span>
      </div>

      {/* Ticket Price Tiers */}
      <div className="match-prices">
        <span className="price-pill">
          Gen: ₹{prices.general?.toLocaleString('en-IN') || 1500}
        </span>
        <span className="price-pill">
          Prem: ₹{prices.premium?.toLocaleString('en-IN') || 3500}
        </span>
        <span className="price-pill vip">
          VIP: ₹{prices.vip?.toLocaleString('en-IN') || 8000}
        </span>
      </div>

      {/* Book Ticket Action Button */}
      <button
        type="button"
        className="book-match-btn"
        onClick={() => onBook && onBook(match)}
      >
        Book Ticket
      </button>
    </div>
  );
}

