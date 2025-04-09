/**
 * PairCoder Generate Command Tests
 * 
 * Tests for the generate command functionality using dependency injection
 * to mock all external dependencies for comprehensive coverage.
 */

const { createGenerateCommand } = require('../../../src/cli/commands/generate-factory');

describe('Generate Command', () => {
  // Mock dependencies
  const mockConfigManager = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getConfig: jest.fn(),
    saveConfig: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockModuleManager = {
    listModules: jest.fn()
  };
  
  const mockContextGenerator = {
    generateModuleContext: jest.fn()
  };
  
  const MOCK_DETAIL_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  };
  
  // Mock ora spinner
  const mockSpinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis()
  };
  
  const mockOra = jest.fn().mockReturnValue(mockSpinner);
  
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  // Mock console methods
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockConfigManager.getConfig.mockResolvedValue({});
    mockModuleManager.listModules.mockResolvedValue([
      { name: 'module1', path: '/path/to/module1' },
      { name: 'module2', path: '/path/to/module2' }
    ]);
    mockContextGenerator.generateModuleContext.mockResolvedValue({
      tokenCount: 3000,
      fromCache: false
    });
  });
  
  // Restore console methods
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  // Create generate command with mocked dependencies
  const { generateCmd } = createGenerateCommand({
    configManager: mockConfigManager,
    moduleManager: mockModuleManager,
    contextGenerator: mockContextGenerator,
    DETAIL_LEVELS: MOCK_DETAIL_LEVELS,
    ora: mockOra
  });
  
  test('initializes config when executed', async () => {
    await generateCmd('module1');
    
    expect(mockConfigManager.initialize).toHaveBeenCalled();
  });
  
  test('generates context for specified module with default level', async () => {
    const result = await generateCmd('module1');
    
    expect(result.success).toBe(true);
    expect(result.moduleName).toBe('module1');
    expect(result.tokenCount).toBe(3000);
    expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
      'module1',
      {
        level: 'medium',
        force: false
      }
    );
    expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.stringContaining('Generated context'));
  });
  
  test('generates context with custom detail level', async () => {
    const result = await generateCmd('module1', { level: 'high' });
    
    expect(result.success).toBe(true);
    expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
      'module1',
      {
        level: 'high',
        force: false
      }
    );
  });
  
  test('forces regeneration with --force option', async () => {
    const result = await generateCmd('module1', { force: true });
    
    expect(result.success).toBe(true);
    expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
      'module1',
      {
        level: 'medium',
        force: true
      }
    );
  });
  
  test('shows message when using cached context', async () => {
    mockContextGenerator.generateModuleContext.mockResolvedValueOnce({
      tokenCount: 3000,
      fromCache: true
    });
    
    const result = await generateCmd('module1');
    
    expect(result.success).toBe(true);
    expect(result.fromCache).toBe(true);
    expect(mockSpinner.succeed).toHaveBeenCalledWith(expect.stringContaining('Using cached context'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Use --force to regenerate'));
  });
  
  test('rejects invalid detail level', async () => {
    const result = await generateCmd('module1', { level: 'invalid-level' });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid detail level 'invalid-level'");
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid detail level'));
    expect(mockContextGenerator.generateModuleContext).not.toHaveBeenCalled();
  });
  
  test('rejects non-existent module', async () => {
    const result = await generateCmd('non-existent-module');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe("Module 'non-existent-module' not found");
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('not found'));
    expect(mockContextGenerator.generateModuleContext).not.toHaveBeenCalled();
  });
  
  test('generates context for focused module with --focus option', async () => {
    mockConfigManager.getConfig.mockResolvedValueOnce({
      focus: {
        module: 'focused-module',
        level: 'high',
        timestamp: '2023-01-01T12:00:00Z'
      }
    });
    
    const result = await generateCmd(null, { focus: true });
    
    expect(result.success).toBe(true);
    expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
      'focused-module',
      {
        level: 'high',
        force: false
      }
    );
  });
  
  test('shows error when using --focus with no focused module', async () => {
    const result = await generateCmd(null, { focus: true });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('No module is currently in focus');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('No module is currently in focus'));
    expect(mockContextGenerator.generateModuleContext).not.toHaveBeenCalled();
  });
  
  test('generates context for all modules when no module specified', async () => {
    const result = await generateCmd();
    
    expect(result.success).toBe(true);
    expect(result.totalModules).toBe(2);
    expect(result.successCount).toBe(2);
    expect(result.failCount).toBe(0);
    expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Context generation complete: 2 succeeded, 0 failed'));
  });
  
  test('shows summary of successful and failed modules', async () => {
    mockContextGenerator.generateModuleContext
      .mockResolvedValueOnce({ tokenCount: 3000, fromCache: false })
      .mockRejectedValueOnce(new Error('Generation failed'));
    
    const result = await generateCmd();
    
    expect(result.success).toBe(true);
    expect(result.successCount).toBe(1);
    expect(result.failCount).toBe(1);
    expect(mockSpinner.succeed).toHaveBeenCalledTimes(1);
    expect(mockSpinner.fail).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Context generation complete: 1 succeeded, 1 failed'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Some modules failed'));
  });
  
  test('shows error when no modules found', async () => {
    mockModuleManager.listModules.mockResolvedValueOnce([]);
    
    const result = await generateCmd();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('No modules found');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('No modules found'));
    expect(mockContextGenerator.generateModuleContext).not.toHaveBeenCalled();
  });
  
  test('handles errors from context generator for specific module', async () => {
    const testError = new Error('Generation error');
    mockContextGenerator.generateModuleContext.mockRejectedValueOnce(testError);
    
    const result = await generateCmd('module1');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Generation error');
    expect(mockSpinner.fail).toHaveBeenCalledWith(expect.stringContaining('Failed to generate context'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error:'), testError.message);
  });
  
  test('handles errors from module manager', async () => {
    const testError = new Error('Module listing error');
    mockModuleManager.listModules.mockRejectedValueOnce(testError);
    
    const result = await generateCmd('module1');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Module listing error');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error generating context'), testError.message);
  });
  
  test('passes correct command definition', () => {
    const { generateCommand } = createGenerateCommand({
      configManager: mockConfigManager,
      moduleManager: mockModuleManager,
      contextGenerator: mockContextGenerator,
      DETAIL_LEVELS: MOCK_DETAIL_LEVELS,
      ora: mockOra
    });
    
    expect(generateCommand).toEqual({
      command: 'generate [module]',
      description: 'Generate context for modules',
      options: expect.arrayContaining([
        { flags: '-l, --level <level>', description: 'Detail level (low, medium, high)' },
        { flags: '-f, --force', description: 'Force regeneration even if cached' },
        { flags: '--focus', description: 'Generate for the focused module' }
      ]),
      action: generateCmd
    });
  });
  
  test('attaches dependencies for testing', () => {
    expect(generateCmd._deps).toEqual({
      configManager: mockConfigManager,
      moduleManager: mockModuleManager,
      contextGenerator: mockContextGenerator,
      DETAIL_LEVELS: MOCK_DETAIL_LEVELS,
      ora: mockOra
    });
  });
});
