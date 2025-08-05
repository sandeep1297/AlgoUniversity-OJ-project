import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function CompetitionForm({ user }) {
  const { id: competitionId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
    problems: [],
  });
  const [allProblems, setAllProblems] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isEditMode = !!competitionId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const problemsRes = await axios.get('http://localhost:5000/api/problems', config);
        setAllProblems(problemsRes.data);

        if (isEditMode) {
          const { data } = await axios.get(`http://localhost:5000/api/competitions/${competitionId}`, config);
          setFormData({
            name: data.name,
            description: data.description,
            startTime: data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : '',
            endTime: data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : '',
            problems: data.problems.map(p => p._id),
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data for form.');
        if (isEditMode) {
            navigate('/admin/competitions');
        }
      }
    };
    fetchData();
  }, [competitionId, isEditMode, user.token, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProblemSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData({ ...formData, problems: selectedOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
    };

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      if (isEditMode) {
        const { data } = await axios.put(`http://localhost:5000/api/competitions/${competitionId}`, payload, config);
        setMessage(data.message);
      } else {
        const { data } = await axios.post('http://localhost:5000/api/competitions', payload, config);
        setMessage(data.message);
        setFormData({
          name: '',
          description: '',
          startTime: '',
          endTime: '',
          problems: [],
        });
      }
      navigate('/admin/competitions');
    } catch (err) {
      setError(err.response?.data?.message || (isEditMode ? 'Failed to update competition.' : 'Failed to add competition.'));
    }
  };

  return (
    <div className="admin-form-container"> {/* <-- ADDED WRAPPER */}
      <h2>{isEditMode ? 'Edit Competition' : 'Add New Competition'}</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
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
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="startTime">Start Time:</label>
          <input
            type="datetime-local"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="endTime">End Time:</label>
          <input
            type="datetime-local"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="problems">Select Problems (hold Ctrl/Cmd to select multiple):</label>
          <select
            id="problems"
            name="problems"
            multiple
            value={formData.problems}
            onChange={handleProblemSelection}
            size={Math.min(allProblems.length, 10)}
          >
            {allProblems.length === 0 ? (
                <option value="" disabled>No problems available. Add problems first!</option>
            ) : (
                allProblems.map((problem) => (
                    <option key={problem._id} value={problem._id}>
                        {problem.name} ({problem.difficulty})
                    </option>
                ))
            )}
          </select>
        </div>
        <div className="button-group"> {/* <-- ADDED WRAPPER */}
          <button type="submit">{isEditMode ? 'Update Competition' : 'Create Competition'}</button>
          <button type="button" onClick={() => navigate('/admin/competitions')} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default CompetitionForm;