import { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MatchCard from './components/MatchCard';
import Toast from './components/Toast';
import { supabase } from './supabase';
import { matchesData as defaultMatchesData } from './data/matchesData';
import './App.css';

// Stand pricing multipliers based on base general ticket price
const STAND_PRICE_MULTIPLIERS = {
  General: 1,
  Premium: 2.333,
  VIP: 5.333,
};

// Full team name dictionary
const TEAM_FULL_NAMES = {
  CSK: 'Chennai Super Kings',
  RCB: 'Royal Challengers Bengaluru',
  MI: 'Mumbai Indians',
  KKR: 'Kolkata Knight Riders',
  GT: 'Gujarat Titans',
  RR: 'Rajasthan Royals',
  SRH: 'Sunrisers Hyderabad',
  DC: 'Delhi Capitals',
  LSG: 'Lucknow Super Giants',
  PBKS: 'Punjab Kings',
};

/**
 * Format raw Supabase match row into UI match model
 */
function formatMatch(m) {
  const team1 = m.team1 || 'Team A';
  const team2 = m.team2 || 'Team B';
  const teams = `${team1} vs ${team2}`;
  const teamFullNames = `${TEAM_FULL_NAMES[team1] || team1} vs ${TEAM_FULL_NAMES[team2] || team2}`;
  const basePrice = Number(m.price) || 1500;
  const matchNo = m.matchNo || (m.id ? `Match ${String(m.id).padStart(2, '0')}` : 'Match');

  return {
    id: m.id,
    matchNo,
    team1,
    team2,
    teams,
    teamFullNames,
    dateTime: m.date || 'March 22, 2026 | 7:30 PM',
    venue: m.venue || 'Stadium Arena',
    available_seats: m.available_seats !== undefined ? Number(m.available_seats) : 50000,
    price: basePrice,
    prices: {
      general: basePrice,
      premium: Math.round(basePrice * STAND_PRICE_MULTIPLIERS.Premium),
      vip: Math.round(basePrice * STAND_PRICE_MULTIPLIERS.VIP),
    },
  };
}

export default function App() {
  // =========================================================================
  // State Management
  // =========================================================================
  // 1. Matches & Bookings data from Supabase
  const [matches, setMatches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbStatus, setDbStatus] = useState('connecting'); // 'live' | 'fallback' | 'connecting'

  // 2. Filter & View Mode
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  // 3. Booking Form Fields
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [standCategory, setStandCategory] = useState('General');
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // 4. Toast Notifications
  const [toast, setToast] = useState({ message: '', visible: false });

  const triggerToast = useCallback((message) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 3500);
  }, []);

  // =========================================================================
  // Step 3: Fetch Matches from Supabase using .from('matches').select('*')
  // =========================================================================
  const fetchMatches = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.warn('Supabase matches fetch error (using fallback):', error.message);
        setDbStatus('fallback');
        // Gracefully use local default data if table permissions/setup are pending
        setMatches(defaultMatchesData.map((m) => ({
          ...m,
          available_seats: m.available_seats || 50000,
        })));
      } else if (data && data.length > 0) {
        setMatches(data.map(formatMatch));
        setDbStatus('live');
      } else {
        // Table exists but is empty
        setMatches(defaultMatchesData.map((m) => ({
          ...m,
          available_seats: m.available_seats || 50000,
        })));
        setDbStatus('live');
      }
    } catch (err) {
      console.error('Network error fetching matches:', err);
      setDbStatus('fallback');
      setMatches(defaultMatchesData);
    } finally {
      setIsLoadingMatches(false);
    }
  }, []);

  // Fetch Bookings from Supabase
  const fetchBookings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase bookings fetch error:', error.message);
      } else if (data) {
        setBookings(data);
      }
    } catch (err) {
      console.error('Network error fetching bookings:', err);
    }
  }, []);

  // =========================================================================
  // Step 5: Realtime Subscription inside useEffect
  // =========================================================================
  useEffect(() => {
    // Initial fetch of live data
    fetchMatches();
    fetchBookings();

    // Setup Supabase Realtime channel for live updates
    const channel = supabase
      .channel('ipl-live-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          console.log('⚡ Realtime Match Update:', payload);
          fetchMatches();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('⚡ Realtime Booking Update:', payload);
          fetchBookings();
        }
      )
      .subscribe((status) => {
        console.log('Supabase Realtime Status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMatches, fetchBookings]);

  // =========================================================================
  // Derived Data
  // =========================================================================
  const filteredMatches = useMemo(() => {
    if (selectedTeam === 'all') return matches;
    return matches.filter(
      (m) => m.team1 === selectedTeam || m.team2 === selectedTeam
    );
  }, [matches, selectedTeam]);

  // Find currently selected match object
  const activeMatch = useMemo(() => {
    return matches.find((m) => String(m.id) === String(selectedMatchId) || m.matchNo === selectedMatchId) || null;
  }, [matches, selectedMatchId]);

  // Price calculations
  const unitPrice = activeMatch
    ? (activeMatch.prices?.[standCategory.toLowerCase()] || activeMatch.price || 1500)
    : 0;
  const totalPrice = unitPrice * ticketQuantity;

  // =========================================================================
  // Event Handlers
  // =========================================================================
  const handleFilterChange = (e) => {
    const team = e.target.value;
    setSelectedTeam(team);
    const count = team === 'all'
      ? matches.length
      : matches.filter((m) => m.team1 === team || m.team2 === team).length;
    triggerToast(`Filter: ${count} match(es) for ${team === 'all' ? 'All Teams' : team}`);
  };

  const handleBookFromCard = (match) => {
    setSelectedMatchId(String(match.id));
    triggerToast(`Selected ${match.teams}`);

    const bookingSection = document.getElementById('book-ticket');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // =========================================================================
  // Step 4: Booking with .insert() into bookings and .update().eq() on matches
  // =========================================================================
  const handleConfirmBooking = async (e) => {
    e.preventDefault();

    if (!activeMatch) {
      triggerToast('⚠️ Please select a match before booking!');
      return;
    }

    if (activeMatch.available_seats < ticketQuantity) {
      triggerToast(`⚠️ Only ${activeMatch.available_seats} seats remaining for this match!`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Insert new booking record into Supabase 'bookings' table
      const { data: bookingResult, error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            match_id: activeMatch.id,
            tickets: ticketQuantity,
            total_price: totalPrice,
            user_name: userName.trim() || 'Fan',
          },
        ])
        .select();

      if (bookingError) {
        console.error('Supabase booking insert error:', bookingError);
        triggerToast(`⚠️ Database error: ${bookingError.message}`);
        // If permission denied error, inform user to run RLS policies
        if (bookingError.code === '42501') {
          triggerToast('⚠️ RLS policy missing! Please execute the SQL GRANT script in Supabase.');
        }
        return;
      }

      // 2. Update available_seats in Supabase 'matches' table using .update().eq()
      const updatedSeats = Math.max(0, activeMatch.available_seats - ticketQuantity);
      const { error: matchUpdateError } = await supabase
        .from('matches')
        .update({ available_seats: updatedSeats })
        .eq('id', activeMatch.id);

      if (matchUpdateError) {
        console.error('Supabase match update error:', matchUpdateError);
      }

      const generatedId = bookingResult?.[0]?.id 
        ? `IPL-BK-${bookingResult[0].id}`
        : `IPL-${Math.floor(1000 + Math.random() * 9000)}`;

      triggerToast(`🎉 Booking Confirmed! ID: ${generatedId} (₹${totalPrice.toLocaleString('en-IN')})`);

      // Refresh data locally immediately
      fetchMatches();
      fetchBookings();

      // Reset form
      setSelectedMatchId('');
      setStandCategory('General');
      setTicketQuantity(1);
      setUserName('');
      setUserEmail('');
      setUserPhone('');

      // Scroll to bookings
      setTimeout(() => {
        const myBookings = document.getElementById('my-bookings');
        if (myBookings) myBookings.scrollIntoView({ behavior: 'smooth' });
      }, 400);

    } catch (err) {
      console.error('Unexpected booking error:', err);
      triggerToast(`⚠️ Booking error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      {/* 1. Navbar Component */}
      <Navbar />

      <main>
        {/* 2. Hero Component */}
        <Hero
          onViewSchedule={() => triggerToast('Viewing Match Schedule')}
          onBookTicket={() => triggerToast('Choose a match below to book')}
        />

        {/* Database Live Connection Status Banner */}
        <div className="db-status-bar">
          <div className="db-status-indicator">
            <span className={`status-dot ${dbStatus === 'live' ? 'online' : 'offline'}`}></span>
            <span>
              {dbStatus === 'live' 
                ? '🟢 Supabase PostgreSQL Live Database Connected' 
                : '🟡 Local Mode (Run SQL script in Supabase SQL Editor to grant table access)'}
            </span>
          </div>
        </div>

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

        {/* 4. Match Schedule Section (Supabase Live Matches) */}
        <section id="matches" className="section-card">
          <div className="section-header-row">
            <h2>Match Schedule</h2>
            {isLoadingMatches && <span className="loading-spinner">Loading matches...</span>}
          </div>

          {/* Schedule Controls */}
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

          {/* Matches Container */}
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

        {/* 5. Ticket Booking & Live Summary Section */}
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
                  {matches.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.matchNo}: {m.teams} ({m.available_seats?.toLocaleString('en-IN')} seats left)
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
                  <option value="General">General Stand (₹{activeMatch?.prices?.general?.toLocaleString('en-IN') || '1,500'})</option>
                  <option value="Premium">Premium Stand (₹{activeMatch?.prices?.premium?.toLocaleString('en-IN') || '3,500'})</option>
                  <option value="VIP">VIP Hospitality (₹{activeMatch?.prices?.vip?.toLocaleString('en-IN') || '8,000'})</option>
                </select>
              </div>

              <div>
                <label htmlFor="ticket-quantity">Number of Tickets (Max 10):</label>
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
                <label htmlFor="user-name">Full Name *:</label>
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
                />
              </div>

              <button 
                type="submit" 
                className="btn-confirm" 
                disabled={isSubmitting || !activeMatch || activeMatch.available_seats < ticketQuantity}
              >
                {isSubmitting ? 'Booking Tickets...' : 'Confirm & Book via Supabase'}
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
              <p>
                <strong>Seats Remaining:</strong>{' '}
                <span>{activeMatch ? `${activeMatch.available_seats.toLocaleString('en-IN')}` : '-'}</span>
              </p>
              <hr />
              <p className="total-row">
                <strong>Total Amount:</strong>{' '}
                <span className="total-amount">₹{totalPrice.toLocaleString('en-IN')}</span>
              </p>
            </div>
          </div>
        </section>

        {/* 6. My Bookings Section (Live Supabase Bookings) */}
        <section id="my-bookings" className="section-card">
          <div className="section-header-row">
            <h2>My Ticket Bookings</h2>
            <span className="live-badge">Live PostgreSQL Table: bookings</span>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Match</th>
                  <th>Tickets</th>
                  <th>Total Price</th>
                  <th>Booked At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map((b) => {
                    const matchInfo = matches.find((m) => m.id === b.match_id);
                    const matchName = matchInfo ? matchInfo.teams : `Match #${b.match_id}`;
                    const bookedDate = b.created_at
                      ? new Date(b.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now';

                    return (
                      <tr key={b.id}>
                        <td><span className="booking-id-tag">IPL-BK-{b.id}</span></td>
                        <td><strong>{b.user_name || 'Guest'}</strong></td>
                        <td>{matchName}</td>
                        <td>{b.tickets}</td>
                        <td>₹{Number(b.total_price).toLocaleString('en-IN')}</td>
                        <td>{bookedDate}</td>
                        <td><span className="badge-confirmed">Confirmed</span></td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-bookings">
                      No bookings recorded yet in Supabase. Select a match above to book your tickets!
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
        <p>&copy; 2026 IPL Ticket Booking. Connected to Supabase PostgreSQL Database.</p>
      </footer>

      {/* Toast Notification */}
      <Toast message={toast.message} isVisible={toast.visible} />
    </div>
  );
}
