#!/usr/bin/env node

/**
 * Script to run specific test suites based on configuration
 */

const { spawn } = require('child_process');
const config = require('./test-config');

// Get the test group to run from the command line arguments
const args = process.argv.slice(2);
const group = args[0] || 'working';
const updateSnapshots = args.includes('--update-snapshots');

// Get the tests to run based on the specified group
let testsToRun = [];
switch (group) {
  case 'working':
    testsToRun = config.workingTests;
    console.log('Running working tests...');
    break;
  case 'partial':
    testsToRun = config.partiallyWorkingTests;
    console.log('Running partially working tests...');
    break;
  case 'failing':
    testsToRun = config.failingTests;
    console.log('Running failing tests...');
    break;
  case 'all':
    testsToRun = [...config.workingTests, ...config.partiallyWorkingTests, ...config.failingTests];
    console.log('Running all tests...');
    break;
  case 'focus':
    const focusArea = args[1] || 'prompt';
    const focusType = args[2] || 'passing';
    
    if (config.focusPatterns[focusArea] && config.focusPatterns[focusArea][focusType]) {
      const patterns = config.focusPatterns[focusArea][focusType];
      
      // Create a testNamePattern with multiple patterns using OR syntax
      const testNamePattern = patterns.map(p => `(${p})`).join('|');
      
      // Find the corresponding test file for this focus area
      let testFile = '';
      if (focusArea === 'prompt') testFile = 'tests/prompt.test.js';
      else if (focusArea === 'exclude') testFile = 'tests/exclude.test.js';
      
      console.log(`Running ${focusType} ${focusArea} tests...`);
      
      // Run Jest with the specific test file and name pattern
      const options = [
        'jest',
        testFile,
        '--testNamePattern', testNamePattern,
        '--no-coverage'
      ];
      
      if (updateSnapshots) {
        options.push('--updateSnapshot');
      }
      
      const jest = spawn('npx', options, { stdio: 'inherit' });
      jest.on('close', code => {
        process.exit(code);
      });
      
      return; // Exit early as we've already spawned the process
    } else {
      console.error(`Invalid focus area or type: ${focusArea} ${focusType}`);
      process.exit(1);
    }
    break;
  default:
    console.error(`Unknown test group: ${group}`);
    console.error('Available groups: working, partial, failing, all, focus');
    process.exit(1);
}

// Build Jest command
const jestArgs = ['jest', ...testsToRun, '--no-coverage'];

if (updateSnapshots) {
  jestArgs.push('--updateSnapshot');
}

// Spawn Jest process
const jest = spawn('npx', jestArgs, { stdio: 'inherit' });

// Handle process exit
jest.on('close', code => {
  process.exit(code);
});
