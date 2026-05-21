import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashPage from "./Pages/Splash/Splash";
import JoinSession from "./Pages/JoinSession/JoinSession";
import SuggestSongs from "./Pages/SuggestSongs/SuggestSongs";
import "./App.css";
import { ErrorProvider } from "./Contexts/ErrorContext";
import { SessionProvider } from "./Contexts/SessionContext";
import HostSession from "./Pages/HostSession/HostSession";

function App() {
  return (
    <ErrorProvider>
      <SessionProvider>
        <BrowserRouter>
          {/* Anything placed here, like a Navbar, will show on ALL pages */}

          <Routes>
            <Route path="/" element={<SplashPage />} />
            <Route path="/join-session" element={<JoinSession />} />
            <Route path="/suggest-songs" element={<SuggestSongs />} />
            <Route path="/host-session" element={<HostSession />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </ErrorProvider>
  );
}

export default App;
