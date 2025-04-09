/**
 * Improved tests for the module CLI command
 * 
 * This approach builds on the successful module-alt.test.js pattern
 * and fixes the issues seen in the original module.test.js
 */

// Set up all mocks before requiring the module
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

// Create mock module manager with controlled functions
const mockModuleManager = {
  addModule: mockAddModule,
  listModules: mockListModules,
  removeModule: mockRemoveModule,
  detectModules: mockDetectModules,
  addDependency: mockAddDependency,
  removeDependency: mockRemoveDependency,
  getDependencies: mockGetDependencies
};

// Mock dependencies before requiring the module
jest.mock('../src/modules/manager', () => ({
  moduleManager: mockModuleManager
}));

// Mock the project scanner (not directly used but might be required by imports)
jest.mock('../src/scanner', () => ({
  projectScanner: {
    scanProject: jest.fn()
  }
}));

// Now require the module under test
const { module: moduleCommands } = require('../src/cli/commands/module');

// Test suite
describe('module commands (improved tests)', () => {
  beforeEach(() => {
    // Clear all mock function calls before each test
    jest.clearAllMocks();
    
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
    
    // Mock process.exit to prevent test termination
    process.exit = jest.fn();
  });
  
  // Helper function to check output
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
      
      expect(mockAddModule).toHaveBeenCalledWith(
        'test-module',
        '/path/to/test-module',
        undefined
      );
      
      expectOutputToContain('Module added successfully');
    });
    
    it('should add a module with description', async () => {
      await moduleCommands.add.action('test-module', '/path/to/test-module', { description: 'Test description' });
      
      expect(mockAddModule).toHaveBeenCalledWith(
        'test-module',
        '/path/to/test-module',
        'Test description'
      );
      
      expectOutputToContain('Module added successfully');
    });
    
    it('should handle errors when adding a module', async () => {
      // Set up mock to reject just for this test
      mockAddModule.mockRejectedValueOnce(new Error('Test error'));
      
      await moduleCommands.add.action('test-module', '/path/to/test-module', {});
      
      expectOutputToContain('Error adding module', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('list command', () => {
    it('should list all modules', async () => {
      await moduleCommands.list.action({});
      
      expect(mockListModules).toHaveBeenCalled();
      expectOutputToContain('Defined modules');
    });
    
    it('should show detailed information with verbose option', async () => {
      await moduleCommands.list.action({ verbose: true });
      
      expect(mockListModules).toHaveBeenCalled();
      expectOutputToContain('Path:');
      expectOutputToContain('Description:');
    });
    
    it('should show message when no modules are defined', async () => {
      // Override for this test only
      mockListModules.mockResolvedValueOnce([]);
      
      await moduleCommands.list.action({});
      
      expectOutputToContain('No modules defined');
    });
    
    it('should handle errors when listing modules', async () => {
      // Override for this test only
      mockListModules.mockRejectedValueOnce(new Error('Test error'));
      
      await moduleCommands.list.action({});
      
      expectOutputToContain('Error listing modules', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('remove command', () => {
    it('should remove a module', async () => {
      await moduleCommands.remove.action('test-module');
      
      expect(mockRemoveModule).toHaveBeenCalledWith('test-module');
      expectOutputToContain('Module \'test-module\' removed successfully');
    });
    
    it('should handle errors when removing a module', async () => {
      // Override for this test only
      mockRemoveModule.mockRejectedValueOnce(new Error('Test error'));
      
      await moduleCommands.remove.action('test-module');
      
      expectOutputToContain('Error removing module', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('detect command', () => {
    it('should detect modules', async () => {
      await moduleCommands.detect.action({});
      
      expect(mockDetectModules).toHaveBeenCalled();
      expectOutputToContain('Detected');
      expectOutputToContain('potential modules');
    });
    
    it('should add detected modules with --add option', async () => {
      await moduleCommands.detect.action({ add: true });
      
      expect(mockDetectModules).toHaveBeenCalled();
      expect(mockAddModule).toHaveBeenCalledWith(
        'detected-module',
        '/path/to/detected',
        'Detected module'
      );
      
      expectOutputToContain('Added module');
    });
    
    it('should show message when no modules are detected', async () => {
      // Override for this test only
      mockDetectModules.mockResolvedValueOnce([]);
      
      await moduleCommands.detect.action({});
      
      expectOutputToContain('No modules automatically detected');
    });
    
    it('should handle errors when detecting modules', async () => {
      // Override for this test only
      mockDetectModules.mockRejectedValueOnce(new Error('Test error'));
      
      await moduleCommands.detect.action({});
      
      expectOutputToContain('Error detecting modules', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should handle errors when adding detected modules', async () => {
      // Make addModule fail once but continue with the test
      mockAddModule.mockRejectedValueOnce(new Error('Test error'));
      
      await moduleCommands.detect.action({ add: true });
      
      expectOutputToContain('Warning:', 'warn');
      expectOutputToContain('Could not add module', 'warn');
    });
  });
  
  describe('deps command', () => {
    it('should show dependencies for a module', async () => {
      await moduleCommands.deps.action('test-module', {});
      
      expect(mockGetDependencies).toHaveBeenCalledWith('test-module');
      expectOutputToContain('Dependencies for module');
    });
    
    it('should add a dependency to a module', async () => {
      await moduleCommands.deps.action('test-module', { add: 'dep3' });
      
      expect(mockAddDependency).toHaveBeenCalledWith('test-module', 'dep3');
      expectOutputToContain('Added dependency');
    });
    
    it('should remove a dependency from a module', async () => {
      await moduleCommands.deps.action('test-module', { remove: 'dep1' });
      
      expect(mockRemoveDependency).toHaveBeenCalledWith('test-module', 'dep1');
      expectOutputToContain('Removed dependency');
    });
    
    it('should visualize all dependencies', async () => {
      await moduleCommands.deps.action(null, { visualize: true });
      
      expect(mockListModules).toHaveBeenCalled();
      expectOutputToContain('Module dependency visualization');
    });
    
    it('should show help message when no options provided', async () => {
      await moduleCommands.deps.action(null, {});
      
      expectOutputToContain('Please specify a module name or use --visualize');
    });
    
    it('should handle errors when managing dependencies', async () => {
      // Override for this test only
      mockGetDependencies.mockRejectedValueOnce(new Error('Test error'));
      
      await moduleCommands.deps.action('test-module', {});
      
      expectOutputToContain('Error managing dependencies', 'error');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should handle empty dependencies and dependents', async () => {
      // Override for this test only
      mockGetDependencies.mockResolvedValueOnce({
        dependencies: [],
        dependents: []
      });
      
      await moduleCommands.deps.action('test-module', {});
      
      expectOutputToContain('No dependencies');
    });
  });
});
