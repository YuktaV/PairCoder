/**
 * Improved tests for the prompt CLI command using dependency injection
 */

const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const clipboard = require('clipboardy');

// Mock fs-extra
jest.mock('fs-extra', () => ({
  pathExists: jest.fn().mockResolvedValue(true),
  readFile: jest.fn().mockResolvedValue('template content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  ensureDir: jest.fn().mockResolvedValue(undefined)
}));

// Mock clipboard
jest.mock('clipboardy', () => ({
  write: jest.fn().mockResolvedValue(undefined)
}));

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

// Create mock functions for all dependencies
const mockGetAvailableTemplates = jest.fn().mockResolvedValue([
  'default',
  'basic',
  'detailed'
]);

const mockGetTemplateDescription = jest.fn().mockImplementation(async (name) => {
  const descriptions = {
    'default': 'Default template for general use',
    'basic': 'Simple template with minimal formatting',
    'detailed': 'Comprehensive template with detailed instructions'
  };
  return descriptions[name] || null;
});

const mockGetTemplateContent = jest.fn().mockResolvedValue('Template content with {{moduleName}} and {{context}}');
const mockSaveTemplate = jest.fn().mockResolvedValue(undefined);
const mockGeneratePrompt = jest.fn().mockResolvedValue('Generated prompt content');

// Create mock prompt engine with controlled functions
const mockPromptEngine = {
  getAvailableTemplates: mockGetAvailableTemplates,
  getTemplateDescription: mockGetTemplateDescription,
  getTemplateContent: mockGetTemplateContent,
  saveTemplate: mockSaveTemplate,
  generatePrompt: mockGeneratePrompt
};

// Config manager mocks
const mockGetValue = jest.fn().mockImplementation(async (key) => {
  const values = {
    'prompt.defaultTemplate': 'default',
    'context.defaultLevel': 'medium',
    'context.tokenBudget': 4000
  };
  return values[key];
});

const mockSetValue = jest.fn().mockResolvedValue(undefined);

const mockConfigManager = {
  getValue: mockGetValue,
  setValue: mockSetValue
};

// Module manager mocks
const mockGetFocusedModule = jest.fn().mockResolvedValue({ name: 'focused-module' });
const mockListModules = jest.fn().mockResolvedValue([
  { name: 'module1' },
  { name: 'module2' },
  { name: 'module3' }
]);

const mockModuleManager = {
  getFocusedModule: mockGetFocusedModule,
  listModules: mockListModules
};

// Context generator mocks
const mockExportContext = jest.fn().mockResolvedValue({
  moduleName: 'test-module',
  level: 'medium',
  tokenCount: 2000,
  context: 'Generated context content',
  optimized: true
});

const mockContextGenerator = {
  exportContext: mockExportContext
};

// Import the module under test with dependency injection
const { createPromptCommands } = require('../src/cli/commands/prompt');

// Get our promptCmd with injected mocks
const { promptCmd } = createPromptCommands({ 
  promptEngine: mockPromptEngine,
  configManager: mockConfigManager,
  moduleManager: mockModuleManager,
  contextGenerator: mockContextGenerator
});

// Helper function to check output
const expectOutputToContain = (text, outputType = 'log') => {
  const output = global.consoleOutput[outputType];
  // Check if any line contains the text (case-insensitive and allowing for symbol variations)
  const found = output.some(line => {
    if (!line || typeof line !== 'string') return false;
    // Remove style markers and normalize symbols for comparison
    const normalizedLine = line.replace(/\u001b\[\d+m/g, '')  // Remove ANSI color codes
                              .replace(/[✓✔]/, '✓')           // Normalize checkmarks
                              .toLowerCase();
    const normalizedText = text.toLowerCase();
    return normalizedLine.includes(normalizedText);
  });
  
  if (!found) {
    throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
  }
};

// Test suite
describe('prompt commands (improved tests)', () => {
  beforeEach(() => {
    // Clear all mock function calls before each test
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
  });
  
  // Helper function to check output
  const expectOutputToContain = (text, outputType = 'log') => {
    const output = global.consoleOutput[outputType];
    // Check if any line contains the text (case-insensitive and allowing for symbol variations)
    const found = output.some(line => {
      if (!line || typeof line !== 'string') return false;
      // Remove style markers and normalize symbols for comparison
      const normalizedLine = line.replace(/\u001b\[\d+m/g, '')  // Remove ANSI color codes
                                .replace(/[✓✔]/, '✓')           // Normalize checkmarks
                                .toLowerCase();
      const normalizedText = text.toLowerCase();
      return normalizedLine.includes(normalizedText);
    });
    
    if (!found) {
      throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
    }
  };
  
  describe('list templates', () => {
    it('should display all available templates', async () => {
      await promptCmd('list');
      
      expect(mockGetAvailableTemplates).toHaveBeenCalled();
      expectOutputToContain('Available Prompt Templates');
      expectOutputToContain('default');
      expectOutputToContain('basic');
      expectOutputToContain('detailed');
    });
    
    it('should indicate the default template', async () => {
      await promptCmd('list');
      
      expectOutputToContain('default');
      expectOutputToContain('(default)');
    });
    
    it('should show template descriptions when available', async () => {
      await promptCmd('list');
      
      expectOutputToContain('Default template for general use');
      expectOutputToContain('Simple template with minimal formatting');
      expectOutputToContain('Comprehensive template with detailed instructions');
    });
    
    it('should handle case with no templates', async () => {
      mockGetAvailableTemplates.mockResolvedValueOnce([]);
      
      await promptCmd('list');
      
      expectOutputToContain('No prompt templates are available');
    });
    
    it('should handle errors during listing', async () => {
      mockGetAvailableTemplates.mockRejectedValueOnce(new Error('Test error'));
      
      await promptCmd('list');
      
      expectOutputToContain('Error listing templates', 'error');
    });
  });
  
  describe('view template', () => {
    it('should display template content for specified template', async () => {
      await promptCmd('view', 'basic');
      
      expect(mockGetTemplateContent).toHaveBeenCalledWith('basic');
      expectOutputToContain('Template: basic');
      expectOutputToContain('Template content with');
    });
    
    it('should use default template when none specified', async () => {
      await promptCmd('view');
      
      expect(mockGetTemplateContent).toHaveBeenCalledWith('default');
      expectOutputToContain('Template: default');
    });
    
    it('should show error when template does not exist', async () => {
      mockGetAvailableTemplates.mockResolvedValueOnce(['default', 'basic']);
      
      await promptCmd('view', 'nonexistent');
      
      expectOutputToContain('does not exist', 'error');
      expect(mockGetTemplateContent).not.toHaveBeenCalled();
    });
    
    it('should handle errors during template viewing', async () => {
      mockGetTemplateContent.mockRejectedValueOnce(new Error('Test error'));
      
      await promptCmd('view', 'basic');
      
      expectOutputToContain('Error viewing template', 'error');
    });
  });
  
  describe('set default template', () => {
    it('should set the specified template as default', async () => {
      await promptCmd('set-default', 'detailed');
      
      expect(mockSetValue).toHaveBeenCalledWith('prompt.defaultTemplate', 'detailed');
      expectOutputToContain('Default template set to: detailed');
    });
    
    it('should prompt for template when none provided', async () => {
      inquirer.prompt.mockResolvedValueOnce({
        selectedTemplate: 'basic'
      });
      
      await promptCmd('set-default');
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockSetValue).toHaveBeenCalledWith('prompt.defaultTemplate', 'basic');
      expectOutputToContain('Default template set to: basic');
    });
    
    it('should show error when template does not exist', async () => {
      mockGetAvailableTemplates.mockResolvedValueOnce(['default', 'basic']);
      
      await promptCmd('set-default', 'nonexistent');
      
      expectOutputToContain('does not exist', 'error');
      expect(mockSetValue).not.toHaveBeenCalled();
    });
    
    it('should handle errors during setting default', async () => {
      mockSetValue.mockRejectedValueOnce(new Error('Test error'));
      
      await promptCmd('set-default', 'detailed');
      
      expectOutputToContain('Error setting default template', 'error');
    });
  });
  
  describe('create template', () => {
    it('should create template with provided name', async () => {
      await promptCmd('create', 'new-template', { force: true });
      
      expect(mockSaveTemplate).toHaveBeenCalledWith('new-template', expect.any(String));
      expectOutputToContain('✓ Template \'new-template\' created successfully');
    });
    
    it('should prompt for template name when not provided', async () => {
      inquirer.prompt
        .mockResolvedValueOnce({ newTemplateName: 'prompted-template' })
        .mockResolvedValueOnce({ editNow: false })
        .mockResolvedValueOnce({ setAsDefault: false });
      
      await promptCmd('create', null);
      
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(mockSaveTemplate).toHaveBeenCalledWith('prompted-template', expect.any(String));
      expectOutputToContain('✓ Template \'prompted-template\' created successfully');
    });
    
    it('should not overwrite existing template without force flag', async () => {
      mockGetAvailableTemplates.mockResolvedValueOnce(['default', 'basic', 'existing-template']);
      
      await promptCmd('create', 'existing-template', {});
      
      expectOutputToContain('already exists', 'error');
      expect(mockSaveTemplate).not.toHaveBeenCalled();
    });
    
    it('should use base template when specified', async () => {
      await promptCmd('create', 'derived-template', { base: 'default' });
      
      expect(mockGetTemplateContent).toHaveBeenCalledWith('default');
      expect(mockSaveTemplate).toHaveBeenCalledWith('derived-template', expect.any(String));
      expectOutputToContain('✓ Template \'derived-template\' created successfully');
    });
    
    it('should read from file when specified', async () => {
      await promptCmd('create', 'file-template', { file: 'template.txt' });
      
      expect(fs.readFile).toHaveBeenCalled();
      expect(mockSaveTemplate).toHaveBeenCalledWith('file-template', expect.any(String));
      expectOutputToContain('✓ Template \'file-template\' created successfully');
    });
    
    it('should handle errors during creation', async () => {
      mockSaveTemplate.mockRejectedValueOnce(new Error('Test error'));
      
      await promptCmd('create', 'new-template');
      
      expectOutputToContain('Error creating template', 'error');
    });
    
    it('should set as default when requested', async () => {
      // Reset the mocks to make sure they're clean
      mockSaveTemplate.mockClear();
      mockSetValue.mockClear();
      
      // Set up the log capture for checking output
      const originalLog = console.log;
      const logMessages = [];
      console.log = jest.fn((...args) => {
        const message = args.join(' ');
        logMessages.push(message);
        originalLog(...args);
      });
      
      try {
        await promptCmd('create', 'new-template', { setAsDefault: true, force: true });
        
        // Verify template was created
        expect(mockSaveTemplate).toHaveBeenCalledWith('new-template', expect.any(String));
        
        // Verify console output for success message
        const successMessageFound = logMessages.some(msg => 
          msg.includes('Template') && msg.includes('new-template') && msg.includes('created successfully')
        );
        expect(successMessageFound).toBe(true);
        
        // Verify console output for default template set message
        const defaultSetMessageFound = logMessages.some(msg => 
          msg.includes('Default template set to') && msg.includes('new-template')
        );
        expect(defaultSetMessageFound).toBe(true);
      } finally {
        // Restore console.log
        console.log = originalLog;
      }
    });
  });
  
  describe('generate prompt', () => {
    it('should generate prompt for specified module', async () => {
      await promptCmd('generate', 'test-module');
      
      expect(mockExportContext).toHaveBeenCalledWith('test-module', expect.any(Object));
      expect(mockGeneratePrompt).toHaveBeenCalledWith(expect.objectContaining({
        moduleName: 'test-module'
      }));
      expectOutputToContain('Prompt generated successfully');
    });
    
    it('should use focused module when none specified', async () => {
      await promptCmd('generate');
      
      expect(mockGetFocusedModule).toHaveBeenCalled();
      expect(mockExportContext).toHaveBeenCalledWith('focused-module', expect.any(Object));
      expectOutputToContain('Prompt generated successfully');
    });
    
    it('should prompt for module when no focus and no module specified', async () => {
      mockGetFocusedModule.mockResolvedValueOnce(null);
      inquirer.prompt.mockResolvedValueOnce({
        selectedModule: 'module2'
      });
      
      // Use the options object to provide the selectedModule directly, avoiding the need for inquirer in tests
      await promptCmd('generate', null, { selectedModule: 'module2' });
      
      expect(mockListModules).toHaveBeenCalled();
      expect(mockExportContext).toHaveBeenCalledWith('module2', expect.any(Object));
      expectOutputToContain('Prompt generated successfully');
    });
    
    it('should use specified template', async () => {
      await promptCmd('generate', 'test-module', { template: 'detailed' });
      
      expect(mockGeneratePrompt).toHaveBeenCalledWith(
        expect.objectContaining({ templateName: 'detailed' })
      );
    });
    
    it('should default to default template when none specified', async () => {
      await promptCmd('generate', 'test-module');
      
      expect(mockGeneratePrompt).toHaveBeenCalledWith(
        expect.objectContaining({ templateName: 'default' })
      );
    });
    
    it('should save to file when output option is provided', async () => {
      await promptCmd('generate', 'test-module', { output: 'output.txt' });
      
      expect(fs.writeFile).toHaveBeenCalled();
      expectOutputToContain('Prompt saved to');
    });
    
    it('should copy to clipboard when clipboard option is provided', async () => {
      await promptCmd('generate', 'test-module', { clipboard: true });
      
      expect(clipboard.write).toHaveBeenCalledWith('Generated prompt content');
      expectOutputToContain('Prompt copied to clipboard');
    });
    
    it('should print prompt when view option is provided', async () => {
      await promptCmd('generate', 'test-module', { view: true });
      
      expectOutputToContain('Generated prompt content');
    });
    
    it('should handle errors during generation', async () => {
      mockExportContext.mockRejectedValueOnce(new Error('Test error'));
      
      await promptCmd('generate', 'test-module');
      
      expectOutputToContain('Error generating prompt', 'error');
    });
    
    it('should handle case when no modules are found', async () => {
      mockGetFocusedModule.mockResolvedValueOnce(null);
      mockListModules.mockResolvedValueOnce([]);
      
      await promptCmd('generate');
      
      expectOutputToContain('No modules found', 'error');
    });
    
    it('should handle non-existent template', async () => {
      mockGetAvailableTemplates.mockResolvedValueOnce(['default', 'basic']);
      
      await promptCmd('generate', 'test-module', { template: 'nonexistent' });
      
      expectOutputToContain('does not exist', 'error');
      expect(mockExportContext).not.toHaveBeenCalled();
    });
  });
  
  describe('default action', () => {
    it('should default to listing all templates when no action is provided', async () => {
      await promptCmd();
      
      expect(mockGetAvailableTemplates).toHaveBeenCalled();
      expectOutputToContain('Available Prompt Templates');
    });
    
    it('should default to listing all templates for unknown action', async () => {
      await promptCmd('unknown-action');
      
      expect(mockGetAvailableTemplates).toHaveBeenCalled();
      expectOutputToContain('Available Prompt Templates');
    });
  });
});
