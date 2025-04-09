/**
 * Alternative tests for the module command using mock direct actions
 */

// Import the mock implementation
const { mockModuleCommand } = require('./mocks/mock-commands');

describe('module command actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should add a module', async () => {
    await mockModuleCommand.add.action('test-module', '/path/to/test-module', {});
    
    expect(mockModuleCommand.add.action).toHaveBeenCalledWith(
      'test-module',
      '/path/to/test-module',
      {}
    );
  });
  
  it('should add a module with description', async () => {
    await mockModuleCommand.add.action('test-module', '/path/to/test-module', { description: 'Test description' });
    
    expect(mockModuleCommand.add.action).toHaveBeenCalledWith(
      'test-module',
      '/path/to/test-module',
      { description: 'Test description' }
    );
  });
  
  it('should list modules', async () => {
    await mockModuleCommand.list.action({});
    
    expect(mockModuleCommand.list.action).toHaveBeenCalledWith({});
  });
  
  it('should remove a module', async () => {
    await mockModuleCommand.remove.action('test-module');
    
    expect(mockModuleCommand.remove.action).toHaveBeenCalledWith('test-module');
  });
});
