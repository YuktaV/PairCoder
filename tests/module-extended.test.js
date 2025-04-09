/**
 * Extended tests for the module CLI command
 * 
 * This approach combines the successful extended test approach with the
 * new dependency injection pattern for more comprehensive testing.
 */

// Import the module extended factory function
const { createExtendedModuleCommands } = require('../src/cli/commands/module-extended-factory');

// Custom mock manager that uses both our mock handlers and can track calls
class MockModuleManager {
  constructor() {
    // Define methods that will be tracked
    this.methods = {
      addModule: jest.fn().mockImplementation((name, modulePath, description) => {
        console.log(`Adding module '${name}' at path '${modulePath}'...`);
        console.log('✓ Module added successfully');
        const module = { name, path: modulePath, description };
        console.log(JSON.stringify(module, null, 2));
        return Promise.resolve(module);
      }),
      
      listModules: jest.fn().mockImplementation(() => {
        const modules = [
          { name: 'test-module', path: '/path/to/test-module', description: 'Test module description' },
          { name: 'other-module', path: '/path/to/other-module', description: 'Other module description' }
        ];
        return Promise.resolve(modules);
      }),
      
      removeModule: jest.fn().mockImplementation((name) => {
        return Promise.resolve(true);
      }),
      
      detectModules: jest.fn().mockImplementation(() => {
        const detectedModules = [
          { name: 'detected-module', path: '/path/to/detected', description: 'Detected module', fileCount: 10 }
        ];
        return Promise.resolve(detectedModules);
      }),
      
      addDependency: jest.fn().mockImplementation((moduleName, dependencyName) => {
        return Promise.resolve(true);
      }),
      
      removeDependency: jest.fn().mockImplementation((moduleName, dependencyName) => {
        return Promise.resolve(true);
      }),
      
      getDependencies: jest.fn().mockImplementation((moduleName) => {
        return Promise.resolve({
          module: moduleName,
          dependencies: ['dep1', 'dep2'],
          dependents: ['dependent1']
        });
      })
    };
  }
  
  // Proxy all method calls to track them
  addModule(...args) { return this.methods.addModule(...args); }
  listModules(...args) { return this.methods.listModules(...args); }
  removeModule(...args) { return this.methods.removeModule(...args); }
  detectModules(...args) { return this.methods.detectModules(...args); }
  addDependency(...args) { return this.methods.addDependency(...args); }
  removeDependency(...args) { return this.methods.removeDependency(...args); }
  getDependencies(...args) { return this.methods.getDependencies(...args); }
}

// Create mock instances
const mockModuleManager = new MockModuleManager();
const mockProjectScanner = { scanProject: jest.fn() };

// Create module commands with mocked dependencies
const mockModuleCommands = createExtendedModuleCommands({
  moduleManager: mockModuleManager,
  projectScanner: mockProjectScanner
});

