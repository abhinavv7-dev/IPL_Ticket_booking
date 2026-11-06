// Execute code once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Toast Container Setup ---
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // --- 2. Reusable showToast() Function ---
    window.showToast = function(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Automatically remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    };

    // --- 3. Smooth Scroll & Auto Select Match ---
    const bookButtons = document.querySelectorAll('table td button');
    const matchSelect = document.getElementById('match-select');
    const bookingSection = document.getElementById('book-ticket');

    bookButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Smooth scroll down to the booking form
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
            }

            // Identify match details from the row
            const row = button.closest('tr');
            if (row) {
                const matchTeams = row.cells[1].textContent.trim();
                showToast(`Selected Match: ${matchTeams}`);

                // Auto-select match in dropdown if element exists
                if (matchSelect) {
                    for (let option of matchSelect.options) {
                        if (option.text.includes(matchTeams)) {
                            matchSelect.value = option.value;
                            break;
                        }
                    }
                }
            }
        });
    });
});