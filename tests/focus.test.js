/**
 * Tests for the focus CLI command
 */

const { focus } = require('../src/cli/commands/focus');
const { configManager } = require('../src/core/config');
const { moduleManager } = require('../src/modules/manager');
const { contextGenerator, DETAIL_LEVELS } = require('../src/context/generator');

// Mock dependencies
jest.mock('../src/core/config', () => ({
  configManager: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getConfig: jest.fn(),
    saveConfig: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('../src/modules/manager', () => ({
  moduleManager: {
    listModules: jest.fn()
  }
}));

jest.mock('../src/context/generator', () => ({
  contextGenerator: {
    generateModuleContext: jest.fn().mockResolvedValue({
      moduleName: 'test-module',
      level: 'medium',
      tokenCount: 2000
    })
  },
  DETAIL_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  }
}));

describe('focus command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset console output mocks
    global.consoleOutput = {
      log: [],
      error: [],
      warn: []
    };
    
    // Setup default mock behavior
    configManager.getConfig.mockResolvedValue({
      focus: null
    });
    
    moduleManager.listModules.mockResolvedValue([
      { name: 'test-module', path: '/path/to/test-module' },
      { name: 'other-module', path: '/path/to/other-module' }
    ]);
  });
  
  describe('setting focus', () => {
    it('should set focus on a valid module', async () => {
      await focus('test-module');
      
      expect(configManager.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          focus: expect.objectContaining({
            module: 'test-module',
            level: 'medium'
          })
        })
      );
      
      expectOutputToContain('Focus set on module');
    });
    
    it('should use specified detail level', async () => {
      await focus('test-module', { level: 'high' });
      
      expect(configManager.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          focus: expect.objectContaining({
            module: 'test-module',
            level: 'high'
          })
        })
      );
    });
    
    it('should show error for invalid module', async () => {
      await focus('non-existent-module');
      
      expect(configManager.saveConfig).not.toHaveBeenCalled();
      expectOutputToContain('not found', 'error');
    });
    
    it('should show error for invalid detail level', async () => {
      await focus('test-module', { level: 'invalid' });
      
      expect(configManager.saveConfig).not.toHaveBeenCalled();
      expectOutputToContain('Invalid detail level', 'error');
    });
    
    it('should generate context by default', async () => {
      await focus('test-module');
      
      expect(contextGenerator.generateModuleContext).toHaveBeenCalledWith(
        'test-module',
        expect.objectContaining({
          level: 'medium',
          force: true
        })
      );
      
      expectOutputToContain('Context generated');
    });
    
    it('should not generate context when --no-generate option is provided', async () => {
      await focus('test-module', { generate: false });
      
      expect(contextGenerator.generateModuleContext).not.toHaveBeenCalled();
      expect(configManager.saveConfig).toHaveBeenCalled();
    });
  });
  
  describe('showing focus', () => {
    it('should show current focus', async () => {
      // Set up mock to return a focused module
      configManager.getConfig.mockResolvedValueOnce({
        focus: {
          module: 'test-module',
          level: 'medium',
          timestamp: new Date().toISOString()
        }
      });
      
      await focus(null);
      
      expectOutputToContain('Current focus');
      expectOutputToContain('test-module');
    });
    
    it('should show message when no module is focused', async () => {
      await focus(null);
      
      expectOutputToContain('No module is currently in focus');
    });
  });
  
  describe('clearing focus', () => {
    it('should clear current focus', async () => {
      // Set up mock to return a focused module
      configManager.getConfig.mockResolvedValueOnce({
        focus: {
          module: 'test-module',
          level: 'medium',
          timestamp: new Date().toISOString()
        }
      });
      
      await focus(null, { clear: true });
      
      expect(configManager.saveConfig).toHaveBeenCalledWith({});
      expectOutputToContain('Focus cleared');
    });
    
    it('should show message when no module is focused', async () => {
      await focus(null, { clear: true });
      
      expectOutputToContain('No module is currently in focus');
      expect(configManager.saveConfig).not.toHaveBeenCalled();
    });
  });
  
  describe('error handling', () => {
    it('should handle errors during focus setting', async () => {
      configManager.saveConfig.mockRejectedValueOnce(new Error('Test error'));
      
      await focus('test-module');
      
      expectOutputToContain('Error setting focus', 'error');
    });
    
    it('should handle errors during focus showing', async () => {
      configManager.getConfig.mockRejectedValueOnce(new Error('Test error'));
      
      await focus(null);
      
      expectOutputToContain('Error showing focus', 'error');
    });
    
    it('should handle errors during focus clearing', async () => {
      configManager.getConfig.mockRejectedValueOnce(new Error('Test error'));
      
      await focus(null, { clear: true });
      
      expectOutputToContain('Error clearing focus', 'error');
    });
  });
});
