import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SplashPage from './Pages/Splash/Splash';
import JoinSession from './Pages/JoinSession/JoinSession';
import SuggestSongs from './Pages/SuggestSongs/SuggestSongs';
import './App.css';
import { ErrorProvider } from './Contexts/ErrorContext';

function App() {
  return (
    <ErrorProvider>
      <BrowserRouter>
        {/* Anything placed here, like a Navbar, will show on ALL pages */}
        
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/join-session" element={<JoinSession />} />
          <Route path="/suggest-songs" element={<SuggestSongs />} />
        </Routes>
        
      </BrowserRouter>
    </ErrorProvider>
  );
}

export default App;