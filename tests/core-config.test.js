/**
 * Tests for the core/config.js module
 */

const fs = require('fs-extra');
const path = require('path');
const { configManager, DEFAULT_CONFIG } = require('../src/core/config');

jest.mock('fs-extra', () => ({
  pathExists: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn().mockResolvedValue(undefined),
  ensureDir: jest.fn().mockResolvedValue(undefined)
}));

describe('ConfigManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset config to force re-reading from disk
    configManager.config = null;
  });

  describe('getConfig', () => {
    it('should return the existing config if already loaded', async () => {
      // Set a mock config
      configManager.config = { testKey: 'testValue' };
      
      const result = await configManager.getConfig();
      
      expect(result).toEqual({ testKey: 'testValue' });
      expect(fs.pathExists).not.toHaveBeenCalled();
      expect(fs.readFile).not.toHaveBeenCalled();
    });

    it('should load config from disk if it exists', async () => {
      // Mock that config file exists
      fs.pathExists.mockResolvedValueOnce(true);
      fs.readFile.mockResolvedValueOnce(JSON.stringify({ testKey: 'testValue' }));
      
      const result = await configManager.getConfig();
      
      expect(result).toEqual({ testKey: 'testValue' });
      expect(fs.pathExists).toHaveBeenCalledWith(configManager.configPath);
      expect(fs.readFile).toHaveBeenCalledWith(configManager.configPath, 'utf8');
    });

    it('should return default config if file does not exist', async () => {
      // Mock that config file doesn't exist
      fs.pathExists.mockResolvedValueOnce(false);
      
      const result = await configManager.getConfig();
      
      expect(result).toEqual(DEFAULT_CONFIG);
      expect(fs.pathExists).toHaveBeenCalledWith(configManager.configPath);
      expect(fs.readFile).not.toHaveBeenCalled();
    });

    it('should throw error if reading fails', async () => {
      // Mock file exists but reading fails
      fs.pathExists.mockResolvedValueOnce(true);
      fs.readFile.mockRejectedValueOnce(new Error('Read error'));
      
      await expect(configManager.getConfig()).rejects.toThrow('Error reading configuration');
    });
  });

  describe('saveConfig', () => {
    it('should save config to disk', async () => {
      const testConfig = { testKey: 'testValue' };
      
      await configManager.saveConfig(testConfig);
      
      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(configManager.configPath));
      expect(fs.writeFile).toHaveBeenCalledWith(
        configManager.configPath,
        JSON.stringify(testConfig, null, 2),
        'utf8'
      );
      expect(configManager.config).toEqual(testConfig);
    });

    it('should throw error if saving fails', async () => {
      fs.ensureDir.mockRejectedValueOnce(new Error('Save error'));
      
      await expect(configManager.saveConfig({})).rejects.toThrow('Error saving configuration');
    });
  });

  describe('getValue', () => {
    it('should get a specific config value', async () => {
      // Set up mock config
      configManager.config = {
        project: {
          name: 'test-project'
        }
      };
      
      const result = await configManager.getValue('project.name');
      
      expect(result).toBe('test-project');
    });

    it('should return undefined for non-existent keys', async () => {
      // Set up mock config
      configManager.config = {
        project: {
          name: 'test-project'
        }
      };
      
      const result = await configManager.getValue('nonexistent.key');
      
      expect(result).toBeUndefined();
    });
  });

  describe('setValue', () => {
    it('should set a specific config value', async () => {
      // Set up mock config
      configManager.config = {
        project: {
          name: 'test-project'
        }
      };
      
      await configManager.setValue('project.name', 'new-project');
      
      expect(configManager.config.project.name).toBe('new-project');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should create new properties if they don\'t exist', async () => {
      // Set up mock config
      configManager.config = {};
      
      await configManager.setValue('new.property', 'new-value');
      
      expect(configManager.config.new.property).toBe('new-value');
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('addItem', () => {
    it('should add an item to a config array', async () => {
      // Set up mock config
      configManager.config = {
        project: {
          excludes: ['node_modules', 'dist']
        }
      };
      
      await configManager.addItem('project.excludes', '.git');
      
      expect(configManager.config.project.excludes).toEqual(['node_modules', 'dist', '.git']);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should create an array if the key doesn\'t exist', async () => {
      // Set up mock config
      configManager.config = {};
      
      await configManager.addItem('new.array', 'item1');
      
      expect(configManager.config.new.array).toEqual(['item1']);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('should remove an item from a config array', async () => {
      // Set up mock config
      configManager.config = {
        project: {
          excludes: ['node_modules', 'dist', '.git']
        }
      };
      
      await configManager.removeItem('project.excludes', item => item === 'dist');
      
      expect(configManager.config.project.excludes).toEqual(['node_modules', '.git']);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should do nothing if the key doesn\'t exist', async () => {
      // Set up mock config
      configManager.config = {};
      
      await configManager.removeItem('nonexistent.array', () => true);
      
      // Should not modify the config object
      expect(configManager.config).toEqual({});
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should do nothing if the item is not found', async () => {
      // Set up mock config
      configManager.config = {
        project: {
          excludes: ['node_modules', 'dist']
        }
      };
      
      await configManager.removeItem('project.excludes', item => item === 'nonexistent');
      
      expect(configManager.config.project.excludes).toEqual(['node_modules', 'dist']);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('resetConfig', () => {
    it('should reset config to defaults', async () => {
      // Set up mock config
      configManager.config = {
        custom: 'value'
      };
      
      await configManager.resetConfig();
      
      expect(configManager.config).toEqual(DEFAULT_CONFIG);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('getAllValues', () => {
    it('should return the complete config', async () => {
      // Set up mock config
      configManager.config = { 
        project: { name: 'test-project' },
        context: { defaultLevel: 'medium' }
      };
      
      const result = await configManager.getAllValues();
      
      expect(result).toEqual(configManager.config);
    });
  });
});