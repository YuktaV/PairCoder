/**
 * Tests for the init-factory.js module
 */

const { createInitCommand } = require('../src/cli/commands/init-factory');

describe('init-factory.js', () => {
  let mockFs;
  let mockInquirer;
  let mockConfigManager;
  let mockStorageManager;
  let mockProjectScanner;
  let initCmd;
  let mockExit;
  
  beforeEach(() => {
    // Mock dependencies
    mockFs = {
      pathExists: jest.fn().mockResolvedValue(false),
      ensureDir: jest.fn().mockResolvedValue(undefined)
    };
    
    mockInquirer = {
      prompt: jest.fn().mockImplementation((questions) => {
        const answers = {};
        questions.forEach(q => {
          if (q.name === 'projectName') answers.projectName = 'test-project';
          if (q.name === 'shouldContinue') answers.shouldContinue = false;
          if (q.name === 'shouldAddModules') answers.shouldAddModules = true;
        });
        return Promise.resolve(answers);
      })
    };
    
    mockConfigManager = {
      saveConfig: jest.fn().mockResolvedValue(undefined),
      getConfig: jest.fn().mockResolvedValue({})
    };
    
    mockStorageManager = {
      initializeStorage: jest.fn().mockResolvedValue(true)
    };
    
    mockProjectScanner = {
      scanProject: jest.fn().mockResolvedValue({
        root: '/test/path',
        fileCount: 10,
        files: ['file1.js', 'file2.js'],
        filesByType: { '.js': ['file1.js', 'file2.js'] },
        technologies: { languages: ['JavaScript'] },
        directories: []
      }),
      detectModules: jest.fn().mockResolvedValue([])
    };
    
    // Create init command with mocked dependencies
    const { initCmd: cmd } = createInitCommand({
      fs: mockFs,
      inquirer: mockInquirer,
      configManager: mockConfigManager,
      storageManager: mockStorageManager,
      projectScanner: mockProjectScanner
    });
    
    initCmd = cmd;
    
    // Set up console output capture
    global.consoleOutput = {
      log: [],
      error: [],
      warn: []
    };
    
    console.log = jest.fn((...args) => {
      global.consoleOutput.log.push(args.join(' '));
    });
    
    console.error = jest.fn((...args) => {
      global.consoleOutput.error.push(args.join(' '));
    });
    
    console.warn = jest.fn((...args) => {
      global.consoleOutput.warn.push(args.join(' '));
    });
    
    // Mock process.cwd and process.exit
    jest.spyOn(process, 'cwd').mockReturnValue('/test/path');
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });
  
  afterEach(() => {
    mockExit.mockRestore();
  });
  
  // Helper function to check output
  const expectOutputToContain = (text, outputType = 'log') => {
    const output = global.consoleOutput[outputType];
    const found = output.some(line => line && typeof line === 'string' && line.includes(text));
    if (!found) {
      throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
    }
  };
  
  describe('initCmd function', () => {
    it('should handle initialization error', async () => {
      // Mock storageManager.initializeStorage to throw error
      mockStorageManager.initializeStorage.mockRejectedValueOnce(
        new Error('Test initialization error')
      );
      
      await initCmd();
      
      expectOutputToContain('Error initializing PairCoder', 'error');
      expectOutputToContain('Test initialization error', 'error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
    
    it('should handle case when user wants to continue with reinitialization', async () => {
      // Mock fs.pathExists to return true (already initialized)
      mockFs.pathExists.mockResolvedValueOnce(true);
      
      // Mock inquirer to return shouldContinue = true
      mockInquirer.prompt.mockImplementationOnce(() => 
        Promise.resolve({ shouldContinue: true })
      ).mockImplementationOnce(() => 
        Promise.resolve({ projectName: 'reinit-project' })
      ).mockImplementationOnce(() => 
        Promise.resolve({ shouldAddModules: false })
      );
      
      await initCmd();
      
      expect(mockStorageManager.initializeStorage).toHaveBeenCalled();
      expect(mockConfigManager.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          project: expect.objectContaining({
            name: 'reinit-project'
          })
        })
      );
      expectOutputToContain('PairCoder initialized successfully');
    });
  });
});
