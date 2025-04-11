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
    
    // Mock console methods
    console.log = jest.fn((...args) => {
      const message = args.join(' ');
      global.consoleOutput.log.push(message);
    });
    
    console.error = jest.fn((...args) => {
      const message = args.join(' ');
      global.consoleOutput.error.push(message);
    });
    
    console.warn = jest.fn((...args) => {
      const message = args.join(' ');
      global.consoleOutput.warn.push(message);
    });
    
    // Mock process.exit
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });
  
  afterEach(() => {
    mockExit.mockRestore();
  });
  
  // Simplified helper function to check output
  const expectOutputToContain = (text, outputType = 'log') => {
    const output = global.consoleOutput[outputType];
    const found = output.some(line => 
      line && typeof line === 'string' && line.toLowerCase().includes(text.toLowerCase())
    );
    
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
      
      // Simple check without using expectOutputToContain
      const errorOutput = global.consoleOutput.error;
      const hasErrorMessage = errorOutput.some(msg => 
        msg.toLowerCase().includes('error') && msg.toLowerCase().includes('listing modules')
      );
      expect(hasErrorMessage).toBe(true);
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
      
      // Simple check without using expectOutputToContain
      const logOutput = global.consoleOutput.log;
      const hasModule = logOutput.some(msg => msg.includes('module1'));
      expect(hasModule).toBe(true);
      
      const hasDependencies = logOutput.some(msg => 
        msg.includes('Dependencies') && msg.includes('module2') && msg.includes('module3')
      );
      expect(hasDependencies).toBe(true);
    });
    
    it('should handle no modules found', async () => {
      // Mock empty modules list
      mockModuleManager.listModules.mockResolvedValueOnce([]);
      
      await moduleCommands.list.action({});
      
      // Simple check without using expectOutputToContain
      const logOutput = global.consoleOutput.log;
      const hasNoModulesMessage = logOutput.some(msg => 
        msg.toLowerCase().includes('no modules') || msg.toLowerCase().includes('no modules defined')
      );
      expect(hasNoModulesMessage).toBe(true);
    });
  });
  
  describe('deps command', () => {
    it('should show warning when no module specified and no visualize option', async () => {
      await moduleCommands.deps.action(null, {});
      
      // Simple check without using expectOutputToContain
      const logOutput = global.consoleOutput.log;
      const hasWarningMessage = logOutput.some(msg => 
        msg.toLowerCase().includes('please specify a module name')
      );
      expect(hasWarningMessage).toBe(true);
    });
    
    it('should visualize all dependencies', async () => {
      await moduleCommands.deps.action(null, { visualize: true });
      
      // Simple check without using expectOutputToContain
      const logOutput = global.consoleOutput.log;
      const hasVisualizationMessage = logOutput.some(msg => 
        msg.toLowerCase().includes('module dependency') && msg.toLowerCase().includes('visualization')
      );
      expect(hasVisualizationMessage).toBe(true);
    });
  });
});