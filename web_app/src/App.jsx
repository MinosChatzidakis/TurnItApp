import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashPage from "./Pages/Splash/Splash";
import JoinSession from "./Pages/JoinSession/JoinSession";
import SuggestSongs from "./Pages/SuggestSongs/SuggestSongs";
import "./App.css";
import { ErrorProvider } from "./Contexts/ErrorContext";
import { SessionProvider } from "./Contexts/SessionContext";
import HostSession from "./Pages/HostSession/HostSession";
import HostDashboard from "./Pages/HostDashboard/HostDashboard";
import EmailPopup from "./Components/EmailPopUp/EmiailPopUp";

function App() {
  const [isServerDown, setIsServerDown] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Blocks screen only on first load
  const [isRetrying, setIsRetrying] = useState(false); // Used for the retry button

  const checkServerStatus = async (isManualRetry = false) => {
    if (isManualRetry) setIsRetrying(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      // Only update state if it actually changed, to prevent unnecessary re-renders
      setIsServerDown((prev) => (prev === true ? false : prev));
    } catch (err) {
      // THIS IS THE SMOKING GUN: Look in your browser console to see this error!
      console.error(
        "⚠️ Health check failed at",
        new Date().toLocaleTimeString(),
        ":",
        err.message,
      );

      // If it fails, we set the server down.
      setIsServerDown(true);
    } finally {
      setIsInitialLoad(false);
      if (isManualRetry) setIsRetrying(false);
    }
  };

  useEffect(() => {
    checkServerStatus(); // Check immediately on load
    const interval = setInterval(() => checkServerStatus(false), 30000); // Check silently every 30s
    return () => clearInterval(interval);
  }, []);

  // 1. Only show this on the very first load
  if (isInitialLoad) {
    return <div style={styles.fullScreen}>Connecting to server...</div>;
  }
  return (
    <ErrorProvider>
      <SessionProvider>
        <BrowserRouter>
          {/* 2. THE HARD BLOCK: If server goes down, trap them here */}
          {isServerDown ? (
            <div style={styles.fullScreen}>
              <h1
                style={{
                  color: "#ff4d4d",
                  fontSize: "2rem",
                  marginBottom: "10px",
                }}
              >
                Server Offline
              </h1>
              <p
                style={{
                  color: "#b3b3b3",
                  fontSize: "1.2rem",
                  marginBottom: "30px",
                }}
              >
                We cannot connect to the server. Please wait a moment and try
                again.
              </p>
              <button
                onClick={() => checkServerStatus(true)} // Trigger a manual retry
                style={styles.retryButton}
                disabled={isRetrying}
              >
                {isRetrying ? "Checking..." : "Retry Connection"}
              </button>
            </div>
          ) : (
            /* 3. If server is UP, render the actual app */
            <Routes>
              <Route path="/" element={<SplashPage />} />
              <Route
                path="/join-session/:sessionCode?"
                element={<JoinSession />}
              />
              <Route
                path="/suggest-songs/:sessionCode?"
                element={<SuggestSongs />}
              />
              <Route path="/host-session" element={<HostSession />} />
              <Route
                path="/host-dashboard/:sessionCode?"
                element={<HostDashboard />}
              />
              <EmailPopup />
            </Routes>
          )}
        </BrowserRouter>
      </SessionProvider>
    </ErrorProvider>
  );
}

const styles = {
  fullScreen: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    color: "white",
    textAlign: "center",
    padding: "20px",
    boxSizing: "border-box",
  },
  retryButton: {
    padding: "12px 24px",
    fontSize: "1rem",
    fontWeight: "bold",
    backgroundColor: "#1db954",
    color: "white",
    border: "none",
    borderRadius: "30px",
    cursor: "pointer",
  },
};

export default App;
