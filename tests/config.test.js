/**
 * Tests for the config CLI command
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

// Import the factory function from the module
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

describe('config command', () => {
  beforeEach(() => {
    // Clear all mock function calls before each test
    jest.clearAllMocks();
    
    // Setup default mock behavior
    mockConfigManager.getAllValues.mockResolvedValue({
      'project.name': 'test-project',
      'project.root': '/test/path',
      'context.defaultLevel': 'medium',
      'context.tokenBudget': 4000
    });
    
    mockConfigManager.getValue.mockImplementation(async (key) => {
      const values = {
        'project.name': 'test-project',
        'project.root': '/test/path',
        'context.defaultLevel': 'medium',
        'context.tokenBudget': 4000
      };
      return values[key];
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
      
      try {
        await errorConfigCmd('get', 'project.name');
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error getting configuration', 'error');
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
      expect(mockConfigManager.setValue).toHaveBeenCalled();
      expectOutputToContain('Configuration updated successfully');
    });
    
    it('should parse JSON values when possible', async () => {
      await configCmd('set', 'project.excludes', '["node_modules", "dist"]');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith(
        'project.excludes', 
        ['node_modules', 'dist']
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
      
      try {
        await errorConfigCmd('set', 'project.name', 'new-project');
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error setting configuration', 'error');
    });
    
    it('should require a key when setting', async () => {
      try {
        await configCmd('set');
      } catch (error) {
        // Process.exit was called
      }
      
      expect(mockConfigManager.setValue).not.toHaveBeenCalled();
      expectOutputToContain('Error: Key is required', 'error');
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
    
    it('should handle errors during reset', async () => {
      // Create a command with custom mock that throws an error
      const errorMockConfigManager = {
        resetValue: jest.fn().mockRejectedValue(new Error('Test error')),
        resetAll: jest.fn().mockRejectedValue(new Error('Test error'))
      };
      
      const { configCmd: errorConfigCmd } = createConfigCommands({ configManager: errorMockConfigManager });
      
      try {
        await errorConfigCmd('reset', 'project.name');
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error resetting configuration', 'error');
    });
  });
  
  describe('default action', () => {
    it('should default to showing all config when no action is provided', async () => {
      await configCmd();
      
      expect(mockConfigManager.getAllValues).toHaveBeenCalled();
      expectOutputToContain('Current PairCoder Configuration');
    });
  });
});