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
  
  describe('detect command', () => {
    it('should detect modules in the project', async () => {
      await extendedCommands.detect.action({});
      
      expect(mockModuleManager.detectModules).toHaveBeenCalled();
      expectOutputToContain('Detecting modules');
      expectOutputToContain('Detected 2 potential modules');
    });
    
    it('should add detected modules when --add option is used', async () => {
      await extendedCommands.detect.action({ add: true });
      
      expect(mockModuleManager.addModule).toHaveBeenCalledTimes(2);
      expectOutputToContain('Adding detected modules');
    });
    
    it('should handle case with no detected modules', async () => {
      mockModuleManager.detectModules.mockResolvedValueOnce([]);
      
      await extendedCommands.detect.action({});
      
      expectOutputToContain('No modules automatically detected');
    });
    
    it('should handle error during module detection', async () => {
      mockModuleManager.detectModules.mockRejectedValueOnce(
        new Error('Test detection error')
      );
      
      await extendedCommands.detect.action({});
      
      expectOutputToContain('Error detecting modules', 'error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('deps command', () => {
    it('should add dependency to a module', async () => {
      await extendedCommands.deps.action('module1', { add: 'module2' });
      
      expect(mockModuleManager.addDependency).toHaveBeenCalledWith('module1', 'module2');
      expectOutputToContain('Added dependency');
    });
    
    it('should remove dependency from a module', async () => {
      await extendedCommands.deps.action('module1', { remove: 'module2' });
      
      expect(mockModuleManager.removeDependency).toHaveBeenCalledWith('module1', 'module2');
      expectOutputToContain('Removed dependency');
    });
    
    it('should show module dependencies', async () => {
      await extendedCommands.deps.action('module1', {});
      
      expect(mockModuleManager.getDependencies).toHaveBeenCalledWith('module1');
      expectOutputToContain('Dependencies for module');
      expectOutputToContain('Depends on: dep1, dep2');
      expectOutputToContain('Used by: dependent1');
    });
    
    it('should visualize all dependencies', async () => {
      await extendedCommands.deps.action(null, { visualize: true });
      
      expect(mockModuleManager.listModules).toHaveBeenCalled();
      expectOutputToContain('Module dependency visualization');
    });
    
    it('should show guidance when no action specified', async () => {
      await extendedCommands.deps.action(null, {});
      
      expectOutputToContain('Please specify a module name or use --visualize');
    });
    
    it('should handle error during dependency management', async () => {
      mockModuleManager.getDependencies.mockRejectedValueOnce(
        new Error('Test dependency error')
      );
      
      await extendedCommands.deps.action('module1', {});
      
      expectOutputToContain('Error managing dependencies', 'error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
