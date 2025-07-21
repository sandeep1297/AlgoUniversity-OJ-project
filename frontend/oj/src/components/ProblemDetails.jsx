import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function ProblemDetails({ user }) {
  const { id: problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [pastSubmissions, setPastSubmissions] = useState([]);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true); // Manages loading state for past submissions

  // New states for Run functionality
  const [customInput, setCustomInput] = useState('');
  const [runOutput, setRunOutput] = useState('');
  const [runError, setRunError] = useState('');
  const [runningCode, setRunningCode] = useState(false); // For loading state of "Run"

  // Check if there are any submissions currently pending evaluation
  const hasPendingSubmissions = pastSubmissions.some(sub => sub.verdict === 'Pending');

  // Fetch problem details
  useEffect(() => {
    const fetchProblem = async () => {
      setLoadingProblem(true);
      setSubmissionError('');
      try {
        const config = user && user.token ? {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        } : {};
        const { data } = await axios.get(`http://localhost:5000/api/problems/${problemId}`, config);
        setProblem(data);
      } catch (err) {
        setSubmissionError(err.response?.data?.message || 'Failed to load problem details.');
      } finally {
        setLoadingProblem(false);
      }
    };

    fetchProblem();
  }, [problemId, user]);

  // Fetch past submissions for the current user and problem
  // Memoized with useCallback to ensure stable function reference
  const fetchPastSubmissions = useCallback(async () => {
    if (!user || !user.token) return; // Only fetch if logged in

    // Only set loading if it's not the initial load and there are pending submissions
    // or if the list is currently empty and we are fetching
    if (!loadingSubmissions || hasPendingSubmissions) {
        setLoadingSubmissions(true);
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`http://localhost:5000/api/submissions/user/${problemId}`, config);
      setPastSubmissions(data);
    } catch (err) {
      console.error('Failed to fetch past submissions:', err);
      // setSubmissionError(err.response?.data?.message || 'Failed to load past submissions.'); // Avoid user-facing error for just submissions fetch
    } finally {
      setLoadingSubmissions(false);
    }
  }, [problemId, user, loadingSubmissions, hasPendingSubmissions]); // Dependencies for useCallback

  // Effect for polling submissions
  useEffect(() => {
    // Initial fetch of submissions when component mounts or dependencies change
    fetchPastSubmissions();

    let pollInterval;
    // Set up polling only if there's a user and if there are pending submissions (or just submitted)
    // The `fetchPastSubmissions` callback will handle the actual API call
    if (user && user.token) {
        pollInterval = setInterval(() => {
            // This condition ensures polling continues as long as there might be pending results
            // `hasPendingSubmissions` here would reflect the state at the time of THIS effect's run.
            // But `fetchPastSubmissions` itself will update `pastSubmissions` and re-trigger effect if needed.
            // Simpler and safer: just call fetch if polling is needed.
            // The `fetchPastSubmissions` should be robust to not over-update if data is identical.
            // Also, `hasPendingSubmissions` is a reactive value here.
            fetchPastSubmissions();
        }, 3000); // Poll every 3 seconds

        // Clear interval when component unmounts or dependencies change
        return () => clearInterval(pollInterval);
    }
  // Dependency array: Re-run this effect only if `fetchPastSubmissions` changes (it's memoized),
  // or if the `user` status changes (login/logout).
  // `hasPendingSubmissions` is intentionally *not* in this dependency array for stability of the interval.
  // The `fetchPastSubmissions` useCallback's own dependencies ensure it re-fetches when needed.
  }, [fetchPastSubmissions, user]);


  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const handleCustomInputChange = (e) => {
    setCustomInput(e.target.value);
  };

  const handleSubmitCode = async (e) => {
    e.preventDefault();
    setSubmissionMessage('');
    setSubmissionError('');
    setRunOutput(''); // Clear run output on new submission
    setRunError('');

    if (!user || !user.token) {
      setSubmissionError('Please log in to submit code.');
      return;
    }
    if (!code.trim()) {
      setSubmissionError('Code cannot be empty.');
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post('http://localhost:5000/api/submissions', {
        problemId,
        language,
        code,
      }, config);

      setSubmissionMessage(data.message || 'Submission sent for evaluation.');
      // Prepend the new pending submission immediately for better UX
      setPastSubmissions(prev => [{
          _id: data.submissionId,
          problem: { _id: problemId, name: problem.name },
          user: { _id: user._id, userId: user.userId },
          code: code,
          language: language,
          verdict: 'Pending',
          submittedAt: new Date().toISOString(), // Use client-side timestamp initially
      }, ...prev]);

      // Trigger re-fetch after a short delay to potentially get initial status, then rely on polling
      // setTimeout(fetchPastSubmissions, 1000);

    } catch (err) {
      setSubmissionError(err.response?.data?.message || 'Failed to submit code.');
    }
  };

  const handleRunCode = async (e) => {
    e.preventDefault();
    setRunOutput('');
    setRunError('');
    setSubmissionMessage(''); // Clear submission messages on run
    setSubmissionError('');

    if (!user || !user.token) {
      setRunError('Please log in to run code.');
      return;
    }
    if (!code.trim()) {
      setRunError('Code cannot be empty.');
      return;
    }

    setRunningCode(true);
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post('http://localhost:5000/api/submissions/run', {
        language,
        code,
        customInput,
      }, config);

      setRunOutput(data.output || 'No output generated.');
      if (data.error) {
        setRunError(data.error);
      } else {
        setRunError(''); // Clear previous run errors
      }

    } catch (err) {
      setRunError(err.response?.data?.message || 'Failed to run code.');
      setRunOutput('');
    } finally {
      setRunningCode(false);
    }
  };


  if (loadingProblem) {
    return <div>Loading problem...</div>;
  }

  if (submissionError && !problem) {
    return <div className="error-message">{submissionError}</div>;
  }

  if (!problem) {
    return <div>Problem not found.</div>;
  }

  const getVerdictClass = (verdict) => {
    switch (verdict) {
      case 'Accepted': return 'verdict-accepted';
      case 'Wrong Answer': return 'verdict-wrong';
      case 'Time Limit Exceeded': return 'verdict-tle';
      case 'Memory Limit Exceeded': return 'verdict-mle';
      case 'Compilation Error': return 'verdict-ce';
      case 'Runtime Error': return 'verdict-re';
      case 'Pending': return 'verdict-pending';
      default: return 'verdict-error';
    }
  };

  return (
    <div className="problem-details-container">
      <h2>Problem: {problem.name}</h2>
      <p className="problem-difficulty">Difficulty: {problem.difficulty}</p>
      <div className="problem-statement">
        <h3>Statement:</h3>
        <pre>{problem.statement}</pre>
        {problem.timeLimit && <p>Time Limit: {problem.timeLimit} seconds</p>}
      </div>

      <div className="example-io">
        <h3>Example:</h3>
        {problem.exampleInput && (
          <div>
            <h4>Input:</h4>
            <pre className="code-block">{problem.exampleInput}</pre>
          </div>
        )}
        {problem.exampleOutput && (
          <div>
            <h4>Output:</h4>
            <pre className="code-block">{problem.exampleOutput}</pre>
          </div>
        )}
      </div>

      <div className="code-submission-section">
        <h3>Code Editor</h3>
        {submissionMessage && <p className="success-message">{submissionMessage}</p>}
        {submissionError && <p className="error-message">{submissionError}</p>}
        {runError && <p className="error-message">{runError}</p>}

        {!user || !user.token ? (
            <p className="info-message">Please <a href="/login">log in</a> to write and run code.</p>
        ) : (
            <>
              <div className="form-group">
                <label htmlFor="language">Language:</label>
                <select id="language" name="language" value={language} onChange={handleLanguageChange}>
                  <option value="python">Python</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="code">Your Code:</label>
                <textarea
                  id="code"
                  name="code"
                  value={code}
                  onChange={handleCodeChange}
                  rows="20"
                  spellCheck="false"
                  placeholder={`Write your ${language} code here...`}
                ></textarea>
              </div>

              <div className="custom-input-section">
                <h4>Custom Input (for 'Run' only):</h4>
                <textarea
                  id="customInput"
                  name="customInput"
                  value={customInput}
                  onChange={handleCustomInputChange}
                  rows="5"
                  spellCheck="false"
                  placeholder="Enter custom input here to test your code locally (optional)..."
                ></textarea>
              </div>

              <div className="action-buttons">
                <button
                  type="button"
                  onClick={handleRunCode}
                  className="run-button"
                  disabled={runningCode}
                >
                  {runningCode ? 'Running...' : 'Run Code'}
                </button>
                <button
                  type="submit"
                  onClick={handleSubmitCode}
                  className="submit-button"
                  disabled={runningCode}
                >
                  Submit Solution
                </button>
              </div>

              {runOutput && (
                <div className="run-output-section">
                  <h4>Run Output:</h4>
                  <pre className="code-block run-output-block">{runOutput}</pre>
                </div>
              )}
            </>
        )}
      </div>

      <div className="past-submissions-section">
        <h3>Your Recent Submissions (Evaluated against all test cases)</h3>
        {loadingSubmissions && !pastSubmissions.length ? ( // Show initial loading or when re-fetching empty list
          <p>Loading your past submissions...</p>
        ) : (
            <>
                {pastSubmissions.length === 0 ? (
                  <p>You have no past submissions for this problem.</p>
                ) : (
                  <>
                    {hasPendingSubmissions && (
                      <p className="info-message">Checking for verdict updates... {loadingSubmissions && <span className="spinner"></span>}</p>
                    )}
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Language</th>
                          <th>Verdict</th>
                          <th>Execution Time (ms)</th>
                          <th>Output / Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pastSubmissions.map((sub) => (
                          <tr key={sub._id}>
                            <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                            <td>{sub.language}</td>
                            <td className={getVerdictClass(sub.verdict)}>
                              <strong>{sub.verdict}</strong>
                            </td>
                            <td>{sub.executionTime ? `${sub.executionTime}ms` : 'N/A'}</td>
                            <td>
                              {sub.verdict === 'Accepted' ? 'N/A' : (
                                  <pre className="submission-output">{sub.output || 'No output/error details'}</pre>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
            </>
        )}
      </div>
    </div>
  );
}

export default ProblemDetails;