describe('module command extended', () => {
  beforeEach(() => {
    // Clear all mock calls for both approaches
    jest.clearAllMocks();
    
    // Reset mock manager methods
    Object.values(mockModuleManager.methods).forEach(mock => mock.mockClear());
    
    // Set up console output capture
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
  
  describe('add command', () => {
    it('should add a new module', async () => {
      await mockModuleCommands.add.action('test-module', '/path/to/test-module', {});
      
      expect(mockModuleManager.methods.addModule).toHaveBeenCalledWith(
        'test-module',
        '/path/to/test-module',
        undefined
      );
      
      expectOutputToContain('Module added successfully');
    });
    
    it('should add a module with description', async () => {
      await mockModuleCommands.add.action('test-module', '/path/to/test-module', { description: 'Test description' });
      
      expect(mockModuleManager.methods.addModule).toHaveBeenCalledWith(
        'test-module',
        '/path/to/test-module',
        'Test description'
      );
      
      expectOutputToContain('Module added successfully');
    });
    
    it('should handle errors when adding a module', async () => {
      // Override implementation for this test to simulate an error
      const originalAddModule = mockModuleManager.methods.addModule;
      mockModuleManager.methods.addModule.mockRejectedValueOnce(new Error('Test error'));
      
      try {
        await mockModuleCommands.add.action('test-module', '/path/to/test-module', {});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error adding module', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
      
      // Restore original implementation
      mockModuleManager.methods.addModule = originalAddModule;
    });
  });
  
  describe('list command', () => {
    it('should list all modules', async () => {
      await mockModuleCommands.list.action({});
      
      expect(mockModuleManager.methods.listModules).toHaveBeenCalled();
      expectOutputToContain('Defined modules');
    });
    
    it('should show detailed information with verbose option', async () => {
      await mockModuleCommands.list.action({ verbose: true });
      
      expect(mockModuleManager.methods.listModules).toHaveBeenCalled();
      expectOutputToContain('Path:');
      expectOutputToContain('Description:');
    });
    
    it('should show message when no modules are defined', async () => {
      // Override implementation for this test
      const originalListModules = mockModuleManager.methods.listModules;
      mockModuleManager.methods.listModules.mockResolvedValueOnce([]);
      
      await mockModuleCommands.list.action({});
      
      expectOutputToContain('No modules defined');
      
      // Restore original implementation
      mockModuleManager.methods.listModules = originalListModules;
    });
    
    it('should handle errors when listing modules', async () => {
      // Override implementation for this test to simulate an error
      const originalListModules = mockModuleManager.methods.listModules;
      mockModuleManager.methods.listModules.mockRejectedValueOnce(new Error('Test error'));
      
      try {
        await mockModuleCommands.list.action({});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error listing modules', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
      
      // Restore original implementation
      mockModuleManager.methods.listModules = originalListModules;
    });
  });
  
  describe('remove command', () => {
    it('should remove a module', async () => {
      await mockModuleCommands.remove.action('test-module');
      
      expect(mockModuleManager.methods.removeModule).toHaveBeenCalledWith('test-module');
      expectOutputToContain('Module \'test-module\' removed successfully');
    });
    
    it('should handle errors when removing a module', async () => {
      // Override implementation for this test to simulate an error
      const originalRemoveModule = mockModuleManager.methods.removeModule;
      mockModuleManager.methods.removeModule.mockRejectedValueOnce(new Error('Test error'));
      
      try {
        await mockModuleCommands.remove.action('test-module');
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error removing module', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
      
      // Restore original implementation
      mockModuleManager.methods.removeModule = originalRemoveModule;
    });
  });
  
  describe('detect command', () => {
    it('should detect modules', async () => {
      await mockModuleCommands.detect.action({});
      
      expect(mockModuleManager.methods.detectModules).toHaveBeenCalled();
      expectOutputToContain('Detected');
      expectOutputToContain('potential modules');
    });
    
    it('should add detected modules with --add option', async () => {
      await mockModuleCommands.detect.action({ add: true });
      
      expect(mockModuleManager.methods.detectModules).toHaveBeenCalled();
      expect(mockModuleManager.methods.addModule).toHaveBeenCalled();
      expectOutputToContain('Adding detected modules');
    });
    
    it('should show message when no modules are detected', async () => {
      // Override implementation for this test
      const originalDetectModules = mockModuleManager.methods.detectModules;
      mockModuleManager.methods.detectModules.mockResolvedValueOnce([]);
      
      await mockModuleCommands.detect.action({});
      
      expectOutputToContain('No modules automatically detected');
      
      // Restore original implementation
      mockModuleManager.methods.detectModules = originalDetectModules;
    });
    
    it('should handle errors when detecting modules', async () => {
      // Override implementation for this test to simulate an error
      const originalDetectModules = mockModuleManager.methods.detectModules;
      mockModuleManager.methods.detectModules.mockRejectedValueOnce(new Error('Test error'));
      
      try {
        await mockModuleCommands.detect.action({});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error detecting modules', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
      
      // Restore original implementation
      mockModuleManager.methods.detectModules = originalDetectModules;
    });
    
    it('should handle errors when adding detected modules', async () => {
      // Override implementation for this test
      const originalAddModule = mockModuleManager.methods.addModule;
      mockModuleManager.methods.addModule.mockRejectedValueOnce(new Error('Test error'));
      
      await mockModuleCommands.detect.action({ add: true });
      
      expectOutputToContain('Warning: Could not add module', 'warn');
      
      // Restore original implementation
      mockModuleManager.methods.addModule = originalAddModule;
    });
  });
  
  describe('deps command', () => {
    it('should show dependencies for a module', async () => {
      await mockModuleCommands.deps.action('test-module', {});
      
      expect(mockModuleManager.methods.getDependencies).toHaveBeenCalledWith('test-module');
      expectOutputToContain('Dependencies for module');
    });
    
    it('should add a dependency to a module', async () => {
      await mockModuleCommands.deps.action('test-module', { add: 'dep3' });
      
      expect(mockModuleManager.methods.addDependency).toHaveBeenCalledWith('test-module', 'dep3');
      expectOutputToContain('Added dependency');
    });
    
    it('should remove a dependency from a module', async () => {
      await mockModuleCommands.deps.action('test-module', { remove: 'dep1' });
      
      expect(mockModuleManager.methods.removeDependency).toHaveBeenCalledWith('test-module', 'dep1');
      expectOutputToContain('Removed dependency');
    });
    
    it('should visualize all dependencies', async () => {
      await mockModuleCommands.deps.action(null, { visualize: true });
      
      expect(mockModuleManager.methods.listModules).toHaveBeenCalled();
      expectOutputToContain('Module dependency visualization');
    });
    
    it('should show help message when no options provided', async () => {
      await mockModuleCommands.deps.action(null, {});
      
      expectOutputToContain('Please specify a module name or use --visualize');
    });
    
    it('should handle errors when managing dependencies', async () => {
      // Override implementation for this test to simulate an error
      const originalGetDependencies = mockModuleManager.methods.getDependencies;
      mockModuleManager.methods.getDependencies.mockRejectedValueOnce(new Error('Test error'));
      
      try {
        await mockModuleCommands.deps.action('test-module', {});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error managing dependencies', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
      
      // Restore original implementation
      mockModuleManager.methods.getDependencies = originalGetDependencies;
    });
    
    it('should handle empty dependencies and dependents', async () => {
      // Override implementation for this test
      const originalGetDependencies = mockModuleManager.methods.getDependencies;
      mockModuleManager.methods.getDependencies.mockResolvedValueOnce({
        module: 'test-module',
        dependencies: [],
        dependents: []
      });
      
      await mockModuleCommands.deps.action('test-module', {});
      
      expectOutputToContain('No dependencies');
      
      // Restore original implementation
      mockModuleManager.methods.getDependencies = originalGetDependencies;
    });
  });
});
