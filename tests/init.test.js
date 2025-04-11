/**
 * Tests for the init CLI command
 */

const fs = require('fs-extra');
const path = require('path');
const { init } = require('../src/cli/commands/init');
const { configManager } = require('../src/core/config');
const { storageManager } = require('../src/storage/manager');
const { projectScanner } = require('../src/scanner');
const inquirer = require('inquirer');

// Mock dependencies
jest.mock('fs-extra', () => ({
  pathExists: jest.fn(),
  ensureDir: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/core/config', () => ({
  configManager: {
    saveConfig: jest.fn().mockResolvedValue(undefined),
    getConfig: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../src/storage/manager', () => ({
  storageManager: {
    initializeStorage: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../src/scanner', () => ({
  projectScanner: {
    scanProject: jest.fn().mockResolvedValue({
      root: '/test/path',
      fileCount: 10,
      files: ['file1.js', 'file2.js'],
      filesByType: { '.js': ['file1.js', 'file2.js'] },
      technologies: { languages: ['JavaScript'] },
      directories: []
    }),
    detectModules: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

describe('init command', () => {
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
  
  let originalCwd;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    originalCwd = process.cwd;
    process.cwd = jest.fn().mockReturnValue('/test/path');
    
    // Reset console output mocks
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
    
    // Mock default inquirer responses
    inquirer.prompt.mockImplementation((questions) => {
      const responses = {};
      
      questions.forEach(q => {
        if (q.name === 'projectName') {
          responses.projectName = 'test-project';
        } else if (q.name === 'shouldContinue') {
          responses.shouldContinue = false;
        } else if (q.name === 'shouldAddModules') {
          responses.shouldAddModules = true;
        }
      });
      
      return Promise.resolve(responses);
    });
  });
  
  afterEach(() => {
    process.cwd = originalCwd;
  });
  
  describe('fresh initialization', () => {
    beforeEach(() => {
      fs.pathExists.mockResolvedValue(false);
    });
    
    it('should initialize a new project', async () => {
      await init({});
      
      expect(fs.pathExists).toHaveBeenCalledWith('.pc');
      expect(storageManager.initializeStorage).toHaveBeenCalled();
      expect(configManager.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          project: expect.objectContaining({
            name: 'test-project'
          })
        })
      );
      
      expect(projectScanner.scanProject).toHaveBeenCalled();
      expect(projectScanner.detectModules).toHaveBeenCalled();
      
      // Simple check without using expectOutputToContain
      const logOutput = global.consoleOutput.log;
      expect(logOutput.some(msg => msg.includes('Initializing PairCoder'))).toBe(true);
      expect(logOutput.some(msg => msg.includes('Created basic configuration'))).toBe(true);
      expect(logOutput.some(msg => msg.includes('PairCoder initialized successfully'))).toBe(true);
    });
    
    it('should include detected modules in configuration', async () => {
      // Mock detectModules to return some modules
      projectScanner.detectModules.mockResolvedValueOnce([
        { name: 'module1', path: 'src/module1' },
        { name: 'module2', path: 'src/module2' }
      ]);
      
      // Mock user agreeing to add modules
      inquirer.prompt.mockImplementation((questions) => {
        const responses = {};
        
        questions.forEach(q => {
          if (q.name === 'projectName') {
            responses.projectName = 'test-project';
          } else if (q.name === 'shouldContinue') {
            responses.shouldContinue = false;
          } else if (q.name === 'shouldAddModules') {
            responses.shouldAddModules = true;
          }
        });
        
        return Promise.resolve(responses);
      });
      
      await init({});
      
      expect(configManager.getConfig).toHaveBeenCalled();
      expect(configManager.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          modules: expect.arrayContaining([
            expect.objectContaining({ name: 'module1' }),
            expect.objectContaining({ name: 'module2' })
          ])
        })
      );
      
      // Simple check without using expectOutputToContain
      const logOutput = global.consoleOutput.log;
      expect(logOutput.some(msg => msg.includes('Detected 2 potential modules'))).toBe(true);
    });
    
    it('should handle case when no modules are detected', async () => {
      projectScanner.detectModules.mockResolvedValueOnce([]);
      
      await init({});
      
      // Simple check without using expectOutputToContain
      const logOutput = global.consoleOutput.log;
      expect(logOutput.some(msg => msg.includes('No modules automatically detected'))).toBe(true);
    });
  });
  
  describe('reinitialization', () => {
    beforeEach(() => {
      fs.pathExists.mockResolvedValue(true);
    });
    
    it('should prompt for confirmation when project is already initialized', async () => {
      await init({});
      
      expect(inquirer.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'confirm',
            name: 'shouldContinue'
          })
        ])
      );
      
      // Simple check without using expectOutputToContain
      const logOutput = global.consoleOutput.log;
      expect(logOutput.some(msg => msg.includes('PairCoder already initialized'))).toBe(true);
      expect(logOutput.some(msg => msg.includes('Initialization cancelled'))).toBe(true);
    });
    
    it('should reinitialize when user confirms', async () => {
      // Mock user confirming reinitialize
      inquirer.prompt.mockImplementationOnce((questions) => {
        return Promise.resolve({ shouldContinue: true });
      }).mockImplementationOnce((questions) => {
        return Promise.resolve({ projectName: 'test-project' });
      }).mockImplementationOnce((questions) => {
        return Promise.resolve({ shouldAddModules: true });
      });
      
      await init({});
      
      expect(storageManager.initializeStorage).toHaveBeenCalled();
      expect(configManager.saveConfig).toHaveBeenCalled();
      
      // Simple check without using expectOutputToContain
      const logOutput = global.consoleOutput.log;
      expect(logOutput.some(msg => msg.includes('PairCoder initialized successfully'))).toBe(true);
    });
    
    it('should force reinitialize when force option is provided', async () => {
      await init({ force: true });
      
      // Should not prompt for confirmation
      expect(inquirer.prompt).not.toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'shouldContinue'
          })
        ])
      );
      
      expect(storageManager.initializeStorage).toHaveBeenCalled();
      expect(configManager.saveConfig).toHaveBeenCalled();
    });
  });
  
  describe('error handling', () => {
    it('should handle errors during initialization', async () => {
      // Mock storageManager.initializeStorage to throw an error
      storageManager.initializeStorage.mockRejectedValueOnce(
        new Error('Test initialization error')
      );
      
      // Mock process.exit to prevent actual exit
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      
      await init({});
      
      // Verify error was logged
      const errorOutput = global.consoleOutput.error;
      expect(errorOutput.some(msg => msg.includes('Error initializing PairCoder'))).toBe(true);
      expect(errorOutput.some(msg => msg.includes('Test initialization error'))).toBe(true);
      
      // Verify process.exit was called with code 1
      expect(mockExit).toHaveBeenCalledWith(1);
      
      // Restore process.exit
      mockExit.mockRestore();
    });
  });
});