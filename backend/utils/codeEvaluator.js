// backend/utils/codeEvaluator.js
const { exec, spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

const CODE_DIR = path.join(__dirname, '../temp_code');
// Default timeout for execution in milliseconds (2 seconds)
// This will be overridden by problem.timeLimit for actual submissions
const DEFAULT_TIMEOUT_MS = 2000;

// Ensure the temporary directory exists
fs.mkdir(CODE_DIR, { recursive: true }).catch(console.error);

/**
 * Executes user code against provided inputs.
 * @param {string} code - The user's submitted code.
 * @param {string} language - The programming language ('python', 'c', 'cpp', 'java').
 * @param {Array<{input: string, output: string}> | string} inputs - An array of test cases (for submission) or a single string (for custom run).
 * @param {number} [timeLimitSeconds=1] - Time limit for execution per test case in seconds.
 * @returns {Promise<{verdict: string, output: string, error?: string, executionTime?: number, results?: Array<{testCase: number, status: string, output?: string, error?: string}>}>}
 */
const executeCode = async (code, language, inputs, timeLimitSeconds = 1) => {
  const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  let filename, compileCommand, runCommand, cleanupCommands = [];
  let overallResult = { verdict: 'Pending', output: '', error: null, executionTime: 0, results: [] };
  const executionStartTime = Date.now();
  const isSubmission = Array.isArray(inputs);
  const testCases = isSubmission ? inputs : [{ input: inputs, output: '' }]; // Treat custom input as a single test case

  try {
    switch (language) {
      case 'python':
        filename = `${fileId}.py`;
        runCommand = `python ${path.join(CODE_DIR, filename)}`;
        break;
      case 'c':
        filename = `${fileId}.c`;
        compileCommand = `gcc ${path.join(CODE_DIR, filename)} -o ${path.join(CODE_DIR, fileId)}`;
        runCommand = `${path.join(CODE_DIR, fileId)}`;
        cleanupCommands.push(`rm -f ${path.join(CODE_DIR, fileId)}`); // Remove compiled executable
        break;
      case 'cpp':
        filename = `${fileId}.cpp`;
        compileCommand = `g++ ${path.join(CODE_DIR, filename)} -o ${path.join(CODE_DIR, fileId)}`;
        runCommand = `${path.join(CODE_DIR, fileId)}`;
        cleanupCommands.push(`rm -f ${path.join(CODE_DIR, fileId)}`); // Remove compiled executable
        break;
      case 'java':
        // For Java, the class name must match the filename without extension
        // Assuming Main class for simplicity and requiring users to name their class Main
        filename = `Main${fileId}.java`; // Use a unique filename for the .java file
        compileCommand = `javac -d ${CODE_DIR} ${path.join(CODE_DIR, filename)}`; // Compile to CODE_DIR
        runCommand = `java -cp ${CODE_DIR} Main${fileId}`; // Run from CODE_DIR, assuming Main class
        cleanupCommands.push(`rm -f ${path.join(CODE_DIR, `Main${fileId}.class`)}`); // Remove compiled class
        break;
      default:
        throw new Error('Unsupported language');
    }

    const codeFilePath = path.join(CODE_DIR, filename);
    await fs.writeFile(codeFilePath, code);
    cleanupCommands.push(`rm -f ${codeFilePath}`); // Remove source file

    // 1. Compilation (for C, C++, Java)
    if (compileCommand) {
      try {
        const compileTimeout = isSubmission ? DEFAULT_TIMEOUT_MS : 5000; // Longer timeout for run compile
        await execPromise(compileCommand, { timeout: compileTimeout, cwd: CODE_DIR });
      } catch (compileErr) {
        overallResult.verdict = 'Compilation Error';
        overallResult.output = `Compilation Error:\n${compileErr.message}`;
        return overallResult; // Stop if compilation fails
      }
    }

    // 2. Execute against all test cases (or single custom input)
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let testCaseResult = { testCase: i + 1, status: 'Running', output: '', error: '' };

      const currentExecutionTimeout = isSubmission ? timeLimitSeconds * 1000 : 5000; // Use problem timeLimit for submission, 5s for run

      // Use spawn for better control over I/O and process management
      const child = spawn(runCommand.split(' ')[0], runCommand.split(' ').slice(1), {
          cwd: CODE_DIR,
          timeout: currentExecutionTimeout
      });

      // Write test case input to child's stdin
      child.stdin.write(tc.input);
      child.stdin.end();

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle timeout
      const timeoutId = setTimeout(() => {
          child.kill('SIGTERM'); // Terminate the process
          timedOut = true;
      }, currentExecutionTimeout + 500); // Give a little extra time for cleanup before force killing

      try {
        await new Promise((resolve, reject) => {
          child.on('close', (code) => {
            clearTimeout(timeoutId); // Clear timeout if process exits naturally
            if (timedOut) {
                testCaseResult.status = 'Time Limit Exceeded';
                testCaseResult.error = `Execution timed out after ${currentExecutionTimeout / 1000} seconds.`;
                return reject(new Error('Time Limit Exceeded')); // Reject to stop further test cases
            }
            if (code !== 0) {
                testCaseResult.status = 'Runtime Error';
                testCaseResult.error = `Process exited with code ${code}. Stderr: ${stderr || 'No stderr'}`;
                return reject(new Error('Runtime Error')); // Reject to stop further test cases
            }
            resolve();
          });

          child.on('error', (err) => {
            clearTimeout(timeoutId);
            testCaseResult.status = 'Runtime Error';
            testCaseResult.error = `Failed to execute: ${err.message}`;
            reject(err); // Reject to stop further test cases
          });
        });

        // Compare output for submissions
        if (isSubmission) {
          const cleanStdout = stdout.trim();
          const cleanExpectedOutput = tc.output.trim();

          if (cleanStdout !== cleanExpectedOutput) {
            testCaseResult.status = 'Wrong Answer';
            testCaseResult.output = stdout; // Keep actual output for debugging WA
            overallResult.verdict = 'Wrong Answer';
            overallResult.output = `Test Case ${i + 1} Failed.\nInput:\n${tc.input}\n\nExpected Output:\n${tc.output}\n\nYour Output:\n${stdout}`;
            return overallResult; // Stop on first wrong answer for submission
          } else {
            testCaseResult.status = 'Accepted';
          }
          overallResult.results.push(testCaseResult);
        } else {
            // For custom run, just return the stdout and stderr
            overallResult.output = stdout;
            if (stderr) {
                overallResult.error = stderr;
            }
            overallResult.verdict = 'Run Complete'; // Specific verdict for run
            return overallResult; // Stop after single run
        }

      } catch (err) {
        if (isSubmission) {
            // If an error (like TLE or RE) occurred during a test case in submission mode
            overallResult.verdict = testCaseResult.status;
            overallResult.output = testCaseResult.error || `Error on Test Case ${i + 1}.`;
            return overallResult; // Stop on first error
        } else {
            // For custom run, just return the error
            overallResult.verdict = testCaseResult.status; // e.g., 'Time Limit Exceeded'
            overallResult.output = testCaseResult.error || err.message;
            overallResult.error = testCaseResult.error || err.message;
            return overallResult;
        }
      }
    }

    // If all test cases pass for submission
    if (isSubmission) {
        overallResult.verdict = 'Accepted';
        overallResult.executionTime = Date.now() - executionStartTime;
    }

  } catch (err) {
    // General unexpected errors during setup or file operations
    if (!overallResult.verdict || overallResult.verdict === 'Pending') {
        overallResult.verdict = 'Error';
        overallResult.output = `An unexpected system error occurred: ${err.message}`;
        overallResult.error = err.message;
    }
  } finally {
    // Clean up temporary files
    for (const cmd of cleanupCommands) {
      try {
        await execPromise(cmd);
      } catch (cleanupErr) {
        console.error(`Failed to clean up: ${cmd}`, cleanupErr.message);
      }
    }
  }

  return overallResult;
};

// Promisify exec for easier async/await usage
function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || stdout || error.message));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

module.exports = { executeCode };