import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function AdminProblemList({ user }) {
  const [problems, setProblems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get('http://localhost:5000/api/problems', config);
      setProblems(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch problems.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this problem? This will also delete all associated test cases and submissions.')) {
      setDeleteSuccess('');
      setDeleteError('');
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        await axios.delete(`http://localhost:5000/api/problems/${id}`, config);
        setDeleteSuccess('Problem deleted successfully!');
        fetchProblems(); // Refresh the list
      } catch (err) {
        setDeleteError(err.response?.data?.message || 'Failed to delete problem.');
      }
    }
  };

  return (
    <div className="admin-list-container">
      <h2>Manage Problems</h2>
      <Link to="/admin/problems/add" className="add-button">Add New Problem</Link>

      {loading && <p>Loading problems...</p>}
      {error && <p className="error-message">{error}</p>}
      {deleteSuccess && <p className="success-message">{deleteSuccess}</p>}
      {deleteError && <p className="error-message">{deleteError}</p>}

      {!loading && problems.length === 0 && !error ? (
        <p>No problems found. Add a new problem to get started.</p>
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
                  <td className="actions-column">
                    <Link to={`/admin/problems/edit/${problem._id}`} className="edit-button-small">Edit</Link>
                    <button onClick={() => handleDelete(problem._id)} className="delete-button-small">Delete</button>
                    {/* THIS IS THE MISSING LINK/BUTTON */}
                    <Link to={`/admin/problems/${problem._id}/testcases`} className="manage-button-small">Manage Test Cases</Link>
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

export default AdminProblemList;