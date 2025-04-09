/**
 * Jest configuration for module-extended tests
 * 
 * This configuration is optimized for running just the module-extended.test.js
 * tests without coverage threshold errors.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test files location and pattern
  testMatch: ['**/tests/module-extended.test.js'],
  
  // Setup files
  setupFilesAfterEnv: ['./tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: false,
  
  // Console output configuration
  verbose: true,
  
  // Timeout for tests
  testTimeout: 10000,
  
  // Global test environment variables
  globals: {
    __TEST_MODE__: true
  }
};
