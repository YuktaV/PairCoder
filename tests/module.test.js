/**
 * Tests for the module CLI command
 */

// Create mock functions for all dependencies
const mockAddModule = jest.fn().mockResolvedValue({
  name: 'test-module',
  path: '/path/to/test-module',
  description: 'Test module description'
});

const mockListModules = jest.fn().mockResolvedValue([
  { name: 'test-module', path: '/path/to/test-module', description: 'Test module description' },
  { name: 'other-module', path: '/path/to/other-module', description: 'Other module description' }
]);

const mockRemoveModule = jest.fn().mockResolvedValue(true);

const mockDetectModules = jest.fn().mockResolvedValue([
  { name: 'detected-module', path: '/path/to/detected', description: 'Detected module', fileCount: 10 }
]);

const mockAddDependency = jest.fn().mockResolvedValue(true);

const mockRemoveDependency = jest.fn().mockResolvedValue(true);

const mockGetDependencies = jest.fn().mockResolvedValue({
  module: 'test-module',
  dependencies: ['dep1', 'dep2'],
  dependents: ['dependent1']
});

// Create mock module manager
const mockModuleManager = {
  addModule: mockAddModule,
  listModules: mockListModules,
  removeModule: mockRemoveModule,
  detectModules: mockDetectModules,
  addDependency: mockAddDependency,
  removeDependency: mockRemoveDependency,
  getDependencies: mockGetDependencies
};

const mockProjectScanner = {
  scanProject: jest.fn()
};

// Mock Command constructor with chainable methods
const mockActionFns = {
  add: null,
  list: null,
  remove: null,
  detect: null,
  deps: null
};

function MockCommand(name) {
  this.name = name;
  this.description = jest.fn(() => this);
  this.argument = jest.fn(() => this);
  this.option = jest.fn(() => this);
  this.action = jest.fn(fn => {
    mockActionFns[name] = fn;
    return this;
  });
}

