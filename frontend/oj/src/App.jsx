import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ProfilePage from './components/ProfilePage';
import AdminDashboard from './components/AdminDashboard';
import AdminProblemList from './components/AdminProblemList';
import ProblemForm from './components/ProblemForm';
import AdminUserList from './components/AdminUserList';
import AdminTestCaseList from './components/AdminTestCaseList';
import TestCaseForm from './components/TestCaseForm';
import AdminCompetitionList from './components/AdminCompetitionList';
import CompetitionForm from './components/CompetitionForm';
import ProblemList from './components/ProblemList';
import CompetitionList from './components/CompetitionList';
import ProblemDetails from './components/ProblemDetails';
import CompetitionDetails from './components/CompetitionDetails'; // <-- NEW Import
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    alert('Logged out successfully!');
  };

  const isAuthenticated = !!user && !!user.token && user.isActive;
  const isAdmin = isAuthenticated && user.role === 'admin';

  return (
    <Router>
      <div className="app-container">
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/problems">Problems</Link></li>
            <li><Link to="/competitions">Competitions</Link></li>
            {!isAuthenticated ? (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/profile">Profile</Link></li>
                {isAdmin && <li><Link to="/admin-dashboard">Admin Dashboard</Link></li>}
                <li><button onClick={handleLogout}>Logout</button></li>
              </>
            )}
          </ul>
        </nav>
        <hr />
        <Routes>
          <Route path="/" element={<h2 className="welcome-message">Welcome to Online Judge System</h2>} />
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/profile" />}
          />
          <Route
            path="/register"
            element={!isAuthenticated ? <RegisterPage onAuthSuccess={handleAuthSuccess} /> : <Navigate to="/profile" />}
          />
          <Route
            path="/profile"
            element={isAuthenticated ? <ProfilePage user={user} onLogout={handleLogout} onUpdateUser={handleAuthSuccess} /> : <Navigate to="/login" />}
          />

          {/* Public Problem and Competition List Routes */}
          <Route
            path="/problems"
            element={<ProblemList user={user} />}
          />
          <Route
            path="/problems/:id"
            element={<ProblemDetails user={user} />}
          />
          <Route
            path="/competitions"
            element={<CompetitionList user={user} />}
          />
          <Route
            path="/competitions/:id" // <-- NEW Route for Competition Details
            element={<CompetitionDetails user={user} />}
          />

          {/* Admin Routes */}
          {isAdmin ? (
            <>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route
                path="/admin/problems"
                element={<AdminProblemList user={user} />}
              />
              <Route
                path="/admin/problems/add"
                element={<ProblemForm user={user} />}
              />
              <Route
                path="/admin/problems/edit/:id"
                element={<ProblemForm user={user} />}
              />
              <Route
                path="/admin/users"
                element={<AdminUserList user={user} />}
              />
              <Route
                path="/admin/problems/:problemId/testcases"
                element={<AdminTestCaseList user={user} />}
              />
              <Route
                path="/admin/problems/:problemId/testcases/add"
                element={<TestCaseForm user={user} />}
              />
              <Route
                path="/admin/testcases/edit/:id"
                element={<TestCaseForm user={user} />}
              />
              <Route
                path="/admin/competitions"
                element={<AdminCompetitionList user={user} />}
              />
              <Route
                path="/admin/competitions/add"
                element={<CompetitionForm user={user} />}
              />
              <Route
                path="/admin/competitions/edit/:id"
                element={<CompetitionForm user={user} />}
              />
            </>
          ) : (
            // Redirect unauthorized users trying to access admin routes
            <Route path="/admin-dashboard/*" element={<Navigate to="/login" />} />
          )}

          <Route path="*" element={<h2>404 - Page Not Found</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;