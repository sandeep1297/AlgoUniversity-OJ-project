import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link

function ProblemList({ user }) {
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const config = user && user.token ? {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      } : {};

      const { data } = await axios.get('http://localhost:5000/api/problems', config);
      setProblems(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch problems. Please try again later.');
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  return (
    <div>
      <h2>Available Problems</h2>
      {loading && <p>Loading problems...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && problems.length === 0 && !error ? (
        <p>No problems are available at the moment. Please check back later!</p>
      ) : (
        !loading && problems.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Difficulty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr key={problem._id}>
                  <td>{problem.name}</td>
                  <td>{problem.difficulty}</td>
                  <td>
                    <Link to={`/problems/${problem._id}`} className="view-button-small">Solve Problem</Link> {/* <-- UPDATED LINK */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

export default ProblemList;