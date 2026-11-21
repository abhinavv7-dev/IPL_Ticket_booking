/**
 * MatchCard Component
 * Demonstrates:
 * - Receiving and destructuring props (`match`, `onBook`)
 * - Displaying live available_seats from Supabase
 * - Dynamic price tier formatting
 * - Event handling via prop callback: onClick={() => onBook(match)}
 */
export default function MatchCard({ match, onBook }) {
  const {
    matchNo,
    teams,
    teamFullNames,
    dateTime,
    venue,
    available_seats,
    prices = {}
  } = match;

  const isSoldOut = available_seats !== undefined && available_seats <= 0;

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
          {teams?.includes(' vs ') ? (
            <>
              {teams.split(' vs ')[0]}{' '}
              <span className="vs">vs</span>{' '}
              {teams.split(' vs ')[1]}
            </>
          ) : (
            teams
          )}
        </h3>
        <p className="teams-full">{teamFullNames}</p>
      </div>

      {/* Venue Information */}
      <div className="match-venue">
        <span className="venue-icon">📍</span>
        <span>{venue}</span>
      </div>

      {/* Live Available Seats Badge (from Supabase) */}
      {available_seats !== undefined && (
        <div className={`match-seats ${isSoldOut ? 'sold-out' : ''}`}>
          <span className="seats-icon">{isSoldOut ? '🚫' : '🎟️'}</span>
          <span className="seats-count">
            {isSoldOut ? 'Sold Out' : `${available_seats.toLocaleString('en-IN')} seats left`}
          </span>
        </div>
      )}

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
        className={`book-match-btn ${isSoldOut ? 'btn-disabled' : ''}`}
        disabled={isSoldOut}
        onClick={() => onBook && onBook(match)}
      >
        {isSoldOut ? 'Sold Out' : 'Book Ticket'}
      </button>
    </div>
  );
}
