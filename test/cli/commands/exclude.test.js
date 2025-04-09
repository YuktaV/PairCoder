/**
 * PairCoder Exclude Command Tests
 * 
 * Tests for the exclude command functionality using dependency injection
 * to mock all external dependencies for comprehensive coverage.
 */

const { createExcludeCommand } = require('../../../src/cli/commands/exclude-factory');

describe('Exclude Command', () => {
  // Mock dependencies
  const mockInquirer = {
    prompt: jest.fn()
  };
  
  const mockConfigManager = {
    initialize: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockScannerConfig = {
    getExclusions: jest.fn(),
    getUserExclusions: jest.fn(),
    addExclusion: jest.fn().mockResolvedValue(undefined),
    removeExclusion: jest.fn().mockResolvedValue(undefined),
    resetExclusions: jest.fn().mockResolvedValue(undefined)
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
    mockScannerConfig.getExclusions.mockResolvedValue([
      'node_modules',
      'dist',
      '*.log',
      'coverage'
    ]);
    
    mockScannerConfig.getUserExclusions.mockResolvedValue([
      'dist',
      '*.log',
      'coverage'
    ]);
    
    mockInquirer.prompt.mockImplementation(async (questions) => {
      if (questions[0].name === 'newPattern') {
        return { newPattern: 'test-pattern' };
      } else if (questions[0].name === 'selectedPattern') {
        return { selectedPattern: 'dist' };
      } else if (questions[0].name === 'confirmReset') {
        return { confirmReset: true };
      }
      return {};
    });
  });
  
  // Restore console methods
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  // Create exclude command with mocked dependencies
  const { excludeCmd } = createExcludeCommand({
    inquirer: mockInquirer,
    configManager: mockConfigManager,
    scannerConfig: mockScannerConfig
  });
  
  test('lists exclusions with default action', async () => {
    const result = await excludeCmd();
    
    expect(result.success).toBe(true);
    expect(result.exclusions).toHaveLength(4);
    expect(mockScannerConfig.getExclusions).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Current Exclusion Patterns'));
  });
  
  test('groups exclusions by type when listing', async () => {
    const result = await excludeCmd('list');
    
    expect(result.success).toBe(true);
    expect(result.groups).toEqual({
      directory: ['node_modules', 'dist', 'coverage'],
      file: [],
      glob: ['*.log']
    });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Directories'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Glob Patterns'));
  });
  
  test('handles no exclusions when listing', async () => {
    mockScannerConfig.getExclusions.mockResolvedValueOnce([]);
    
    const result = await excludeCmd('list');
    
    expect(result.success).toBe(true);
    expect(result.exclusions).toEqual([]);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No exclusion patterns are currently set'));
  });
  
  test('adds exclusion with specified pattern', async () => {
    const result = await excludeCmd('add', 'some-pattern');
    
    expect(result.success).toBe(true);
    expect(result.pattern).toBe('some-pattern');
    expect(mockScannerConfig.addExclusion).toHaveBeenCalledWith('some-pattern');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Added exclusion pattern'));
  });
  
  test('prompts for pattern when not provided for add', async () => {
    const result = await excludeCmd('add');
    
    expect(result.success).toBe(true);
    expect(result.pattern).toBe('test-pattern');
    expect(mockInquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'newPattern' })
    ]));
    expect(mockScannerConfig.addExclusion).toHaveBeenCalledWith('test-pattern');
  });
  
  test('removes exclusion with specified pattern', async () => {
    const result = await excludeCmd('remove', 'dist');
    
    expect(result.success).toBe(true);
    expect(result.removed).toBe(true);
    expect(result.pattern).toBe('dist');
    expect(mockScannerConfig.removeExclusion).toHaveBeenCalledWith('dist');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Removed exclusion pattern'));
  });
  
  test('handles removing non-existent pattern', async () => {
    const result = await excludeCmd('remove', 'non-existent-pattern');
    
    expect(result.success).toBe(true);
    expect(result.removed).toBe(false);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('not in the exclusion list'));
    expect(mockScannerConfig.removeExclusion).not.toHaveBeenCalled();
  });
  
  test('prompts for pattern when not provided for remove', async () => {
    const result = await excludeCmd('remove');
    
    expect(result.success).toBe(true);
    expect(result.removed).toBe(true);
    expect(result.pattern).toBe('dist');
    expect(mockInquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'selectedPattern' })
    ]));
    expect(mockScannerConfig.removeExclusion).toHaveBeenCalledWith('dist');
  });
  
  test('handles no exclusions when trying to remove', async () => {
    mockScannerConfig.getUserExclusions.mockResolvedValueOnce([]);
    
    const result = await excludeCmd('remove');
    
    expect(result.success).toBe(true);
    expect(result.removed).toBe(false);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No exclusion patterns are currently set'));
    expect(mockScannerConfig.removeExclusion).not.toHaveBeenCalled();
  });
  
  test('resets exclusions after confirmation', async () => {
    const result = await excludeCmd('reset');
    
    expect(result.success).toBe(true);
    expect(result.reset).toBe(true);
    expect(mockInquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'confirmReset' })
    ]));
    expect(mockScannerConfig.resetExclusions).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('reset to defaults'));
  });
  
  test('cancels reset when not confirmed', async () => {
    mockInquirer.prompt.mockResolvedValueOnce({ confirmReset: false });
    
    const result = await excludeCmd('reset');
    
    expect(result.success).toBe(true);
    expect(result.reset).toBe(false);
    expect(result.message).toBe('Reset cancelled');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Reset cancelled'));
    expect(mockScannerConfig.resetExclusions).not.toHaveBeenCalled();
  });
  
  test('handles error from scanner config when listing', async () => {
    const testError = new Error('Failed to get exclusions');
    mockScannerConfig.getExclusions.mockRejectedValueOnce(testError);
    
    const result = await excludeCmd('list');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to get exclusions');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error listing exclusions'), testError.message);
  });
  
  test('handles error from scanner config when adding', async () => {
    const testError = new Error('Failed to add exclusion');
    mockScannerConfig.addExclusion.mockRejectedValueOnce(testError);
    
    const result = await excludeCmd('add', 'pattern');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to add exclusion');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error adding exclusion'), testError.message);
  });
  
  test('handles error from scanner config when removing', async () => {
    const testError = new Error('Failed to remove exclusion');
    mockScannerConfig.removeExclusion.mockRejectedValueOnce(testError);
    
    const result = await excludeCmd('remove', 'dist');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to remove exclusion');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error removing exclusion'), testError.message);
  });
  
  test('handles error from scanner config when resetting', async () => {
    const testError = new Error('Failed to reset exclusions');
    mockScannerConfig.resetExclusions.mockRejectedValueOnce(testError);
    
    const result = await excludeCmd('reset');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to reset exclusions');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error resetting exclusions'), testError.message);
  });
  
  test('passes correct command definition', () => {
    const { excludeCommand } = createExcludeCommand({
      inquirer: mockInquirer,
      configManager: mockConfigManager,
      scannerConfig: mockScannerConfig
    });
    
    expect(excludeCommand).toEqual({
      command: 'exclude [action] [pattern]',
      description: 'Manage exclusion patterns for scanning',
      options: [],
      action: excludeCmd
    });
  });
  
  test('attaches dependencies for testing', () => {
    expect(excludeCmd._deps).toEqual({
      inquirer: mockInquirer,
      configManager: mockConfigManager,
      scannerConfig: mockScannerConfig
    });
  });
});
