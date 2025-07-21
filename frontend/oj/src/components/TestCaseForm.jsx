import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function TestCaseForm({ user }) {
  // Check if we are adding for a specific problem or editing an existing test case
  const { problemId, id: testCaseId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    input: '',
    output: '',
  });
  const [problemName, setProblemName] = useState(''); // To display which problem it's for
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isEditMode = !!testCaseId; // True if testCaseId exists in URL

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        if (isEditMode) {
          // Fetch existing test case data for editing
          const { data } = await axios.get(`http://localhost:5000/api/testcases/${testCaseId}`, config);
          setFormData({
            input: data.input,
            output: data.output,
          });
          // Also fetch problem name associated with this test case for display
          const problemRes = await axios.get(`http://localhost:5000/api/problems/${data.problem}`, config);
          setProblemName(problemRes.data.name);
        } else if (problemId) {
          // If adding, fetch problem name to display
          const problemRes = await axios.get(`http://localhost:5000/api/problems/${problemId}`, config);
          setProblemName(problemRes.data.name);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data for form.');
        // If error in edit mode, redirect to problem list or test case list
        if (isEditMode) {
            navigate('/admin/problems'); // or navigate(`/admin/problems/${problemId}/testcases`)
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
        // Update existing test case
        const { data } = await axios.put(`http://localhost:5000/api/testcases/${testCaseId}`, formData, config);
        setMessage(data.message);
        // After successful edit, redirect back to the test cases list for that problem
        // Need to get problem ID from the test case object
        const updatedTestCaseProblemId = data.testCase.problem;
        navigate(`/admin/problems/${updatedTestCaseProblemId}/testcases`);
      } else {
        // Add new test case
        const payload = { ...formData, problemId: problemId };
        const { data } = await axios.post('http://localhost:5000/api/testcases', payload, config);
        setMessage(data.message);
        setFormData({ input: '', output: '' }); // Clear form
        // After successful add, redirect back to the test cases list for that problem
        navigate(`/admin/problems/${problemId}/testcases`);
      }
    } catch (err) {
      setError(err.response?.data?.message || (isEditMode ? 'Failed to update test case.' : 'Failed to add test case.'));
    }
  };

  // Determine the correct "Back" button path
  const backPath = isEditMode ? `/admin/problems/${problemName ? problemId : ''}/testcases` : `/admin/problems/${problemId}/testcases`;


  return (
    <div>
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
        <button type="submit">{isEditMode ? 'Update Test Case' : 'Add Test Case'}</button>
        <button type="button" onClick={() => navigate(backPath)} className="cancel-button">Cancel</button>
      </form>
    </div>
  );
}

export default TestCaseForm;