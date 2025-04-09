/**
 * PairCoder Config Command Tests
 * 
 * Tests for the config command functionality using dependency injection
 * to mock all external dependencies for comprehensive coverage.
 */

const { createConfigCommands } = require('../../../src/cli/commands/config-factory');
const path = require('path');

describe('Config Command', () => {
  // Mock dependencies
  const mockFs = {
    pathExists: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockInquirer = {
    prompt: jest.fn()
  };
  
  const mockConfigManager = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getConfig: jest.fn(),
    saveConfig: jest.fn().mockResolvedValue(undefined),
    getValue: jest.fn(),
    setValue: jest.fn().mockResolvedValue(undefined),
    deleteValue: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockPath = {
    isAbsolute: jest.fn(),
    join: jest.fn(),
    basename: jest.fn()
  };
  
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  // Mock console methods
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockFs.pathExists.mockResolvedValue(false);
    mockFs.readFile.mockResolvedValue('{"project":{"name":"test-project"}}');
    
    mockPath.isAbsolute.mockImplementation(p => p.startsWith('/'));
    mockPath.join.mockImplementation((dir, file) => `${dir}/${file}`);
    mockPath.basename.mockReturnValue('test-project');
    
    mockConfigManager.getConfig.mockResolvedValue({
      project: {
        name: 'test-project',
        root: '/test/path',
        excludes: ['node_modules', 'dist', '.git', 'build']
      },
      modules: [
        { name: 'core', path: 'src/core' }
      ],
      context: {
        defaultLevel: 'medium',
        tokenBudget: 4000
      },
      versioning: {
        enabled: true,
        gitIntegration: false
      }
    });
    
    mockConfigManager.getValue.mockImplementation(async (key) => {
      switch (key) {
        case 'project.name':
          return 'test-project';
        case 'project.excludes':
          return ['node_modules', 'dist', '.git', 'build'];
        case 'project.excludes.0':
          return 'node_modules';
        case 'context.defaultLevel':
          return 'medium';
        case 'nonexistent.key':
          return undefined;
        default:
          return undefined;
      }
    });
    
    mockInquirer.prompt.mockImplementation(async (questions) => {
      const question = questions[0];
      if (question.name === 'confirmDelete') {
        return { confirmDelete: true };
      }
      if (question.name === 'confirmReset') {
        return { confirmReset: true };
      }
      if (question.name === 'confirmOverwrite') {
        return { confirmOverwrite: true };
      }
      if (question.name === 'confirmReplace') {
        return { confirmReplace: true };
      }
      return {};
    });
  });
  
  // Restore console methods
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  // Create config command with mocked dependencies
  const { configCmd } = createConfigCommands({
    fs: mockFs,
    inquirer: mockInquirer,
    configManager: mockConfigManager,
    path: mockPath
  });
  
  describe('Main Command', () => {
    test('shows configuration when no options provided', async () => {
      const result = await configCmd({});
      
      expect(result.success).toBe(true);
      expect(mockConfigManager.getConfig).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Current Configuration'));
    });
    
    test('handles errors gracefully', async () => {
      mockConfigManager.getConfig.mockRejectedValueOnce(new Error('Test error'));
      
      const result = await configCmd({});
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error executing config command'));
    });
  });
  
  describe('Get Config Value', () => {
    test('retrieves and displays simple configuration value', async () => {
      const result = await configCmd.getConfigValue('project.name');
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('test-project');
      expect(mockConfigManager.getValue).toHaveBeenCalledWith('project.name');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('project.name:'));
    });
    
    test('retrieves and displays array configuration value', async () => {
      const result = await configCmd.getConfigValue('project.excludes');
      
      expect(result.success).toBe(true);
      expect(mockConfigManager.getValue).toHaveBeenCalledWith('project.excludes');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('project.excludes:'));
    });
    
    test('handles nonexistent configuration key', async () => {
      const result = await configCmd.getConfigValue('nonexistent.key');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(`Key 'nonexistent.key' not found`);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`not found`));
    });
    
    test('handles errors gracefully', async () => {
      mockConfigManager.getValue.mockRejectedValueOnce(new Error('Test error'));
      
      const result = await configCmd.getConfigValue('project.name');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error getting config value'));
    });
  });
  
  describe('Set Config Value', () => {
    test('sets string configuration value', async () => {
      const result = await configCmd.setConfigValue('project.name', 'new-project-name');
      
      expect(result.success).toBe(true);
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('project.name', 'new-project-name');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('updated successfully'));
    });
    
    test('sets numeric configuration value with auto-parsing', async () => {
      const result = await configCmd.setConfigValue('context.tokenBudget', '5000');
      
      expect(result.success).toBe(true);
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('context.tokenBudget', 5000);
    });
    
    test('sets boolean configuration value with auto-parsing', async () => {
      const result = await configCmd.setConfigValue('versioning.enabled', 'false');
      
      expect(result.success).toBe(true);
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('versioning.enabled', false);
    });
    
    test('sets JSON configuration value with auto-parsing', async () => {
      const result = await configCmd.setConfigValue('project.excludes', '["node_modules", "build", "dist"]');
      
      expect(result.success).toBe(true);
      expect(mockConfigManager.setValue).toHaveBeenCalledWith(
        'project.excludes', 
        ['node_modules', 'build', 'dist']
      );
    });
    
    test('handles errors gracefully', async () => {
      mockConfigManager.setValue.mockRejectedValueOnce(new Error('Test error'));
      
      const result = await configCmd.setConfigValue('project.name', 'new-name');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error setting config value'));
    });
  });
  
  describe('Delete Config Value', () => {
    test('deletes configuration value when confirmed', async () => {
      const result = await configCmd.deleteConfigValue('project.excludes.0');
      
      expect(result.success).toBe(true);
      expect(mockConfigManager.deleteValue).toHaveBeenCalledWith('project.excludes.0');
      expect(mockInquirer.prompt).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('deleted successfully'));
    });
    
    test('cancels deletion when not confirmed', async () => {
      // Override the mock to return false for confirmDelete
      mockInquirer.prompt.mockResolvedValueOnce({ confirmDelete: false });
      
      const result = await configCmd.deleteConfigValue('project.excludes.0');
      
      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(mockConfigManager.deleteValue).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Deletion cancelled'));
    });
    
    test('handles nonexistent configuration key', async () => {
      const result = await configCmd.deleteConfigValue('nonexistent.key');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(`Key 'nonexistent.key' not found`);
      expect(mockConfigManager.deleteValue).not.toHaveBeenCalled();
    });
    
    test('handles errors gracefully', async () => {
      mockConfigManager.getValue.mockResolvedValueOnce('exists');
      mockConfigManager.deleteValue.mockRejectedValueOnce(new Error('Test error'));
      
      const result = await configCmd.deleteConfigValue('project.name');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error deleting config value'));
    });
  });
  
  describe('Show Config', () => {
    test('displays entire configuration', async () => {
      const result = await configCmd.showConfig();
      
      expect(result.success).toBe(true);
      expect(result.config).toEqual(expect.objectContaining({
        project: expect.any(Object),
        modules: expect.any(Array)
      }));
      expect(mockConfigManager.getConfig).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Current Configuration'));
    });
    
    test('handles errors gracefully', async () => {
      mockConfigManager.getConfig.mockRejectedValueOnce(new Error('Test error'));
      
      const result = await configCmd.showConfig();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error displaying config'));
    });
  });
  
  describe('Reset Config', () => {
    test('resets configuration when confirmed', async () => {
      const result = await configCmd.resetConfig();
      
      expect(result.success).toBe(true);
      expect(mockConfigManager.saveConfig).toHaveBeenCalledWith(expect.objectContaining({
        project: expect.objectContaining({
          name: 'test-project'
        }),
        context: expect.objectContaining({
          defaultLevel: 'medium',
          tokenBudget: 4000
        })
      }));
      expect(mockInquirer.prompt).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Configuration reset'));
    });
    
    test('cancels reset when not confirmed', async () => {
      // Override the mock to return false for confirmReset
      mockInquirer.prompt.mockResolvedValueOnce({ confirmReset: false });
      
      const result = await configCmd.resetConfig();
      
      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(mockConfigManager.saveConfig).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Reset cancelled'));
    });
    
    test('handles errors gracefully', async () => {
      mockConfigManager.saveConfig.mockRejectedValueOnce(new Error('Test error'));
      
      const result = await configCmd.resetConfig();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error resetting config'));
    });
  });
  
  describe('Export Config', () => {
    test('exports configuration to default file', async () => {
      const result = await configCmd.exportConfig({});
      
      expect(result.success).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('paircoder-config.json'),
        expect.any(String),
        'utf8'
      );
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('exported to'));
    });
    
    test('exports configuration to specified file', async () => {
      const result = await configCmd.exportConfig({ output: 'custom-config.json' });
      
      expect(result.success).toBe(true);
      expect(mockPath.isAbsolute).toHaveBeenCalledWith('custom-config.json');
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
    
    test('prompts for confirmation when file exists', async () => {
      mockFs.pathExists.mockResolvedValueOnce(true);
      
      const result = await configCmd.exportConfig({ output: 'existing-file.json' });
      
      expect(result.success).toBe(true);
      expect(mockInquirer.prompt).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
    
    test('cancels export when overwrite not confirmed', async () => {
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockInquirer.prompt.mockResolvedValueOnce({ confirmOverwrite: false });
      
      const result = await configCmd.exportConfig({});
      
      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Export cancelled'));
    });
    
    test('skips confirmation with force option', async () => {
      mockFs.pathExists.mockResolvedValueOnce(true);
      
      const result = await configCmd.exportConfig({ force: true });
      
      expect(result.success).toBe(true);
      expect(mockInquirer.prompt).not.toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
    
    test('handles errors gracefully', async () => {
      mockFs.writeFile.mockRejectedValueOnce(new Error('Test error'));
      
      const result = await configCmd.exportConfig({});
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error exporting config'));
    });
  });
  
  describe('Import Config', () => {
    test('imports configuration from file', async () => {
      mockFs.pathExists.mockResolvedValueOnce(true);
      
      const result = await configCmd.importConfig('import-config.json', { force: true });
      
      expect(result.success).toBe(true);
      expect(mockFs.readFile).toHaveBeenCalledWith('import-config.json', 'utf8');
      expect(mockConfigManager.saveConfig).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('imported from'));
    });
    
    test('prompts for confirmation before replacing', async () => {
      mockFs.pathExists.mockResolvedValueOnce(true);
      
      const result = await configCmd.importConfig('import-config.json', {});
      
      expect(result.success).toBe(true);
      expect(mockInquirer.prompt).toHaveBeenCalled();
      expect(mockConfigManager.saveConfig).toHaveBeenCalled();
    });
    
    test('cancels import when replacement not confirmed', async () => {
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockInquirer.prompt.mockResolvedValueOnce({ confirmReplace: false });
      
      const result = await configCmd.importConfig('import-config.json', {});
      
      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(mockConfigManager.saveConfig).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Import cancelled'));
    });
    
    test('merges imported configuration when merge option provided', async () => {
      mockFs.pathExists.mockResolvedValueOnce(true);
      
      const result = await configCmd.importConfig('import-config.json', { merge: true });
      
      expect(result.success).toBe(true);
      expect(result.merged).toBe(true);
      expect(mockConfigManager.saveConfig).toHaveBeenCalledWith(expect.objectContaining({
        project: expect.any(Object),
        modules: expect.any(Array)
      }));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('imported and merged'));
    });
    
    test('handles file not found error', async () => {
      mockFs.pathExists.mockResolvedValueOnce(false);
      
      const result = await configCmd.importConfig('nonexistent.json', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(`File 'nonexistent.json' not found`);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });
    
    test('handles invalid JSON error', async () => {
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockFs.readFile.mockResolvedValueOnce('invalid json content');
      
      const result = await configCmd.importConfig('invalid.json', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON format');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error parsing JSON'));
    });
    
    test('handles invalid configuration format', async () => {
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockFs.readFile.mockResolvedValueOnce('{"not_valid": true}');
      
      const result = await configCmd.importConfig('invalid-format.json', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid configuration format');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid configuration format'));
    });
    
    test('handles errors gracefully', async () => {
      mockFs.pathExists.mockResolvedValueOnce(true);
      mockFs.readFile.mockRejectedValueOnce(new Error('Test error'));
      
      const result = await configCmd.importConfig('error.json', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error importing config'));
    });
  });
  
  describe('Command Definition', () => {
    test('has correct command definition', () => {
      const { config } = createConfigCommands({
        fs: mockFs,
        inquirer: mockInquirer,
        configManager: mockConfigManager,
        path: mockPath
      });
      
      expect(config).toEqual({
        command: 'config',
        description: 'Manage PairCoder configuration',
        options: expect.arrayContaining([
          { flags: '-g, --get <key>', description: expect.any(String) },
          { flags: '-s, --set <key>', description: expect.any(String) },
          { flags: '-v, --value <value>', description: expect.any(String) },
          { flags: '-d, --delete <key>', description: expect.any(String) },
          { flags: '-r, --reset', description: expect.any(String) },
          { flags: '-e, --export', description: expect.any(String) },
          { flags: '-i, --import <file>', description: expect.any(String) },
          { flags: '-o, --output <file>', description: expect.any(String) },
          { flags: '-m, --merge', description: expect.any(String) },
          { flags: '-f, --force', description: expect.any(String) }
        ]),
        action: expect.any(Function)
      });
    });
    
    test('attaches dependencies for testing', () => {
      const { configCmd } = createConfigCommands({
        fs: mockFs,
        inquirer: mockInquirer,
        configManager: mockConfigManager,
        path: mockPath
      });
      
      expect(configCmd._deps).toEqual({
        fs: mockFs,
        inquirer: mockInquirer,
        configManager: mockConfigManager,
        path: mockPath
      });
    });
  });
});
