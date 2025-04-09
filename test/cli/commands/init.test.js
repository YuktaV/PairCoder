/**
 * PairCoder Init Command Tests
 * 
 * Tests for the init command functionality using dependency injection
 * to mock all external dependencies for comprehensive coverage.
 */

const { createInitCommand } = require('../../../src/cli/commands/init-factory');
const path = require('path');

describe('Init Command', () => {
  // Mock dependencies
  const mockFs = {
    pathExists: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockInquirer = {
    prompt: jest.fn()
  };
  
  const mockConfigManager = {
    getConfig: jest.fn(),
    saveConfig: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockStorageManager = {
    initializeStorage: jest.fn().mockResolvedValue(undefined)
  };
  
  const mockProjectScanner = {
    scanProject: jest.fn(),
    detectModules: jest.fn()
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
    mockFs.pathExists.mockResolvedValue(false); // Not initialized by default
    
    mockInquirer.prompt.mockImplementation(async (questions) => {
      const question = questions[0];
      if (question.name === 'projectName') {
        return { projectName: 'test-project' };
      }
      if (question.name === 'shouldContinue') {
        return { shouldContinue: true };
      }
      if (question.name === 'shouldAddModules') {
        return { shouldAddModules: true };
      }
      return {};
    });
    
    mockConfigManager.getConfig.mockResolvedValue({
      project: {
        name: 'test-project',
        root: '/test/path',
        excludes: ['node_modules', 'dist', '.git', 'build']
      },
      modules: []
    });
    
    mockProjectScanner.scanProject.mockResolvedValue({
      files: [
        { path: 'src/index.js', size: 1024 },
        { path: 'src/utils.js', size: 512 }
      ],
      directories: [
        { path: 'src', files: 2 },
        { path: 'test', files: 1 }
      ]
    });
    
    mockProjectScanner.detectModules.mockResolvedValue([
      { name: 'core', path: 'src', files: ['src/index.js', 'src/utils.js'] }
    ]);
  });
  
  // Restore console methods
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  // Create init command with mocked dependencies
  const { initCmd } = createInitCommand({
    fs: mockFs,
    inquirer: mockInquirer,
    configManager: mockConfigManager,
    storageManager: mockStorageManager,
    projectScanner: mockProjectScanner
  });
  
  test('initializes a new project successfully', async () => {
    const result = await initCmd();
    
    expect(result.success).toBe(true);
    expect(result.projectName).toBe('test-project');
    expect(mockStorageManager.initializeStorage).toHaveBeenCalled();
    expect(mockConfigManager.saveConfig).toHaveBeenCalledWith(expect.objectContaining({
      project: expect.objectContaining({
        name: 'test-project'
      })
    }));
    expect(mockProjectScanner.scanProject).toHaveBeenCalled();
    expect(mockProjectScanner.detectModules).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('PairCoder initialized successfully'));
  });
  
  test('detects and adds modules to configuration', async () => {
    mockProjectScanner.detectModules.mockResolvedValue([
      { name: 'core', path: 'src/core', files: ['src/core/index.js'] },
      { name: 'utils', path: 'src/utils', files: ['src/utils/helpers.js'] }
    ]);
    
    const result = await initCmd();
    
    expect(result.success).toBe(true);
    expect(result.modules).toHaveLength(2);
    expect(mockConfigManager.saveConfig).toHaveBeenCalledWith(expect.objectContaining({
      modules: expect.arrayContaining([
        expect.objectContaining({ name: 'core' }),
        expect.objectContaining({ name: 'utils' })
      ])
    }));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Detected 2 potential modules'));
  });
  
  test('initializes without modules when none detected', async () => {
    mockProjectScanner.detectModules.mockResolvedValue([]);
    
    const result = await initCmd();
    
    expect(result.success).toBe(true);
    expect(result.modules).toHaveLength(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No modules automatically detected'));
  });
  
  test('skips adding modules when user declines', async () => {
    // Override the mock to return false for shouldAddModules
    mockInquirer.prompt.mockImplementation(async (questions) => {
      const question = questions[0];
      if (question.name === 'projectName') {
        return { projectName: 'test-project' };
      }
      if (question.name === 'shouldContinue') {
        return { shouldContinue: true };
      }
      if (question.name === 'shouldAddModules') {
        return { shouldAddModules: false };
      }
      return {};
    });
    
    const result = await initCmd();
    
    expect(result.success).toBe(true);
    // Config should still be saved, but modules array should not be updated
    expect(mockConfigManager.saveConfig).toHaveBeenCalledTimes(1); // Only the initial config save
  });
  
  test('prompts for reinitialization when already initialized', async () => {
    mockFs.pathExists.mockResolvedValue(true);
    
    const result = await initCmd();
    
    expect(result.success).toBe(true);
    expect(mockInquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'shouldContinue' })
    ]));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('PairCoder already initialized'));
  });
  
  test('cancels initialization when user declines reinitialization', async () => {
    mockFs.pathExists.mockResolvedValue(true);
    
    // Override the mock to return false for shouldContinue
    mockInquirer.prompt.mockImplementation(async (questions) => {
      const question = questions[0];
      if (question.name === 'shouldContinue') {
        return { shouldContinue: false };
      }
      return {};
    });
    
    const result = await initCmd();
    
    expect(result.success).toBe(false);
    expect(result.cancelled).toBe(true);
    expect(mockStorageManager.initializeStorage).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Initialization cancelled'));
  });
  
  test('forces initialization when --force option is provided', async () => {
    mockFs.pathExists.mockResolvedValue(true);
    
    const result = await initCmd({ force: true });
    
    expect(result.success).toBe(true);
    // Should not prompt for confirmation
    expect(mockInquirer.prompt).not.toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'shouldContinue' })
    ]));
    expect(mockStorageManager.initializeStorage).toHaveBeenCalled();
  });
  
  test('handles error during initialization', async () => {
    const testError = new Error('Test error');
    mockStorageManager.initializeStorage.mockRejectedValueOnce(testError);
    
    const result = await initCmd();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Test error');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error initializing PairCoder'), testError.message);
  });
  
  test('passes correct command definition', () => {
    const { initCommand } = createInitCommand({
      fs: mockFs,
      inquirer: mockInquirer,
      configManager: mockConfigManager,
      storageManager: mockStorageManager,
      projectScanner: mockProjectScanner
    });
    
    expect(initCommand).toEqual({
      command: 'init',
      description: 'Initialize a new PairCoder project in the current directory',
      options: [
        { flags: '-f, --force', description: 'Force initialization even if already initialized' }
      ],
      action: expect.any(Function)
    });
  });
  
  test('attaches dependencies for testing', () => {
    const { initCmd } = createInitCommand({
      fs: mockFs,
      inquirer: mockInquirer,
      configManager: mockConfigManager,
      storageManager: mockStorageManager,
      projectScanner: mockProjectScanner
    });
    
    expect(initCmd._deps).toEqual({
      fs: mockFs,
      inquirer: mockInquirer,
      configManager: mockConfigManager,
      storageManager: mockStorageManager,
      projectScanner: mockProjectScanner
    });
  });
});
