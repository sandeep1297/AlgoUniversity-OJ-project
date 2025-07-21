import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';

function AdminTestCaseList({ user }) {
  const { problemId } = useParams(); // Get problem ID from URL
  const navigate = useNavigate();
  const [problemName, setProblemName] = useState(''); // To display problem name
  const [testCases, setTestCases] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchProblemAndTestCases = useCallback(async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      // Fetch problem details to get its name
      const problemRes = await axios.get(`http://localhost:5000/api/problems/${problemId}`, config);
      setProblemName(problemRes.data.name);

      // Fetch test cases for this problem
      const testCasesRes = await axios.get(`http://localhost:5000/api/testcases/${problemId}`, config);
      setTestCases(testCasesRes.data);
      setMessage('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch problem or test cases.');
      if (err.response && (err.response.status === 404 || err.response.status === 400)) {
          navigate('/admin/problems'); // Redirect if problem not found or invalid ID
      }
      setTestCases([]);
    }
  }, [problemId, user.token, navigate]);

  useEffect(() => {
    fetchProblemAndTestCases();
  }, [fetchProblemAndTestCases]);

  const handleDeleteTestCase = async (testCaseId) => {
    if (window.confirm('Are you sure you want to delete this test case?')) {
      setMessage('');
      setError('');
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.delete(`http://localhost:5000/api/testcases/${testCaseId}`, config);
        setMessage(data.message);
        fetchProblemAndTestCases(); // Refresh the list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete test case.');
      }
    }
  };

  return (
    <div>
      <h2>Test Cases for "{problemName}"</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <div className="testcase-list-actions">
        <Link to={`/admin/problems/${problemId}/testcases/add`} className="add-testcase-button">Add New Test Case</Link>
        <button onClick={() => navigate('/admin/problems')} className="back-button">Back to Problems</button>
      </div>

      {testCases.length === 0 ? (
        <p>No test cases found for this problem. Add the first one!</p>
      ) : (
        <table className="testcases-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Input</th>
              <th>Output</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc, index) => (
              <tr key={tc._id}>
                <td>{index + 1}</td>
                <td className="code-snippet-cell"><pre>{tc.input}</pre></td>
                <td className="code-snippet-cell"><pre>{tc.output}</pre></td>
                <td className="testcase-actions-cell">
                  <Link to={`/admin/testcases/edit/${tc._id}`} className="edit-button-small">Edit</Link>
                  <button onClick={() => handleDeleteTestCase(tc._id)} className="delete-button-small">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminTestCaseList;