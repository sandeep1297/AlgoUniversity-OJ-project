import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ProfilePage({ user, onLogout, onUpdateUser }) { // Receive user object and onUpdateUser
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`, // Use token from the user object
          },
        };
        const { data } = await axios.get('http://localhost:5000/api/users/profile', config);
        setUserProfile(data);
        setFormData({
          userId: data.userId,
          fullName: data.fullName,
          email: data.email,
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
        });
        setMessage('');
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch profile. Please login again.');
        onLogout();
        navigate('/login');
      }
    };

    if (user && user.token) { // Check if user and token exist
      fetchProfile();
    }
  }, [user, onLogout, navigate]); // Depend on the user object

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`, // Use token from user object
        },
      };
      const { data } = await axios.put('http://localhost:5000/api/users/profile', formData, config);
      setUserProfile(data); // Update local profile state
      onUpdateUser({ ...user, ...data, token: user.token }); // Update user in App.jsx (keep original token)
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setMessage('');
      setError('');
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`, // Use token from user object
          },
        };
        await axios.delete(`http://localhost:5000/api/users/${userProfile._id}`, config);
        setMessage('Account deleted successfully!');
        onLogout();
        navigate('/register');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete account.');
      }
    }
  };

  if (!userProfile) {
    return <div>{error || 'Loading profile...'}</div>;
  }

  return (
    <div>
      <h2>User Profile</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {!isEditing ? (
        <div className="profile-details">
          <p><strong>User ID:</strong> {userProfile.userId}</p>
          <p><strong>Full Name:</strong> {userProfile.fullName}</p>
          <p><strong>Email:</strong> {userProfile.email}</p>
          <p><strong>Date of Birth:</strong> {new Date(userProfile.dob).toLocaleDateString()}</p>
          <p><strong>Role:</strong> {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}</p> {/* Display Role */}
          <div className="profile-actions">
            <button onClick={() => setIsEditing(true)} className="edit-button">Edit Profile</button>
            <button onClick={handleDelete} className="delete-button">Delete Account</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate}>
          <div>
            <label>User ID:</label>
            <input type="text" name="userId" value={formData.userId} onChange={handleChange} required />
          </div>
          <div>
            <label>Full Name:</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
          </div>
          <div>
            <label>Email:</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div>
            <label>Date of Birth:</label>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
          </div>
          <div>
            <label>New Password (optional):</label>
            <input type="password" name="password" value={formData.password || ''} onChange={handleChange} placeholder="Leave blank to keep current" />
          </div>
          <button type="submit">Save Changes</button>
          <button type="button" onClick={() => setIsEditing(false)} className="cancel-button">Cancel</button>
        </form>
      )}
    </div>
  );
}

export default ProfilePage;