/**
 * Improved tests for the config CLI command using dependency injection
 */

const inquirer = require('inquirer');
const chalk = require('chalk');

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

// Mock chalk to avoid ANSI color codes in tests
jest.mock('chalk', () => ({
  blue: jest.fn(text => text),
  green: jest.fn(text => text),
  red: jest.fn(text => text),
  yellow: jest.fn(text => text),
  cyan: jest.fn(text => text),
  gray: jest.fn(text => text),
  bold: jest.fn(text => text)
}));

// Import the factory function from our new module
const { createConfigCommands } = require('../src/cli/commands/config-factory');

// Create mock functions for all dependencies
const mockConfigManager = {
  getValue: jest.fn(),
  setValue: jest.fn().mockResolvedValue(undefined),
  getAllValues: jest.fn(),
  resetValue: jest.fn().mockResolvedValue(undefined),
  resetAll: jest.fn().mockResolvedValue(undefined)
};

// Create our commands with injected mocks
const { configCmd } = createConfigCommands({ configManager: mockConfigManager });

// Setup mock data
const mockConfig = {
  'project.name': 'test-project',
  'project.root': '/test/path',
  'project.excludes': ['node_modules', 'dist', '.git', 'build'],
  'context.defaultLevel': 'medium',
  'context.tokenBudget': 4000,
  'versioning.enabled': true,
  'versioning.gitIntegration': false
};

