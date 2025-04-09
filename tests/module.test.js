/**
 * Tests for the module CLI command
 */

// Create mock dependencies
const mockModuleManager = {
  addModule: jest.fn().mockResolvedValue({
    name: 'test-module',
    path: '/path/to/test-module',
    description: 'Test module description'
  }),
  
  listModules: jest.fn().mockResolvedValue([
    { name: 'test-module', path: '/path/to/test-module', description: 'Test module description' },
    { name: 'other-module', path: '/path/to/other-module', description: 'Other module description' }
  ]),
  
  removeModule: jest.fn().mockResolvedValue(true),
  
  detectModules: jest.fn().mockResolvedValue([
    { name: 'detected-module', path: '/path/to/detected', description: 'Detected module', fileCount: 10 }
  ]),
  
  addDependency: jest.fn().mockResolvedValue(true),
  
  removeDependency: jest.fn().mockResolvedValue(true),
  
  getDependencies: jest.fn().mockResolvedValue({
    module: 'test-module',
    dependencies: ['dep1', 'dep2'],
    dependents: ['dependent1']
  })
};

const mockProjectScanner = {
  scanProject: jest.fn()
};

// We don't need to mock the modules anymore, we use dependency injection
// Import the module factory function
const { createModuleCommands } = require('../src/cli/commands/module');

// Create module commands with mocked dependencies
const moduleCommands = createModuleCommands({
  moduleManager: mockModuleManager,
  projectScanner: mockProjectScanner
});

describe('module commands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
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
  
  describe('add command', () => {
    it('should add a new module', async () => {
      await moduleCommands.add.action('test-module', '/path/to/test-module', {});
      
      expect(mockModuleManager.addModule).toHaveBeenCalledWith(
        'test-module',
        '/path/to/test-module',
        undefined
      );
      
      expectOutputToContain('Module added successfully');
    });
    
    it('should add a module with description', async () => {
      await moduleCommands.add.action('test-module', '/path/to/test-module', { description: 'Test description' });
      
      expect(mockModuleManager.addModule).toHaveBeenCalledWith(
        'test-module',
        '/path/to/test-module',
        'Test description'
      );
    });
    
    it('should handle errors when adding a module', async () => {
      mockModuleManager.addModule.mockRejectedValueOnce(new Error('Test error'));
      
      // We need to catch the process.exit mock error
      try {
        await moduleCommands.add.action('test-module', '/path/to/test-module', {});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error adding module', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('list command', () => {
    it('should list all modules', async () => {
      await moduleCommands.list.action({});
      
      expect(mockModuleManager.listModules).toHaveBeenCalled();
      expectOutputToContain('Defined modules');
    });
    
    it('should show detailed information with verbose option', async () => {
      await moduleCommands.list.action({ verbose: true });
      
      expectOutputToContain('Path:');
      expectOutputToContain('Description:');
    });
    
    it('should show message when no modules are defined', async () => {
      mockModuleManager.listModules.mockResolvedValueOnce([]);
      
      await moduleCommands.list.action({});
      
      expectOutputToContain('No modules defined');
    });
    
    it('should handle errors when listing modules', async () => {
      mockModuleManager.listModules.mockRejectedValueOnce(new Error('Test error'));
      
      try {
        await moduleCommands.list.action({});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error listing modules', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('remove command', () => {
    it('should remove a module', async () => {
      await moduleCommands.remove.action('test-module');
      
      expect(mockModuleManager.removeModule).toHaveBeenCalledWith('test-module');
      expectOutputToContain('Module \'test-module\' removed successfully');
    });
    
    it('should handle errors when removing a module', async () => {
      mockModuleManager.removeModule.mockRejectedValueOnce(new Error('Test error'));
      
      try {
        await moduleCommands.remove.action('test-module');
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error removing module', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('detect command', () => {
    it('should detect modules', async () => {
      await moduleCommands.detect.action({});
      
      expect(mockModuleManager.detectModules).toHaveBeenCalled();
      expectOutputToContain('Detected 1 potential modules');
    });
    
    it('should add detected modules with --add option', async () => {
      await moduleCommands.detect.action({ add: true });
      
      expect(mockModuleManager.addModule).toHaveBeenCalledWith(
        'detected-module',
        '/path/to/detected',
        'Detected module'
      );
      
      expectOutputToContain('Added module');
    });
    
    it('should show message when no modules are detected', async () => {
      mockModuleManager.detectModules.mockResolvedValueOnce([]);
      
      await moduleCommands.detect.action({});
      
      expectOutputToContain('No modules automatically detected');
    });
    
    it('should handle errors when detecting modules', async () => {
      mockModuleManager.detectModules.mockRejectedValueOnce(new Error('Test error'));
      
      try {
        await moduleCommands.detect.action({});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error detecting modules', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should handle errors when adding detected modules', async () => {
      mockModuleManager.addModule.mockRejectedValueOnce(new Error('Test error'));
      
      await moduleCommands.detect.action({ add: true });
      
      expectOutputToContain('Warning: Could not add module', 'warn');
    });
  });
  
  describe('deps command', () => {
    it('should show dependencies for a module', async () => {
      await moduleCommands.deps.action('test-module', {});
      
      expect(mockModuleManager.getDependencies).toHaveBeenCalledWith('test-module');
      expectOutputToContain('Dependencies for module');
    });
    
    it('should add a dependency to a module', async () => {
      await moduleCommands.deps.action('test-module', { add: 'dep3' });
      
      expect(mockModuleManager.addDependency).toHaveBeenCalledWith('test-module', 'dep3');
      expectOutputToContain('Added dependency');
    });
    
    it('should remove a dependency from a module', async () => {
      await moduleCommands.deps.action('test-module', { remove: 'dep1' });
      
      expect(mockModuleManager.removeDependency).toHaveBeenCalledWith('test-module', 'dep1');
      expectOutputToContain('Removed dependency');
    });
    
    it('should visualize all dependencies', async () => {
      await moduleCommands.deps.action(null, { visualize: true });
      
      expect(mockModuleManager.listModules).toHaveBeenCalled();
      expectOutputToContain('Module dependency visualization');
    });
    
    it('should show help message when no options provided', async () => {
      await moduleCommands.deps.action(null, {});
      
      expectOutputToContain('Please specify a module name or use --visualize');
    });
    
    it('should handle errors when managing dependencies', async () => {
      mockModuleManager.getDependencies.mockRejectedValueOnce(new Error('Test error'));
      
      try {
        await moduleCommands.deps.action('test-module', {});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error managing dependencies', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should handle empty dependencies and dependents', async () => {
      mockModuleManager.getDependencies.mockResolvedValueOnce({
        dependencies: [],
        dependents: []
      });
      
      await moduleCommands.deps.action('test-module', {});
      
      expectOutputToContain('No dependencies');
    });
  });
});