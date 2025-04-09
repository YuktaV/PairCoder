/**
 * Visual Test Reporter
 * 
 * Custom formatter for improved visual output of test results.
 * To use this reporter, run Jest with:
 * jest --reporters=./tests/helpers/visual-reporter.js
 */

const chalk = require('chalk');
const { relative } = require('path');

/**
 * Formats test file path to be more readable
 * @param {string} filePath - Full path to test file
 * @returns {string} Formatted file path
 */
function formatFilePath(filePath) {
  const relativePath = relative(process.cwd(), filePath);
  return chalk.gray(relativePath);
}

/**
 * Formats test duration
 * @param {number} duration - Test duration in seconds
 * @returns {string} Formatted duration string
 */
function formatDuration(duration) {
  if (duration < 1) {
    return chalk.gray(`${Math.floor(duration * 1000)}ms`);
  }
  return chalk.gray(`${duration.toFixed(1)}s`);
}

/**
 * Custom Jest reporter for enhanced visual output
 * @see https://jestjs.io/docs/configuration#reporters-array-modulename-modulename-options
 */
class VisualReporter {
  constructor(globalConfig, reporterOptions = {}) {
    this._globalConfig = globalConfig;
    this._options = reporterOptions;
    this._testResults = [];
  }

  onRunStart() {
    console.log(chalk.bold('\n🚀 Starting PairCoder CLI Tests\n'));
  }

  onTestStart(test) {
    // Optional: Uncomment to show test start
    // console.log(`  ${chalk.gray('→')} ${test.path}`);
  }

  onTestResult(test, testResult) {
    this._testResults.push({ test, testResult });

    // Get test file and results summary
    const { numFailingTests, numPassingTests, numPendingTests, testResults } = testResult;
    
    // Format the file path for display
    const filePath = formatFilePath(test.path);
    
    // Print file header if any tests passed or failed
    if (numPassingTests > 0 || numFailingTests > 0) {
      console.log(`\n${chalk.underline(filePath)}`);
    }

    // Print passed tests
    if (numPassingTests > 0) {
      testResults.forEach(result => {
        if (result.status === 'passed') {
          const duration = formatDuration(result.duration / 1000);
          console.log(
            `  ${chalk.green('✓')} ${chalk.dim(result.ancestorTitles.join(' › '))}${result.ancestorTitles.length ? ' › ' : ''}${result.title} ${duration}`
          );
        }
      });
    }

    // Print failed tests
    if (numFailingTests > 0) {
      testResults.forEach(result => {
        if (result.status === 'failed') {
          const duration = formatDuration(result.duration / 1000);
          console.log(
            `  ${chalk.red('✕')} ${chalk.dim(result.ancestorTitles.join(' › '))}${result.ancestorTitles.length ? ' › ' : ''}${result.title} ${duration}`
          );
        }
      });
    }

    // Print skipped/pending tests
    if (numPendingTests > 0) {
      testResults.forEach(result => {
        if (result.status === 'pending') {
          console.log(
            `  ${chalk.yellow('○')} ${chalk.dim(result.ancestorTitles.join(' › '))}${result.ancestorTitles.length ? ' › ' : ''}${result.title}`
          );
        }
      });
    }
  }

  onRunComplete(contexts, results) {
    const { numFailedTests, numPassedTests, numPendingTests, numTotalTests, startTime, testResults } = results;
    const totalTime = (Date.now() - startTime) / 1000;

    console.log('\n' + '─'.repeat(80) + '\n');

    // Print summary
    console.log(chalk.bold('Test Summary:'));
    
    // Tests passed
    console.log(
      `  ${chalk.green('✓')} ${numPassedTests} tests passed` +
      (numPassedTests > 0 ? ` (${((numPassedTests / numTotalTests) * 100).toFixed(1)}%)` : '')
    );
    
    // Tests failed
    if (numFailedTests > 0) {
      console.log(
        `  ${chalk.red('✕')} ${numFailedTests} tests failed` +
        ` (${((numFailedTests / numTotalTests) * 100).toFixed(1)}%)`
      );
    }
    
    // Tests skipped
    if (numPendingTests > 0) {
      console.log(
        `  ${chalk.yellow('○')} ${numPendingTests} tests skipped` +
        ` (${((numPendingTests / numTotalTests) * 100).toFixed(1)}%)`
      );
    }
    
    // Total time
    console.log(`  ${chalk.blue('ℹ')} Total time: ${formatDuration(totalTime)}`);

    // Print failure details
    if (numFailedTests > 0) {
      console.log('\n' + chalk.red.bold('Failed Tests:') + '\n');
      
      let failureIndex = 1;
      
      this._testResults.forEach(({ test, testResult }) => {
        const failedResults = testResult.testResults.filter(r => r.status === 'failed');
        
        if (failedResults.length > 0) {
          const filePath = formatFilePath(test.path);
          console.log(`  ${chalk.gray(`${failureIndex}.`)} ${filePath}`);
          
          failedResults.forEach(result => {
            console.log(
              `     ${chalk.red('❯')} ${chalk.dim(result.ancestorTitles.join(' › '))}${result.ancestorTitles.length ? ' › ' : ''}${result.title}`
            );
            
            // Print error message and stack trace
            if (result.failureMessages && result.failureMessages.length > 0) {
              const message = result.failureMessages[0]
                .split('\n')
                .slice(0, 2)
                .join('\n')
                .replace(/\s+at.+/g, '');
              
              console.log(`       ${chalk.red(message)}`);
            }
            
            failureIndex++;
          });
        }
      });
    }

    // Final status message
    if (numFailedTests === 0) {
      console.log(chalk.bold.green('\n✨ All tests passed!'));
    } else {
      console.log(chalk.bold.red(`\n⚠️ Tests completed with ${numFailedTests} failures!`));
    }
    
    console.log('\n');
  }
}

module.exports = VisualReporter;
