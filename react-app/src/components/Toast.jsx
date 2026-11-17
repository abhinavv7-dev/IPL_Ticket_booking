/**
 * Toast Component
 * Displays transient notifications triggered by state changes.
 */
export default function Toast({ message, isVisible }) {
  if (!isVisible) return null;

  return (
    <div id="toast-container">
      <div className="toast show">
        {message}
      </div>
    </div>
  );
}

