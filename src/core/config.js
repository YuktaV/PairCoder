/**
 * PairCoder Configuration Manager
 * 
 * This module handles reading and writing configuration for PairCoder.
 * It manages the .pcconfig.json file and provides access to configuration settings.
 */

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  project: {
    name: '',
    root: '',
    excludes: ['node_modules', 'dist', '.git', 'build']
  },
  modules: [],
  context: {
    defaultLevel: 'medium',
    tokenBudget: 4000
  },
  versioning: {
    enabled: true,
    gitIntegration: false
  }
};

/**
 * Configuration Manager for PairCoder
 */
class ConfigManager {
  constructor() {
    this.configPath = path.join(process.cwd(), '.pc', 'config.json');
    this.config = null;
  }

  /**
   * Get the current configuration
   * 
   * @returns {Promise<Object>} The configuration object
   */
  async getConfig() {
    if (this.config) {
      return this.config;
    }

    try {
      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readFile(this.configPath, 'utf8');
        this.config = JSON.parse(configData);
        return this.config;
      } else {
        this.config = _.cloneDeep(DEFAULT_CONFIG);
        return this.config;
      }
    } catch (error) {
      throw new Error(`Error reading configuration: ${error.message}`);
    }
  }

  /**
   * Save the configuration to disk
   * 
   * @param {Object} config Configuration object to save
   * @returns {Promise<void>}
   */
  async saveConfig(config) {
    try {
      this.config = config;
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Error saving configuration: ${error.message}`);
    }
  }

  /**
   * Get a specific configuration value
   * 
   * @param {string} key Dot-notation path to the configuration value
   * @returns {Promise<any>} The configuration value
   */
  async getValue(key) {
    const config = await this.getConfig();
    return _.get(config, key);
  }

  /**
   * Set a specific configuration value
   * 
   * @param {string} key Dot-notation path to the configuration value
   * @param {any} value Value to set
   * @returns {Promise<void>}
   */
  async setValue(key, value) {
    const config = await this.getConfig();
    _.set(config, key, value);
    await this.saveConfig(config);
  }

  /**
   * Add an item to a configuration array
   * 
   * @param {string} key Dot-notation path to the configuration array
   * @param {any} item Item to add to the array
   * @returns {Promise<void>}
   */
  async addItem(key, item) {
    const config = await this.getConfig();
    const array = _.get(config, key, []);
    array.push(item);
    _.set(config, key, array);
    await this.saveConfig(config);
  }

  /**
   * Remove an item from a configuration array
   * 
   * @param {string} key Dot-notation path to the configuration array
   * @param {Function} predicate Function to identify the item to remove
   * @returns {Promise<void>}
   */
  async removeItem(key, predicate) {
    const config = await this.getConfig();
    const array = _.get(config, key);
    
    // If the key doesn't exist, do nothing
    if (!array) {
      // Don't create empty arrays for non-existent keys
      await this.saveConfig(config);
      return;
    }
    
    const filteredArray = array.filter(item => !predicate(item));
    _.set(config, key, filteredArray);
    await this.saveConfig(config);
  }

  /**
   * Reset configuration to defaults
   * 
   * @returns {Promise<void>}
   */
  async resetConfig() {
    this.config = _.cloneDeep(DEFAULT_CONFIG);
    await this.saveConfig(this.config);
  }
  
  /**
   * Get all configuration values
   * 
   * @returns {Promise<Object>} The complete configuration object
   */
  async getAllValues() {
    return await this.getConfig();
  }
}

// Export singleton instance
const configManager = new ConfigManager();
module.exports = { configManager, DEFAULT_CONFIG };
