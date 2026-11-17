import { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MatchCard from './components/MatchCard';
import Toast from './components/Toast';
import { matchesData } from './data/matchesData';
import './App.css';

// Stand pricing structure
const STAND_PRICES = {
  General: 1500,
  Premium: 3500,
  VIP: 8000,
};

export default function App() {
  // =========================================================================
  // State Management (Activity: Using React useState)
  // =========================================================================
  // 1. Team Filter state
  const [selectedTeam, setSelectedTeam] = useState('all');

  // 2. View Mode state ('grid' vs 'list')
  const [viewMode, setViewMode] = useState('grid');

  // 3. Active Booking Selection state
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [standCategory, setStandCategory] = useState('General');
  const [ticketQuantity, setTicketQuantity] = useState(1);

  // 4. Booking Form User Details state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // 5. Confirmed Bookings list state
  const [bookings, setBookings] = useState([]);

  // 6. Toast Notification state
  const [toast, setToast] = useState({ message: '', visible: false });

  // Reusable helper to show notification
  const triggerToast = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 3000);
  };

  // =========================================================================
  // Derived Data (Filtering Matches using JavaScript Array methods)
  // =========================================================================
  const filteredMatches = useMemo(() => {
    if (selectedTeam === 'all') return matchesData;
    return matchesData.filter(
      (m) => m.team1 === selectedTeam || m.team2 === selectedTeam
    );
  }, [selectedTeam]);

  // Find currently selected match object
  const activeMatch = useMemo(() => {
    return matchesData.find((m) => m.matchNo === selectedMatchId) || null;
  }, [selectedMatchId]);

  // Live price calculations
  const unitPrice = activeMatch ? (STAND_PRICES[standCategory] || 0) : 0;
  const totalPrice = unitPrice * ticketQuantity;

  // =========================================================================
  // Event Handlers
  // =========================================================================
  // Handle team filter change
  const handleFilterChange = (e) => {
    const team = e.target.value;
    setSelectedTeam(team);
    const count = team === 'all' 
      ? matchesData.length 
      : matchesData.filter(m => m.team1 === team || m.team2 === team).length;
    triggerToast(`Filter: ${count} match(es) for ${team === 'all' ? 'All Teams' : team}`);
  };

  // Handle "Book Ticket" click from any MatchCard component
  const handleBookFromCard = (match) => {
    setSelectedMatchId(match.matchNo);
    triggerToast(`Selected ${match.teams}`);

    // Smooth scroll down to booking section
    const bookingSection = document.getElementById('book-ticket');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle form submission to confirm booking
  const handleConfirmBooking = (e) => {
    e.preventDefault();

    if (!activeMatch) {
      triggerToast('⚠️ Please select a match before booking!');
      return;
    }

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const newBooking = {
      id: `IPL-2026-${randomId}`,
      match: activeMatch.teams,
      stand: standCategory,
      quantity: ticketQuantity,
      totalPrice: totalPrice,
      status: 'Confirmed',
    };

    setBookings((prev) => [newBooking, ...prev]);
    triggerToast(`🎉 Booking Confirmed! ID: ${newBooking.id} (₹${totalPrice.toLocaleString('en-IN')})`);

    // Reset form fields
    setSelectedMatchId('');
    setStandCategory('General');
    setTicketQuantity(1);
    setUserName('');
    setUserEmail('');
    setUserPhone('');

    // Smooth scroll to My Bookings
    setTimeout(() => {
      const myBookings = document.getElementById('my-bookings');
      if (myBookings) myBookings.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  };

  return (
    <div className="app-container">
      {/* 1. Reusable Navbar Component */}
      <Navbar />

      <main>
        {/* 2. Reusable Hero Component */}
        <Hero
          onViewSchedule={() => triggerToast('Scrolled to Match Schedule')}
          onBookTicket={() => triggerToast('Select a match to book tickets')}
        />

        {/* 3. About Section */}
        <section id="about" className="section-card">
          <h2>About IPL 2026</h2>
          <p>
            The Indian Premier League (IPL) brings together world-class talent, thrilling stadium
            atmospheres, and high-octane T20 cricket action across major stadiums nationwide.
          </p>

          <h3>Popular Teams</h3>
          <ul className="teams-grid">
            <li>Chennai Super Kings</li>
            <li>Royal Challengers Bengaluru</li>
            <li>Mumbai Indians</li>
            <li>Kolkata Knight Riders</li>
            <li>Gujarat Titans</li>
          </ul>

          <h3>Major Match Venues</h3>
          <ul className="venues-grid">
            <li>M. Chinnaswamy Stadium, Bengaluru</li>
            <li>M. A. Chidambaram Stadium, Chennai</li>
            <li>Narendra Modi Stadium, Ahmedabad</li>
            <li>Wankhede Stadium, Mumbai</li>
          </ul>
        </section>

        {/* 4. Match Schedule Section (Mapping over MatchCard components) */}
        <section id="matches" className="section-card">
          <h2>Match Schedule</h2>

          {/* Schedule Controls: Team Filter & Grid/List View Switcher */}
          <div className="schedule-controls">
            <div className="filter-group">
              <label htmlFor="team-filter">Filter by Team: </label>
              <select
                id="team-filter"
                value={selectedTeam}
                onChange={handleFilterChange}
              >
                <option value="all">All Teams</option>
                <option value="CSK">Chennai Super Kings</option>
                <option value="RCB">Royal Challengers Bengaluru</option>
                <option value="MI">Mumbai Indians</option>
                <option value="KKR">Kolkata Knight Riders</option>
                <option value="GT">Gujarat Titans</option>
              </select>
            </div>

            <div className="view-toggle">
              <span className="toggle-label">View:</span>
              <button
                type="button"
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('grid');
                  triggerToast('Switched to Grid View');
                }}
              >
                Grid
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('list');
                  triggerToast('Switched to List View');
                }}
              >
                List
              </button>
            </div>
          </div>

          {/* 
            Render a list of matches by mapping over match data
            and reusing the MatchCard component with props!
          */}
          <div className={`matches-container ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
            {filteredMatches.length > 0 ? (
              filteredMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onBook={handleBookFromCard}
                />
              ))
            ) : (
              <p className="no-matches">No matches found for the selected team filter.</p>
            )}
          </div>
        </section>

        {/* 5. Ticket Booking & Live Summary Section (React State & Props) */}
        <section id="book-ticket" className="section-card">
          <h2>Book Your Tickets</h2>

          <div className="booking-container">
            {/* Booking Form */}
            <form id="booking-form" onSubmit={handleConfirmBooking}>
              <div>
                <label htmlFor="match-select">Select Match:</label>
                <select
                  id="match-select"
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a Match --</option>
                  {matchesData.map((m) => (
                    <option key={m.id} value={m.matchNo}>
                      {m.matchNo}: {m.teams}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="stand-category">Stand Category:</label>
                <select
                  id="stand-category"
                  value={standCategory}
                  onChange={(e) => setStandCategory(e.target.value)}
                  required
                >
                  <option value="General">General (₹1,500)</option>
                  <option value="Premium">Premium (₹3,500)</option>
                  <option value="VIP">VIP (₹8,000)</option>
                </select>
              </div>

              <div>
                <label htmlFor="ticket-quantity">Number of Tickets (1-10):</label>
                <input
                  type="number"
                  id="ticket-quantity"
                  min="1"
                  max="10"
                  value={ticketQuantity}
                  onChange={(e) => setTicketQuantity(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                  required
                />
              </div>

              <div>
                <label htmlFor="user-name">Full Name:</label>
                <input
                  type="text"
                  id="user-name"
                  placeholder="Enter your full name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="user-email">Email Address:</label>
                <input
                  type="email"
                  id="user-email"
                  placeholder="Enter your email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="user-phone">Phone Number:</label>
                <input
                  type="tel"
                  id="user-phone"
                  placeholder="Enter 10-digit phone number"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-confirm">
                Confirm & Book
              </button>
            </form>

            {/* Live Booking Summary Card */}
            <div className="summary-card">
              <h3>Booking Summary</h3>
              <p>
                <strong>Match:</strong>{' '}
                <span>{activeMatch ? `${activeMatch.matchNo}: ${activeMatch.teams}` : 'Not Selected'}</span>
              </p>
              <p>
                <strong>Stand:</strong> <span>{standCategory}</span>
              </p>
              <p>
                <strong>Price per Ticket:</strong>{' '}
                <span>₹{unitPrice.toLocaleString('en-IN')}</span>
              </p>
              <p>
                <strong>Quantity:</strong> <span>{ticketQuantity}</span>
              </p>
              <hr />
              <p className="total-row">
                <strong>Total Amount:</strong>{' '}
                <span className="total-amount">₹{totalPrice.toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>
        </section>

        {/* 6. My Bookings Section */}
        <section id="my-bookings" className="section-card">
          <h2>My Ticket Bookings</h2>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Match</th>
                  <th>Stand</th>
                  <th>Tickets</th>
                  <th>Total Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((b) => (
                    <tr key={b.id}>
                      <td><span className="booking-id-tag">{b.id}</span></td>
                      <td><strong>{b.match}</strong></td>
                      <td>{b.stand}</td>
                      <td>{b.quantity}</td>
                      <td>₹{b.totalPrice.toLocaleString('en-IN')}</td>
                      <td><span className="badge-confirmed">{b.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-bookings">
                      No bookings yet. Select a match above to book your stadium tickets!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. Matchday Guidelines Section */}
        <section id="guidelines" className="section-card">
          <h2>Matchday Guidelines</h2>

          <div className="guidelines-container">
            <div className="card">
              <h3>Ticket Verification</h3>
              <p>Ensure you have your digital E-ticket or printed ticket with a clear QR code ready for scanning at turnstiles.</p>
            </div>
            <div className="card">
              <h3>ID Proof Requirement</h3>
              <p>A valid government-issued photo ID (Aadhaar, Passport, Driving License, or Voter ID) matching the booking name is mandatory.</p>
            </div>
            <div className="card">
              <h3>Prohibited Items</h3>
              <p>Bags, Outside Food & Beverages, Cameras, Power Banks, Coins, and Lighters are strictly prohibited inside the grounds.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <p>&copy; 2026 IPL Ticket Booking. Built with React & Vite.</p>
      </footer>

      {/* Toast Notification */}
      <Toast message={toast.message} isVisible={toast.visible} />
    </div>
  );
}
