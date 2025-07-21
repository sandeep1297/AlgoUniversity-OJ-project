import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link

function CompetitionList({ user }) {
  const [competitions, setCompetitions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const config = user && user.token ? {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      } : {};

      const { data } = await axios.get('http://localhost:5000/api/competitions', config);
      setCompetitions(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch competitions. Please try again later.');
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div>
      <h2>Upcoming Competitions</h2>
      {loading && <p>Loading competitions...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && competitions.length === 0 && !error ? (
        <p>No competitions are scheduled at the moment. Please check back later!</p>
      ) : (
        !loading && competitions.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Organizer</th>
                <th>Status</th>
                <th>Actions</th> {/* <-- Added Actions column */}
              </tr>
            </thead>
            <tbody>
              {competitions.map((comp) => {
                const now = new Date();
                const startTime = new Date(comp.startTime);
                const endTime = new Date(comp.endTime);
                let status = '';
                if (now < startTime) {
                  status = 'Upcoming';
                } else if (now >= startTime && now <= endTime) {
                  status = 'Live';
                } else {
                  status = 'Finished';
                }

                return (
                  <tr key={comp._id}>
                    <td>{comp.name}</td>
                    <td>{comp.description}</td>
                    <td>{formatDateTime(comp.startTime)}</td>
                    <td>{formatDateTime(comp.endTime)}</td>
                    <td>{comp.organizer ? comp.organizer.fullName : 'N/A'}</td>
                    <td>
                        <span className={`competition-status ${status.toLowerCase()}`}>
                            {status}
                        </span>
                    </td>
                    <td>
                      <Link to={`/competitions/${comp._id}`} className="view-button-small">View Details</Link> {/* <-- UPDATED LINK */}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

export default CompetitionList;