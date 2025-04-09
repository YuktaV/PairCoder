/**
 * Tests for the scan CLI command
 */

const path = require('path');
const glob = require('glob');
const { scanCmd } = require('../src/cli/commands/scan');
const { scannerConfig, DEFAULT_EXCLUSIONS } = require('../src/scanner/config');

// Mock dependencies
jest.mock('glob', () => ({
  sync: jest.fn()
}));

jest.mock('../src/scanner/config', () => ({
  scannerConfig: {
    getExclusions: jest.fn()
  },
  DEFAULT_EXCLUSIONS: [
    'node_modules',
    '.git',
    'dist',
    'build'
  ]
}));

describe('scan command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset console output mocks
    global.consoleOutput = {
      log: [],
      error: [],
      warn: []
    };
    
    // Setup default mock behavior
    scannerConfig.getExclusions.mockResolvedValue([
      'node_modules',
      '.git',
      'dist',
      'build'
    ]);
    
    glob.sync.mockReturnValue([
      'src/index.js',
      'src/cli/commands/scan.js',
      'src/scanner/config.js',
      'tests/scan.test.js',
      'README.md'
    ]);
  });
  
  it('should scan project and display file count', async () => {
    await scanCmd();
    
    expect(scannerConfig.getExclusions).toHaveBeenCalled();
    expect(glob.sync).toHaveBeenCalledWith('**/*', expect.any(Object));
    
    expectOutputToContain('Scanning project');
    expectOutputToContain('Found 5 files in the project');
  });
  
  it('should convert simple exclusion patterns to glob patterns', async () => {
    scannerConfig.getExclusions.mockResolvedValueOnce([
      'node_modules',  // Simple pattern (should be converted)
      '**/.vscode/**', // Already a glob pattern (should not be converted)
      'temp'           // Simple pattern (should be converted)
    ]);
    
    await scanCmd();
    
    expect(glob.sync).toHaveBeenCalledWith('**/*', {
      ignore: [
        '**/node_modules/**',
        '**/.vscode/**',
        '**/temp/**'
      ],
      nodir: true,
      dot: false
    });
  });
  
  it('should group files by type', async () => {
    // Test with files that have extensions
    glob.sync.mockReturnValueOnce([
      'src/index.js',
      'src/cli/commands/scan.js',
      'tests/test.js',
      'README.md',
      'LICENSE.txt'
    ]);
    
    await scanCmd();
    
    expectOutputToContain('File Types:');
    expectOutputToContain('js:');
    expectOutputToContain('md:');
    expectOutputToContain('txt:');
  });
  
  it('should handle files without extensions', async () => {
    // Test with files without extensions
    glob.sync.mockReturnValueOnce([
      'README',
      'LICENSE',
      'Dockerfile',
      '.gitignore'
    ]);
    
    await scanCmd();
    
    expectOutputToContain('File Types:');
    expectOutputToContain('unknown:');
  });
  
  it('should output JSON format when requested', async () => {
    await scanCmd({ json: true });
    
    const jsonOutput = global.consoleOutput.log.find(line => line.startsWith('{'));
    expect(jsonOutput).toBeTruthy();
    
    const parsed = JSON.parse(jsonOutput);
    expect(parsed).toHaveProperty('fileCount', 5);
    expect(parsed).toHaveProperty('files');
    expect(parsed).toHaveProperty('exclusions');
  });
  
  it('should handle errors during scanning', async () => {
    // Simulate an error
    glob.sync.mockImplementationOnce(() => {
      throw new Error('Test error');
    });
    
    await scanCmd();
    
    expectOutputToContain('Error scanning project', 'error');
  });
});
