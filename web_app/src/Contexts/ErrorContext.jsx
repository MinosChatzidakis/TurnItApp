import { createContext, useContext, useState } from "react";

// 1. Create the context
const ErrorContext = createContext();

// 2. Create the Provider Component
export function ErrorProvider({ children }) {
  const [error, setError] = useState(null);

  // Function to clear the error
  const clearError = () => setError(null);

  return (
    <ErrorContext.Provider value={{ error, setError, clearError }}>
      {/* This renders your app's actual pages */}
      {children}

      {/* This is the GLOBAL POPUP that sits on top of everything */}
      {error && (
        <div style={popupStyles}>
          <p>{error}</p>
          <button onClick={clearError} style={closeButtonStyles}>
            X
          </button>
        </div>
      )}
    </ErrorContext.Provider>
  );
}

// 3. Create a custom hook to make it super easy to use anywhere
export const useError = () => useContext(ErrorContext);

// --- Simple styles for demonstration ---
const popupStyles = {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  backgroundColor: "#ff4d4d",
  color: "white",
  padding: "15px 25px",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  display: "flex",
  gap: "15px",
  alignItems: "center",
  zIndex: 9999, // Ensures it is always on top!
};

const closeButtonStyles = {
  background: "transparent",
  border: "none",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};
