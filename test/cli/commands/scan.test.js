/**
 * PairCoder Scan Command Tests
 * 
 * Tests for the scan command functionality using dependency injection
 * to mock all external dependencies for comprehensive coverage.
 */

const { createScanCommand } = require('../../../src/cli/commands/scan-factory');

describe('Scan Command', () => {
  // Mock dependencies
  const mockFs = {
    readFile: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockGlob = {
    sync: jest.fn()
  };
  
  const mockScannerConfig = {
    getExclusions: jest.fn()
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
    mockScannerConfig.getExclusions.mockResolvedValue(['node_modules', 'dist', '.git']);
    mockGlob.sync.mockReturnValue([
      'src/index.js',
      'src/utils/helpers.js',
      'docs/README.md',
      'package.json'
    ]);
  });
  
  // Restore console methods
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  // Create scan command with mocked dependencies
  const { scanCmd } = createScanCommand({
    fs: mockFs,
    glob: mockGlob,
    scannerConfig: mockScannerConfig
  });
  
  test('scans project with default options', async () => {
    const result = await scanCmd();
    
    expect(result.success).toBe(true);
    expect(result.fileCount).toBe(4);
    expect(result.files).toHaveLength(4);
    expect(result.exclusions).toEqual(['**/node_modules/**', '**/dist/**', '**/.git/**']);
    expect(mockGlob.sync).toHaveBeenCalledWith('**/*', {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      nodir: true,
      dot: false
    });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Found 4 files'));
  });
  
  test('groups files by type', async () => {
    const result = await scanCmd();
    
    expect(result.filesByType).toHaveProperty('js');
    expect(result.filesByType).toHaveProperty('md');
    expect(result.filesByType).toHaveProperty('json');
    expect(result.filesByType.js).toContain('src/index.js');
    expect(result.filesByType.js).toContain('src/utils/helpers.js');
    expect(result.filesByType.md).toContain('docs/README.md');
    expect(result.filesByType.json).toContain('package.json');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('File Types:'));
  });
  
  test('outputs JSON when --json option is provided', async () => {
    const result = await scanCmd({ json: true });
    
    expect(result.success).toBe(true);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('"fileCount": 4'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('"files": ['));
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('File Types:'));
  });
  
  test('handles empty exclusion list', async () => {
    mockScannerConfig.getExclusions.mockResolvedValueOnce([]);
    
    const result = await scanCmd();
    
    expect(result.success).toBe(true);
    expect(result.exclusions).toEqual([]);
    expect(mockGlob.sync).toHaveBeenCalledWith('**/*', {
      ignore: [],
      nodir: true,
      dot: false
    });
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Using 0 exclusion patterns'));
  });
  
  test('handles no files found', async () => {
    mockGlob.sync.mockReturnValueOnce([]);
    
    const result = await scanCmd();
    
    expect(result.success).toBe(true);
    expect(result.fileCount).toBe(0);
    expect(result.files).toHaveLength(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Found 0 files'));
  });
  
  test('handles error from scanner config', async () => {
    const testError = new Error('Failed to get exclusions');
    mockScannerConfig.getExclusions.mockRejectedValueOnce(testError);
    
    const result = await scanCmd();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to get exclusions');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error scanning project:'), testError.message);
  });
  
  test('handles error from glob', async () => {
    const testError = new Error('Glob pattern error');
    mockGlob.sync.mockImplementationOnce(() => {
      throw testError;
    });
    
    const result = await scanCmd();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Glob pattern error');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error scanning project:'), testError.message);
  });
  
  test('converts simple patterns to glob patterns', async () => {
    mockScannerConfig.getExclusions.mockResolvedValueOnce([
      'node_modules',          // Simple pattern
      'dist',                  // Simple pattern
      '**/*.log',              // Already a glob pattern
      'src/test/*',            // Already a glob pattern
      'coverage/*/index.html'  // Already a glob pattern
    ]);
    
    const result = await scanCmd();
    
    expect(result.exclusions).toEqual([
      '**/node_modules/**',
      '**/dist/**',
      '**/*.log',
      'src/test/*',
      'coverage/*/index.html'
    ]);
    expect(mockGlob.sync).toHaveBeenCalledWith('**/*', {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.log',
        'src/test/*',
        'coverage/*/index.html'
      ],
      nodir: true,
      dot: false
    });
  });
  
  test('passes correct command definition', () => {
    const { scanCommand } = createScanCommand({
      fs: mockFs,
      glob: mockGlob,
      scannerConfig: mockScannerConfig
    });
    
    expect(scanCommand).toEqual({
      command: 'scan',
      description: 'Scan the project for files',
      options: [
        { flags: '--json', description: 'Output results as JSON' }
      ],
      action: scanCmd
    });
  });
  
  test('attaches dependencies for testing', () => {
    expect(scanCmd._deps).toEqual({
      fs: mockFs,
      glob: mockGlob,
      scannerConfig: mockScannerConfig
    });
  });
});