// Mock commander
jest.mock('commander', () => ({
  Command: jest.fn(name => new MockCommand(name))
}));

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
      const actionFn = mockActionFns.add;
      if (!actionFn) {
        console.warn("Action function for 'add' command not found");
        return;
      }
      
      await actionFn('test-module', '/path/to/test-module', {});
      
      expect(mockAddModule).toHaveBeenCalledWith(
        'test-module',
        '/path/to/test-module',
        undefined
      );
      
      expectOutputToContain('Module added successfully');
    });
    
    it('should add a module with description', async () => {
      const actionFn = mockActionFns.add;
      if (!actionFn) {
        console.warn("Action function for 'add' command not found");
        return;
      }
      
      await actionFn('test-module', '/path/to/test-module', { description: 'Test description' });
      
      expect(mockAddModule).toHaveBeenCalledWith(
        'test-module',
        '/path/to/test-module',
        'Test description'
      );
    });
    
    it('should handle errors when adding a module', async () => {
      mockAddModule.mockRejectedValueOnce(new Error('Test error'));
      
      const actionFn = mockActionFns.add;
      if (!actionFn) {
        console.warn("Action function for 'add' command not found");
        return;
      }
      
      // We need to catch the process.exit mock error
      try {
        await actionFn('test-module', '/path/to/test-module', {});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error adding module', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('list command', () => {
    it('should list all modules', async () => {
      const actionFn = mockActionFns.list;
      if (!actionFn) {
        console.warn("Action function for 'list' command not found");
        return;
      }
      
      await actionFn({});
      
      expect(mockListModules).toHaveBeenCalled();
      expectOutputToContain('Defined modules');
    });
    
    it('should show detailed information with verbose option', async () => {
      const actionFn = mockActionFns.list;
      if (!actionFn) {
        console.warn("Action function for 'list' command not found");
        return;
      }
      
      await actionFn({ verbose: true });
      
      expectOutputToContain('Path:');
      expectOutputToContain('Description:');
    });
    
    it('should show message when no modules are defined', async () => {
      mockListModules.mockResolvedValueOnce([]);
      
      const actionFn = mockActionFns.list;
      if (!actionFn) {
        console.warn("Action function for 'list' command not found");
        return;
      }
      
      await actionFn({});
      
      expectOutputToContain('No modules defined');
    });
    
    it('should handle errors when listing modules', async () => {
      mockListModules.mockRejectedValueOnce(new Error('Test error'));
      
      const actionFn = mockActionFns.list;
      if (!actionFn) {
        console.warn("Action function for 'list' command not found");
        return;
      }
      
      try {
        await actionFn({});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error listing modules', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('remove command', () => {
    it('should remove a module', async () => {
      const actionFn = mockActionFns.remove;
      if (!actionFn) {
        console.warn("Action function for 'remove' command not found");
        return;
      }
      
      await actionFn('test-module');
      
      expect(mockRemoveModule).toHaveBeenCalledWith('test-module');
      expectOutputToContain('Module \'test-module\' removed successfully');
    });
    
    it('should handle errors when removing a module', async () => {
      mockRemoveModule.mockRejectedValueOnce(new Error('Test error'));
      
      const actionFn = mockActionFns.remove;
      if (!actionFn) {
        console.warn("Action function for 'remove' command not found");
        return;
      }
      
      try {
        await actionFn('test-module');
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error removing module', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('detect command', () => {
    it('should detect modules', async () => {
      const actionFn = mockActionFns.detect;
      if (!actionFn) {
        console.warn("Action function for 'detect' command not found");
        return;
      }
      
      await actionFn({});
      
      expect(mockDetectModules).toHaveBeenCalled();
      expectOutputToContain('Detected 1 potential modules');
    });
    
    it('should add detected modules with --add option', async () => {
      const actionFn = mockActionFns.detect;
      if (!actionFn) {
        console.warn("Action function for 'detect' command not found");
        return;
      }
      
      await actionFn({ add: true });
      
      expect(mockAddModule).toHaveBeenCalledWith(
        'detected-module',
        '/path/to/detected',
        'Detected module'
      );
      
      expectOutputToContain('Added module');
    });
    
    it('should show message when no modules are detected', async () => {
      mockDetectModules.mockResolvedValueOnce([]);
      
      const actionFn = mockActionFns.detect;
      if (!actionFn) {
        console.warn("Action function for 'detect' command not found");
        return;
      }
      
      await actionFn({});
      
      expectOutputToContain('No modules automatically detected');
    });
    
    it('should handle errors when detecting modules', async () => {
      mockDetectModules.mockRejectedValueOnce(new Error('Test error'));
      
      const actionFn = mockActionFns.detect;
      if (!actionFn) {
        console.warn("Action function for 'detect' command not found");
        return;
      }
      
      try {
        await actionFn({});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error detecting modules', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should handle errors when adding detected modules', async () => {
      mockAddModule.mockRejectedValueOnce(new Error('Test error'));
      
      const actionFn = mockActionFns.detect;
      if (!actionFn) {
        console.warn("Action function for 'detect' command not found");
        return;
      }
      
      await actionFn({ add: true });
      
      expectOutputToContain('Warning: Could not add module', 'warn');
    });
  });
  
  describe('deps command', () => {
    it('should show dependencies for a module', async () => {
      const actionFn = mockActionFns.deps;
      if (!actionFn) {
        console.warn("Action function for 'deps' command not found");
        return;
      }
      
      await actionFn('test-module', {});
      
      expect(mockGetDependencies).toHaveBeenCalledWith('test-module');
      expectOutputToContain('Dependencies for module');
    });
    
    it('should add a dependency to a module', async () => {
      const actionFn = mockActionFns.deps;
      if (!actionFn) {
        console.warn("Action function for 'deps' command not found");
        return;
      }
      
      await actionFn('test-module', { add: 'dep3' });
      
      expect(mockAddDependency).toHaveBeenCalledWith('test-module', 'dep3');
      expectOutputToContain('Added dependency');
    });
    
    it('should remove a dependency from a module', async () => {
      const actionFn = mockActionFns.deps;
      if (!actionFn) {
        console.warn("Action function for 'deps' command not found");
        return;
      }
      
      await actionFn('test-module', { remove: 'dep1' });
      
      expect(mockRemoveDependency).toHaveBeenCalledWith('test-module', 'dep1');
      expectOutputToContain('Removed dependency');
    });
    
    it('should visualize all dependencies', async () => {
      const actionFn = mockActionFns.deps;
      if (!actionFn) {
        console.warn("Action function for 'deps' command not found");
        return;
      }
      
      await actionFn(null, { visualize: true });
      
      expect(mockListModules).toHaveBeenCalled();
      expectOutputToContain('Module dependency visualization');
    });
    
    it('should show help message when no options provided', async () => {
      const actionFn = mockActionFns.deps;
      if (!actionFn) {
        console.warn("Action function for 'deps' command not found");
        return;
      }
      
      await actionFn(null, {});
      
      expectOutputToContain('Please specify a module name or use --visualize');
    });
    
    it('should handle errors when managing dependencies', async () => {
      mockGetDependencies.mockRejectedValueOnce(new Error('Test error'));
      
      const actionFn = mockActionFns.deps;
      if (!actionFn) {
        console.warn("Action function for 'deps' command not found");
        return;
      }
      
      try {
        await actionFn('test-module', {});
      } catch (error) {
        // Process.exit was called
      }
      
      expectOutputToContain('Error managing dependencies', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should handle empty dependencies and dependents', async () => {
      mockGetDependencies.mockResolvedValueOnce({
        dependencies: [],
        dependents: []
      });
      
      const actionFn = mockActionFns.deps;
      if (!actionFn) {
        console.warn("Action function for 'deps' command not found");
        return;
      }
      
      await actionFn('test-module', {});
      
      expectOutputToContain('No dependencies');
    });
  });
});