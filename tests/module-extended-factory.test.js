/**
 * Tests for the module-extended-factory.js module
 */

const { createExtendedModuleCommands } = require('../src/cli/commands/module-extended-factory');

describe('module-extended-factory.js', () => {
  let mockModuleManager;
  let mockProjectScanner;
  let extendedCommands;
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
    extendedCommands = createExtendedModuleCommands({
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
    const found = output.some(line => line && typeof line === 'string' && line.includes(text));
    if (!found) {
      throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
    }
  };
  
  describe('detectModules function', () => {
    it('should handle error during module detection', async () => {
      // Mock detectModules to throw error
      mockModuleManager.detectModules.mockRejectedValueOnce(
        new Error('Test detection error')
      );
      
      await extendedCommands.detect.action({});
      
      expectOutputToContain('Error detecting modules', 'error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
    
    it('should handle module addition errors when --add is specified', async () => {
      // Mock addModule to succeed for first module and fail for second
      mockModuleManager.addModule
        .mockResolvedValueOnce({ name: 'detected1', path: 'src/detected1' })
        .mockRejectedValueOnce(new Error('Module already exists'));
      
      await extendedCommands.detect.action({ add: true });
      
      expectOutputToContain('Added module', 'log');
      expectOutputToContain('Warning: Could not add module', 'warn');
    });
  });
});
