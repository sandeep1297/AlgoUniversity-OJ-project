import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function ProblemForm({ user, onProblemSaved }) {
  const { id } = useParams(); // Get problem ID from URL if in edit mode
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    statement: '',
    difficulty: 'Easy',
    exampleInput: '',
    exampleOutput: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isEditMode = !!id; // True if ID exists in URL

  useEffect(() => {
    // If in edit mode, fetch problem data
    if (isEditMode) {
      const fetchProblem = async () => {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          };
          const { data } = await axios.get(`http://localhost:5000/api/problems/${id}`, config);
          setFormData({
            name: data.name,
            statement: data.statement,
            difficulty: data.difficulty,
            exampleInput: data.exampleInput || '', // Ensure it's an empty string if null
            exampleOutput: data.exampleOutput || '', // Ensure it's an empty string if null
          });
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch problem for editing.');
          navigate('/admin/problems'); // Redirect if problem not found
        }
      };
      fetchProblem();
    }
  }, [id, isEditMode, user.token, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      if (isEditMode) {
        // Update existing problem
        const { data } = await axios.put(`http://localhost:5000/api/problems/${id}`, formData, config);
        setMessage(data.message);
      } else {
        // Add new problem
        const { data } = await axios.post('http://localhost:5000/api/problems', formData, config);
        setMessage(data.message);
        setFormData({ // Clear form after successful creation
          name: '',
          statement: '',
          difficulty: 'Easy',
          exampleInput: '',
          exampleOutput: '',
        });
      }
      if (onProblemSaved) {
        onProblemSaved(); // Notify parent component (AdminProblemList) to refresh
      }
      navigate('/admin/problems'); // Redirect to problem list after save
    } catch (err) {
      setError(err.response?.data?.message || (isEditMode ? 'Failed to update problem.' : 'Failed to add problem.'));
    }
  };

  return (
    <div>
      <h2>{isEditMode ? 'Edit Problem' : 'Add New Problem'}</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Problem Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="statement">Problem Statement:</label>
          <textarea
            id="statement"
            name="statement"
            value={formData.statement}
            onChange={handleChange}
            rows="10"
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="difficulty">Difficulty:</label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            required
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div>
          <label htmlFor="exampleInput">Example Input:</label>
          <textarea
            id="exampleInput"
            name="exampleInput"
            value={formData.exampleInput}
            onChange={handleChange}
            rows="5"
            placeholder="e.g., [2, 7, 11, 15], 9"
          ></textarea>
        </div>
        <div>
          <label htmlFor="exampleOutput">Example Output:</label>
          <textarea
            id="exampleOutput"
            name="exampleOutput"
            value={formData.exampleOutput}
            onChange={handleChange}
            rows="5"
            placeholder="e.g., [0, 1]"
          ></textarea>
        </div>
        <button type="submit">{isEditMode ? 'Update Problem' : 'Add Problem'}</button>
        <button type="button" onClick={() => navigate('/admin/problems')} className="cancel-button">Cancel</button>
      </form>
    </div>
  );
}

export default ProblemForm;