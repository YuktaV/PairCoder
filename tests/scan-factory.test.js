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
      readFile: jest.fn().mockResolvedValue('file content')
    };
    
    mockGlob = {
      sync: jest.fn().mockReturnValue([
        'src/file1.js',
        'src/file2.js',
        'docs/readme.md',
        'config.json'
      ])
    };
    
    mockScannerConfig = {
      getExclusions: jest.fn().mockResolvedValue([
        'node_modules',
        'dist',
        '.git'
      ])
    };
    
    // Create scan command with mocked dependencies
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
    it('should handle error during scanning', async () => {
      // Mock getExclusions to throw error
      mockScannerConfig.getExclusions.mockRejectedValueOnce(
        new Error('Test scanner error')
      );
      
      const result = await scanCmd();
      
      expect(result.success).toBe(false);
      expectOutputToContain('Error scanning project', 'error');
    });
    
    it('should output JSON when json option is specified', async () => {
      const result = await scanCmd({ json: true });
      
      expect(result.success).toBe(true);
      
      // Check that JSON output was logged
      const jsonOutput = global.consoleOutput.log.find(line => 
        line.includes('"fileCount":') && line.includes('"files"')
      );
      expect(jsonOutput).toBeDefined();
    });
  });
});
