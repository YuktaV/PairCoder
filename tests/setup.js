/**
 * Test Setup and Mocks
 * 
 * This file contains setup code and mocks used by the test suite.
 * It also registers global helper functions and custom matchers.
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Mock process.exit to prevent tests from terminating
const originalExit = process.exit;
beforeAll(() => {
  process.exit = jest.fn(code => {
    throw new Error(`process.exit called with "${code}"`);
  });
});

// Mock console methods for testing output
beforeEach(() => {
  global.consoleOutput = {
    log: [],
    error: [],
    warn: []
  };
  
  jest.spyOn(console, 'log').mockImplementation((...args) => {
    global.consoleOutput.log.push(args.join(' '));
  });
  
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    global.consoleOutput.error.push(args.join(' '));
  });
  
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    global.consoleOutput.warn.push(args.join(' '));
  });
});

// Restore original process.exit after all tests
afterAll(() => {
  process.exit = originalExit;
});

// Restore console methods after tests
afterEach(() => {
  console.log.mockRestore();
  console.error.mockRestore();
  console.warn.mockRestore();
});

// Helper to check console output contains text
global.expectOutputToContain = (text, outputType = 'log') => {
  const output = global.consoleOutput[outputType];
  const found = output.some(line => line.includes(text));
  if (!found) {
    throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
  }
};

// Mock chalk to return input strings unchanged for easier testing
jest.mock('chalk', () => ({
  red: jest.fn(text => text),
  green: jest.fn(text => text),
  blue: jest.fn(text => text),
  yellow: jest.fn(text => text),
  gray: jest.fn(text => text),
  cyan: jest.fn(text => text),
  bold: {
    red: jest.fn(text => text),
    green: jest.fn(text => text),
    blue: jest.fn(text => text),
    yellow: jest.fn(text => text),
    white: jest.fn(text => text)
  },
  bold: jest.fn(text => text)
}));

// Mock clipboard
jest.mock('clipboardy', () => ({
  write: jest.fn().mockResolvedValue(undefined)
}));

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn().mockImplementation(questions => {
    // Default mock responses based on question name
    const responses = {
      newValue: 'mock-value',
      selectedPattern: 'mock-pattern',
      confirmReset: true,
      newPattern: 'mock-pattern',
      selectedTemplate: 'mock-template',
      newTemplateName: 'mock-template',
      editNow: false,
      continue: '',
      setAsDefault: false,
      selectedModule: 'mock-module'
    };
    
    const result = {};
    questions.forEach(q => {
      result[q.name] = responses[q.name];
    });
    
    return Promise.resolve(result);
  })
}));

// Import custom assertion helpers
try {
  const { assertJsonStructure, assertCliOutput, assertCommandResult } = require('./helpers/assertions');
  const { matchesSnapshot } = require('./helpers/snapshots');
  
  // Register global helper for snapshot testing
  global.matchesSnapshot = matchesSnapshot;
  
  // Register additional Jest matchers
  expect.extend({
    toMatchCommandSnapshot: async (received, snapshotName) => {
      if (typeof received !== 'string') {
        return {
          message: () => 'Command output must be a string',
          pass: false
        };
      }
      
      const pass = await matchesSnapshot(snapshotName, received, {
        updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true'
      });
      
      return {
        message: () =>
          `Expected command output to ${pass ? 'not ' : ''}match snapshot "${snapshotName}"`,
        pass
      };
    },
    
    toHaveJsonStructure: (received, schema) => {
      try {
        assertJsonStructure(received, schema);
        return {
          message: () =>
            `Expected JSON not to match the provided schema, but it did`,
          pass: true
        };
      } catch (error) {
        return {
          message: () => `${error.message}`,
          pass: false
        };
      }
    }
  });
  
  // Make assertion helpers globally available
  global.assertJsonStructure = assertJsonStructure;
  global.assertCliOutput = assertCliOutput;
  global.assertCommandResult = assertCommandResult;
} catch (error) {
  console.warn(`Warning: Could not load assertion helpers: ${error.message}`);
}

module.exports = {
  // Shared test utilities 
  createTempDir: async () => {
    const tempDir = path.join(__dirname, 'temp');
    await fs.ensureDir(tempDir);
    return tempDir;
  },
  cleanTempDir: async () => {
    const tempDir = path.join(__dirname, 'temp');
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  },
  
  // Helper for running CLI commands in tests
  runCliCommand: (command, cwd = process.cwd()) => {
    const cliPath = path.resolve(__dirname, '../bin/paircoder');
    try {
      const output = require('child_process').execSync(`${cliPath} ${command}`, {
        cwd,
        encoding: 'utf8'
      });
      return { success: true, code: 0, stdout: output, stderr: '' };
    } catch (error) {
      return {
        success: false,
        code: error.status || 1,
        stdout: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }
};
