/**
 * Minimal tests for the module CLI command
 */

// Set up mocks before requiring the module
const mockAddModule = jest.fn().mockResolvedValue({
  name: 'test-module',
  path: '/path/to/test-module',
  description: 'Test module description'
});

const mockListModules = jest.fn().mockResolvedValue([
  { name: 'test-module', path: '/path/to/test-module', description: 'Test module description' }
]);

// Create mock module manager with controlled functions
const mockModuleManager = {
  addModule: mockAddModule,
  listModules: mockListModules
};

// Mock dependencies before requiring the module
jest.mock('../src/modules/manager', () => ({
  moduleManager: mockModuleManager
}));

// Mock console methods
console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();
process.exit = jest.fn();

// Now require the module
const { module: moduleCommands } = require('../src/cli/commands/module');

describe('module commands (minimal tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call addModule when adding a module', async () => {
    await moduleCommands.add.action('test-module', '/path/to/test-module', {});
    
    expect(mockAddModule).toHaveBeenCalledWith(
      'test-module',
      '/path/to/test-module',
      undefined
    );
  });

  it('should call listModules when listing modules', async () => {
    await moduleCommands.list.action({});
    
    expect(mockListModules).toHaveBeenCalled();
  });
});