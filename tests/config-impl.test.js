/**
 * Tests for the config.js implementation
 * 
 * This test covers the implementation file directly, while the 
 * existing config.test.js covers the factory-created functions.
 */

// Mock the factory function
jest.mock('../src/cli/commands/config-factory', () => ({
  createConfigCommands: jest.fn().mockReturnValue({
    configCmd: jest.fn(),
    config: {
      command: 'config',
      description: 'Manage PairCoder configuration',
      builder: jest.fn(),
      handler: jest.fn()
    }
  })
}));

describe('config.js', () => {
  // Import module only after mocks are set up
  const { configCmd, config } = require('../src/cli/commands/config');
  const { createConfigCommands } = require('../src/cli/commands/config-factory');
  
  test('should export configCmd function', () => {
    expect(configCmd).toBeDefined();
    expect(typeof configCmd).toBe('function');
  });
  
  test('should export config object', () => {
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
    expect(config.command).toBe('config');
  });
  
  test('should use factory function to create commands', () => {
    // The config.js file calls this function when it's imported
    expect(createConfigCommands).toHaveBeenCalled();
  });
});
