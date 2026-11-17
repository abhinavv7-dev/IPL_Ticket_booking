// Execute code once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================================
    // 1. Toast Notification System (Activity 4)
    // =========================================================================
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Reusable showToast function
    window.showToast = function(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 50);

        // Automatically remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    };

    // =========================================================================
    // 2. DOM Elements Selection
    // =========================================================================
    // Match Schedule Elements
    const bookButtons = document.querySelectorAll('#matches table td button');
    const teamFilter = document.getElementById('team-filter');
    const matchRows = document.querySelectorAll('#matches table tbody tr');

    // Booking Form Elements
    const bookingForm = document.getElementById('booking-form');
    const matchSelect = document.getElementById('match-select');
    const standCategory = document.getElementById('stand-category');
    const ticketQuantity = document.getElementById('ticket-quantity');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userPhone = document.getElementById('user-phone');
    const bookingSection = document.getElementById('book-ticket');

    // Summary Card Elements
    const summaryMatch = document.getElementById('summary-match');
    const summaryStand = document.getElementById('summary-stand');
    const summaryPrice = document.getElementById('summary-price');
    const summaryQty = document.getElementById('summary-qty');
    const summaryTotal = document.getElementById('summary-total');

    // My Bookings Table Elements
    const bookingsList = document.getElementById('bookings-list');
    const myBookingsSection = document.getElementById('my-bookings');

    // =========================================================================
    // 3. Activity 7: Dynamic Ticket Price & Summary Calculation
    // =========================================================================
    // Stand Category Pricing Structure
    const standPrices = {
        'General': 1500,
        'Premium': 3500,
        'VIP': 8000
    };

    /**
     * Calculates the unit price, quantity, and total amount,
     * then updates the booking summary card in real-time.
     * @param {boolean} showNotification - Whether to trigger a toast notification.
     */
    function updateBookingSummary(showNotification = true) {
        // Guard clause in case elements do not exist on the current page
        if (!summaryMatch || !summaryStand || !summaryPrice || !summaryQty || !summaryTotal) {
            return;
        }

        const isMatchSelected = matchSelect && matchSelect.value !== '';
        const selectedMatchText = isMatchSelected 
            ? matchSelect.options[matchSelect.selectedIndex].text 
            : 'Not Selected';

        const selectedStand = (standCategory && standCategory.value) || 'General';
        
        // Parse and validate quantity (must be between 1 and 10)
        let qty = ticketQuantity ? parseInt(ticketQuantity.value, 10) : 1;
        if (isNaN(qty) || qty < 1) {
            qty = 1;
        } else if (qty > 10) {
            qty = 10;
        }

        // When no match is chosen, price and total must show 0
        const unitPrice = isMatchSelected ? (standPrices[selectedStand] || 0) : 0;
        const totalPrice = unitPrice * qty;

        // Dynamically update the summary card DOM elements
        summaryMatch.textContent = selectedMatchText;
        summaryStand.textContent = selectedStand;
        summaryPrice.textContent = unitPrice.toLocaleString('en-IN');
        summaryQty.textContent = qty;
        summaryTotal.textContent = totalPrice.toLocaleString('en-IN');

        // Show toast notification when user changes values on an active selection
        if (showNotification && isMatchSelected) {
            showToast(`Summary updated: Total ₹${totalPrice.toLocaleString('en-IN')}`);
        }
    }

    // Attach real-time event listeners for live price recalculation
    if (matchSelect) {
        matchSelect.addEventListener('change', () => updateBookingSummary(true));
    }
    if (standCategory) {
        standCategory.addEventListener('change', () => updateBookingSummary(true));
    }
    if (ticketQuantity) {
        // Live update while typing or clicking spinners
        ticketQuantity.addEventListener('input', () => updateBookingSummary(false));
        // Confirm with toast once input loses focus or spinner completes change
        ticketQuantity.addEventListener('change', () => updateBookingSummary(true));
    }

    // =========================================================================
    // 4. Smooth Scroll & Auto-Select Match from Match Schedule Table
    // =========================================================================
    bookButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Smoothly scroll down to the booking form
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
            }

            // Identify match details from the clicked row
            const row = button.closest('tr');
            if (row) {
                const matchTeams = row.cells[1].textContent.trim();

                // Auto-select match in dropdown if element exists
                if (matchSelect) {
                    for (let option of matchSelect.options) {
                        if (option.text.includes(matchTeams)) {
                            matchSelect.value = option.value;
                            break;
                        }
                    }
                    // Update summary card instantly with the newly selected match
                    updateBookingSummary(false);
                }

                showToast(`Selected Match: ${matchTeams}`);
            }
        });
    });

    // =========================================================================
    // 5. Match Schedule Team Filter
    // =========================================================================
    if (teamFilter && matchRows.length > 0) {
        teamFilter.addEventListener('change', () => {
            const selectedTeam = teamFilter.value;
            let visibleCount = 0;

            matchRows.forEach(row => {
                const teams = row.cells[1]?.textContent.trim() || '';
                if (selectedTeam === 'all' || teams.includes(selectedTeam)) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            showToast(`Filter applied: ${visibleCount} match(es) visible`);
        });
    }

    // =========================================================================
    // 6. Activity 8: Dynamic Booking Submission & "My Bookings" Persistence
    // =========================================================================
    const LOCAL_STORAGE_KEY = 'ipl_ticket_bookings';

    /**
     * Retrieve stored bookings from localStorage.
     * @returns {Array} List of booking objects.
     */
    function getStoredBookings() {
        try {
            const data = localStorage.getItem(LOCAL_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading bookings from localStorage', e);
            return [];
        }
    }

    /**
     * Save bookings array to localStorage.
     * @param {Array} bookings 
     */
    function saveBookings(bookings) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookings));
        } catch (e) {
            console.error('Error saving bookings to localStorage', e);
        }
    }

    /**
     * Renders all bookings into the 'My Bookings' table.
     */
    function renderBookingsTable() {
        if (!bookingsList) return;

        const bookings = getStoredBookings();
        bookingsList.innerHTML = '';

        if (bookings.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="6" class="empty-bookings">
                    No bookings yet. Select a match above to book your stadium tickets!
                </td>
            `;
            bookingsList.appendChild(emptyRow);
            return;
        }

        bookings.forEach(booking => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="booking-id-tag">${booking.id}</span></td>
                <td><strong>${booking.match}</strong></td>
                <td>${booking.stand}</td>
                <td>${booking.quantity}</td>
                <td>₹${booking.totalPrice.toLocaleString('en-IN')}</td>
                <td><span class="badge-confirmed">${booking.status || 'Confirmed'}</span></td>
            `;
            bookingsList.appendChild(row);
        });
    }

    /**
     * Handles booking form submission:
     * - Validates form inputs
     * - Generates unique Booking ID
     * - Saves booking object to localStorage
     * - Appends new row dynamically to 'My Bookings' table
     * - Shows confirmation toast & resets form
     */
    if (bookingForm) {
        bookingForm.addEventListener('submit', (event) => {
            event.preventDefault();

            // Validate that a match has been selected
            if (!matchSelect || matchSelect.value === '') {
                showToast('⚠️ Please select a match before confirming your booking!');
                if (matchSelect) matchSelect.focus();
                return;
            }

            const selectedMatchText = matchSelect.options[matchSelect.selectedIndex].text;
            const selectedStand = standCategory ? standCategory.value : 'General';
            const qty = ticketQuantity ? (parseInt(ticketQuantity.value, 10) || 1) : 1;
            const unitPrice = standPrices[selectedStand] || 0;
            const totalPrice = unitPrice * qty;

            // Generate unique Booking ID (Format: IPL-2026-XXXX)
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            const bookingId = `IPL-2026-${randomCode}`;

            // Create new booking record
            const newBooking = {
                id: bookingId,
                match: selectedMatchText,
                stand: selectedStand,
                quantity: qty,
                unitPrice: unitPrice,
                totalPrice: totalPrice,
                customerName: userName ? userName.value.trim() : '',
                customerEmail: userEmail ? userEmail.value.trim() : '',
                customerPhone: userPhone ? userPhone.value.trim() : '',
                status: 'Confirmed',
                bookedAt: new Date().toLocaleString('en-IN')
            };

            // Save to localStorage
            const bookings = getStoredBookings();
            bookings.unshift(newBooking); // Add latest booking to top of list
            saveBookings(bookings);

            // Dynamically refresh the My Bookings table
            renderBookingsTable();

            // Notify user with success toast
            showToast(`🎉 Booking Confirmed! ID: ${bookingId} (₹${totalPrice.toLocaleString('en-IN')})`);

            // Reset form fields
            bookingForm.reset();

            // Reset summary card back to default
            updateBookingSummary(false);

            // Smooth scroll down to 'My Bookings' to display the confirmed reservation
            if (myBookingsSection) {
                setTimeout(() => {
                    myBookingsSection.scrollIntoView({ behavior: 'smooth' });
                }, 400);
            }
        });
    }

    // =========================================================================
    // 7. Initial Page Load Execution
    // =========================================================================
    // Initialize Summary Card with default state (shows ₹0 before match selection)
    updateBookingSummary(false);

    // Initialize My Bookings table with persistent localStorage records
    renderBookingsTable();
});
