/**
 * Tests for the module-extended.js implementation
 * 
 * This test covers the implementation file directly, while the 
 * existing module-extended.test.js covers the factory-created functions.
 */

// Mock the dependencies
jest.mock('../src/cli/commands/module-extended-factory', () => ({
  createExtendedModuleCommands: jest.fn().mockReturnValue({
    add: { command: 'add', action: jest.fn() },
    list: { command: 'list', action: jest.fn() },
    remove: { command: 'remove', action: jest.fn() },
    detect: { command: 'detect', action: jest.fn() },
    deps: { command: 'deps', action: jest.fn() }
  })
}));

jest.mock('../src/cli/commands/deps-command', () => ({
  createDepsCommand: jest.fn().mockReturnValue({
    deps: { command: 'deps', action: jest.fn() }
  })
}));

describe('module-extended.js', () => {
  // Import module only after mocks are set up
  const { moduleExtended, createExtendedModuleCommands, createDepsCommand } = require('../src/cli/commands/module-extended');
  
  test('should export moduleExtended object', () => {
    expect(moduleExtended).toBeDefined();
    expect(typeof moduleExtended).toBe('object');
  });
  
  test('should export factory functions', () => {
    expect(createExtendedModuleCommands).toBeDefined();
    expect(typeof createExtendedModuleCommands).toBe('function');
    
    expect(createDepsCommand).toBeDefined();
    expect(typeof createDepsCommand).toBe('function');
  });
  
  test('should export required commands', () => {
    expect(moduleExtended.add).toBeDefined();
    expect(moduleExtended.list).toBeDefined();
    expect(moduleExtended.remove).toBeDefined();
    expect(moduleExtended.detect).toBeDefined();
    expect(moduleExtended.deps).toBeDefined();
  });
  
  test('should use factory functions to create commands', () => {
    // The module-extended.js file calls these functions when it's imported
    expect(createExtendedModuleCommands).toHaveBeenCalled();
    expect(createDepsCommand).toHaveBeenCalled();
  });
});
