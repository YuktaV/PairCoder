/**
 * Additional tests for the prompt.js module
 * 
 * This test file covers edge cases and specific lines that weren't covered
 * in the main prompt-improved.test.js file.
 */

const { createPromptCommands } = require('../src/cli/commands/prompt');

describe('prompt.js additional tests', () => {
  let mockPromptEngine;
  let mockConfigManager;
  let mockModuleManager;
  let mockContextGenerator;
  let mockFs;
  let mockClipboard;
  let mockInquirer;
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
    
    mockInquirer = {
      prompt: jest.fn().mockResolvedValue({})
    };
    
    // Get promptCmd with injected mocks
    const commands = createPromptCommands({
      promptEngine: mockPromptEngine,
      configManager: mockConfigManager,
      moduleManager: mockModuleManager,
      contextGenerator: mockContextGenerator,
      fs: mockFs,
      clipboard: mockClipboard,
      inquirer: mockInquirer
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
  
  describe('generate prompt function', () => {
    it('should handle the case when no module is in focus and no modules exist', async () => {
      // Mock no focused module and empty modules list
      mockModuleManager.getFocusedModule.mockResolvedValueOnce(null);
      mockModuleManager.listModules.mockResolvedValueOnce([]);
      
      await promptCmd('generate');
      
      expectOutputToContain('No modules found', 'error');
    });
    
    it('should display token count when generating prompt without view option', async () => {
      await promptCmd('generate', 'test-module');
      
      expectOutputToContain('Approximate token count');
    });
  });
  
  describe('create template function', () => {
    it('should create a template from a base template', async () => {
      await promptCmd('create', 'new-template', { base: 'default' });
      
      expect(mockPromptEngine.getTemplateContent).toHaveBeenCalledWith('default');
      expect(mockPromptEngine.saveTemplate).toHaveBeenCalledWith('new-template', expect.any(String));
      expectOutputToContain('Template \'new-template\' created successfully');
    });
    
    it('should create a template from a file', async () => {
      await promptCmd('create', 'file-template', { file: 'template.txt' });
      
      expect(mockFs.readFile).toHaveBeenCalled();
      expect(mockPromptEngine.saveTemplate).toHaveBeenCalledWith('file-template', expect.any(String));
      expectOutputToContain('Template \'file-template\' created successfully');
    });
  });
});
