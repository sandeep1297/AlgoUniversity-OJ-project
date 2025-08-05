import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function LoginPage({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handle regular email/password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    try {
      const { data } = await axios.post('http://localhost:5000/api/users/login', { email, password });
      onAuthSuccess(data); 
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };
  
  // Handle successful Google login
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setError('');
    try {
      const decodedToken = jwtDecode(credentialResponse.credential);
      console.log('Google login successful:', decodedToken);
      
      // Send the token to your backend for verification
      const backendRes = await axios.post('http://localhost:5000/api/auth/google', {
        token: credentialResponse.credential,
      });

      // The backend should return the user and a new JWT
      onAuthSuccess(backendRes.data);
      navigate('/profile');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed on the server.');
      console.error('Google login error:', err);
    }
  };

  // Handle Google login errors
  const handleGoogleLoginError = () => {
    console.log('Google Login Failed');
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input 
            type="email" 
            id="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input 
            type="password" 
            id="password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className="login-button">Login</button>
      </form>
      
      <div className="google-login-separator">
        <hr />
        <span>OR</span>
        <hr />
      </div>

      <div className="google-login-button-container">
        <GoogleLogin
          onSuccess={handleGoogleLoginSuccess}
          onError={handleGoogleLoginError}
        />
      </div>
    </div>
  );
}

export default LoginPage;