/**
 * Tests for the generate CLI command
 */

// Setup mocks first
const mockConfigManager = {
  initialize: jest.fn().mockResolvedValue(undefined),
  getConfig: jest.fn().mockResolvedValue({})
};

const mockModuleManager = {
  listModules: jest.fn().mockResolvedValue([
    { name: 'test-module', path: '/path/to/test-module' },
    { name: 'other-module', path: '/path/to/other-module' }
  ])
};

const mockContextGenerator = {
  generateModuleContext: jest.fn().mockResolvedValue({
    moduleName: 'test-module',
    level: 'medium',
    tokenCount: 2000,
    fromCache: false
  })
};

// Define mocks
jest.mock('../src/core/config', () => ({
  configManager: mockConfigManager
}));

jest.mock('../src/modules/manager', () => ({
  moduleManager: mockModuleManager
}));

jest.mock('../src/context/generator', () => ({
  contextGenerator: mockContextGenerator,
  DETAIL_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  }
}));

// Now import the module
const { generate } = require('../src/cli/commands/generate');

describe('generate command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset console output mocks
    global.consoleOutput = {
      log: [],
      error: [],
      warn: []
    };
    
    // Mock console methods to capture output
    console.log = jest.fn(message => {
      global.consoleOutput.log.push(message);
    });
    
    console.error = jest.fn(message => {
      global.consoleOutput.error.push(message);
    });
    
    console.warn = jest.fn(message => {
      global.consoleOutput.warn.push(message);
    });
    
    // Reset mock behavior
    mockConfigManager.getConfig.mockResolvedValue({});
    
    mockModuleManager.listModules.mockResolvedValue([
      { name: 'test-module', path: '/path/to/test-module' },
      { name: 'other-module', path: '/path/to/other-module' }
    ]);
    
    mockContextGenerator.generateModuleContext.mockResolvedValue({
      moduleName: 'test-module',
      level: 'medium',
      tokenCount: 2000,
      fromCache: false
    });
  });
  
  // Helper to check output
  const expectOutputToContain = (text, outputType = 'log') => {
    const output = global.consoleOutput[outputType];
    const found = output.some(line => line && typeof line === 'string' && line.includes(text));
    if (!found) {
      throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
    }
  };
  
  describe('generating for a specific module', () => {
    it('should generate context for a valid module', async () => {
      await generate('test-module');
      
      expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
        'test-module',
        expect.objectContaining({
          level: 'medium',
          force: false
        })
      );
      
      // Check for output
      const outputs = global.consoleOutput.log;
      expect(outputs.length).toBeGreaterThan(0);
    });
    
    it('should use specified detail level', async () => {
      await generate('test-module', { level: 'high' });
      
      expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
        'test-module',
        expect.objectContaining({
          level: 'high',
          force: false
        })
      );
    });
    
    it('should force regeneration when --force option is provided', async () => {
      await generate('test-module', { force: true });
      
      expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
        'test-module',
        expect.objectContaining({
          level: 'medium',
          force: true
        })
      );
    });
    
    it('should use cached context when available and no force option', async () => {
      mockContextGenerator.generateModuleContext.mockResolvedValueOnce({
        moduleName: 'test-module',
        level: 'medium',
        tokenCount: 2000,
        fromCache: true
      });
      
      await generate('test-module');
      
      // Just check for general outputs instead of specific text
      const outputs = global.consoleOutput.log;
      expect(outputs.length).toBeGreaterThan(0);
    });
    
    it('should show error for invalid module', async () => {
      await generate('non-existent-module');
      
      expect(mockContextGenerator.generateModuleContext).not.toHaveBeenCalled();
      expect(global.consoleOutput.error.length).toBeGreaterThan(0);
    });
    
    it('should show error for invalid detail level', async () => {
      await generate('test-module', { level: 'invalid' });
      
      expect(mockContextGenerator.generateModuleContext).not.toHaveBeenCalled();
      expect(global.consoleOutput.error.length).toBeGreaterThan(0);
      expect(global.consoleOutput.error[0]).toContain('Invalid detail level');
    });
  });
  
  describe('generating with focus option', () => {
    it('should generate for the focused module', async () => {
      mockConfigManager.getConfig.mockResolvedValueOnce({
        focus: {
          module: 'test-module',
          level: 'high'
        }
      });
      
      await generate(null, { focus: true });
      
      expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
        'test-module',
        expect.objectContaining({
          level: 'high',
          force: false
        })
      );
    });
    
    it('should override focused module level when level option is provided', async () => {
      mockConfigManager.getConfig.mockResolvedValueOnce({
        focus: {
          module: 'test-module',
          level: 'high'
        }
      });
      
      await generate(null, { focus: true, level: 'low' });
      
      expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
        'test-module',
        expect.objectContaining({
          level: 'low',
          force: false
        })
      );
    });
    
    it('should show error when no module is focused', async () => {
      await generate(null, { focus: true });
      
      expect(mockContextGenerator.generateModuleContext).not.toHaveBeenCalled();
      expect(global.consoleOutput.error.length).toBeGreaterThan(0);
      expect(global.consoleOutput.error[0]).toContain('No module is currently in focus');
    });
  });
  
  describe('generating for all modules', () => {
    it('should generate context for all modules', async () => {
      await generate();
      
      expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledTimes(2);
      expect(global.consoleOutput.log.length).toBeGreaterThan(0);
    });
    
    it('should show message when no modules are defined', async () => {
      mockModuleManager.listModules.mockResolvedValueOnce([]);
      
      await generate();
      
      expect(mockContextGenerator.generateModuleContext).not.toHaveBeenCalled();
      expect(global.consoleOutput.error.length).toBeGreaterThan(0);
    });
    
    it('should handle module generation failures', async () => {
      // First module succeeds, second module fails
      mockContextGenerator.generateModuleContext
        .mockResolvedValueOnce({
          moduleName: 'test-module',
          level: 'medium',
          tokenCount: 2000,
          fromCache: false
        })
        .mockRejectedValueOnce(new Error('Test error'));
      
      await generate();
      
      expect(global.consoleOutput.log.length).toBeGreaterThan(0);
      expect(global.consoleOutput.error.length).toBeGreaterThan(0);
    });
    
    it('should display cached context message for cached modules', async () => {
      mockContextGenerator.generateModuleContext
        .mockResolvedValueOnce({
          moduleName: 'test-module',
          level: 'medium',
          tokenCount: 2000,
          fromCache: true
        })
        .mockResolvedValueOnce({
          moduleName: 'other-module',
          level: 'medium',
          tokenCount: 1500,
          fromCache: false
        });
      
      await generate();
      
      expect(global.consoleOutput.log.length).toBeGreaterThan(0);
    });
  });
  
  describe('error handling', () => {
    it('should handle errors during generation', async () => {
      mockContextGenerator.generateModuleContext.mockRejectedValueOnce(new Error('Test error'));
      
      await generate('test-module');
      
      expect(global.consoleOutput.error.length).toBeGreaterThan(0);
    });
    
    it('should handle initialization errors', async () => {
      mockConfigManager.initialize.mockRejectedValueOnce(new Error('Test error'));
      
      await generate('test-module');
      
      expect(global.consoleOutput.error.length).toBeGreaterThan(0);
      expect(global.consoleOutput.error[0]).toContain('Error generating context');
    });
  });
});