/**
 * Tests for the module dependencies command
 */

// Mock dependencies
const mockGetDependencies = jest.fn().mockResolvedValue({
  module: 'test-module',
  dependencies: ['dep1', 'dep2'],
  dependents: ['dependent1']
});

const mockAddDependency = jest.fn().mockResolvedValue(true);
const mockRemoveDependency = jest.fn().mockResolvedValue(true);
const mockListModules = jest.fn().mockResolvedValue([
  { name: 'module1', path: '/path/to/module1' },
  { name: 'module2', path: '/path/to/module2' }
]);

// Create mock module manager
const mockModuleManager = {
  getDependencies: mockGetDependencies,
  addDependency: mockAddDependency,
  removeDependency: mockRemoveDependency,
  listModules: mockListModules
};

// Import the factory function
const { createDepsCommand } = require('../src/cli/commands/deps-command');

describe('deps command', () => {
  let depsCommand;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create deps command with mocked dependencies
    depsCommand = createDepsCommand({
      moduleManager: mockModuleManager
    });
    
    // Reset console output capture
    global.consoleOutput = {
      log: [],
      error: [],
      warn: []
    };
    
    // Mock console methods
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
    process.exit = jest.fn();
  });
  
  // Helper to check for text in output
  const expectOutputToContain = (text, outputType = 'log') => {
    const output = global.consoleOutput[outputType];
    const found = output.some(line => line && typeof line === 'string' && line.includes(text));
    if (!found) {
      throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
    }
  };
  
  describe('depsCmd', () => {
    it('should show module dependencies when given a module name', async () => {
      await depsCommand.depsCmd('test-module', {});
      
      expect(mockGetDependencies).toHaveBeenCalledWith('test-module');
      expectOutputToContain('Dependencies for module');
      expectOutputToContain('Depends on: dep1, dep2');
      expectOutputToContain('Used by: dependent1');
    });
    
    it('should add dependency when using --add option', async () => {
      await depsCommand.depsCmd('test-module', { add: 'new-dep' });
      
      expect(mockAddDependency).toHaveBeenCalledWith('test-module', 'new-dep');
      expectOutputToContain('Added dependency');
    });
    
    it('should remove dependency when using --remove option', async () => {
      await depsCommand.depsCmd('test-module', { remove: 'dep1' });
      
      expect(mockRemoveDependency).toHaveBeenCalledWith('test-module', 'dep1');
      expectOutputToContain('Removed dependency');
    });
    
    it('should visualize dependencies when using --visualize option', async () => {
      await depsCommand.depsCmd(null, { visualize: true });
      
      expect(mockListModules).toHaveBeenCalled();
      expectOutputToContain('Module dependency visualization');
    });
    
    it('should show help message when no module name or visualize option', async () => {
      await depsCommand.depsCmd(null, {});
      
      expectOutputToContain('Please specify a module name or use --visualize');
    });
    
    it('should handle error and exit', async () => {
      mockGetDependencies.mockRejectedValueOnce(new Error('Test error'));
      
      await depsCommand.depsCmd('test-module', {});
      
      expectOutputToContain('Error managing dependencies', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('showModuleDependencies', () => {
    it('should show dependencies and dependents', async () => {
      await depsCommand._showModuleDependencies('test-module');
      
      expectOutputToContain('Dependencies for module');
      expectOutputToContain('Depends on: dep1, dep2');
      expectOutputToContain('Used by: dependent1');
    });
    
    it('should handle empty dependencies', async () => {
      mockGetDependencies.mockResolvedValueOnce({
        module: 'test-module',
        dependencies: [],
        dependents: ['dependent1']
      });
      
      await depsCommand._showModuleDependencies('test-module');
      
      expectOutputToContain('No dependencies');
      expectOutputToContain('Used by: dependent1');
    });
    
    it('should handle empty dependents', async () => {
      mockGetDependencies.mockResolvedValueOnce({
        module: 'test-module',
        dependencies: ['dep1'],
        dependents: []
      });
      
      await depsCommand._showModuleDependencies('test-module');
      
      expectOutputToContain('Depends on: dep1');
      expectOutputToContain('No dependents');
    });
    
    it('should handle both empty dependencies and dependents', async () => {
      mockGetDependencies.mockResolvedValueOnce({
        module: 'test-module',
        dependencies: [],
        dependents: []
      });
      
      await depsCommand._showModuleDependencies('test-module');
      
      expectOutputToContain('No dependencies');
      expectOutputToContain('No dependents');
    });
    
    it('should handle undefined dependencies or dependents', async () => {
      mockGetDependencies.mockResolvedValueOnce({
        module: 'test-module'
      });
      
      await depsCommand._showModuleDependencies('test-module');
      
      expectOutputToContain('No dependencies');
      expectOutputToContain('No dependents');
    });
    
    it('should handle errors from getDependencies', async () => {
      mockGetDependencies.mockRejectedValueOnce(new Error('Failed to get dependencies'));
      
      await expect(depsCommand._showModuleDependencies('test-module'))
        .rejects.toThrow('Error showing dependencies');
    });
  });
  
  describe('handleModuleDependencies', () => {
    it('should add dependency', async () => {
      await depsCommand._handleModuleDependencies('test-module', { add: 'new-dep' });
      
      expect(mockAddDependency).toHaveBeenCalledWith('test-module', 'new-dep');
      expectOutputToContain('Added dependency');
    });
    
    it('should remove dependency', async () => {
      await depsCommand._handleModuleDependencies('test-module', { remove: 'dep1' });
      
      expect(mockRemoveDependency).toHaveBeenCalledWith('test-module', 'dep1');
      expectOutputToContain('Removed dependency');
    });
    
    it('should show dependencies when no add/remove option', async () => {
      await depsCommand._handleModuleDependencies('test-module', {});
      
      expect(mockGetDependencies).toHaveBeenCalledWith('test-module');
      expectOutputToContain('Dependencies for module');
    });
    
    it('should handle errors from addDependency', async () => {
      mockAddDependency.mockRejectedValueOnce(new Error('Failed to add dependency'));
      
      await expect(depsCommand._handleModuleDependencies('test-module', { add: 'new-dep' }))
        .rejects.toThrow('Error handling module dependencies');
    });
    
    it('should handle errors from removeDependency', async () => {
      mockRemoveDependency.mockRejectedValueOnce(new Error('Failed to remove dependency'));
      
      await expect(depsCommand._handleModuleDependencies('test-module', { remove: 'dep1' }))
        .rejects.toThrow('Error handling module dependencies');
    });
  });
  
  describe('visualizeDependencies', () => {
    it('should visualize all module dependencies', async () => {
      mockGetDependencies.mockImplementation((moduleName) => {
        if (moduleName === 'module1') {
          return Promise.resolve({
            module: 'module1',
            dependencies: ['module2'],
            dependents: []
          });
        } else if (moduleName === 'module2') {
          return Promise.resolve({
            module: 'module2',
            dependencies: [],
            dependents: ['module1']
          });
        }
        return Promise.resolve({
          dependencies: [],
          dependents: []
        });
      });
      
      await depsCommand._visualizeDependencies();
      
      expect(mockListModules).toHaveBeenCalled();
      expectOutputToContain('Module dependency visualization');
      expectOutputToContain('module1');
      expectOutputToContain('module2');
    });
    
    it('should handle empty module list', async () => {
      mockListModules.mockResolvedValueOnce([]);
      
      await depsCommand._visualizeDependencies();
      
      expectOutputToContain('No modules defined');
    });
    
    it('should handle errors from listModules', async () => {
      mockListModules.mockRejectedValueOnce(new Error('Failed to list modules'));
      
      await expect(depsCommand._visualizeDependencies())
        .rejects.toThrow('Error visualizing dependencies');
    });
    
    it('should handle errors from getDependencies', async () => {
      mockGetDependencies.mockRejectedValueOnce(new Error('Failed to get dependencies'));
      
      await expect(depsCommand._visualizeDependencies())
        .rejects.toThrow('Error visualizing dependencies');
    });
    
    it('should handle undefined dependencies or dependents during visualization', async () => {
      mockGetDependencies.mockResolvedValue({
        module: 'test-module'
      });
      
      await depsCommand._visualizeDependencies();
      
      expectOutputToContain('Depends on: none');
      expectOutputToContain('Used by: none');
    });
  });
  
  describe('command definition', () => {
    it('should have correct command definition', () => {
      expect(depsCommand.deps).toEqual({
        command: 'deps [module]',
        description: 'Manage module dependencies',
        options: [
          { flags: '-a, --add <dependency>', description: 'Add dependency to module' },
          { flags: '-r, --remove <dependency>', description: 'Remove dependency from module' },
          { flags: '-v, --visualize', description: 'Visualize all dependencies' }
        ],
        action: depsCommand.depsCmd
      });
    });
  });
});
