/**
 * Tests for the scan-factory.js module
 */

const { createScanCommand } = require('../src/cli/commands/scan-factory');

describe('scan-factory.js', () => {
  let mockFs;
  let mockGlob;
  let mockScannerConfig;
  let scanCmd;
  
  beforeEach(() => {
    // Mock dependencies
    mockFs = {
      readFile: jest.fn().mockResolvedValue('{}'),
      writeFile: jest.fn().mockResolvedValue(undefined)
    };
    
    mockGlob = {
      sync: jest.fn().mockReturnValue([
        'src/index.js',
        'src/app.js',
        'src/utils/helpers.js',
        'tests/test.js',
        'package.json',
        'README.md'
      ])
    };
    
    mockScannerConfig = {
      getExclusions: jest.fn().mockResolvedValue([
        'node_modules',
        'dist',
        '.git',
        'build'
      ])
    };
    
    // Create command with mocked dependencies
    const { scanCmd: cmd } = createScanCommand({
      fs: mockFs,
      glob: mockGlob,
      scannerConfig: mockScannerConfig
    });
    
    scanCmd = cmd;
    
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
  
  describe('scanCmd function', () => {
    it('should scan project and display summary by default', async () => {
      const result = await scanCmd();
      
      expect(result.success).toBe(true);
      expect(result.fileCount).toBe(6);
      expect(mockScannerConfig.getExclusions).toHaveBeenCalled();
      expect(mockGlob.sync).toHaveBeenCalled();
      
      expectOutputToContain('Scanning project');
      expectOutputToContain('Found 6 files in the project');
      expectOutputToContain('File Types');
    });
    
    it('should output JSON when specified', async () => {
      const result = await scanCmd({ json: true });
      
      expect(result.success).toBe(true);
      
      // Check that JSON output contains the expected properties
      const jsonOutput = global.consoleOutput.log.join(' ');
      expect(jsonOutput).toContain('"fileCount":');
      expect(jsonOutput).toContain('"files":');
      expect(jsonOutput).toContain('"exclusions":');
    });
    
    it('should convert simple exclusion patterns to glob patterns', async () => {
      mockScannerConfig.getExclusions.mockResolvedValueOnce([
        'node_modules',
        'some/specific/path/*'
      ]);
      
      const result = await scanCmd();
      
      expect(result.exclusions).toContain('**/node_modules/**');
      expect(result.exclusions).toContain('some/specific/path/*');
    });
    
    it('should group files by extension', async () => {
      const result = await scanCmd();
      
      expect(result.filesByType).toBeDefined();
      expect(result.filesByType.js).toHaveLength(4);
      expect(result.filesByType.json).toHaveLength(1);
      expect(result.filesByType.md).toHaveLength(1);
    });
    
    it('should handle error during scanning', async () => {
      mockScannerConfig.getExclusions.mockRejectedValueOnce(
        new Error('Test scanner error')
      );
      
      const result = await scanCmd();
      
      expect(result.success).toBe(false);
      expectOutputToContain('Error scanning project', 'error');
    });
  });
});
