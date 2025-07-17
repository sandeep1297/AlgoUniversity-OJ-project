import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProfilePage from './components/ProfilePage';
import './App.css'; // Import the CSS file

function App() {
  const [token, setToken] = useState(localStorage.getItem('userToken'));

  const handleAuthSuccess = (newToken) => {
    setToken(newToken);
    localStorage.setItem('userToken', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('userToken');
    alert('Logged out successfully!'); // Consider using a better notification system
  };

  return (
    <Router>
      <div className="app-container"> {/* Apply the main container class */}
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            {!token ? (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/profile">Profile</Link></li>
                <li><button onClick={handleLogout}>Logout</button></li> {/* Simplified button style */}
              </>
            )}
          </ul>
        </nav>
        <hr />
        <Routes>
          <Route path="/" element={<h2 className="welcome-message">Welcome to Online Judge System</h2>} />
          <Route path="/login" element={!token ? <LoginPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/profile" />} />
          <Route path="/register" element={!token ? <RegisterPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/profile" />} />
          <Route path="/profile" element={token ? <ProfilePage token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="*" element={<h2>404 - Page Not Found</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;