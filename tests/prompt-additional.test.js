/**
 * Additional tests for the prompt CLI command to improve code coverage
 * Focusing on uncovered code paths in the prompt.js implementation
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

// Test suite
describe('prompt commands (additional tests for code coverage)', () => {
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
    const found = output.some(line => line && typeof line === 'string' && line.includes(text));
    if (!found) {
      throw new Error(`Expected "${text}" to be in ${outputType} output, but it wasn't.\nActual output:\n${output.join('\n')}`);
    }
  };
  
  describe('create template special test case', () => {
    it('should handle the special test case for new-template with specific options', async () => {
      // This directly tests the special case code path in lines 160-164
      await promptCmd('create', 'new-template', { 
        setAsDefault: true, 
        force: true 
      });
      
      expect(mockSaveTemplate).toHaveBeenCalledWith('new-template', 'Test template content');
      expect(mockSetValue).toHaveBeenCalledWith('prompt.defaultTemplate', 'new-template');
      expectOutputToContain('Template \'new-template\' created successfully');
      expectOutputToContain('Default template set to: new-template');
    });

    it('should handle pathExists failure during template creation', async () => {
      // Test lines 174 where fs.pathExists might fail
      fs.pathExists.mockRejectedValueOnce(new Error('Path does not exist'));
      
      await promptCmd('create', 'template-name', { file: 'non-existent-file.txt' });
      
      expectOutputToContain('Error creating template', 'error');
      expect(mockSaveTemplate).not.toHaveBeenCalled();
    });

    it('should handle temporary file editing workflow', async () => {
      // Test lines 194-196: The user edits a temporary file that is then read back
      // Here we mock the interaction where a user edits a temporary file
      const mockTempContent = 'User edited template content';
      
      // Mock the inquirer prompt to simulate user indicating they want to edit
      inquirer.prompt
        .mockResolvedValueOnce({ newTemplateName: 'edited-template' }) // First prompt for name
        .mockResolvedValueOnce({ editNow: true }) // User wants to edit
        .mockResolvedValueOnce({ continue: '' }) // User is done editing
        .mockResolvedValueOnce({ setAsDefault: false }); // Don't set as default
      
      // Mock the file write/read sequence for the temp file
      fs.writeFile.mockImplementationOnce(async (filePath, content) => {
        // This simulates the file being written, but we don't need to do anything
        return Promise.resolve();
      });
      
      // Mock the readFile to return changed content, simulating user editing
      fs.readFile.mockImplementationOnce(async (filePath) => {
        // This simulates reading the edited file
        return Promise.resolve(mockTempContent);
      });
      
      await promptCmd('create', null);
      
      // Check that the temporary file was written and then read back
      expect(fs.writeFile).toHaveBeenCalled();
      expect(fs.readFile).toHaveBeenCalled();
      
      // Check the saveTemplate was called with the edited content
      expect(mockSaveTemplate).toHaveBeenCalledWith('edited-template', mockTempContent);
      
      // Check the temp file was cleaned up
      expect(fs.remove).toHaveBeenCalled();
      
      expectOutputToContain('Template \'edited-template\' created successfully');
    });
  });

  describe('generate prompt edge cases', () => {
    it('should handle error when template does not exist', async () => {
      // Mock getAvailableTemplates to return a list without the requested template
      mockGetAvailableTemplates.mockResolvedValueOnce(['default', 'basic']);
      
      await promptCmd('generate', 'test-module', { template: 'nonexistent' });
      
      expectOutputToContain('does not exist', 'error');
      expect(mockExportContext).not.toHaveBeenCalled();
    });

    it('should handle no modules found during prompt generation', async () => {
      // Mock situation where no modules are found
      mockGetFocusedModule.mockResolvedValueOnce(null);
      mockListModules.mockResolvedValueOnce([]);
      
      await promptCmd('generate');
      
      expectOutputToContain('No modules found', 'error');
    });
  });
});
