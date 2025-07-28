import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './../App.css'; 

function ProblemDetails({ user }) {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  // CHANGED: Initial language is now 'c'
  const [language, setLanguage] = useState('c'); 
  const [verdict, setVerdict] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [customInput, setCustomInput] = useState('');

  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const [pastSubmissions, setPastSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [submissionsError, setSubmissionsError] = useState(null);

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/api/problems/${id}`);
        setProblem(response.data);
      } catch (err) {
        setError("Failed to fetch problem details. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  useEffect(() => {
    const fetchPastSubmissions = async () => {
      if (!user) {
        setSubmissionsError('Please log in to view past submissions.');
        setSubmissionsLoading(false);
        return;
      }
      if (!problem) {
        return;
      }

      setSubmissionsLoading(true);
      setSubmissionsError(null);
      try {
        const response = await axios.get(`http://localhost:5000/api/submissions/user/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setPastSubmissions(response.data);
      } catch (err) {
        setSubmissionsError('Failed to fetch past submissions. ' + (err.response?.data?.message || err.message));
        console.error('Fetch submissions error:', err);
      } finally {
        setSubmissionsLoading(false);
      }
    };

    if (problem && user) {
      fetchPastSubmissions();
    }
  }, [id, problem, user, verdict]); 

  const handleSubmitCode = async (event) => {
    event.preventDefault();
    if (!user || submitting) {
      setError('Please log in to submit code.');
      return;
    }
    if (!code.trim()) {
      setError('Code cannot be empty.');
      return;
    }

    setSubmitting(true);
    setVerdict(null);
    setError(null); 
    try {
      const response = await axios.post(`http://localhost:5000/api/submissions`, {
        problemId: problem._id,
        code,
        language
      }, {
        headers: { Authorization: `Bearer ${user.token}` } 
      });
      setVerdict(response.data.verdict);
    } catch (err) {
      setVerdict({ status: 'Error', message: 'Failed to submit code. ' + (err.response?.data?.message || err.message) });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunCode = async (event) => {
    event.preventDefault();
    if (!user || submitting) {
      setError('Please log in to run code.');
      return;
    }
    if (!code.trim()) {
      setError('Code cannot be empty.');
      return;
    }

    setSubmitting(true);
    setVerdict(null);
    setError(null); 
    try {
      const response = await axios.post(`http://localhost:5000/api/submissions/run`, {
        code,
        language,
        customInput
      }, {
        headers: { Authorization: `Bearer ${user.token}` } 
      });
      setVerdict(response.data); 
    } catch (err) {
      setVerdict({ 
        verdict: 'Error', 
        output: null,
        error: 'Failed to run code. ' + (err.response?.data?.message || err.message)
      });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const requestAiReview = async () => {
    if (!user) {
        setAiError('Please log in to use the AI assistant.');
        return;
    }
    if (!code.trim()) {
        setAiError('Please write some code to get AI suggestions.');
        return;
    }

    setAiSuggestions(null); 
    setAiError(null); 
    setIsAiLoading(true);

    try {
      const response = await axios.post(`http://localhost:5000/api/gemini/review`, {
        problemId: problem._id,
        language: language,
        code: code,
        problemStatement: problem.statement, 
        exampleInput: problem.exampleInput,
        exampleOutput: problem.exampleOutput
      }, {
        headers: { Authorization: `Bearer ${user.token}` } 
      });
      setAiSuggestions(response.data.suggestions);
    } catch (err) {
      setAiError('Failed to get AI suggestions: ' + (err.response?.data?.message || err.message));
      console.error('AI Review Error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading) return <div className="problem-details-container info-message">Loading problem details...</div>;
  if (error) return <div className="problem-details-container error-message">{error}</div>;
  if (!problem) return <div className="problem-details-container info-message">Problem not found.</div>;

  return (
    <div className="problem-content-wrapper">
      <div className="problem-details-container">
        <h2>{problem.title}</h2>
        <p className="problem-difficulty">{problem.difficulty}</p>

        <div className="problem-page-layout">
          <div className="problem-statement-section">
            <div className="problem-statement">
              <h3>Problem Statement</h3>
              <p>{problem.statement}</p>
            </div>

            <div className="example-io">
              <h4>Example Input</h4>
              <pre>{problem.exampleInput}</pre>
              <h4>Example Output</h4>
              <pre>{problem.exampleOutput}</pre>
            </div>
            
            <div className="ai-assistant-section">
              <h3>AI Code Assistant</h3>
              <p>Get suggestions and code review from our AI-powered assistant.</p>
              {!user ? (
                <p className="info-message">Please log in to use the AI assistant.</p>
              ) : (
                <button 
                  className="submit-button" 
                  onClick={requestAiReview}
                  disabled={isAiLoading || !code.trim()}
                >
                  {isAiLoading ? (
                    <>
                      Analyzing...
                      <span className="spinner"></span>
                    </>
                  ) : 'Get AI Suggestions'}
                </button>
              )}
              {aiError && <div className="error-message">{aiError}</div>}
              {aiSuggestions && (
                <div className="info-message ai-suggestion-box">
                  <h4>AI Suggestions:</h4>
                  <pre>{aiSuggestions}</pre>
                </div>
              )}
            </div>
          </div>
          <div className="code-editor-section">
            <div className="code-submission-section">
              <h3>Code Editor</h3>
              <form> 
                <div className="form-group">
                  <label htmlFor="language-select">Language:</label>
                  <select 
                    id="language-select" 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {/* CHANGED: Added the C option */}
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="code-editor">Your Code:</label>
                  <textarea
                    id="code-editor"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Write your code here..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="custom-input">Custom Input (Optional):</label>
                  <textarea
                    id="custom-input"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom input here..."
                  />
                </div>
                <div className="action-buttons">
                  <button type="button" onClick={handleRunCode} className="run-button" disabled={submitting}>
                    {submitting ? 'Running...' : 'Run Code'}
                  </button>
                  <button type="button" onClick={handleSubmitCode} className="submit-button" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Code'}
                  </button>
                </div>
              </form>
            </div>
            {verdict && (
              <div className={`info-message ${verdict.verdict === 'Accepted' ? 'success-message' : 'error-message'}`}>
                {verdict.verdict === 'Run Complete' ? (
                  <>
                    {verdict.output && <pre>{verdict.output}</pre>}
                    {verdict.error && (
                      <>
                        <pre className="error-text">{verdict.error}</pre>
                      </>
                  )}
                </>
              ) : (
                <>
                  <strong>Verdict:</strong> {verdict.status}
                  <p>{verdict.message}</p>
                </>
              )}
              {verdict.executionTime && <p><strong>Execution Time:</strong> {verdict.executionTime}ms</p>}
            </div>
          )}
          </div>
        </div>

        <div className="past-submissions-section">
          <h3>Past Submissions</h3>
          {submissionsLoading ? (
            <div className="info-message">Loading past submissions...</div>
          ) : submissionsError ? (
            <div className="error-message">{submissionsError}</div>
          ) : pastSubmissions.length === 0 ? (
            <div className="info-message">No past submissions for this problem.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Submission ID</th>
                  <th>Language</th>
                  <th>Verdict</th>
                  <th>Time (ms)</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {pastSubmissions.map((submission) => (
                  <tr key={submission._id}>
                    <td>{submission._id.substring(0, 8)}...</td>
                    <td>{submission.language}</td>
                    <td>
                      <span className={`verdict-${submission.verdict.toLowerCase().replace(/\s/g, '-')}`}>
                        {submission.verdict}
                      </span>
                    </td>
                    <td>{submission.executionTime || 'N/A'}</td>
                    <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                    <td>
                    </td>
                </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProblemDetails;