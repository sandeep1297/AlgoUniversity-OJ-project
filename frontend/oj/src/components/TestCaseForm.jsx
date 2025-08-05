import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function TestCaseForm({ user }) {
  const { problemId, id: testCaseId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    input: '',
    output: '',
  });
  const [problemName, setProblemName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isEditMode = !!testCaseId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        if (isEditMode) {
          const { data } = await axios.get(`http://localhost:5000/api/testcases/${testCaseId}`, config);
          setFormData({
            input: data.input,
            output: data.output,
          });
          const problemRes = await axios.get(`http://localhost:5000/api/problems/${data.problem}`, config);
          setProblemName(problemRes.data.name);
        } else if (problemId) {
          const problemRes = await axios.get(`http://localhost:5000/api/problems/${problemId}`, config);
          setProblemName(problemRes.data.name);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data for form.');
        if (isEditMode) {
            navigate('/admin/problems');
        }
      }
    };
    fetchData();
  }, [problemId, testCaseId, isEditMode, user.token, navigate]);

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
        const { data } = await axios.put(`http://localhost:5000/api/testcases/${testCaseId}`, formData, config);
        setMessage(data.message);
        const updatedTestCaseProblemId = data.testCase.problem;
        navigate(`/admin/problems/${updatedTestCaseProblemId}/testcases`);
      } else {
        const payload = { ...formData, problemId: problemId };
        const { data } = await axios.post('http://localhost:5000/api/testcases', payload, config);
        setMessage(data.message);
        setFormData({ input: '', output: '' });
        navigate(`/admin/problems/${problemId}/testcases`);
      }
    } catch (err) {
      setError(err.response?.data?.message || (isEditMode ? 'Failed to update test case.' : 'Failed to add test case.'));
    }
  };
  
  const backPath = isEditMode ? `/admin/problems/${problemId}/testcases` : `/admin/problems/${problemId}/testcases`;

  return (
    <div className="admin-form-container"> {/* <-- ADDED WRAPPER */}
      <h2>{isEditMode ? 'Edit Test Case' : `Add Test Case for "${problemName || 'Loading...'}"`}</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="input">Input:</label>
          <textarea
            id="input"
            name="input"
            value={formData.input}
            onChange={handleChange}
            rows="8"
            required
            placeholder="Enter input data for the test case"
          ></textarea>
        </div>
        <div>
          <label htmlFor="output">Expected Output:</label>
          <textarea
            id="output"
            name="output"
            value={formData.output}
            onChange={handleChange}
            rows="8"
            required
            placeholder="Enter the expected output for the given input"
          ></textarea>
        </div>
        <div className="button-group"> {/* <-- ADDED WRAPPER */}
          <button type="submit">{isEditMode ? 'Update Test Case' : 'Add Test Case'}</button>
          <button type="button" onClick={() => navigate(backPath)} className="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default TestCaseForm;