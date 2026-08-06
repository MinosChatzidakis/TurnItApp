import { useState, useEffect } from "react";
import "./EmailPopup.css";

export default function EmailPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Triggers every single time the page loads, no exceptions
  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const closePopup = () => {
    // Only closes it for the current session.
    // The moment they refresh, it's coming back!
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("Submitting...");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStatusMessage("Thank you for subscribing!");
        // We will still close it if they actually subscribe, to be nice.
        setTimeout(() => closePopup(), 1500);
      } else {
        setStatusMessage(data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Failed to connect to the server.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Stay Updated!</h2>
        <p>Enter your email to get the latest updates.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="email-input"
          />
          <button type="submit" className="submit-btn">
            Subscribe
          </button>
        </form>

        {statusMessage && <p className="status-message">{statusMessage}</p>}

        <button onClick={closePopup} className="close-btn">
          No thanks, close
        </button>
      </div>
    </div>
  );
}
