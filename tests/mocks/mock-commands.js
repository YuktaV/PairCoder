/**
 * Mock implementation for CLI commands for testing
 */

// Mock commands
const mockModuleCommand = {
  add: {
    action: jest.fn().mockImplementation((name, path, options) => {
      return Promise.resolve({ name, path, description: options.description });
    })
  },
  list: {
    action: jest.fn().mockImplementation((options) => {
      return Promise.resolve();
    })
  },
  remove: {
    action: jest.fn().mockImplementation((name) => {
      return Promise.resolve(true);
    })
  },
  detect: {
    action: jest.fn().mockImplementation((options) => {
      return Promise.resolve({ modules: [{ name: 'detected-module', path: '/path/to/detected' }] });
    })
  },
  deps: {
    action: jest.fn().mockImplementation((moduleName, options) => {
      return Promise.resolve();
    })
  }
};

module.exports = { mockModuleCommand };
