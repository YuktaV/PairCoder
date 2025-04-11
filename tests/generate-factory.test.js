/**
 * Tests for the generate-factory.js module
 */

const { createGenerateCommand } = require('../src/cli/commands/generate-factory');

describe('generate-factory.js', () => {
  let mockConfigManager;
  let mockModuleManager;
  let mockContextGenerator;
  let mockOra;
  let generateCmd;
  
  beforeEach(() => {
    // Mock dependencies
    mockConfigManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getConfig: jest.fn().mockResolvedValue({
        focus: {
          module: 'focused-module',
          level: 'medium'
        }
      })
    };
    
    mockModuleManager = {
      listModules: jest.fn().mockResolvedValue([
        { name: 'module1' },
        { name: 'module2' },
        { name: 'focused-module' }
      ])
    };
    
    mockContextGenerator = {
      generateModuleContext: jest.fn().mockResolvedValue({
        tokenCount: 2000,
        fromCache: false
      })
    };
    
    // Mock ora spinner
    mockOra = jest.fn().mockReturnValue({
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis()
    });
    
    // Create generate command with mocked dependencies
    const { generateCmd: cmd } = createGenerateCommand({
      configManager: mockConfigManager,
      moduleManager: mockModuleManager,
      contextGenerator: mockContextGenerator,
      DETAIL_LEVELS: { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' },
      ora: mockOra
    });
    
    generateCmd = cmd;
    
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
  });
  
  // Helper function to check output
  const expectOutputToContain = (text, outputType = 'log') => {
    const output = global.consoleOutput[outputType];
    const found = output.some(line => line && typeof line === 'string' && line.includes(text));
    if (!found) {
      throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
    }
  };
  
  describe('generateCmd function', () => {
    it('should generate context for a specific module', async () => {
      const result = await generateCmd('module1');
      
      expect(result.success).toBe(true);
      expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
        'module1',
        expect.objectContaining({ level: 'medium' })
      );
    });
    
    it('should generate context for all modules when no module specified', async () => {
      const result = await generateCmd();
      
      expect(result.success).toBe(true);
      expect(mockModuleManager.listModules).toHaveBeenCalled();
      expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledTimes(3);
    });
    
    it('should handle no modules found case', async () => {
      mockModuleManager.listModules.mockResolvedValueOnce([]);
      
      const result = await generateCmd();
      
      expect(result.success).toBe(false);
      expectOutputToContain('No modules found', 'error');
    });
    
    it('should handle no focused module with --focus option', async () => {
      mockConfigManager.getConfig.mockResolvedValueOnce({focus: null});
      
      const result = await generateCmd(null, {focus: true});
      
      expect(result.success).toBe(false);
      expectOutputToContain('No module is currently in focus', 'error');
    });
    
    it('should handle invalid detail level', async () => {
      const result = await generateCmd('module1', { level: 'invalid-level' });
      
      expect(result.success).toBe(false);
      expectOutputToContain('Invalid detail level', 'error');
    });
    
    it('should focus on the currently focused module', async () => {
      const result = await generateCmd(null, { focus: true });
      
      expect(result.success).toBe(true);
      expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
        'focused-module',
        expect.objectContaining({ level: 'medium' })
      );
    });
    
    it('should respect force flag for regeneration', async () => {
      await generateCmd('module1', { force: true });
      
      expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
        'module1',
        expect.objectContaining({ force: true })
      );
    });
    
    it('should handle case when module does not exist', async () => {
      const result = await generateCmd('nonexistent-module');
      
      expect(result.success).toBe(false);
      expectOutputToContain('not found', 'error');
    });
    
    it('should handle error during context generation', async () => {
      mockContextGenerator.generateModuleContext.mockRejectedValueOnce(
        new Error('Test error')
      );
      
      const result = await generateCmd('module1');
      
      expect(result.success).toBe(false);
      expectOutputToContain('Test error', 'error');
    });
    
    it('should handle error during module context generation in batch mode', async () => {
      // Mock generateModuleContext to throw error for one module
      mockContextGenerator.generateModuleContext
        .mockResolvedValueOnce({ tokenCount: 2000, fromCache: false })
        .mockRejectedValueOnce(new Error('Generation error'))
        .mockResolvedValueOnce({ tokenCount: 1500, fromCache: true });
      
      const result = await generateCmd();
      
      expect(result.success).toBe(true);
      expect(result.failCount).toBe(1);
      expect(result.successCount).toBe(2);
    });
  });
});