// Test suite
describe('config command (improved tests)', () => {
  beforeEach(() => {
    // Clear all mock function calls before each test
    jest.clearAllMocks();
    
    // Setup default mock behavior
    mockConfigManager.getAllValues.mockResolvedValue(mockConfig);
    mockConfigManager.getValue.mockImplementation(async (key) => {
      return mockConfig[key];
    });
    
    // Set up console output capture
    global.consoleOutput = {
      log: [],
      error: [],
      warn: []
    };
    
    // Mock console methods
    console.log = jest.fn((...args) => {
      global.consoleOutput.log.push(args.join(' '));
    });
    
    console.error = jest.fn((...args) => {
      global.consoleOutput.error.push(args.join(' '));
    });
    
    console.warn = jest.fn((...args) => {
      global.consoleOutput.warn.push(args.join(' '));
    });
    
    // Mock process.exit
    process.exit = jest.fn();
  });
  
  // Helper function to check output
  const expectOutputToContain = (text, outputType = 'log') => {
    const output = global.consoleOutput[outputType];
    const found = output.some(line => line && typeof line === 'string' && line.includes(text));
    if (!found) {
      throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
    }
  };
  
  describe('get config', () => {
    it('should display all config when no key is provided', async () => {
      await configCmd('get');
      
      expect(mockConfigManager.getAllValues).toHaveBeenCalled();
      expectOutputToContain('Current PairCoder Configuration');
      expectOutputToContain('project');
      expectOutputToContain('context');
    });
    
    it('should display specific config when key is provided', async () => {
      await configCmd('get', 'project.name');
      
      expect(mockConfigManager.getValue).toHaveBeenCalledWith('project.name');
      expectOutputToContain('project.name');
      expectOutputToContain('test-project');
    });
    
    it('should handle errors during retrieval', async () => {
      // Create a command with custom mock that throws an error
      const errorMockConfigManager = {
        getValue: jest.fn().mockRejectedValue(new Error('Test error')),
        getAllValues: jest.fn().mockRejectedValue(new Error('Test error'))
      };
      
      const { configCmd: errorConfigCmd } = createConfigCommands({ configManager: errorMockConfigManager });
      
      await errorConfigCmd('get', 'project.name');
      
      expectOutputToContain('Error getting configuration', 'error');
    });
    
    it('should format different value types correctly', async () => {
      // Setup mock getValue to return different types
      const valueTypesMockConfigManager = {
        getValue: jest.fn()
          .mockResolvedValueOnce('string-value')
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ key: 'value' })
          .mockResolvedValueOnce([1, 2, 3])
      };
      
      const { configCmd: valueTypesConfigCmd } = createConfigCommands({ configManager: valueTypesMockConfigManager });
      
      // Test string value
      await valueTypesConfigCmd('get', 'test.string');
      expectOutputToContain('string-value');
      
      // Test boolean true
      await valueTypesConfigCmd('get', 'test.boolTrue');
      expectOutputToContain('true');
      
      // Test boolean false
      await valueTypesConfigCmd('get', 'test.boolFalse');
      expectOutputToContain('false');
      
      // Test null value
      await valueTypesConfigCmd('get', 'test.null');
      expectOutputToContain('not set');
      
      // Test object value
      await valueTypesConfigCmd('get', 'test.object');
      expectOutputToContain('{"key":"value"}');
      
      // Test array value
      await valueTypesConfigCmd('get', 'test.array');
      expectOutputToContain('[1,2,3]');
    });
  });
  
  describe('set config', () => {
    it('should set config with provided value', async () => {
      await configCmd('set', 'project.name', 'new-project');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('project.name', 'new-project');
      expectOutputToContain('Configuration updated successfully');
    });
    
    it('should prompt for value when not provided', async () => {
      inquirer.prompt.mockResolvedValueOnce({
        newValue: 'prompted-value'
      });
      
      await configCmd('set', 'project.name');
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('project.name', 'prompted-value');
      expectOutputToContain('Configuration updated successfully');
    });
    
    it('should parse JSON values when possible', async () => {
      await configCmd('set', 'project.excludes', '["node_modules", "dist"]');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith(
        'project.excludes', 
        ['node_modules', 'dist']
      );
    });
    
    it('should parse numeric values correctly', async () => {
      await configCmd('set', 'context.tokenBudget', '5000');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith(
        'context.tokenBudget', 
        5000
      );
    });
    
    it('should parse boolean values correctly', async () => {
      await configCmd('set', 'versioning.enabled', 'true');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith(
        'versioning.enabled', 
        true
      );
      
      await configCmd('set', 'versioning.gitIntegration', 'false');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith(
        'versioning.gitIntegration', 
        false
      );
    });
    
    it('should use string values when not valid JSON', async () => {
      await configCmd('set', 'project.name', 'My Project');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('project.name', 'My Project');
    });
    
    it('should handle errors during setting', async () => {
      // Create a command with custom mock that throws an error
      const errorMockConfigManager = {
        setValue: jest.fn().mockRejectedValue(new Error('Test error')),
        getValue: jest.fn().mockResolvedValue('old-value')
      };
      
      const { configCmd: errorConfigCmd } = createConfigCommands({ configManager: errorMockConfigManager });
      
      await errorConfigCmd('set', 'project.name', 'new-project');
      
      expectOutputToContain('Error setting configuration', 'error');
    });
    
    it('should require a key when setting', async () => {
      await configCmd('set');
      
      expect(mockConfigManager.setValue).not.toHaveBeenCalled();
      expectOutputToContain('Error: Key is required', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('reset config', () => {
    it('should reset specific config when key is provided', async () => {
      await configCmd('reset', 'project.name');
      
      expect(mockConfigManager.resetValue).toHaveBeenCalledWith('project.name');
      expectOutputToContain('Configuration key');
      expectOutputToContain('reset to default');
    });
    
    it('should prompt for confirmation when resetting all configs', async () => {
      inquirer.prompt.mockResolvedValueOnce({ confirmReset: true });
      
      await configCmd('reset');
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockConfigManager.resetAll).toHaveBeenCalled();
      expectOutputToContain('All configuration reset to defaults');
    });
    
    it('should cancel reset when confirmation is declined', async () => {
      inquirer.prompt.mockResolvedValueOnce({ confirmReset: false });
      
      await configCmd('reset');
      
      expect(mockConfigManager.resetAll).not.toHaveBeenCalled();
      expectOutputToContain('Reset cancelled');
    });
    
    it('should handle errors during reset of specific key', async () => {
      // Create a command with custom mock that throws an error
      const errorMockConfigManager = {
        resetValue: jest.fn().mockRejectedValue(new Error('Test error'))
      };
      
      const { configCmd: errorConfigCmd } = createConfigCommands({ configManager: errorMockConfigManager });
      
      await errorConfigCmd('reset', 'project.name');
      
      expectOutputToContain('Error resetting configuration', 'error');
    });
    
    it('should handle errors during reset of all config', async () => {
      // Create a command with custom mock that throws an error
      const errorMockConfigManager = {
        resetAll: jest.fn().mockRejectedValue(new Error('Test error'))
      };
      
      inquirer.prompt.mockResolvedValueOnce({ confirmReset: true });
      
      const { configCmd: errorConfigCmd } = createConfigCommands({ configManager: errorMockConfigManager });
      
      await errorConfigCmd('reset');
      
      expectOutputToContain('Error resetting configuration', 'error');
    });
  });
  
  describe('default action', () => {
    it('should default to showing all config when no action is provided', async () => {
      await configCmd();
      
      expect(mockConfigManager.getAllValues).toHaveBeenCalled();
      expectOutputToContain('Current PairCoder Configuration');
    });
    
    it('should default to showing all config when unknown action is provided', async () => {
      await configCmd('unknown-action');
      
      expect(mockConfigManager.getAllValues).toHaveBeenCalled();
      expectOutputToContain('Current PairCoder Configuration');
    });
  });
});
