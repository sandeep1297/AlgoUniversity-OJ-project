import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function AdminUserList({ user }) {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingUserId, setEditingUserId] = useState(null); // State to manage which user's role is being edited
  const [newRole, setNewRole] = useState(''); // State for the new role selection

  const fetchUsers = useCallback(async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get('http://localhost:5000/api/users/admin/all', config);
      setUsers(data);
      setMessage('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users.');
      setUsers([]);
    }
  }, [user.token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId) => {
    if (!newRole) {
      alert('Please select a role.');
      return;
    }
    setMessage('');
    setError('');
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(`http://localhost:5000/api/users/admin/update-role/${userId}`, { role: newRole }, config);
      setMessage(data.message);
      setEditingUserId(null); // Exit editing mode
      setNewRole(''); // Clear role selection
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this account?`)) {
      setMessage('');
      setError('');
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.put(`http://localhost:5000/api/users/admin/toggle-active/${userId}`, {}, config);
        setMessage(data.message);
        fetchUsers(); // Refresh the user list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to toggle account status.');
      }
    }
  };

  return (
    <div>
      <h2>Manage Users</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="users-table"> {/* Use a distinct class for user table */}
          <thead>
            <tr>
              <th>User ID</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.userId}</td>
                <td>{u.email}</td>
                <td>
                  {editingUserId === u._id ? (
                    <select
                      value={newRole || u.role}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    u.role.charAt(0).toUpperCase() + u.role.slice(1)
                  )}
                </td>
                <td className={u.isActive ? 'active-status' : 'deactivated-status'}>
                    {u.isActive ? 'Active' : 'Deactivated'}
                </td>
                <td className="user-actions-cell">
                  {editingUserId === u._id ? (
                    <>
                      <button onClick={() => handleRoleChange(u._id)} className="save-button-small">Save</button>
                      <button onClick={() => { setEditingUserId(null); setNewRole(''); }} className="cancel-button-small">Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingUserId(u._id); setNewRole(u.role); }} className="edit-button-small">Change Role</button>
                  )}
                  <button
                    onClick={() => handleToggleActive(u._id, u.isActive)}
                    className={u.isActive ? 'deactivate-button-small' : 'activate-button-small'}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  {/* Optional: Add delete user button, similar to problem delete */}
                  {/* <button onClick={() => handleDelete(u._id)} className="delete-button-small">Delete</button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminUserList;