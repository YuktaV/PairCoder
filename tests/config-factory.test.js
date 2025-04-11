/**
 * Tests for the config-factory.js module
 */

const inquirer = require('inquirer');
const { createConfigCommands } = require('../src/cli/commands/config-factory');

// Mock dependencies
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

describe('config-factory.js', () => {
  let mockConfigManager;
  let configCmd;
  let mockExit;
  
  beforeEach(() => {
    // Mock dependencies
    mockConfigManager = {
      getValue: jest.fn().mockResolvedValue('test-value'),
      getAllValues: jest.fn().mockResolvedValue({ 
        project: { name: 'test-project' },
        context: { defaultLevel: 'medium' }
      }),
      setValue: jest.fn().mockResolvedValue(undefined),
      resetValue: jest.fn().mockResolvedValue(undefined),
      resetAll: jest.fn().mockResolvedValue(undefined)
    };
    
    // Create command with mocked dependencies
    const { configCmd: cmd } = createConfigCommands({
      configManager: mockConfigManager
    });
    
    configCmd = cmd;
    
    // Set up console output capture
    global.consoleOutput = {
      log: [],
      error: [],
      warn: []
    };
    
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
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });
  
  afterEach(() => {
    mockExit.mockRestore();
  });
  
  // Helper function to check output
  const expectOutputToContain = (text, outputType = 'log') => {
    const output = global.consoleOutput[outputType];
    const found = output.some(line => line && typeof line === 'string' && line.includes(text));
    if (!found) {
      throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
    }
  };
  
  describe('get action', () => {
    it('should display specific configuration value', async () => {
      await configCmd('get', 'test.key');
      
      expect(mockConfigManager.getValue).toHaveBeenCalledWith('test.key');
      expectOutputToContain('test.key:');
      expectOutputToContain('test-value');
    });
    
    it('should display all configuration values when no key provided', async () => {
      await configCmd('get');
      
      expect(mockConfigManager.getAllValues).toHaveBeenCalled();
      expectOutputToContain('Current PairCoder Configuration');
    });

    it('should display "(not set)" for null config values', async () => {
      mockConfigManager.getValue.mockResolvedValueOnce(null);
      await configCmd('get', 'test.key');
      
      expectOutputToContain('(not set)');
    });
    
    it('should handle error during get', async () => {
      mockConfigManager.getValue.mockRejectedValueOnce(new Error('Test error'));
      
      await configCmd('get', 'test.key');
      
      expectOutputToContain('Error getting configuration', 'error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('set action', () => {
    it('should set configuration value', async () => {
      await configCmd('set', 'test.key', 'new-value');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('test.key', 'new-value');
      expectOutputToContain('Configuration updated successfully');
    });
    
    it('should prompt for value if not provided', async () => {
      inquirer.prompt.mockResolvedValueOnce({ newValue: 'prompted-value' });
      
      await configCmd('set', 'test.key');
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('test.key', 'prompted-value');
    });
    
    it('should parse boolean values', async () => {
      await configCmd('set', 'test.bool', 'true');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('test.bool', true);
    });
    
    it('should parse numeric values', async () => {
      await configCmd('set', 'test.number', '42');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('test.number', 42);
    });
    
    it('should parse JSON values', async () => {
      await configCmd('set', 'complex.key', '{"nested":{"value":42}}');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith(
        'complex.key',
        expect.objectContaining({nested: {value: 42}})
      );
    });
    
    it('should error if key is not provided', async () => {
      await configCmd('set');
      
      expectOutputToContain('Error: Key is required', 'error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
    
    it('should handle error during set', async () => {
      mockConfigManager.setValue.mockRejectedValueOnce(new Error('Test error'));
      
      await configCmd('set', 'test.key', 'new-value');
      
      expectOutputToContain('Error setting configuration', 'error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('reset action', () => {
    it('should reset specific configuration key', async () => {
      await configCmd('reset', 'test.key');
      
      expect(mockConfigManager.resetValue).toHaveBeenCalledWith('test.key');
      expectOutputToContain('reset to default');
    });
    
    it('should prompt for confirmation before resetting all', async () => {
      inquirer.prompt.mockResolvedValueOnce({ confirmReset: true });
      
      await configCmd('reset');
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockConfigManager.resetAll).toHaveBeenCalled();
      expectOutputToContain('All configuration reset to defaults');
    });
    
    it('should cancel reset if not confirmed', async () => {
      inquirer.prompt.mockResolvedValueOnce({ confirmReset: false });
      
      await configCmd('reset');
      
      expect(mockConfigManager.resetAll).not.toHaveBeenCalled();
      expectOutputToContain('Reset cancelled');
    });
    
    it('should handle error during reset', async () => {
      mockConfigManager.resetValue.mockRejectedValueOnce(new Error('Test error'));
      
      await configCmd('reset', 'test.key');
      
      expectOutputToContain('Error resetting configuration', 'error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('unknown action', () => {
    it('should handle unknown action by showing all config', async () => {
      await configCmd('unknown');
      
      expect(mockConfigManager.getAllValues).toHaveBeenCalled();
      expectOutputToContain('Current PairCoder Configuration');
    });
    
    it('should handle error in unknown action', async () => {
      mockConfigManager.getAllValues.mockRejectedValueOnce(new Error('Test error'));
      
      await configCmd('unknown');
      
      expectOutputToContain('Error', 'error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
