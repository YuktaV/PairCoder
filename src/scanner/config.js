/**
 * Scanner Configuration Manager
 * 
 * Manages configuration for the project scanner, including
 * exclusion patterns and scan options.
 */

const { configManager } = require('../core/config');

/**
 * Default exclusion patterns that are always applied
 */
const DEFAULT_EXCLUSIONS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.DS_Store',
  '*.log',
  '.env*',
  '*.min.js',
  '*.min.css',
  '*.map',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
];

/**
 * Scanner configuration manager
 */
class ScannerConfig {
  /**
   * Get all exclusion patterns
   * 
   * @returns {Promise<string[]>} Array of exclusion patterns
   */
  async getExclusions() {
    const userExclusions = await configManager.getValue('scanner.exclusions') || [];
    return [...DEFAULT_EXCLUSIONS, ...userExclusions];
  }
  
  /**
   * Get only user-defined exclusion patterns
   * 
   * @returns {Promise<string[]>} Array of user-defined exclusion patterns
   */
  async getUserExclusions() {
    return await configManager.getValue('scanner.exclusions') || [];
  }
  
  /**
   * Add an exclusion pattern
   * 
   * @param {string} pattern Pattern to exclude
   * @returns {Promise<void>}
   */
  async addExclusion(pattern) {
    if (!pattern || typeof pattern !== 'string') {
      throw new Error('Invalid exclusion pattern');
    }
    
    // Normalize pattern
    pattern = pattern.trim();
    
    if (pattern === '') {
      throw new Error('Exclusion pattern cannot be empty');
    }
    
    // Check if pattern is in default exclusions
    if (DEFAULT_EXCLUSIONS.includes(pattern)) {
      throw new Error(`Pattern '${pattern}' is already in default exclusions`);
    }
    
    // Get current user exclusions
    const userExclusions = await this.getUserExclusions();
    
    // Check if pattern already exists
    if (userExclusions.includes(pattern)) {
      throw new Error(`Pattern '${pattern}' is already excluded`);
    }
    
    // Add pattern
    await configManager.setValue('scanner.exclusions', [...userExclusions, pattern]);
  }
  
  /**
   * Remove an exclusion pattern
   * 
   * @param {string} pattern Pattern to remove
   * @returns {Promise<void>}
   */
  async removeExclusion(pattern) {
    if (!pattern || typeof pattern !== 'string') {
      throw new Error('Invalid exclusion pattern');
    }
    
    // Normalize pattern
    pattern = pattern.trim();
    
    // Check if pattern is in default exclusions
    if (DEFAULT_EXCLUSIONS.includes(pattern)) {
      throw new Error(`Cannot remove default exclusion pattern '${pattern}'`);
    }
    
    // Get current user exclusions
    const userExclusions = await this.getUserExclusions();
    
    // Check if pattern exists
    if (!userExclusions.includes(pattern)) {
      throw new Error(`Pattern '${pattern}' is not in user exclusions`);
    }
    
    // Remove pattern
    const updatedExclusions = userExclusions.filter(p => p !== pattern);
    await configManager.setValue('scanner.exclusions', updatedExclusions);
  }
  
  /**
   * Reset exclusions to defaults
   * 
   * @returns {Promise<void>}
   */
  async resetExclusions() {
    await configManager.setValue('scanner.exclusions', []);
  }
  
  /**
   * Get scanner options
   * 
   * @returns {Promise<Object>} Scanner options
   */
  async getOptions() {
    return {
      depth: await configManager.getValue('scanner.depth') || -1, // -1 means no limit
      followSymlinks: await configManager.getValue('scanner.followSymlinks') || false,
      includeHidden: await configManager.getValue('scanner.includeHidden') || false,
      maxFileSize: await configManager.getValue('scanner.maxFileSize') || 1048576, // 1MB default
    };
  }
  
  /**
   * Set scanner option
   * 
   * @param {string} option Option name
   * @param {any} value Option value
   * @returns {Promise<void>}
   */
  async setOption(option, value) {
    const validOptions = ['depth', 'followSymlinks', 'includeHidden', 'maxFileSize'];
    
    if (!validOptions.includes(option)) {
      throw new Error(`Invalid scanner option: ${option}`);
    }
    
    await configManager.setValue(`scanner.${option}`, value);
  }
}

// Export scanner config singleton
const scannerConfig = new ScannerConfig();
module.exports = { scannerConfig, DEFAULT_EXCLUSIONS };
