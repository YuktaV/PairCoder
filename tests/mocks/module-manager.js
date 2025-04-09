/**
 * Mock implementation for the module manager
 */

const moduleManager = {
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

module.exports = { moduleManager };
