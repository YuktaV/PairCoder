/**
 * Real tests for the export-factory.js module
 * 
 * This test file directly tests the actual implementation, not a mock,
 * to ensure proper code coverage.
 */

const chalk = require('chalk');
// Add chalk.white mock if needed
chalk.white = chalk.white || chalk.cyan; // Fallback if white doesn't exist

// Mocks for dependencies
const mockFs = {
    writeFile: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockClipboard = {
    write: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockContextGenerator = {
    exportContext: jest.fn().mockResolvedValue({
      moduleName: 'test-module',
      level: 'medium',
      tokenCount: 2000,
      optimized: true,
      context: `# Test Module Context\n\nThis is a test.\n\n*Note: Context was optimized to meet the token budget. Reduced by 25.5%.*`
    })
  };
  
  const mockConfigManager = {
    getValue: jest.fn().mockImplementation(async (key) => {
      const values = {
        'context.defaultLevel': 'medium',
        'context.tokenBudget': 4000
      };
      return values[key];
    })
  };
  
  // Import the actual module (not mocked)
  const { createExportCommand } = require('../src/cli/commands/export-factory');
  
  // Create export command with mocked dependencies
  const { exportCmd, exportCommand } = createExportCommand({
    fs: mockFs,
    clipboard: mockClipboard,
    contextGenerator: mockContextGenerator,
    configManager: mockConfigManager
  });
  
  // Utility function to access private functions for testing - IMPROVED VERSION
  const extractPrivateFn = (fn, name) => {
    const fnString = fn.toString();
    const fnBody = fnString.substring(fnString.indexOf('{') + 1, fnString.lastIndexOf('}'));
    
    // Try different patterns for function declarations
    const patterns = [
      // Regular function declaration
      new RegExp(`function\\s+${name}\\s*\\(([^)]*)\\)\\s*\\{([\\s\\S]*?)\\}(?:\\s*\\n|$)`, 'g'),
      // Arrow function with block body
      new RegExp(`const\\s+${name}\\s*=\\s*\\(([^)]*)\\)\\s*=>\\s*\\{([\\s\\S]*?)\\}`, 'g'),
      // Variable assigned function
      new RegExp(`const\\s+${name}\\s*=\\s*function\\s*\\(([^)]*)\\)\\s*\\{([\\s\\S]*?)\\}`, 'g')
    ];
    
    for (const regex of patterns) {
      const matches = [...fnBody.matchAll(regex)];
      if (matches.length > 0) {
        const match = matches[0];
        // args should be in group 1, body should be in group 2
        const args = match[1];
        const body = match[2];
        
        // Create a function from extracted parts
        return new Function(args.split(',').map(a => a.trim()), body);
      }
    }
    
    // Fallback - more flexible approach
    const lines = fnBody.split('\n');
    const startPattern = new RegExp(`(function\\s+${name}|const\\s+${name}\\s*=)`);
    let startIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (startPattern.test(lines[i])) {
        startIndex = i;
        break;
      }
    }
    
    if (startIndex >= 0) {
      // Extract args from the function signature
      const argsMatch = lines[startIndex].match(/\(([^)]*)\)/);
      const args = argsMatch ? argsMatch[1] : '';
      
      // Find the function body
      let openBraces = 0;
      let bodyStartIndex = -1;
      let bodyEndIndex = -1;
      
      for (let i = startIndex; i < lines.length; i++) {
        if (lines[i].includes('{')) {
          openBraces++;
          if (bodyStartIndex === -1) bodyStartIndex = i;
        }
        
        if (lines[i].includes('}')) {
          openBraces--;
          if (openBraces === 0) {
            bodyEndIndex = i;
            break;
          }
        }
      }
      
      if (bodyStartIndex !== -1 && bodyEndIndex !== -1) {
        const body = lines.slice(bodyStartIndex, bodyEndIndex + 1).join('\n');
        // Extract just the body content by removing outer braces
        const bodyContent = body.substring(body.indexOf('{') + 1, body.lastIndexOf('}'));
        
        return new Function(args.split(',').map(a => a.trim()), bodyContent);
      }
    }
    
    // Function couldn't be extracted
    console.warn(`Could not extract function "${name}" from the source`);
    return () => { throw new Error(`Function "${name}" could not be extracted`); };
  };
  
  // Extract private functions for testing
  const formatContext = extractPrivateFn(exportCmd.toString(), 'formatContext');
  const generateOptimizationStats = extractPrivateFn(exportCmd.toString(), 'generateOptimizationStats');
  
  describe('export-factory.js (Real Implementation)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      
      // Clear console output capture
      global.consoleOutput = {
        log: [],
        error: [],
        warn: []
      };
      
      // Mock console methods to capture output
      console.log = jest.fn((...args) => {
        global.consoleOutput.log.push(args.join(' '));
      });
      
      console.error = jest.fn((...args) => {
        global.consoleOutput.error.push(args.join(' '));
      });
      
      console.warn = jest.fn((...args) => {
        global.consoleOutput.warn.push(args.join(' '));
      });
      
      // Set default mock behavior
      mockContextGenerator.exportContext.mockResolvedValue({
        moduleName: 'test-module',
        level: 'medium',
        tokenCount: 2000,
        optimized: true,
        context: `# Test Module Context\n\nThis is a test.\n\n*Note: Context was optimized to meet the token budget. Reduced by 25.5%.*`
      });
    });
    
    describe('createExportCommand function', () => {
      it('should create export command with provided dependencies', () => {
        const { exportCmd } = createExportCommand({
          fs: mockFs,
          clipboard: mockClipboard,
          contextGenerator: mockContextGenerator,
          configManager: mockConfigManager
        });
        
        expect(exportCmd).toBeDefined();
        expect(exportCmd._deps.fs).toBe(mockFs);
        expect(exportCmd._deps.clipboard).toBe(mockClipboard);
        expect(exportCmd._deps.contextGenerator).toBe(mockContextGenerator);
        expect(exportCmd._deps.configManager).toBe(mockConfigManager);
      });
      
      it('should create export command with default dependencies when none provided', () => {
        // We can't easily test this without mocking requires, so we'll just verify the function doesn't error
        const { exportCmd } = createExportCommand();
        expect(exportCmd).toBeDefined();
      });
    });
    
    describe('formatContext function (extracted)', () => {
      const mockResult = {
        moduleName: 'test-module',
        level: 'medium',
        tokenCount: 2000,
        optimized: true,
        context: `# Heading\n\n**Bold** and *italic* text.\n\n\`inline code\`\n\n\`\`\`javascript\nconst x = 1;\n\`\`\``
      };
      
      it('should format context as markdown', () => {
        const formatted = formatContext(mockResult, 'markdown');
        expect(formatted).toBe(mockResult.context);
      });
      
      it('should format context as JSON', () => {
        const formatted = formatContext(mockResult, 'json');
        const parsed = JSON.parse(formatted);
        
        expect(parsed.moduleName).toBe('test-module');
        expect(parsed.level).toBe('medium');
        expect(parsed.tokenCount).toBe(2000);
        expect(parsed.optimized).toBe(true);
        expect(parsed.context).toBe(mockResult.context);
        expect(parsed.timestamp).toBeDefined();
      });
      
      it('should format context as text (stripping markdown)', () => {
        const formatted = formatContext(mockResult, 'text');
        
        // Should convert heading
        expect(formatted).toContain('Heading\n');
        
        // Should strip bold and italic formatting
        expect(formatted).toContain('Bold and italic text');
        expect(formatted).not.toContain('**Bold**');
        expect(formatted).not.toContain('*italic*');
        
        // Should strip inline code formatting
        expect(formatted).toContain('inline code');
        expect(formatted).not.toContain('`inline code`');
        
        // Should strip code block formatting but keep content
        expect(formatted).toContain('const x = 1;');
        expect(formatted).not.toContain('```javascript');
        expect(formatted).not.toContain('```');
      });
      
      it('should default to markdown for unknown formats', () => {
        const formatted = formatContext(mockResult, 'unknown');
        expect(formatted).toBe(mockResult.context);
      });
    });
    
    describe('generateOptimizationStats function (extracted)', () => {
      it('should generate stats for optimized context', () => {
        const mockResult = {
          moduleName: 'test-module',
          level: 'medium',
          tokenCount: 2000,
          optimized: true,
          context: `# Test\n\n*Note: Context was optimized to meet the token budget. Reduced by 25.5%.*`
        };
        
        const stats = generateOptimizationStats(mockResult);
        
        // Check that stats contain key information
        expect(stats).toContain('Token Optimization Statistics');
        expect(stats).toContain('Original token count:');
        expect(stats).toContain('Optimized token count:');
        expect(stats).toContain('Tokens saved:');
        expect(stats).toContain('Reduction percentage:');
        expect(stats).toContain('25.5%');
      });
      
      it('should handle case when optimization metadata is missing', () => {
        const mockResult = {
          moduleName: 'test-module',
          level: 'medium',
          tokenCount: 2000,
          optimized: true,
          context: `# Test\n\nNo optimization metadata here.`
        };
        
        const stats = generateOptimizationStats(mockResult);
        
        // Should still generate stats but with unknown reduction
        expect(stats).toContain('Token Optimization Statistics');
        expect(stats).toContain('unknown%');
      });
      
      it('should return simple message for non-optimized context', () => {
        const mockResult = {
          moduleName: 'test-module',
          level: 'medium',
          tokenCount: 2000,
          optimized: false,
          context: `# Test\n\nRegular content.`
        };
        
        const stats = generateOptimizationStats(mockResult);
        
        // Should return simple message
        expect(stats).toContain('No optimization was performed');
        expect(stats).not.toContain('Token Optimization Statistics');
      });
    });
    
    describe('exportCmd function', () => {
      it('should export context with default options', async () => {
        const result = await exportCmd('test-module');
        
        expect(result.success).toBe(true);
        expect(mockContextGenerator.exportContext).toHaveBeenCalledWith(
          'test-module',
          expect.objectContaining({
            level: 'medium',
            tokenBudget: 4000,
            optimize: true
          })
        );
      });
      
      it('should handle invalid detail level', async () => {
        const result = await exportCmd('test-module', { level: 'invalid' });
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid detail level');
        expect(mockContextGenerator.exportContext).not.toHaveBeenCalled();
      });
      
      it('should handle invalid format', async () => {
        const result = await exportCmd('test-module', { format: 'invalid' });
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid format');
        expect(mockContextGenerator.exportContext).not.toHaveBeenCalled();
      });
      
      it('should use configManager for default values', async () => {
        // Mock specific config values
        mockConfigManager.getValue.mockImplementation(async (key) => {
          if (key === 'context.defaultLevel') return 'high';
          if (key === 'context.tokenBudget') return 8000;
          return null;
        });
        
        await exportCmd('test-module');
        
        // Should use values from config
        expect(mockContextGenerator.exportContext).toHaveBeenCalledWith(
          'test-module',
          expect.objectContaining({
            level: 'high',
            tokenBudget: 8000
          })
        );
      });
      
      describe('output options', () => {
        it('should save to file with explicit extension', async () => {
          await exportCmd('test-module', { output: 'context.md' });
          
          expect(mockFs.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('context.md'),
            expect.any(String),
            'utf8'
          );
        });
        
        it('should save to file with auto extension based on format', async () => {
          await exportCmd('test-module', { output: 'context', format: 'json' });
          
          expect(mockFs.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('context.json'),
            expect.any(String),
            'utf8'
          );
        });
        
        it('should convert relative path to absolute path', async () => {
          // Mock process.cwd() globally
          const originalCwd = process.cwd;
          process.cwd = jest.fn().mockReturnValue('/test/dir');
          
          await exportCmd('test-module', { output: 'context.md' });
          
          expect(mockFs.writeFile).toHaveBeenCalledWith(
            '/test/dir/context.md',
            expect.any(String),
            'utf8'
          );
          
          // Restore original cwd
          process.cwd = originalCwd;
        });
        
        it('should copy to clipboard when requested', async () => {
          await exportCmd('test-module', { clipboard: true });
          
          expect(mockClipboard.write).toHaveBeenCalled();
        });
        
        it('should print content when view is enabled', async () => {
          await exportCmd('test-module', { view: true });
          
          const output = global.consoleOutput.log.join('\n');
          expect(output).toContain('# Test Module Context');
        });
        
        it('should show help text when no output option is specified', async () => {
          await exportCmd('test-module');
          
          const output = global.consoleOutput.log.join('\n');
          expect(output).toContain('To view the full context:');
          expect(output).toContain('pc export test-module --view');
        });
      });
      
      describe('error handling', () => {
        it('should handle errors during context generation', async () => {
          // Mock export context to throw an error
          mockContextGenerator.exportContext.mockRejectedValueOnce(
            new Error('Mock generation error')
          );
          
          const result = await exportCmd('test-module');
          
          expect(result.success).toBe(false);
          expect(result.error).toBe('Mock generation error');
        });
        
        it('should handle errors during file writing', async () => {
          // Mock file writing to throw an error
          mockFs.writeFile.mockRejectedValueOnce(
            new Error('Mock write error')
          );
          
          const result = await exportCmd('test-module', { output: 'context.md' });
          
          expect(result.success).toBe(false);
          expect(result.error).toBe('Mock write error');
        });
        
        it('should handle errors during clipboard writing', async () => {
          // Mock clipboard writing to throw an error
          mockClipboard.write.mockRejectedValueOnce(
            new Error('Mock clipboard error')
          );
          
          const result = await exportCmd('test-module', { clipboard: true });
          
          expect(result.success).toBe(false);
          expect(result.error).toBe('Mock clipboard error');
        });
      });
    });
    
    describe('exportCommand object', () => {
      it('should have correct command properties', () => {
        expect(exportCommand.command).toBe('export <module>');
        expect(exportCommand.description).toBeDefined();
        expect(Array.isArray(exportCommand.options)).toBe(true);
        expect(exportCommand.action).toBe(exportCmd);
      });
    });
  });