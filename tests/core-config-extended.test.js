/**
 * Extended tests for the core/config.js module
 * 
 * This test file focuses on the methods and branches that have low coverage
 * in the existing core-config.test.js
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

describe('ConfigManager (Extended Tests)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset config to force re-reading from disk
    configManager.config = null;
  });

  describe('initialize', () => {
    it('should call getConfig if config is not already loaded', async () => {
      // Mock getConfig
      const originalGetConfig = configManager.getConfig;
      configManager.getConfig = jest.fn().mockResolvedValueOnce({});
      
      await configManager.initialize();
      
      expect(configManager.getConfig).toHaveBeenCalled();
      
      // Restore original method
      configManager.getConfig = originalGetConfig;
    });

    it('should not call getConfig if config is already loaded', async () => {
      // Set a config
      configManager.config = {};
      
      // Mock getConfig
      const originalGetConfig = configManager.getConfig;
      configManager.getConfig = jest.fn();
      
      await configManager.initialize();
      
      expect(configManager.getConfig).not.toHaveBeenCalled();
      
      // Restore original method
      configManager.getConfig = originalGetConfig;
    });

    it('should return itself for method chaining', async () => {
      const result = await configManager.initialize();
      expect(result).toBe(configManager);
    });
  });

  describe('deleteValue', () => {
    it('should delete an existing key', async () => {
      // Set up mock config
      configManager.config = {
        project: {
          name: 'test-project',
          description: 'A test project'
        }
      };
      
      const result = await configManager.deleteValue('project.name');
      
      expect(result).toBe(true);
      expect(configManager.config.project.name).toBeUndefined();
      expect(configManager.config.project.description).toBe('A test project');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should throw error if key does not exist', async () => {
      // Set up mock config
      configManager.config = {
        project: {
          name: 'test-project'
        }
      };
      
      await expect(configManager.deleteValue('nonexistent.key')).rejects.toThrow("Key 'nonexistent.key' not found");
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('resetValue', () => {
    it('should reset an existing value to its default', async () => {
      // Set up mock config with modified values
      configManager.config = {
        project: {
          name: 'custom-project',
          excludes: ['only-custom']
        }
      };
      
      await configManager.resetValue('project.excludes');
      
      // Should be reset to the default value
      expect(configManager.config.project.excludes).toEqual(DEFAULT_CONFIG.project.excludes);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should throw error if key has no default value', async () => {
      // Set up mock config with custom key
      configManager.config = {
        custom: {
          key: 'value'
        }
      };
      
      await expect(configManager.resetValue('custom.key')).rejects.toThrow("No default value exists for key 'custom.key'");
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('resetAll', () => {
    it('should reset all configuration to defaults', async () => {
      // Set up mock config with custom values
      configManager.config = {
        project: {
          name: 'custom-project'
        },
        custom: {
          key: 'value'
        }
      };
      
      await configManager.resetAll();
      
      // Should be reset to the complete default config
      expect(configManager.config).toEqual(DEFAULT_CONFIG);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
});
