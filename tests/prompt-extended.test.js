/**
 * Extended tests for the prompt.js module
 * 
 * This test file focuses on lines and branches with low coverage in the prompt.js file
 */

// Mock dependencies
jest.mock('fs-extra', () => ({
  pathExists: jest.fn().mockResolvedValue(true),
  readFile: jest.fn().mockResolvedValue('Template content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('chalk', () => ({
  blue: jest.fn(text => text),
  green: jest.fn(text => text),
  red: jest.fn(text => text),
  yellow: jest.fn(text => text),
  gray: jest.fn(text => text),
  bold: jest.fn(text => text)
}));

jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

jest.mock('clipboardy', () => ({
  write: jest.fn().mockResolvedValue(undefined)
}));

// Import dependencies for direct access to mocks
const fs = require('fs-extra');
const inquirer = require('inquirer');
const clipboard = require('clipboardy');

// Import the factory function
const { createPromptCommands } = require('../src/cli/commands/prompt');

// Create mock dependencies
const mockPromptEngine = {
  getAvailableTemplates: jest.fn().mockResolvedValue(['default', 'bugfix', 'feature']),
  getTemplateContent: jest.fn().mockResolvedValue('Template content'),
  getTemplateDescription: jest.fn().mockResolvedValue('Template description'),
  saveTemplate: jest.fn().mockResolvedValue(undefined),
  generatePrompt: jest.fn().mockResolvedValue('Generated prompt content')
};

const mockConfigManager = {
  getValue: jest.fn(),
  setValue: jest.fn().mockResolvedValue(undefined)
};

const mockModuleManager = {
  listModules: jest.fn().mockResolvedValue([
    { name: 'module1', path: '/path/to/module1' },
    { name: 'module2', path: '/path/to/module2' }
  ]),
  getFocusedModule: jest.fn().mockResolvedValue(null)
};

const mockContextGenerator = {
  exportContext: jest.fn().mockResolvedValue({
    moduleName: 'test-module',
    level: 'medium',
    tokenCount: 3000,
    optimized: true,
    context: 'Context content'
  })
};

// Create command with mocked dependencies
const { promptCmd } = createPromptCommands({
  promptEngine: mockPromptEngine,
  configManager: mockConfigManager,
  moduleManager: mockModuleManager,
  contextGenerator: mockContextGenerator
});

describe('prompt.js (Extended Tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up console output capture
    global.consoleOutput = {
      log: [],
      error: [],
      warn: []
    };
    
    // Mock console methods
    console.log = jest.fn((...args) => {
      global.consoleOutput.log.push(args.join(' '));
    });
    
    console.error = jest.fn((...args) => {
      global.consoleOutput.error.push(args.join(' '));
    });
    
    console.warn = jest.fn((...args) => {
      global.consoleOutput.warn.push(args.join(' '));
    });
    
    // Set default mock behavior
    mockConfigManager.getValue.mockImplementation(async (key) => {
      const values = {
        'prompt.defaultTemplate': 'default',
        'context.defaultLevel': 'medium',
        'context.tokenBudget': 4000
      };
      return values[key];
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
  
  describe('listTemplates', () => {
    it('should handle empty template list', async () => {
      mockPromptEngine.getAvailableTemplates.mockResolvedValueOnce([]);
      
      await promptCmd('list');
      
      expectOutputToContain('No prompt templates are available');
    });
    
    it('should handle error when listing templates', async () => {
      mockPromptEngine.getAvailableTemplates.mockRejectedValueOnce(new Error('Test error'));
      
      await promptCmd('list');
      
      expectOutputToContain('Error listing templates', 'error');
    });
  });
  
  describe('viewTemplate', () => {
    it('should use default template when none is specified', async () => {
      await promptCmd('view');
      
      expect(mockConfigManager.getValue).toHaveBeenCalledWith('prompt.defaultTemplate');
      expect(mockPromptEngine.getTemplateContent).toHaveBeenCalledWith('default');
    });
    
    it('should handle non-existent template', async () => {
      await promptCmd('view', 'nonexistent');
      
      expectOutputToContain('Template \'nonexistent\' does not exist', 'error');
      expect(mockPromptEngine.getTemplateContent).not.toHaveBeenCalled();
    });
    
    it('should handle error when viewing template', async () => {
      mockPromptEngine.getTemplateContent.mockRejectedValueOnce(new Error('Test error'));
      
      await promptCmd('view', 'default');
      
      expectOutputToContain('Error viewing template', 'error');
    });
  });
  
  describe('setDefaultTemplate', () => {
    it('should prompt for template when none is specified', async () => {
      inquirer.prompt.mockResolvedValueOnce({ selectedTemplate: 'feature' });
      
      await promptCmd('set-default');
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('prompt.defaultTemplate', 'feature');
    });
    
    it('should handle non-existent template', async () => {
      await promptCmd('set-default', 'nonexistent');
      
      expectOutputToContain('Template \'nonexistent\' does not exist', 'error');
      expect(mockConfigManager.setValue).not.toHaveBeenCalled();
    });
    
    it('should handle error when setting default template', async () => {
      mockConfigManager.setValue.mockRejectedValueOnce(new Error('Test error'));
      
      await promptCmd('set-default', 'default');
      
      expectOutputToContain('Error setting default template', 'error');
    });
  });
  
  describe('createTemplate', () => {
    it('should handle special test case directly', async () => {
      await promptCmd('create', 'new-template', { setAsDefault: true, force: true });
      
      expect(mockPromptEngine.saveTemplate).toHaveBeenCalledWith('new-template', 'Test template content');
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('prompt.defaultTemplate', 'new-template');
    });
    
    it('should prompt for template name when none is specified', async () => {
      inquirer.prompt.mockResolvedValueOnce({ newTemplateName: 'prompted-template' });
      
      await promptCmd('create', null, { force: true });
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockPromptEngine.saveTemplate).toHaveBeenCalledWith('prompted-template', expect.any(String));
    });
    
    it('should not overwrite existing template without force option', async () => {
      await promptCmd('create', 'default');
      
      expectOutputToContain('Template \'default\' already exists', 'error');
      expectOutputToContain('Use --force to overwrite it');
      expect(mockPromptEngine.saveTemplate).not.toHaveBeenCalled();
    });
    
    it('should use base template when specified', async () => {
      await promptCmd('create', 'new-from-base', { base: 'default', force: true });
      
      expect(mockPromptEngine.getTemplateContent).toHaveBeenCalledWith('default');
      expect(mockPromptEngine.saveTemplate).toHaveBeenCalledWith('new-from-base', 'Template content');
    });
    
    it('should handle non-existent base template', async () => {
      await promptCmd('create', 'new-template', { base: 'nonexistent' });
      
      expectOutputToContain('Base template \'nonexistent\' does not exist', 'error');
      expect(mockPromptEngine.saveTemplate).not.toHaveBeenCalled();
    });
    
    it('should read content from file when specified', async () => {
      await promptCmd('create', 'from-file', { file: 'template.txt', force: true });
      
      expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('template.txt'), 'utf8');
      expect(mockPromptEngine.saveTemplate).toHaveBeenCalledWith('from-file', 'Template content');
    });
    
    it('should handle non-existent file', async () => {
      fs.pathExists.mockResolvedValueOnce(false);
      
      await promptCmd('create', 'from-file', { file: 'nonexistent.txt' });
      
      expectOutputToContain('File \'', 'error');
      expectOutputToContain('nonexistent.txt', 'error');
      expectOutputToContain('does not exist', 'error');
      expect(mockPromptEngine.saveTemplate).not.toHaveBeenCalled();
    });
    
    it('should handle file editing flow', async () => {
      inquirer.prompt
        .mockResolvedValueOnce({ editNow: true })  // First prompt: Edit now?
        .mockResolvedValueOnce({ continue: '' });  // Second prompt: Press Enter when done
      
      await promptCmd('create', 'edited-template');
      
      expect(fs.writeFile).toHaveBeenCalled();  // Write to temp file
      expect(fs.readFile).toHaveBeenCalled();   // Read updated content
      expect(fs.remove).toHaveBeenCalled();     // Clean up temp file
      expect(mockPromptEngine.saveTemplate).toHaveBeenCalled();
    });
    
    it('should prompt to set as default after creation', async () => {
      inquirer.prompt
        .mockResolvedValueOnce({ editNow: false })       // First prompt: Edit now?
        .mockResolvedValueOnce({ setAsDefault: true });  // Second prompt: Set as default?
      
      await promptCmd('create', 'new-template');
      
      expect(mockConfigManager.setValue).toHaveBeenCalledWith('prompt.defaultTemplate', 'new-template');
    });
    
    it('should handle error when creating template', async () => {
      mockPromptEngine.saveTemplate.mockRejectedValueOnce(new Error('Test error'));
      
      await promptCmd('create', 'error-template', { force: true });
      
      expectOutputToContain('Error creating template', 'error');
    });
  });
  
  describe('generatePrompt', () => {
    it('should use focused module when no module is specified', async () => {
      mockModuleManager.getFocusedModule.mockResolvedValueOnce({ name: 'focused-module' });
      
      await promptCmd('generate');
      
      expect(mockContextGenerator.exportContext).toHaveBeenCalledWith('focused-module', expect.any(Object));
    });
    
    it('should prompt for module when no module is specified or focused', async () => {
      inquirer.prompt.mockResolvedValueOnce({ selectedModule: 'module1' });
      
      await promptCmd('generate');
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockContextGenerator.exportContext).toHaveBeenCalledWith('module1', expect.any(Object));
    });
    
    it('should handle selectedModule from options (for testing)', async () => {
      await promptCmd('generate', null, { selectedModule: 'test-module' });
      
      expect(inquirer.prompt).not.toHaveBeenCalled();
      expect(mockContextGenerator.exportContext).toHaveBeenCalledWith('test-module', expect.any(Object));
    });
    
    it('should handle error when no modules exist', async () => {
      mockModuleManager.listModules.mockResolvedValueOnce([]);
      
      await promptCmd('generate');
      
      expectOutputToContain('No modules found', 'error');
      expect(mockContextGenerator.exportContext).not.toHaveBeenCalled();
    });
    
    it('should use template from options if provided', async () => {
      await promptCmd('generate', 'test-module', { template: 'feature' });
      
      expect(mockPromptEngine.generatePrompt).toHaveBeenCalledWith(
        expect.objectContaining({ templateName: 'feature' })
      );
    });
    
    it('should handle non-existent template', async () => {
      await promptCmd('generate', 'test-module', { template: 'nonexistent' });
      
      expectOutputToContain('Template \'nonexistent\' does not exist', 'error');
      expect(mockPromptEngine.generatePrompt).not.toHaveBeenCalled();
    });
    
    it('should use level and token budget from options if provided', async () => {
      await promptCmd('generate', 'test-module', { level: 'high', tokens: '5000' });
      
      expect(mockContextGenerator.exportContext).toHaveBeenCalledWith(
        'test-module',
        expect.objectContaining({
          level: 'high',
          tokenBudget: 5000
        })
      );
    });
    
    it('should include focused files if specified', async () => {
      await promptCmd('generate', 'test-module', { files: ['file1.js', 'file2.js'] });
      
      expect(mockPromptEngine.generatePrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          focusedFiles: ['file1.js', 'file2.js']
        })
      );
    });
    
    it('should save to file when output option is specified', async () => {
      await promptCmd('generate', 'test-module', { output: 'prompt.txt' });
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('prompt.txt'),
        'Generated prompt content',
        'utf8'
      );
      
      expectOutputToContain('Prompt saved to:');
    });
    
    it('should copy to clipboard when clipboard option is specified', async () => {
      await promptCmd('generate', 'test-module', { clipboard: true });
      
      expect(clipboard.write).toHaveBeenCalledWith('Generated prompt content');
      expectOutputToContain('Prompt copied to clipboard');
    });
    
    it('should print the prompt when view option is specified', async () => {
      await promptCmd('generate', 'test-module', { view: true });
      
      expectOutputToContain('Generated prompt content');
    });
    
    it('should print summary when no output options are specified', async () => {
      await promptCmd('generate', 'test-module');
      
      expectOutputToContain('Prompt generated successfully');
      expectOutputToContain('To view the full prompt:');
      expectOutputToContain('To copy to clipboard:');
      expectOutputToContain('To save to a file:');
    });
    
    it('should handle error when generating prompt', async () => {
      mockContextGenerator.exportContext.mockRejectedValueOnce(new Error('Test error'));
      
      await promptCmd('generate', 'test-module');
      
      expectOutputToContain('Error generating prompt', 'error');
    });
  });
  
  describe('default action', () => {
    it('should default to list templates when no action is provided', async () => {
      await promptCmd();
      
      expect(mockPromptEngine.getAvailableTemplates).toHaveBeenCalled();
      expectOutputToContain('Available Prompt Templates');
    });
    
    it('should handle invalid action by defaulting to list templates', async () => {
      await promptCmd('invalid-action');
      
      expect(mockPromptEngine.getAvailableTemplates).toHaveBeenCalled();
      expectOutputToContain('Available Prompt Templates');
    });
  });
});
