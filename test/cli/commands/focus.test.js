/**
 * PairCoder Focus Command Tests
 * 
 * Tests for the focus command functionality using dependency injection
 * to mock all external dependencies for comprehensive coverage.
 */

const { createFocusCommand } = require('../../../src/cli/commands/focus-factory');

describe('Focus Command', () => {
  // Mock dependencies
  const mockConfigManager = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getConfig: jest.fn(),
    saveConfig: jest.fn().mockResolvedValue(undefined),
    getValue: jest.fn()
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
      { name: 'existing-module', path: '/path/to/module' }
    ]);
    mockContextGenerator.generateModuleContext.mockResolvedValue({
      tokenCount: 3000
    });
  });
  
  // Restore console methods
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  // Create focus command with mocked dependencies
  const { focusCmd } = createFocusCommand({
    configManager: mockConfigManager,
    moduleManager: mockModuleManager,
    contextGenerator: mockContextGenerator,
    DETAIL_LEVELS: MOCK_DETAIL_LEVELS
  });
  
  test('initializes config when executed', async () => {
    await focusCmd('existing-module');
    
    expect(mockConfigManager.initialize).toHaveBeenCalled();
  });
  
  test('sets focus on existing module with default level', async () => {
    const result = await focusCmd('existing-module');
    
    expect(result.success).toBe(true);
    expect(result.module).toBe('existing-module');
    expect(result.level).toBe('medium');
    expect(mockConfigManager.saveConfig).toHaveBeenCalledWith({
      focus: {
        module: 'existing-module',
        level: 'medium',
        timestamp: expect.any(String)
      }
    });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Focus set on module'));
  });
  
  test('sets focus with custom detail level', async () => {
    const result = await focusCmd('existing-module', { level: 'high' });
    
    expect(result.success).toBe(true);
    expect(result.level).toBe('high');
    expect(mockConfigManager.saveConfig).toHaveBeenCalledWith({
      focus: {
        module: 'existing-module',
        level: 'high',
        timestamp: expect.any(String)
      }
    });
  });
  
  test('generates context for focused module by default', async () => {
    const result = await focusCmd('existing-module');
    
    expect(result.contextGenerated).toBe(true);
    expect(result.tokenCount).toBe(3000);
    expect(mockContextGenerator.generateModuleContext).toHaveBeenCalledWith(
      'existing-module',
      {
        level: 'medium',
        force: true
      }
    );
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Context generated'));
  });
  
  test('skips context generation with --no-generate option', async () => {
    const result = await focusCmd('existing-module', { generate: false });
    
    expect(result.contextGenerated).toBe(false);
    expect(mockContextGenerator.generateModuleContext).not.toHaveBeenCalled();
  });
  
  test('rejects invalid detail level', async () => {
    const result = await focusCmd('existing-module', { level: 'invalid-level' });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid detail level 'invalid-level'");
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid detail level'));
    expect(mockConfigManager.saveConfig).not.toHaveBeenCalled();
  });
  
  test('rejects non-existent module', async () => {
    const result = await focusCmd('non-existent-module');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe("Module 'non-existent-module' not found");
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('not found'));
    expect(mockConfigManager.saveConfig).not.toHaveBeenCalled();
  });
  
  test('shows current focus when no module specified', async () => {
    mockConfigManager.getConfig.mockResolvedValueOnce({
      focus: {
        module: 'currently-focused',
        level: 'high',
        timestamp: '2023-01-01T12:00:00Z'
      }
    });
    
    const result = await focusCmd();
    
    expect(result.success).toBe(true);
    expect(result.focused).toBe(true);
    expect(result.module).toBe('currently-focused');
    expect(result.level).toBe('high');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Current focus'));
  });
  
  test('shows message when no module is in focus', async () => {
    const result = await focusCmd();
    
    expect(result.success).toBe(true);
    expect(result.focused).toBe(false);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No module is currently in focus'));
  });
  
  test('clears current focus with --clear option', async () => {
    mockConfigManager.getConfig.mockResolvedValueOnce({
      focus: {
        module: 'currently-focused',
        level: 'high',
        timestamp: '2023-01-01T12:00:00Z'
      }
    });
    
    const result = await focusCmd(null, { clear: true });
    
    expect(result.success).toBe(true);
    expect(result.wasCleared).toBe(true);
    expect(result.previousModule).toBe('currently-focused');
    expect(mockConfigManager.saveConfig).toHaveBeenCalledWith({});
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Focus cleared'));
  });
  
  test('shows message when trying to clear with no focus set', async () => {
    const result = await focusCmd(null, { clear: true });
    
    expect(result.success).toBe(true);
    expect(result.wasCleared).toBe(false);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No module is currently in focus'));
    expect(mockConfigManager.saveConfig).not.toHaveBeenCalled();
  });
  
  test('handles errors from config manager', async () => {
    const testError = new Error('Config error');
    mockConfigManager.getConfig.mockRejectedValueOnce(testError);
    
    const result = await focusCmd('existing-module');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Config error');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error setting focus'), testError.message);
  });
  
  test('handles errors from context generator', async () => {
    const testError = new Error('Generation error');
    mockContextGenerator.generateModuleContext.mockRejectedValueOnce(testError);
    
    const result = await focusCmd('existing-module');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Generation error');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error setting focus'), testError.message);
  });
  
  test('passes correct command definition', () => {
    const { focusCommand } = createFocusCommand({
      configManager: mockConfigManager,
      moduleManager: mockModuleManager,
      contextGenerator: mockContextGenerator,
      DETAIL_LEVELS: MOCK_DETAIL_LEVELS
    });
    
    expect(focusCommand).toEqual({
      command: 'focus [module]',
      description: 'Set focus on a specific module',
      options: expect.arrayContaining([
        { flags: '-l, --level <level>', description: 'Detail level (low, medium, high)' },
        { flags: '--no-generate', description: 'Skip automatic context generation' },
        { flags: '-c, --clear', description: 'Clear current focus' }
      ]),
      action: focusCmd
    });
  });
  
  test('attaches dependencies for testing', () => {
    expect(focusCmd._deps).toEqual({
      configManager: mockConfigManager,
      moduleManager: mockModuleManager,
      contextGenerator: mockContextGenerator,
      DETAIL_LEVELS: MOCK_DETAIL_LEVELS
    });
  });
});
