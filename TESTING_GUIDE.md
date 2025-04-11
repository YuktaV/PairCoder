PairCoder Testing Guide
Overview
Our testing framework is designed to ensure the reliability and performance of PairCoder across different scenarios and use cases.
Test Categories
1. Core Functionality Tests

Module initialization
Context generation
Configuration parsing
Server startup

2. Integration Tests

Claude API integration
Different IDE/environment compatibility
Cross-platform support

3. Performance Tests

Context generation speed
Memory usage
Token optimization efficiency

Running Tests
Test Runner Usage
bash# Run all tests known to pass
node run-tests.js working

# Run tests with mixed pass/fail status
node run-tests.js partial

# Run specific test patterns
node run-tests.js focus prompt passing
Test Configuration
Configure test runs in tests/config.json:
json{
  "testGroups": {
    "core": ["init", "generate", "serve"],
    "integration": ["claude", "vscode", "jetbrains"],
    "performance": ["token-usage", "context-generation"]
  },
  "environmentVariables": {
    "CLAUDE_API_KEY": "${CLAUDE_API_KEY}",
    "TEST_PROJECT_PATH": "./test-projects"
  }
}
Writing New Tests
Test File Structure
Create test files in tests/ directory:

test-core.js
test-integration.js
test-performance.js

Test Case Template
javascriptconst assert = require('assert');
const PairCoder = require('../src/paircoder');

describe('PairCoder Core Functionality', () => {
  it('should initialize project module correctly', async () => {
    const pc = new PairCoder();
    const result = await pc.initModule('auth');
    assert.strictEqual(result.status, 'success');
  });
});
Test Coverage

Aim for >90% code coverage
Test both happy paths and edge cases
Mock external dependencies (Claude API, file system)

Continuous Integration

GitHub Actions configured for automated testing
Tests run on every pull request
Coverage reports generated automatically

Debugging Tests

Use verbose logging
Isolate failing tests
Check environment setup
Verify test data and mocks

Contributing Test Cases

Fork the repository
Create a new branch
Add test cases
Submit a pull request with detailed description

Support
For test-related issues or improvements, please open an issue on our GitHub repository.