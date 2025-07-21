import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function AdminCompetitionList({ user }) {
  const [competitions, setCompetitions] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchCompetitions = useCallback(async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get('http://localhost:5000/api/competitions', config);
      setCompetitions(data);
      setMessage('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch competitions.');
      setCompetitions([]);
    }
  }, [user.token]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const handleDelete = async (competitionId) => {
    if (window.confirm('Are you sure you want to delete this competition?')) {
      setMessage('');
      setError('');
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.delete(`http://localhost:5000/api/competitions/${competitionId}`, config);
        setMessage(data.message);
        fetchCompetitions(); // Refresh the list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete competition.');
      }
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString(); // Format to local date and time
  };

  return (
    <div>
      <h2>Manage Competitions</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <div className="list-actions">
        <Link to="/admin/competitions/add" className="add-button">Add New Competition</Link>
      </div>

      {competitions.length === 0 ? (
        <p>No competitions found. Add a new competition!</p>
      ) : (
        <table className="data-table"> {/* Re-using generic data-table class */}
          <thead>
            <tr>
              <th>Name</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Problems</th>
              <th>Organizer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {competitions.map((comp) => (
              <tr key={comp._id}>
                <td>{comp.name}</td>
                <td>{formatDateTime(comp.startTime)}</td>
                <td>{formatDateTime(comp.endTime)}</td>
                <td>
                  {comp.problems && comp.problems.length > 0 ? (
                    <ul>
                      {comp.problems.map(p => (
                        <li key={p._id}>{p.name} ({p.difficulty})</li>
                      ))}
                    </ul>
                  ) : (
                    'No problems'
                  )}
                </td>
                <td>{comp.organizer ? comp.organizer.fullName : 'N/A'}</td>
                <td className="actions-cell">
                  <Link to={`/admin/competitions/edit/${comp._id}`} className="edit-button-small">Edit</Link>
                  <button onClick={() => handleDelete(comp._id)} className="delete-button-small">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminCompetitionList;