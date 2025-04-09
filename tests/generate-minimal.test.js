/**
 * Minimal tests for the generate CLI command
 */

jest.mock('../src/core/config', () => ({
  configManager: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getConfig: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../src/modules/manager', () => ({
  moduleManager: {
    listModules: jest.fn().mockResolvedValue([
      { name: 'test-module', path: '/path/to/test-module' },
      { name: 'other-module', path: '/path/to/other-module' }
    ])
  }
}));

jest.mock('../src/context/generator', () => ({
  contextGenerator: {
    generateModuleContext: jest.fn().mockResolvedValue({
      moduleName: 'test-module',
      level: 'medium',
      tokenCount: 2000,
      fromCache: false
    })
  },
  DETAIL_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  }
}));

// Mock console methods
console.log = jest.fn();
console.error = jest.fn();

// Import generate command after mocks are set up
const { generate } = require('../src/cli/commands/generate');

describe('generate command (minimal tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls generateModuleContext with correct parameters', async () => {
    const { contextGenerator } = require('../src/context/generator');
    
    await generate('test-module');
    
    expect(contextGenerator.generateModuleContext).toHaveBeenCalledWith(
      'test-module',
      expect.objectContaining({
        level: 'medium',
        force: false
      })
    );
  });
  
  it('shows error for non-existent module', async () => {
    const { moduleManager } = require('../src/modules/manager');
    
    await generate('non-existent-module');
    
    expect(moduleManager.listModules).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});