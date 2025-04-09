/**
 * PairCoder Storage Manager
 * 
 * This module handles all file system operations for PairCoder,
 * managing the .pc directory structure and file operations.
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * Storage Manager for PairCoder
 */
class StorageManager {
  constructor() {
    this.basePath = path.join(process.cwd(), '.pc');
    this.directories = {
      modules: path.join(this.basePath, 'modules'),
      summaries: path.join(this.basePath, 'summaries'),
      versions: path.join(this.basePath, 'versions'),
      cache: path.join(this.basePath, 'cache'),
      templates: path.join(this.basePath, 'templates')
    };
  }

  /**
   * Initialize storage structure
   * 
   * @returns {Promise<void>}
   */
  async initializeStorage() {
    try {
      // Ensure base directory exists
      await fs.ensureDir(this.basePath);
      
      // Create subdirectories
      for (const dir of Object.values(this.directories)) {
        await fs.ensureDir(dir);
      }
      
      // Create journal file
      const journalPath = path.join(this.basePath, 'journal.md');
      if (!await fs.pathExists(journalPath)) {
        const initialJournal = '# PairCoder Development Journal\n\n' +
          '## Project Initialization\n\n' +
          `Created on: ${new Date().toISOString()}\n\n` +
          'This journal will track key decisions and milestones in your development process.\n';
        
        await fs.writeFile(journalPath, initialJournal, 'utf8');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error initializing storage: ${error.message}`);
    }
  }

  /**
   * Save module metadata
   * 
   * @param {string} moduleName Name of the module
   * @param {Object} metadata Module metadata
   * @returns {Promise<void>}
   */
  async saveModuleMetadata(moduleName, metadata) {
    try {
      const modulePath = path.join(this.directories.modules, `${moduleName}.json`);
      await fs.writeFile(modulePath, JSON.stringify(metadata, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Error saving module metadata: ${error.message}`);
    }
  }

  /**
   * Get module metadata
   * 
   * @param {string} moduleName Name of the module
   * @returns {Promise<Object>} Module metadata
   */
  async getModuleMetadata(moduleName) {
    try {
      const modulePath = path.join(this.directories.modules, `${moduleName}.json`);
      if (await fs.pathExists(modulePath)) {
        const data = await fs.readFile(modulePath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      throw new Error(`Error reading module metadata: ${error.message}`);
    }
  }

  /**
   * List all modules
   * 
   * @returns {Promise<string[]>} List of module names
   */
  async listModules() {
    try {
      const files = await fs.readdir(this.directories.modules);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'));
    } catch (error) {
      throw new Error(`Error listing modules: ${error.message}`);
    }
  }

  /**
   * Save module summary
   * 
   * @param {string} moduleName Name of the module
   * @param {string} level Detail level (high, medium, low)
   * @param {string} content Summary content
   * @returns {Promise<void>}
   */
  async saveModuleSummary(moduleName, level, content) {
    try {
      const moduleDir = path.join(this.directories.summaries, moduleName);
      await fs.ensureDir(moduleDir);
      
      const summaryPath = path.join(moduleDir, `${level}.md`);
      await fs.writeFile(summaryPath, content, 'utf8');
    } catch (error) {
      throw new Error(`Error saving module summary: ${error.message}`);
    }
  }

  /**
   * Get module summary
   * 
   * @param {string} moduleName Name of the module
   * @param {string} level Detail level (high, medium, low)
   * @returns {Promise<string>} Summary content
   */
  async getModuleSummary(moduleName, level) {
    try {
      const summaryPath = path.join(this.directories.summaries, moduleName, `${level}.md`);
      if (await fs.pathExists(summaryPath)) {
        return await fs.readFile(summaryPath, 'utf8');
      }
      return null;
    } catch (error) {
      throw new Error(`Error reading module summary: ${error.message}`);
    }
  }

  /**
   * Save version snapshot
   * 
   * @param {string} versionName Name of the version
   * @param {Object} snapshot Version snapshot data
   * @returns {Promise<void>}
   */
  async saveVersion(versionName, snapshot) {
    try {
      const versionPath = path.join(this.directories.versions, `${versionName}.json`);
      await fs.writeFile(versionPath, JSON.stringify(snapshot, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`Error saving version: ${error.message}`);
    }
  }

  /**
   * Get version snapshot
   * 
   * @param {string} versionName Name of the version
   * @returns {Promise<Object>} Version snapshot data
   */
  async getVersion(versionName) {
    try {
      const versionPath = path.join(this.directories.versions, `${versionName}.json`);
      if (await fs.pathExists(versionPath)) {
        const data = await fs.readFile(versionPath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      throw new Error(`Error reading version: ${error.message}`);
    }
  }

  /**
   * List all versions
   * 
   * @returns {Promise<string[]>} List of version names
   */
  async listVersions() {
    try {
      const files = await fs.readdir(this.directories.versions);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'));
    } catch (error) {
      throw new Error(`Error listing versions: ${error.message}`);
    }
  }

  /**
   * Add entry to journal
   * 
   * @param {string} entry Journal entry text
   * @returns {Promise<void>}
   */
  async addJournalEntry(entry) {
    try {
      const journalPath = path.join(this.basePath, 'journal.md');
      const timestamp = new Date().toISOString();
      const formattedEntry = `\n\n## ${timestamp}\n\n${entry}\n`;
      
      await fs.appendFile(journalPath, formattedEntry, 'utf8');
    } catch (error) {
      throw new Error(`Error adding journal entry: ${error.message}`);
    }
  }

  /**
   * Get journal content
   * 
   * @returns {Promise<string>} Journal content
   */
  async getJournal() {
    try {
      const journalPath = path.join(this.basePath, 'journal.md');
      if (await fs.pathExists(journalPath)) {
        return await fs.readFile(journalPath, 'utf8');
      }
      return '';
    } catch (error) {
      throw new Error(`Error reading journal: ${error.message}`);
    }
  }

  /**
   * Save a file to cache
   * 
   * @param {string} key Cache key
   * @param {any} data Data to cache
   * @returns {Promise<void>}
   */
  async saveToCache(key, data) {
    try {
      const cachePath = path.join(this.directories.cache, `${key}.json`);
      await fs.writeFile(cachePath, JSON.stringify(data), 'utf8');
    } catch (error) {
      // Cache errors shouldn't fail the operation
      console.warn(`Warning: Failed to cache data: ${error.message}`);
    }
  }

  /**
   * Get data from cache
   * 
   * @param {string} key Cache key
   * @returns {Promise<any>} Cached data or null if not found
   */
  async getFromCache(key) {
    try {
      const cachePath = path.join(this.directories.cache, `${key}.json`);
      if (await fs.pathExists(cachePath)) {
        const data = await fs.readFile(cachePath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      // Cache errors shouldn't fail the operation
      console.warn(`Warning: Failed to read from cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Clear the cache
   * 
   * @returns {Promise<void>}
   */
  async clearCache() {
    try {
      await fs.emptyDir(this.directories.cache);
    } catch (error) {
      throw new Error(`Error clearing cache: ${error.message}`);
    }
  }
}

// Export singleton instance
const storageManager = new StorageManager();
module.exports = { storageManager };
