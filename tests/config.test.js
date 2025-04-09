/**
 * Tests for the config CLI command
 */

const { configCmd } = require('../src/cli/commands/config');
const { configManager } = require('../src/core/config');
const inquirer = require('inquirer');

// Mock the config manager
jest.mock('../src/core/config', () => {
  const mockConfigManager = {
    getValue: jest.fn(),
    setValue: jest.fn().mockResolvedValue(undefined),
    getAllValues: jest.fn(),
    resetValue: jest.fn().mockResolvedValue(undefined),
    resetAll: jest.fn().mockResolvedValue(undefined)
  };
  
  return {
    configManager: mockConfigManager,
    DEFAULT_CONFIG: {
      project: {
        name: 'test-project',
        root: '/test/path',
        excludes: ['node_modules', 'dist', '.git', 'build']
      },
      context: {
        defaultLevel: 'medium',
        tokenBudget: 4000
      }
    }
  };
});

describe('config command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock behavior
    configManager.getAllValues.mockResolvedValue({
      'project.name': 'test-project',
      'project.root': '/test/path',
      'context.defaultLevel': 'medium',
      'context.tokenBudget': 4000
    });
    
    configManager.getValue.mockImplementation(async (key) => {
      const values = {
        'project.name': 'test-project',
        'project.root': '/test/path',
        'context.defaultLevel': 'medium',
        'context.tokenBudget': 4000
      };
      return values[key];
    });
  });
  
  describe('get config', () => {
    it('should display all config when no key is provided', async () => {
      await configCmd('get');
      
      expect(configManager.getAllValues).toHaveBeenCalled();
      expectOutputToContain('Current PairCoder Configuration');
    });
    
    it('should display specific config when key is provided', async () => {
      await configCmd('get', 'project.name');
      
      expect(configManager.getValue).toHaveBeenCalledWith('project.name');
      expectOutputToContain('project.name');
      expectOutputToContain('test-project');
    });
    
    it('should handle errors during retrieval', async () => {
      configManager.getValue.mockRejectedValueOnce(new Error('Test error'));
      
      await configCmd('get', 'project.name');
      
      expectOutputToContain('Error getting configuration', 'error');
    });
  });
  
  describe('set config', () => {
    it('should set config with provided value', async () => {
      await configCmd('set', 'project.name', 'new-project');
      
      expect(configManager.setValue).toHaveBeenCalledWith('project.name', 'new-project');
      expectOutputToContain('Configuration updated successfully');
    });
    
    it('should prompt for value when not provided', async () => {
      await configCmd('set', 'project.name');
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(configManager.setValue).toHaveBeenCalled();
      expectOutputToContain('Configuration updated successfully');
    });
    
    it('should parse JSON values when possible', async () => {
      await configCmd('set', 'project.excludes', '["node_modules", "dist"]');
      
      expect(configManager.setValue).toHaveBeenCalledWith(
        'project.excludes', 
        ['node_modules', 'dist']
      );
    });
    
    it('should use string values when not valid JSON', async () => {
      await configCmd('set', 'project.name', 'My Project');
      
      expect(configManager.setValue).toHaveBeenCalledWith('project.name', 'My Project');
    });
    
    it('should handle errors during setting', async () => {
      configManager.setValue.mockRejectedValueOnce(new Error('Test error'));
      
      await configCmd('set', 'project.name', 'new-project');
      
      expectOutputToContain('Error setting configuration', 'error');
    });
    
    it('should require a key when setting', async () => {
      await configCmd('set');
      
      expect(configManager.setValue).not.toHaveBeenCalled();
      expectOutputToContain('Error: Key is required', 'error');
    });
  });
  
  describe('reset config', () => {
    it('should reset specific config when key is provided', async () => {
      await configCmd('reset', 'project.name');
      
      expect(configManager.resetValue).toHaveBeenCalledWith('project.name');
      expectOutputToContain('Configuration key');
      expectOutputToContain('reset to default');
    });
    
    it('should prompt for confirmation when resetting all configs', async () => {
      await configCmd('reset');
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(configManager.resetAll).toHaveBeenCalled();
      expectOutputToContain('All configuration reset to defaults');
    });
    
    it('should cancel reset when confirmation is declined', async () => {
      inquirer.prompt.mockResolvedValueOnce({ confirmReset: false });
      
      await configCmd('reset');
      
      expect(configManager.resetAll).not.toHaveBeenCalled();
      expectOutputToContain('Reset cancelled');
    });
    
    it('should handle errors during reset', async () => {
      configManager.resetValue.mockRejectedValueOnce(new Error('Test error'));
      
      await configCmd('reset', 'project.name');
      
      expectOutputToContain('Error resetting configuration', 'error');
    });
  });
  
  describe('default action', () => {
    it('should default to showing all config when no action is provided', async () => {
      await configCmd();
      
      expect(configManager.getAllValues).toHaveBeenCalled();
      expectOutputToContain('Current PairCoder Configuration');
    });
  });
});
