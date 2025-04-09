/**
 * Test configuration for running specific test suites
 * This allows running tests in groups to isolate issues
 */

module.exports = {
  // Test groups that are known to pass
  workingTests: [
    'tests/config.test.js',
    'tests/snapshot.test.js'
  ],
  
  // Tests with some passing and some failing tests
  partiallyWorkingTests: [
    'tests/prompt.test.js',
    'tests/exclude.test.js'
  ],
  
  // Tests that are currently failing and need fixes
  failingTests: [
    'tests/export.test.js',
    'tests/integration/command-chains.test.js'
  ],
  
  // Focus on specific test patterns for debugging
  focusPatterns: {
    // Add specific test patterns here to focus on fixing particular issues
    prompt: {
      passing: ['list templates', 'view template', 'set the specified template'],
      failing: ['should prompt for template when none provided', 'generate prompt for specified module']
    },
    exclude: {
      passing: ['display all exclusions', 'add exclusion'],
      failing: ['should remove exclusion with provided pattern', 'should handle case with no exclusions']
    }
  }
};
