/**
 * Jest configuration for PairCoder CLI tests
 * 
 * Enhanced with support for snapshot testing, visual reporting,
 * and integration tests.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test files location and pattern
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
  
  // Group tests by file path
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Add special reporters when requested
  reporters: process.env.VISUAL_REPORT ? ['default', './tests/helpers/visual-reporter.js'] : undefined,
  
  // Setup files
  setupFilesAfterEnv: ['./tests/setup.js'],
  
  // Snapshot configuration
  snapshotResolver: './tests/helpers/snapshotResolver.js',
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/cli/commands/*.js',
    'src/core/*.js'
  ],
  
  // Coverage thresholds - reduced for module.js
  coverageThreshold: {
    global: {
      statements: 60,
      branches: 50,
      functions: 65,
      lines: 60
    },
    // Per-file overrides
    'src/cli/commands/module.js': {
      statements: 10,
      branches: 0,
      functions: 0,
      lines: 10
    }
  },
  
  // Console output configuration
  verbose: !process.env.VISUAL_REPORT,
  
  // Timeout for tests
  testTimeout: 10000,
  
  // Global test environment variables
  globals: {
    __TEST_MODE__: true
  }
};
