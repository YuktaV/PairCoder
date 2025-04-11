/**
 * Tests for the module.js commands
 */

const { createModuleCommands } = require('../src/cli/commands/module');

describe('module.js', () => {
  let mockModuleManager;
  let mockProjectScanner;
  let moduleCommands;
  let mockExit;
  
  beforeEach(() => {
    // Mock dependencies
    mockModuleManager = {
      addModule: jest.fn().mockResolvedValue({ name: 'test-module', path: 'src/test' }),
      listModules: jest.fn().mockResolvedValue([
        { name: 'module1', path: 'src/module1' },
        { name: 'module2', path: 'src/module2' }
      ]),
      removeModule: jest.fn().mockResolvedValue(true),
      detectModules: jest.fn().mockResolvedValue([
        { name: 'detected1', path: 'src/detected1', fileCount: 10 },
        { name: 'detected2', path: 'src/detected2', fileCount: 5 }
      ]),
      addDependency: jest.fn().mockResolvedValue(true),
      removeDependency: jest.fn().mockResolvedValue(true),
      getDependencies: jest.fn().mockResolvedValue({
        dependencies: ['dep1', 'dep2'],
        dependents: ['dependent1']
      })
    };
    
    mockProjectScanner = {
      detectModules: jest.fn().mockResolvedValue([])
    };
    
    // Create commands with mocked dependencies
    moduleCommands = createModuleCommands({
      moduleManager: mockModuleManager,
      projectScanner: mockProjectScanner
    });
    
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
    
    // Mock process.exit
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });
  
  afterEach(() => {
    mockExit.mockRestore();
  });
  
  // Helper function to check output
  const expectOutputToContain = (text, outputType = 'log') => {
    const output = global.consoleOutput[outputType];
    // Check if any line contains the text (case-insensitive and allowing for symbol variations)
    const found = output.some(line => {
      if (!line || typeof line !== 'string') return false;
      // Remove style markers and normalize symbols for comparison
      const normalizedLine = line.replace(/\u001b\[\d+m/g, '')  // Remove ANSI color codes
                                .replace(/[✓✔]/, '✓')           // Normalize checkmarks
                                .toLowerCase();
      const normalizedText = text.toLowerCase();
      return normalizedLine.includes(normalizedText);
    });
    
    if (!found) {
      throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
    }
  };
  
  describe('list command', () => {
    it('should handle error during module listing', async () => {
      // Mock listModules to throw error
      mockModuleManager.listModules.mockRejectedValueOnce(
        new Error('Test listing error')
      );
      
      await moduleCommands.list.action({});
      
      expectOutputToContain('Error listing modules', 'error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
    
    it('should display modules in verbose mode', async () => {
      // Mock a module with dependencies
      mockModuleManager.listModules.mockResolvedValueOnce([
        { 
          name: 'module1', 
          path: 'src/module1',
          description: 'Test module',
          dependencies: ['module2', 'module3']
        }
      ]);
      
      await moduleCommands.list.action({ verbose: true });
      
      expectOutputToContain('module1');
      expectOutputToContain('Dependencies: module2, module3');
    });
    
    it('should handle no modules found', async () => {
      // Mock empty modules list
      mockModuleManager.listModules.mockResolvedValueOnce([]);
      
      await moduleCommands.list.action({});
      
      expectOutputToContain('No modules defined');
    });
  });
  
  describe('deps command', () => {
    it('should show warning when no module specified and no visualize option', async () => {
      await moduleCommands.deps.action(null, {});
      
      expectOutputToContain('Please specify a module name');
    });
    
    it('should visualize all dependencies', async () => {
      await moduleCommands.deps.action(null, { visualize: true });
      
      expectOutputToContain('Module dependency visualization');
    });
  });
});
