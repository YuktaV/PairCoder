/**
 * Tests for the deps-factory module
 */

// Mock the createDepsCommand function
const mockCreateDepsCommand = jest.fn().mockImplementation((deps) => ({
  deps: { 
    command: 'deps [module]', 
    description: 'Manage module dependencies', 
    options: [
      { flags: '-a, --add <dependency>', description: 'Add dependency to module' }
    ],
    action: jest.fn() 
  },
  depsCmd: jest.fn(),
  _handleModuleDependencies: jest.fn(),
  _showModuleDependencies: jest.fn(),
  _visualizeDependencies: jest.fn()
}));

jest.mock('../src/cli/commands/deps-command', () => ({
  createDepsCommand: mockCreateDepsCommand
}));

// Import the factory module
const { deps, createDepsFactory } = require('../src/cli/commands/deps-factory');

describe('deps-factory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should export deps object and createDepsFactory function', () => {
    expect(deps).toBeDefined();
    expect(createDepsFactory).toBeInstanceOf(Function);
  });
  
  it('should pass dependencies to createDepsCommand', () => {
    const mockModuleManager = { listModules: jest.fn() };
    const mockDeps = { moduleManager: mockModuleManager };
    
    createDepsFactory(mockDeps);
    
    expect(mockCreateDepsCommand).toHaveBeenCalledWith(mockDeps);
  });
  
  it('should use default dependencies when none provided', () => {
    createDepsFactory();
    
    expect(mockCreateDepsCommand).toHaveBeenCalledWith({});
  });
  
  it('should return the deps property from createDepsCommand result', () => {
    const mockDepsCmd = { deps: { command: 'test' }, depsCmd: jest.fn() };
    mockCreateDepsCommand.mockReturnValueOnce(mockDepsCmd);
    
    const result = createDepsFactory();
    
    expect(result).toEqual(mockDepsCmd);
  });
  
  it('should export a valid deps command object', () => {
    // Verify that the exported deps object has the expected structure
    expect(deps).toBeDefined();
    // We can't directly test if mockCreateDepsCommand was called during module initialization,
    // but we can verify the structure of the exported deps object
    expect(deps).toHaveProperty('command');
    expect(deps).toHaveProperty('description');
    expect(deps).toHaveProperty('options');
    expect(deps).toHaveProperty('action');
  });
});
