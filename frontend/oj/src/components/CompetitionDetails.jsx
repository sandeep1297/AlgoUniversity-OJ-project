import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

function CompetitionDetails({ user }) {
  const { id: competitionId } = useParams();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompetition = async () => {
      setLoading(true);
      setError('');
      try {
        // This route is public, but include token for consistency if user is logged in
        const config = user && user.token ? {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        } : {};
        const { data } = await axios.get(`http://localhost:5000/api/competitions/${competitionId}`, config);
        setCompetition(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load competition details.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetition();
  }, [competitionId, user]);

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div>Loading competition details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!competition) {
    return <div>Competition not found.</div>;
  }

  const now = new Date();
  const startTime = new Date(competition.startTime);
  const endTime = new Date(competition.endTime);
  let status = '';
  if (now < startTime) {
    status = 'Upcoming';
  } else if (now >= startTime && now <= endTime) {
    status = 'Live';
  } else {
    status = 'Finished';
  }

  return (
    <div className="competition-details-container">
      <h2>{competition.name}</h2>
      <p className={`competition-status-badge ${status.toLowerCase()}`}>
        Status: {status}
      </p>
      <p><strong>Description:</strong> {competition.description}</p>
      <p><strong>Starts:</strong> {formatDateTime(competition.startTime)}</p>
      <p><strong>Ends:</strong> {formatDateTime(competition.endTime)}</p>
      <p><strong>Organizer:</strong> {competition.organizer ? competition.organizer.fullName : 'N/A'}</p>

      <div className="competition-problems-section">
        <h3>Problems in this Competition:</h3>
        {competition.problems && competition.problems.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Difficulty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {competition.problems.map((problem) => (
                <tr key={problem._id}>
                  <td>{problem.name}</td>
                  <td>{problem.difficulty}</td>
                  <td>
                    {/* Link to ProblemDetails page, potentially with competition context */}
                    <Link to={`/problems/${problem._id}`} className="view-button-small">Solve Problem</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No problems have been added to this competition yet.</p>
        )}
      </div>
    </div>
  );
}

export default CompetitionDetails;