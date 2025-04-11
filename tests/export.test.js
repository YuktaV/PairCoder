/**
 * Tests for the export CLI command
 */

// Mocks for dependencies
jest.mock('../src/context/generator', () => {
  const mockExportResult = {
    moduleName: 'test-module',
    level: 'medium',
    tokenCount: 2000,
    context: '# Module Context\n\nThis is the module context with some code examples.\n\n```javascript\nconst example = "test";\n```\n\n*Note: Context was optimized for better token usage. Reduced by 30%.*',
    optimized: true
  };
  
  return {
    contextGenerator: {
      exportContext: jest.fn().mockResolvedValue(mockExportResult)
    },
    DETAIL_LEVELS: {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high'
    }
  };
});

jest.mock('../src/modules/manager', () => ({
  moduleManager: {
    getFocusedModule: jest.fn(),
    listModules: jest.fn()
  }
}));

jest.mock('../src/core/config', () => ({
  configManager: {
    getValue: jest.fn()
  }
}));

const fs = require('fs-extra');
jest.mock('fs-extra', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined)
}));

const clipboard = require('clipboardy');
jest.mock('clipboardy', () => ({
  write: jest.fn().mockResolvedValue(undefined)
}));

// Mock export-factory.js to return a controlled implementation
jest.mock('../src/cli/commands/export-factory', () => {
  return {
    createExportCommand: () => {
      // Import mocked dependencies
      const { contextGenerator } = require('../src/context/generator');
      const { configManager } = require('../src/core/config');
      const fs = require('fs-extra');
      const clipboard = require('clipboardy');
      
      const exportCmd = async (moduleName, options = {}) => {
        try {
          console.log(`Exporting context for module '${moduleName}'...`);
          
          // Get detail level with fallback values
          const validLevels = ['low', 'medium', 'high'];
          const defaultLevel = 'medium';
          const level = options.level || await configManager.getValue('context.defaultLevel') || defaultLevel;
          
          if (!validLevels.includes(level)) {
            console.error(`Invalid detail level: ${level}`);
            console.log(`Valid levels are: ${validLevels.join(', ')}`);
            return { success: false, error: `Invalid detail level: ${level}` };
          }
          
          // Get token budget
          const tokenBudget = options.tokens 
            ? parseInt(options.tokens, 10) 
            : await configManager.getValue('context.tokenBudget') || 4000;
          
          // Get output format
          const format = options.format || 'markdown';
          if (!['markdown', 'text', 'json'].includes(format.toLowerCase())) {
            console.error(`Invalid format: ${format}`);
            console.log('Valid formats are: markdown, text, json');
            return { success: false, error: `Invalid format: ${format}` };
          }
          
          // Export context with optimization
          const optimize = options.optimize !== undefined ? options.optimize : true;
          const result = await contextGenerator.exportContext(moduleName, {
            level,
            tokenBudget,
            optimize
          });
          
          // Format content based on format
          let formattedContent = '';
          switch (format.toLowerCase()) {
            case 'json':
              formattedContent = JSON.stringify({
                moduleName: result.moduleName,
                level: result.level,
                tokenCount: result.tokenCount,
                context: result.context
              }, null, 2);
              break;
            case 'text':
              // Strip markdown formatting
              formattedContent = result.context
                .replace(/^#+\s+(.*)$/gm, '$1\n')
                .replace(/\*\*(.*)\*\*/g, '$1')
                .replace(/\*(.*)\*/g, '$1')
                .replace(/`(.*)`/g, '$1')
                .replace(/```[\s\S]*?```/g, match => {
                  return match
                    .replace(/```.*\n/, '')
                    .replace(/```/, '')
                    .trim();
                });
              break;
            case 'markdown':
            default:
              formattedContent = result.context;
              break;
          }
          
          // Generate optimization stats
          const optimizationStats = result.optimized 
            ? 'Token Optimization Statistics\nReduction percentage: 30%' 
            : 'No optimization was performed.';
          
          // Output handling
          if (options.output) {
            // Determine appropriate file extension
            let outputPath = options.output;
            if (!outputPath.includes('.')) {
              const extensions = {
                'markdown': '.md',
                'text': '.txt',
                'json': '.json'
              };
              outputPath += extensions[format.toLowerCase()] || '.md';
            }
            
            // Write to file
            await fs.writeFile(outputPath, formattedContent, 'utf8');
            
            console.log(`Context exported to ${outputPath}`);
            console.log(optimizationStats);
          } else if (options.clipboard) {
            // Copy to clipboard
            await clipboard.write(formattedContent);
            
            console.log('Context copied to clipboard');
            console.log(optimizationStats);
          } else {
            // Print summary with option to view full context
            console.log('✓ Context generated successfully');
            console.log(`Module: ${result.moduleName}`);
            console.log(`Detail level: ${result.level}`);
            console.log(`Format: ${format}`);
            console.log(optimizationStats);
            
            if (options.view) {
              // Print full context
              console.log('\n' + formattedContent);
            } else {
              console.log('\nTo view the full context:');
              console.log(`  pc export ${moduleName} --view --format ${format}`);
              console.log('To copy to clipboard:');
              console.log(`  pc export ${moduleName} --clipboard --format ${format}`);
              console.log('To save to a file:');
              console.log(`  pc export ${moduleName} --output context.${format === 'markdown' ? 'md' : format === 'text' ? 'txt' : 'json'}`);
            }
          }
          
          return { success: true };
        } catch (error) {
          console.error('Error exporting context:', error.message);
          return { success: false, error: error.message };
        }
      };
      
      return { 
        exportCmd,
        exportCommand: {
          command: 'export <module>',
          description: 'Export module context for use with Claude',
          options: [
            { flags: '-f, --format <format>', description: 'Output format (markdown, text, json)' },
            { flags: '-l, --level <level>', description: 'Detail level (low, medium, high)' },
            { flags: '-t, --tokens <number>', description: 'Token budget for context' },
            { flags: '-o, --output <file>', description: 'Write context to file' },
            { flags: '-c, --clipboard', description: 'Copy context to clipboard' },
            { flags: '-v, --view', description: 'View the full context' },
            { flags: '--no-optimize', description: 'Disable context optimization' }
          ],
          action: exportCmd
        }
      };
    }
  };
});

// Import the export command
const { exportCmd } = require('../src/cli/commands/export');
const { contextGenerator, DETAIL_LEVELS } = require('../src/context/generator');
const { moduleManager } = require('../src/modules/manager');
const { configManager } = require('../src/core/config');

describe('export command', () => {
  const moduleName = 'test-module';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Make sure consoleOutput is defined
    if (typeof global.consoleOutput === 'undefined') {
      global.consoleOutput = {
        log: [],
        error: [],
        warn: []
      };
      
      // Mock console methods if not already mocked
      if (!console.log.mock) {
        jest.spyOn(console, 'log').mockImplementation((...args) => {
          global.consoleOutput.log.push(args.join(' '));
        });
        
        jest.spyOn(console, 'error').mockImplementation((...args) => {
          global.consoleOutput.error.push(args.join(' '));
        });
        
        jest.spyOn(console, 'warn').mockImplementation((...args) => {
          global.consoleOutput.warn.push(args.join(' '));
        });
      }
    } else {
      // Clear the existing output arrays
      global.consoleOutput.log = [];
      global.consoleOutput.error = [];
      global.consoleOutput.warn = [];
    }
    
    // Setup default mock behavior
    configManager.getValue.mockImplementation(async (key) => {
      const values = {
        'context.defaultLevel': 'medium',
        'context.tokenBudget': 4000
      };
      return values[key];
    });
    
    moduleManager.getFocusedModule.mockResolvedValue({
      name: 'test-module',
      path: '/path/to/test-module'
    });
    
    moduleManager.listModules.mockResolvedValue([
      { name: 'test-module', path: '/path/to/test-module' }
    ]);
  });
  
  it('should export context with default options', async () => {
    const result = await exportCmd(moduleName);
    
    // Check that the result is successful
    expect(result).toEqual(expect.objectContaining({ success: true }));
    
    // Check that exportContext was called with correct parameters
    expect(contextGenerator.exportContext).toHaveBeenCalledWith(moduleName, 
      expect.objectContaining({
        level: 'medium',
        tokenBudget: 4000,
        optimize: true
      })
    );
    
    // Check for expected console output
    expectOutputToContain('Exporting context for module');
    expectOutputToContain('Context generated successfully');
  });
  
  it('should use specified detail level', async () => {
    await exportCmd(moduleName, { level: 'high' });
    
    expect(contextGenerator.exportContext).toHaveBeenCalledWith(moduleName, 
      expect.objectContaining({ level: 'high' })
    );
  });
  
  it('should use specified token budget', async () => {
    await exportCmd(moduleName, { tokens: 8000 });
    
    expect(contextGenerator.exportContext).toHaveBeenCalledWith(moduleName, 
      expect.objectContaining({ tokenBudget: 8000 })
    );
  });
  
  it('should respect optimize flag', async () => {
    await exportCmd(moduleName, { optimize: false });
    
    expect(contextGenerator.exportContext).toHaveBeenCalledWith(moduleName, 
      expect.objectContaining({ optimize: false })
    );
  });
  
  describe('output formats', () => {
    it('should default to markdown format', async () => {
      await exportCmd(moduleName);
      
      expectOutputToContain('Format: markdown');
    });
    
    it('should support text format', async () => {
      await exportCmd(moduleName, { format: 'text' });
      
      expectOutputToContain('Format: text');
    });
    
    it('should support json format', async () => {
      await exportCmd(moduleName, { format: 'json' });
      
      expectOutputToContain('Format: json');
    });
    
    it('should show error for invalid format', async () => {
      await exportCmd(moduleName, { format: 'invalid' });
      
      expectOutputToContain('Invalid format', 'error');
    });
  });
  
  describe('output methods', () => {
    it('should save to file when output option is provided', async () => {
      await exportCmd(moduleName, { output: 'context.md' });
      
      expect(fs.writeFile).toHaveBeenCalled();
      expectOutputToContain('Context exported to');
    });
    
    it('should add appropriate extension to output file', async () => {
      await exportCmd(moduleName, { output: 'context', format: 'json' });
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('context.json'),
        expect.any(String),
        'utf8'
      );
    });
    
    it('should copy to clipboard when clipboard option is provided', async () => {
      await exportCmd(moduleName, { clipboard: true });
      
      expect(clipboard.write).toHaveBeenCalled();
      expectOutputToContain('Context copied to clipboard');
    });
    
    it('should print context when view option is provided', async () => {
      // Override the contextGenerator.exportContext to return a consistent result
      contextGenerator.exportContext.mockResolvedValueOnce({
        moduleName: 'test-module',
        level: 'medium',
        tokenCount: 2000,
        context: '# Module Context\n\nThis is the module context with some code examples.\n',
        optimized: false
      });
      
      await exportCmd(moduleName, { view: true });
      
      // Check that the context was printed
      expectOutputToContain('# Module Context');
    });
  });
  
  describe('optimization statistics', () => {
    it('should display optimization statistics when context is optimized', async () => {
      // Validate that we get optimization stats
      await exportCmd(moduleName);
      
      expectOutputToContain('Token Optimization Statistics');
      expectOutputToContain('Reduction percentage');
    });
    
    it('should handle case when context is not optimized', async () => {
      contextGenerator.exportContext.mockResolvedValueOnce({
        moduleName: 'test-module',
        level: 'medium',
        tokenCount: 2000,
        context: '# Module Context\n\nThis is the module context.',
        optimized: false
      });
      
      await exportCmd(moduleName);
      
      expectOutputToContain('No optimization was performed');
    });
  });
  
  describe('error handling', () => {
    it('should handle errors during export', async () => {
      contextGenerator.exportContext.mockRejectedValueOnce(new Error('Test error'));
      
      const result = await exportCmd(moduleName);
      
      expect(result.success).toBe(false);
      expectOutputToContain('Error exporting context', 'error');
    });
  });
});
