/**
 * Additional coverage tests for the prompt.js module
 * 
 * This test file focuses on specific edge cases and code paths that weren't covered
 * in the other test files.
 */

const inquirer = require('inquirer');
const { createPromptCommands } = require('../src/cli/commands/prompt');

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

describe('prompt.js additional coverage', () => {
  let mockPromptEngine;
  let mockConfigManager;
  let mockModuleManager;
  let mockContextGenerator;
  let mockFs;
  let mockClipboard;
  let promptCmd;
  
  beforeEach(() => {
    // Mock dependencies
    mockPromptEngine = {
      getAvailableTemplates: jest.fn().mockResolvedValue(['default', 'basic']),
      getTemplateDescription: jest.fn().mockResolvedValue('Template description'),
      getTemplateContent: jest.fn().mockResolvedValue('Template content'),
      saveTemplate: jest.fn().mockResolvedValue(undefined),
      generatePrompt: jest.fn().mockResolvedValue('Generated prompt content')
    };
    
    mockConfigManager = {
      getValue: jest.fn().mockImplementation(async (key) => {
        const values = {
          'prompt.defaultTemplate': 'default',
          'context.defaultLevel': 'medium',
          'context.tokenBudget': 4000
        };
        return values[key];
      }),
      setValue: jest.fn().mockResolvedValue(undefined)
    };
    
    mockModuleManager = {
      getFocusedModule: jest.fn().mockResolvedValue({ name: 'focused-module' }),
      listModules: jest.fn().mockResolvedValue([
        { name: 'module1' },
        { name: 'module2' }
      ])
    };
    
    mockContextGenerator = {
      exportContext: jest.fn().mockResolvedValue({
        moduleName: 'test-module',
        level: 'medium',
        tokenCount: 2000,
        context: 'Generated context content',
        optimized: true
      })
    };
    
    mockFs = {
      pathExists: jest.fn().mockResolvedValue(true),
      readFile: jest.fn().mockResolvedValue('File content'),
      writeFile: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      ensureDir: jest.fn().mockResolvedValue(undefined)
    };
    
    mockClipboard = {
      write: jest.fn().mockResolvedValue(undefined)
    };
    
    // Get promptCmd with injected mocks
    const commands = createPromptCommands({
      promptEngine: mockPromptEngine,
      configManager: mockConfigManager,
      moduleManager: mockModuleManager,
      contextGenerator: mockContextGenerator,
      fs: mockFs,
      clipboard: mockClipboard,
      inquirer: inquirer
    });
    
    promptCmd = commands.promptCmd;
    
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
  });
  
  // Helper function to check output
  const expectOutputToContain = (text, outputType = 'log') => {
    const output = global.consoleOutput[outputType];
    const found = output.some(line => line && typeof line === 'string' && line.includes(text));
    if (!found) {
      throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
    }
  };
  
  describe('create template', () => {
    it('should create blank template when no base or file specified', async () => {
      inquirer.prompt.mockResolvedValueOnce({ editNow: false });
      
      await promptCmd('create', 'blank-template', { force: true });
      
      expect(mockPromptEngine.saveTemplate).toHaveBeenCalledWith('blank-template', expect.any(String));
      expectOutputToContain('Template created successfully');
    });
    
    it('should handle error when reading from file', async () => {
      mockFs.pathExists.mockResolvedValueOnce(false);
      
      await promptCmd('create', 'file-template', { file: 'nonexistent.txt' });
      
      expectOutputToContain('does not exist', 'error');
      expect(mockPromptEngine.saveTemplate).not.toHaveBeenCalled();
    });
    
    it('should handle error with non-existent base template', async () => {
      mockPromptEngine.getAvailableTemplates.mockResolvedValueOnce(['default']);
      
      await promptCmd('create', 'derived-template', { base: 'nonexistent' });
      
      expectOutputToContain('does not exist', 'error');
      expect(mockPromptEngine.saveTemplate).not.toHaveBeenCalled();
    });
  });
  
  describe('generate prompt', () => {
    it('should handle no modules found', async () => {
      mockModuleManager.getFocusedModule.mockResolvedValueOnce(null);
      mockModuleManager.listModules.mockResolvedValueOnce([]);
      
      await promptCmd('generate');
      
      expectOutputToContain('No modules found', 'error');
    });
    
    it('should prompt user to select module when no focus and multiple modules', async () => {
      mockModuleManager.getFocusedModule.mockResolvedValueOnce(null);
      inquirer.prompt.mockResolvedValueOnce({ selectedModule: 'module1' });
      
      await promptCmd('generate');
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockContextGenerator.exportContext).toHaveBeenCalledWith('module1', expect.any(Object));
    });
    
    it('should handle invalid level option', async () => {
      mockContextGenerator.exportContext.mockRejectedValueOnce(
        new Error('Invalid level')
      );
      
      await promptCmd('generate', 'test-module', { level: 'invalid' });
      
      expectOutputToContain('Error generating prompt', 'error');
    });
  });
  
  describe('view template', () => {
    it('should handle template not found', async () => {
      mockPromptEngine.getAvailableTemplates.mockResolvedValueOnce(['default']);
      
      await promptCmd('view', 'nonexistent');
      
      expectOutputToContain('does not exist', 'error');
    });
    
    it('should display the default template when no template specified', async () => {
      await promptCmd('view');
      
      expect(mockPromptEngine.getTemplateContent).toHaveBeenCalledWith('default');
      expectOutputToContain('Template: default');
    });
  });
  
  describe('set default template', () => {
    it('should prompt for template selection when none provided', async () => {
      inquirer.prompt.mockResolvedValueOnce({
        selectedTemplate: 'basic'
      });
      
      await promptCmd('set-default');
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('prompt.defaultTemplate', 'basic');
    });
    
    it('should handle template not found', async () => {
      mockPromptEngine.getAvailableTemplates.mockResolvedValueOnce(['default']);
      
      await promptCmd('set-default', 'nonexistent');
      
      expectOutputToContain('does not exist', 'error');
      expect(mockConfigManager.setValue).not.toHaveBeenCalled();
    });
  });
});
