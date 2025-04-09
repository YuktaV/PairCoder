/**
 * PairCoder Export Command Tests
 * 
 * Tests for the export command functionality using dependency injection
 * to mock all external dependencies for comprehensive coverage.
 */

const { createExportCommand } = require('../../../src/cli/commands/export-factory');
const path = require('path');

describe('Export Command', () => {
  // Mock dependencies
  const mockFs = {
    writeFile: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockClipboard = {
    write: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockContextGenerator = {
    exportContext: jest.fn()
  };
  
  const mockConfigManager = {
    getValue: jest.fn()
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
    mockContextGenerator.exportContext.mockResolvedValue({
      moduleName: 'test-module',
      level: 'medium',
      tokenCount: 3000,
      optimized: true,
      context: '*Note: Context was optimized. Reduced by 25.5%.*\n# Test Module\nThis is test content.'
    });
    
    mockConfigManager.getValue.mockImplementation(async (key) => {
      if (key === 'context.defaultLevel') return 'medium';
      if (key === 'context.tokenBudget') return 4000;
      return null;
    });
  });
  
  // Restore console methods
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  // Create export command with mocked dependencies
  const { exportCmd } = createExportCommand({
    fs: mockFs,
    clipboard: mockClipboard,
    contextGenerator: mockContextGenerator,
    configManager: mockConfigManager
  });
  
  test('exports context with default options', async () => {
    const result = await exportCmd('test-module');
    
    expect(result.success).toBe(true);
    expect(mockContextGenerator.exportContext).toHaveBeenCalledWith('test-module', {
      level: 'medium',
      tokenBudget: 4000,
      optimize: true
    });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Context generated successfully'));
  });
  
  test('exports context with custom detail level', async () => {
    const result = await exportCmd('test-module', { level: 'high' });
    
    expect(result.success).toBe(true);
    expect(mockContextGenerator.exportContext).toHaveBeenCalledWith('test-module', {
      level: 'high',
      tokenBudget: 4000,
      optimize: true
    });
  });
  
  test('exports context with custom token budget', async () => {
    const result = await exportCmd('test-module', { tokens: '6000' });
    
    expect(result.success).toBe(true);
    expect(mockContextGenerator.exportContext).toHaveBeenCalledWith('test-module', {
      level: 'medium',
      tokenBudget: 6000,
      optimize: true
    });
  });
  
  test('exports context without optimization', async () => {
    const result = await exportCmd('test-module', { optimize: false });
    
    expect(result.success).toBe(true);
    expect(mockContextGenerator.exportContext).toHaveBeenCalledWith('test-module', {
      level: 'medium',
      tokenBudget: 4000,
      optimize: false
    });
  });
  
  test('writes context to file with specified path', async () => {
    const result = await exportCmd('test-module', { output: 'output.md' });
    
    expect(result.success).toBe(true);
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('output.md'),
      expect.any(String),
      'utf8'
    );
  });
  
  test('adds appropriate file extension when not provided', async () => {
    const result = await exportCmd('test-module', { output: 'output', format: 'json' });
    
    expect(result.success).toBe(true);
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('output.json'),
      expect.any(String),
      'utf8'
    );
  });
  
  test('copies context to clipboard', async () => {
    const result = await exportCmd('test-module', { clipboard: true });
    
    expect(result.success).toBe(true);
    expect(mockClipboard.write).toHaveBeenCalled();
  });
  
  test('formats output as JSON', async () => {
    const result = await exportCmd('test-module', { format: 'json', clipboard: true });
    
    expect(result.success).toBe(true);
    expect(mockClipboard.write).toHaveBeenCalledWith(expect.stringContaining('"moduleName":"test-module"'));
  });
  
  test('formats output as text', async () => {
    mockContextGenerator.exportContext.mockResolvedValueOnce({
      moduleName: 'test-module',
      level: 'medium',
      tokenCount: 3000,
      optimized: true,
      context: '# Test Module\nThis is **bold** and `code`.\n```javascript\nconst x = 1;\n```'
    });
    
    const result = await exportCmd('test-module', { format: 'text', clipboard: true });
    
    expect(result.success).toBe(true);
    // Text format should strip markdown formatting
    expect(mockClipboard.write).toHaveBeenCalledWith(expect.not.stringContaining('# Test Module'));
    expect(mockClipboard.write).toHaveBeenCalledWith(expect.stringContaining('Test Module'));
    expect(mockClipboard.write).toHaveBeenCalledWith(expect.not.stringContaining('**bold**'));
    expect(mockClipboard.write).toHaveBeenCalledWith(expect.stringContaining('bold'));
    expect(mockClipboard.write).toHaveBeenCalledWith(expect.not.stringContaining('`code`'));
    expect(mockClipboard.write).toHaveBeenCalledWith(expect.stringContaining('code'));
  });
  
  test('views full context when --view option is provided', async () => {
    const result = await exportCmd('test-module', { view: true });
    
    expect(result.success).toBe(true);
    // Full context should be logged
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('# Test Module\nThis is test content.'));
  });
  
  test('handles invalid detail level', async () => {
    const result = await exportCmd('test-module', { level: 'invalid' });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid detail level: invalid');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid detail level'));
  });
  
  test('handles invalid format', async () => {
    const result = await exportCmd('test-module', { format: 'invalid' });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid format: invalid');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid format'));
  });
  
  test('handles error from context generator', async () => {
    const testError = new Error('Module not found');
    mockContextGenerator.exportContext.mockRejectedValueOnce(testError);
    
    const result = await exportCmd('test-module');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Module not found');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error exporting context'), testError.message);
  });
  
  test('generates optimization stats when optimization was performed', async () => {
    await exportCmd('test-module');
    
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Token Optimization Statistics'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Reduction percentage:'));
  });
  
  test('shows message when no optimization was performed', async () => {
    mockContextGenerator.exportContext.mockResolvedValueOnce({
      moduleName: 'test-module',
      level: 'medium',
      tokenCount: 3000,
      optimized: false,
      context: '# Test Module\nThis is test content.'
    });
    
    await exportCmd('test-module');
    
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No optimization was performed'));
  });
  
  test('uses absolute path for output file', async () => {
    // When a relative path is provided
    await exportCmd('test-module', { output: 'relative/path/output.md' });
    
    // Should convert to absolute path
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/^[\/\\]/), // Should start with / or \ (for Windows)
      expect.any(String),
      'utf8'
    );
  });
  
  test('passes correct command definition', () => {
    const { exportCommand } = createExportCommand({
      fs: mockFs,
      clipboard: mockClipboard,
      contextGenerator: mockContextGenerator,
      configManager: mockConfigManager
    });
    
    expect(exportCommand).toEqual({
      command: 'export <module>',
      description: 'Export module context for use with Claude',
      options: expect.arrayContaining([
        { flags: '-f, --format <format>', description: 'Output format (markdown, text, json)' },
        { flags: '-l, --level <level>', description: 'Detail level (low, medium, high)' },
        { flags: '-t, --tokens <number>', description: 'Token budget for context' },
        { flags: '-o, --output <file>', description: 'Write context to file' },
        { flags: '-c, --clipboard', description: 'Copy context to clipboard' },
        { flags: '-v, --view', description: 'View the full context' },
        { flags: '--no-optimize', description: 'Disable context optimization' }
      ]),
      action: exportCmd
    });
  });
  
  test('attaches dependencies for testing', () => {
    const { exportCmd } = createExportCommand({
      fs: mockFs,
      clipboard: mockClipboard,
      contextGenerator: mockContextGenerator,
      configManager: mockConfigManager
    });
    
    expect(exportCmd._deps).toEqual({
      fs: mockFs,
      clipboard: mockClipboard,
      contextGenerator: mockContextGenerator,
      configManager: mockConfigManager
    });
  });
});
